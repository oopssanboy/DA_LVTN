<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamQuestion;
use App\Models\Question;
use App\Models\StudentAnswer;
use App\Models\ViolationLog;
use App\Models\FillBlankAnswer;
use App\Models\Choice;
use App\Models\TestCase; // Thêm Model TestCase
use App\Models\ClassEnrollment;
use App\Events\ViolationUpdated;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http; // Thêm Http Client gọi Judge0
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use App\Mail\ExamResultMail;

class ExamAttemptController extends Controller
{
    public function getAvailableExams(Request $request)
    {
        $studentId = Auth::user()->student->user_id ?? Auth::id(); 
        $classIds = ClassEnrollment::where('student_id', $studentId)->pluck('class_id');
        $now = Carbon::now();

        $query = Exam::with(['subject', 'classes']) 
            ->whereHas('classes', function($q) use ($classIds) {
                $q->whereIn('classes.id', $classIds);
            })
            ->where('is_active', true)
            ->where(function($q) use ($now) {
                $q->whereNull('end_time')->orWhere('end_time', '>=', $now);
            });

        if ($request->has('is_practice')) {
            $isPractice = filter_var($request->is_practice, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_practice', $isPractice);
        }

        $exams = $query->orderBy('start_time', 'asc')->paginate(6);

        $exams->getCollection()->transform(function ($exam) use ($studentId) {
            $attempt = ExamAttempt::where('exam_id', $exam->id)
                                  ->where('student_id', $studentId)
                                  ->latest('id')
                                  ->first();
            $exam->attempt = $attempt;
            return $exam;
        });

        return response()->json($exams);
    }

    public function getHistory()
    {
        $studentId = Auth::id();
        $history = ExamAttempt::with(['exam.subject'])
            ->where('student_id', $studentId)
            ->whereIn('status', ['submitted', 'suspended'])
            ->orderBy('ended_at', 'desc')
            ->paginate(6);

        return response()->json($history);
    }

    public function startExam(Request $request, $examId)
    {
        $studentId = Auth::id();
        $exam = Exam::findOrFail($examId);

        if ($exam->password && $request->input('password') !== $exam->password) {
            return response()->json(['message' => 'Mật khẩu phòng thi không chính xác'], 403);
        }

        $attempt = ExamAttempt::where('exam_id', $examId)
                              ->where('student_id', $studentId)
                              ->latest('id')
                              ->first();

        if ($attempt && $attempt->status === 'in_progress') {
            return response()->json(['message' => 'Vào lại phòng thi thành công', 'attempt_id' => $attempt->id]);
        }

        if ($attempt && $attempt->status !== 'in_progress' && !$exam->is_practice) {
            return response()->json(['message' => 'Bài thi này đã kết thúc, không cho phép làm lại.'], 403);
        }

        DB::beginTransaction();
        try {
            $newAttempt = ExamAttempt::create([
                'exam_id' => $examId,
                'student_id' => $studentId,
                'status' => 'in_progress',
                'violation_count' => 0,
                'started_at' => Carbon::now(),
            ]);

            $examQuestionIds = ExamQuestion::where('exam_id', $examId)->pluck('question_id');
            $questions = Question::whereIn('id', $examQuestionIds)->get();

            if ($exam->shuffle_questions) {
                $questions = $questions->shuffle();
            }

            $answersData = [];
            foreach ($questions as $q) {
                $answersData[] = [
                    'attempt_id' => $newAttempt->id,
                    'question_id' => $q->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            StudentAnswer::insert($answersData);

            DB::commit();
            
            if (!$exam->is_practice) {
                broadcast(new ViolationUpdated($examId, $newAttempt->id, 'joined', 'Sinh viên vừa vào phòng thi'))->toOthers();
            }

            return response()->json(['message' => 'Khởi tạo phòng thi thành công', 'attempt_id' => $newAttempt->id]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi khởi tạo đề thi: ' . $e->getMessage()], 500);
        }
    }

    public function getAttempt($attemptId)
    {
        $studentId = Auth::id();
        $attempt = ExamAttempt::with(['exam.subject'])->where('id', $attemptId)->where('student_id', $studentId)->firstOrFail();

        $startedAt = Carbon::parse($attempt->started_at)->timestamp; 
        $now = Carbon::now()->timestamp;
        
        $timeElapsed = $now - $startedAt;
        if ($timeElapsed < 0) {
            $timeElapsed = 0; 
        }

        $totalTime = $attempt->exam->duration * 60;
        $remaining = max(0, $totalTime - $timeElapsed);

        if ($attempt->status !== 'in_progress' || $remaining <= 0) {
            if ($attempt->status === 'in_progress') {
                $this->autoSubmitExam($attempt);
            }
            return response()->json(['message' => 'Bài thi đã kết thúc', 'status' => 'submitted'], 403);
        }

        $answers = StudentAnswer::where('attempt_id', $attempt->id)->orderBy('id', 'asc')->get();
        $questions = [];

        foreach ($answers as $ans) {
            $q = Question::with('choices')->find($ans->question_id);
            if (!$q) continue;

            $choices = $q->choices;
            if ($attempt->exam->shuffle_options) {
                $choices = $choices->shuffle();
            }

            $qData = [
                'id' => $q->id,
                'content' => $q->content,
                'type' => $q->type,
                'choices' => $choices->map(function($c) {
                    return ['id' => $c->id, 'key' => $c->choice_key, 'text' => $c->choice_text];
                }),
                'saved_choice_id' => $ans->choice_id,
                'saved_answer_text' => $ans->answer_text,
            ];

            if ($q->type === 'coding') {
                $qData['test_cases'] = TestCase::where('question_id', $q->id)
                                               ->where('is_hidden', false)
                                               ->get(['id', 'input_data', 'expected_output']);
                $qData['saved_language'] = $ans->language ?? 'python'; 
                
                $qData['allowed_languages'] = $q->allowed_languages; 
            }

            $questions[] = $qData;
        }

        $examData = $attempt->exam;

        return response()->json([
            'exam' => $examData,
            'attempt' => $attempt,
            'questions' => $questions,
            'remaining_seconds' => $remaining,
            'violation_count' => $attempt->violation_count
        ]);
    }

    public function saveAnswer(Request $request, $attemptId)
    {
        $request->validate(['question_id' => 'required|exists:questions,id']);

        $attempt = ExamAttempt::where('id', $attemptId)->where('student_id', Auth::id())->firstOrFail();
        if ($attempt->status !== 'in_progress') {
            return response()->json(['message' => 'Bài thi đã đóng.'], 403);
        }

        $question = Question::findOrFail($request->question_id);

        $updateData = [
            'choice_id' => !in_array($question->type, ['fill_blank', 'coding']) ? $request->choice_id : null,
            'answer_text' => in_array($question->type, ['fill_blank', 'coding']) ? $request->answer_text : null,
        ];

        if ($question->type === 'coding' && $request->has('language')) {
            $updateData['language'] = $request->language;
        }

        StudentAnswer::where('attempt_id', $attempt->id)
            ->where('question_id', $question->id)
            ->update($updateData);

        return response()->json(['message' => 'Đã lưu đáp án']);
    }

    public function runCode(Request $request, $attemptId)
    {
        $request->validate([
            'question_id' => 'required|exists:questions,id',
            'source_code' => 'required|string',
            'language' => 'required|string', 
        ]);

        $attempt = ExamAttempt::where('id', $attemptId)->where('student_id', Auth::id())->where('status', 'in_progress')->firstOrFail();

        if (!ExamQuestion::where('exam_id', $attempt->exam_id)->where('question_id', $request->question_id)->exists()) {
            return response()->json(['message' => 'Câu hỏi không thuộc đề thi này.'], 403);
        }

        $question = Question::findOrFail($request->question_id);

        $allowedLangs = $question->allowed_languages ?? ['cpp', 'python', 'java', 'php'];
        if (!in_array($request->language, $allowedLangs, true)) {
            return response()->json(['message' => 'Ngôn ngữ này không được phép cho câu hỏi hiện tại.'], 403);
        }

        $judge0Ids = ['cpp' => 54, 'python' => 71, 'java' => 62, 'php' => 68];
        $judge0Id = $judge0Ids[$request->language] ?? 71;

        $publicTestCases = TestCase::where('question_id', $question->id)->where('is_hidden', false)->get();
        if ($publicTestCases->isEmpty()) return response()->json(['message' => 'Bài toán này chưa có test case công khai.'], 404);

        $results = [];
        foreach ($publicTestCases as $tc) {
            try {
                $response = Http::post('http://localhost:2358/submissions?base64_encoded=false&wait=true', [
                    'source_code' => $request->source_code,
                    'language_id' => $judge0Id, 
                    'stdin' => $tc->input_data,
                    'expected_output' => $tc->expected_output,
                    'cpu_time_limit' => $question->time_limit ? ($question->time_limit / 1000) : 2,
                    'memory_limit' => $question->memory_limit ?? 128000,
                ]);
                
                $results[] = ['test_case_id' => $tc->id, 'input' => $tc->input_data, 'expected' => $tc->expected_output, 'result' => $response->json()];
            } catch (\Exception $e) {
                $results[] = ['test_case_id' => $tc->id, 'error' => 'Không thể kết nối đến máy chấm Judge0'];
            }
        }
        return response()->json(['results' => $results]);
    }

    public function submitExam(Request $request, $attemptId)
    {
        $attempt = ExamAttempt::where('id', $attemptId)->where('student_id', Auth::id())->firstOrFail();
        if ($attempt->status !== 'in_progress') {
            return response()->json(['message' => 'Bài thi đã được nộp trước đó'], 400);
        }

        $attempt->update([
            'status' => 'wait',
            'ended_at' => Carbon::now()
        ]);

        \App\Jobs\GradeExamJob::dispatch($attempt->id);

        return response()->json([
            'message' => 'Nộp bài thành công! Hệ thống đang tiến hành chấm điểm tự động.',
            'status' => 'wait'
        ]);
    }

    public function autoSubmitExam(ExamAttempt $attempt)
    {
        $exam = $attempt->exam;
        $answers = StudentAnswer::where('attempt_id', $attempt->id)->get();
        $totalScore = 0;
        $examQuestions = ExamQuestion::where('exam_id', $exam->id)
                                     ->get()
                                     ->keyBy('question_id');

        foreach ($answers as $answer) {
            $question = Question::find($answer->question_id);
            if (!$question) continue;

            $isCorrect = false;
            $scoreEarned = 0;
            $snapshotScore = isset($examQuestions[$question->id]) 
                             ? $examQuestions[$question->id]->question_score 
                             : 0;

            if ($question->type === 'fill_blank') {
                if ($answer->answer_text) {
                    $validAnswers = FillBlankAnswer::where('question_id', $question->id)->pluck('accepted_text')->toArray();
                    $studentText = mb_strtolower(trim($answer->answer_text));
                    $validAnswersLower = array_map(function($val) { return mb_strtolower(trim($val)); }, $validAnswers);
                    
                    if (in_array($studentText, $validAnswersLower)) {
                        $isCorrect = true;
                        $scoreEarned = $snapshotScore;
                    }
                }
            } elseif ($question->type === 'coding') {
                if (empty($answer->answer_text)) {
                    $isCorrect = false; $scoreEarned = 0;
                } elseif ($question->type === 'coding') {
                $testCases = TestCase::where('question_id', $question->id)->get();
                $totalCases = $testCases->count();
                
                if (empty($answer->answer_text) || $totalCases === 0) {
                    $scoreEarned = 0;
                    $isCorrect = false;
                    $answer->update([
                        'judge_status' => 'No Code or No TestCases',
                        'execution_time' => 0,
                        'memory_usage' => 0,
                        'test_case_results' => []
                    ]);
                } else {
                    $passedCases = 0;
                    $resultsLog = [];
                    $totalTime = 0;
                    $maxMemory = 0;
                    $langCode = $answer->language ?? 'python';
                    $judge0Ids = ['cpp' => 54, 'python' => 71, 'java' => 62, 'php' => 68];
                    $judge0Id = $judge0Ids[$langCode] ?? 71;

                    foreach ($testCases as $tc) {
                        try {
                            $response = Http::post('http://localhost:2358/submissions?base64_encoded=false&wait=true', [
                                'source_code' => $answer->answer_text,
                                'language_id' => $judge0Id,
                                'stdin' => $tc->input_data,
                                'expected_output' => $tc->expected_output,
                                'cpu_time_limit' => $question->time_limit ? ($question->time_limit / 1000) : 2,
                                'memory_limit' => $question->memory_limit ?? 128000,
                            ]);
                            $res = $response->json();
                            $statusId = $res['status']['id'] ?? null;
                            
                            if ($statusId === 3) { $passedCases++; } 
                            
                            $resultsLog[] = [
                                'test_case_id' => $tc->id,
                                'is_hidden' => $tc->is_hidden,
                                'status' => $res['status']['description'] ?? 'Lỗi',
                                'time' => $res['time'] ?? null,
                                'memory' => $res['memory'] ?? null,
                            ];
                            
                            $totalTime += (float)($res['time'] ?? 0);
                            $maxMemory = max($maxMemory, (int)($res['memory'] ?? 0));
                        } catch (\Exception $e) {
                            $resultsLog[] = [
                                'test_case_id' => $tc->id, 
                                'is_hidden' => $tc->is_hidden,
                                'status' => 'Lỗi kết nối máy chấm'
                            ];
                        }
                    }
                    
                    $scoreEarned = $snapshotScore * ($passedCases / $totalCases);
                    $isCorrect = $passedCases === $totalCases;
                    
                    $answer->update([
                        'judge_status' => "$passedCases/$totalCases Pass",
                        'execution_time' => $totalTime,
                        'memory_usage' => $maxMemory,
                        'test_case_results' => $resultsLog
                    ]);
                }
            }
            } else {
                if ($answer->choice_id) {
                    $choice = Choice::find($answer->choice_id);
                    if ($choice && $choice->is_correct) {
                        $isCorrect = true;
                        $scoreEarned = $snapshotScore;
                    }
                }
            }

            $answer->update([
                'is_correct' => $isCorrect,
                'score_earned' => $scoreEarned
            ]);

            $totalScore += $scoreEarned;
        }
        
        $finalScore = round($totalScore, 2);
        $isPassed = $finalScore >= $exam->passing_score;

        $attempt->update([
            'status' => 'submitted',
            'ended_at' => Carbon::now(),
            'total_score' => $finalScore,
            'is_passed' => $isPassed
        ]);

        broadcast(new ViolationUpdated($exam->id, $attempt->id, 'submitted', 'Sinh viên đã nộp bài'))->toOthers();

        $userEmail = $attempt->student->user->email ?? null;
        if ($userEmail) {
            Mail::to($userEmail)->send(new ExamResultMail($attempt, $exam));
        }

        return response()->json([
            'message' => 'Nộp bài thành công',
            'total_score' => $finalScore,
            'is_passed' => $isPassed
        ]);
    }

    public function logViolation(Request $request, $attemptId)
    {
        $request->validate([
            'type' => 'required|string', 
            'detail' => 'nullable|string',
        ]);
        
        $attempt = ExamAttempt::where('id', $attemptId)->where('student_id', Auth::id())->firstOrFail();

        if ($attempt->status !== 'in_progress') {
            return response()->json(['message' => 'Bài thi đã kết thúc'], 400);
        }

        $violationType = $request->type;


        $penaltyTypes = [
            'Mở mã nguồn',
            'Chuyển Tab/Thu nhỏ',
            'Thoát Fullscreen',
            'Mất Focus cửa sổ thi'
        ];

   
        $isPenalty = in_array($violationType, $penaltyTypes, true);

        ViolationLog::create([
            'attempt_id' => $attempt->id,
            'type' => $violationType,
            'detail' => $request->detail ?? 'Hành vi vi phạm',
        ]);

        if ($isPenalty) {
            $attempt->increment('violation_count');
            
            broadcast(new ViolationUpdated($attempt->exam_id, $attempt->id, 'violation', "Sinh viên vi phạm: " . $violationType))->toOthers();

            if ($attempt->violation_count >= 3) {
                $this->autoSubmitExam($attempt); 
                $attempt->update(['status' => 'suspended']); 
                return response()->json([
                    'message' => 'BẠN ĐÃ VI PHẠM QUY CHẾ QUÁ 3 LẦN. HỆ THỐNG ĐÃ TỰ ĐỘNG THU BÀI!',
                    'violation_count' => $attempt->violation_count,
                    'is_suspended' => true
                ], 403);
            }
        } else {
            broadcast(new ViolationUpdated($attempt->exam_id, $attempt->id, 'system_log', "Sự cố hệ thống/Mạng: " . $violationType))->toOthers();
        }

        return response()->json(['message' => 'Ghi nhận log thành công', 'violation_count' => $attempt->violation_count]);
    }

    public function getResult($attemptId)
    {
        $studentId = Auth::id();
        $attempt = ExamAttempt::with(['exam.subject'])->where('id', $attemptId)->where('student_id', $studentId)->firstOrFail();

        if ($attempt->status === 'in_progress') {
            return response()->json(['message' => 'Bài thi chưa nộp'], 400);
        }

        $answers = StudentAnswer::with(['question.choices', 'question.fillBlankAnswers'])->where('attempt_id', $attempt->id)->get();

        return response()->json(['attempt' => $attempt, 'details' => $answers]);
    }
}