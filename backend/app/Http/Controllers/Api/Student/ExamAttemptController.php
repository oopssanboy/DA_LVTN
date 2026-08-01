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
use App\Models\ClassEnrollment;
use App\Events\ViolationUpdated;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ExamAttemptController extends Controller
{
    public function getAvailableExams()
    {
        $studentId = Auth::user()->student->user_id ?? Auth::id(); 
        $classIds = ClassEnrollment::where('student_id', $studentId)->pluck('class_id');
        $now = Carbon::now();

        $exams = Exam::with(['subject', 'classes']) 
          
            ->whereHas('classes', function($q) use ($classIds) {
                $q->whereIn('classes.id', $classIds);
            })
            ->where('is_active', true)
            ->where(function($q) use ($now) {
                $q->whereNull('end_time')->orWhere('end_time', '>=', $now);
            })
            ->orderBy('start_time', 'asc')
            ->paginate(6);

        $exams->getCollection()->transform(function ($exam) use ($studentId) {
            $attempt = ExamAttempt::where('exam_id', $exam->id)->where('student_id', $studentId)->first();
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

        $attempt = ExamAttempt::where('exam_id', $examId)->where('student_id', $studentId)->first();

        if ($attempt) {
            if ($attempt->status !== 'in_progress') {
                return response()->json(['message' => 'Bài thi này đã kết thúc.'], 403);
            }
            return response()->json(['message' => 'Vào lại phòng thi thành công', 'attempt_id' => $attempt->id]);
        }

        DB::beginTransaction();
        try {
            $attempt = ExamAttempt::create([
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
                    'attempt_id' => $attempt->id,
                    'question_id' => $q->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            StudentAnswer::insert($answersData);

            DB::commit();
            
            broadcast(new ViolationUpdated($examId, $attempt->id, 'joined', 'Sinh viên vừa vào phòng thi'))->toOthers();

            return response()->json(['message' => 'Khởi tạo phòng thi thành công', 'attempt_id' => $attempt->id]);
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

            $questions[] = [
                'id' => $q->id,
                'content' => $q->content,
                'type' => $q->type,
                'choices' => $choices->map(function($c) {
                    return ['id' => $c->id, 'key' => $c->choice_key, 'text' => $c->choice_text];
                }),
                'saved_choice_id' => $ans->choice_id,
                'saved_answer_text' => $ans->answer_text,
            ];
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

        StudentAnswer::where('attempt_id', $attempt->id)
            ->where('question_id', $question->id)
            ->update([
                'choice_id' => $question->type !== 'fill_blank' ? $request->choice_id : null,
                'answer_text' => $question->type === 'fill_blank' ? $request->answer_text : null,
            ]);

        return response()->json(['message' => 'Đã lưu đáp án']);
    }

    public function submitExam(Request $request, $attemptId)
    {
        $attempt = ExamAttempt::where('id', $attemptId)->where('student_id', Auth::id())->firstOrFail();
        if ($attempt->status !== 'in_progress') {
            return response()->json(['message' => 'Bài thi đã được nộp trước đó'], 400);
        }

        return $this->autoSubmitExam($attempt);
    }

    public function autoSubmitExam(ExamAttempt $attempt)
    {
        $exam = $attempt->exam;
        $answers = StudentAnswer::where('attempt_id', $attempt->id)->get();
        $totalScore = 0;

        foreach ($answers as $answer) {
            $question = Question::find($answer->question_id);
            if (!$question) continue;

            $isCorrect = false;
            $scoreEarned = 0;

            if ($question->type === 'fill_blank') {
                if ($answer->answer_text) {
                    $validAnswers = FillBlankAnswer::where('question_id', $question->id)->pluck('accepted_text')->toArray();
                    $studentText = mb_strtolower(trim($answer->answer_text));
                    $validAnswersLower = array_map(function($val) { return mb_strtolower(trim($val)); }, $validAnswers);
                    
                    if (in_array($studentText, $validAnswersLower)) {
                        $isCorrect = true;
                        $scoreEarned = $question->score;
                    }
                }
            } else {
                if ($answer->choice_id) {
                    $choice = Choice::find($answer->choice_id);
                    if ($choice && $choice->is_correct) {
                        $isCorrect = true;
                        $scoreEarned = $question->score;
                    }
                }
            }

            $answer->update([
                'is_correct' => $isCorrect,
                'score_earned' => $scoreEarned
            ]);

            $totalScore += $scoreEarned;
        }

        $isPassed = $totalScore >= $exam->passing_score;

        $attempt->update([
            'status' => 'submitted',
            'ended_at' => Carbon::now(),
            'total_score' => $totalScore,
            'is_passed' => $isPassed
        ]);

        broadcast(new ViolationUpdated($exam->id, $attempt->id, 'submitted', 'Sinh viên đã nộp bài'))->toOthers();

        return response()->json([
            'message' => 'Nộp bài thành công',
            'total_score' => $totalScore,
            'is_passed' => $isPassed
        ]);
    }

    public function logViolation(Request $request, $attemptId)
    {
        $request->validate(['type' => 'required|string', 'detail' => 'nullable|string']);
        $attempt = ExamAttempt::where('id', $attemptId)->where('student_id', Auth::id())->firstOrFail();

        if ($attempt->status !== 'in_progress') {
            return response()->json(['message' => 'Bài thi đã kết thúc'], 400);
        }

        ViolationLog::create([
            'attempt_id' => $attempt->id,
            'type' => $request->type,
            'detail' => $request->detail ?? 'Hành vi vi phạm',
        ]);

        $attempt->increment('violation_count');
        
        broadcast(new ViolationUpdated($attempt->exam_id, $attempt->id, 'violation', "Sinh viên vi phạm: " . $request->type))->toOthers();

        if ($attempt->violation_count >= 3) {
            $this->autoSubmitExam($attempt); 
            $attempt->update(['status' => 'suspended']); 
            return response()->json([
                'message' => 'BẠN ĐÃ VI PHẠM QUY CHẾ QUÁ 3 LẦN. HỆ THỐNG ĐÃ TỰ ĐỘNG THU BÀI!',
                'violation_count' => $attempt->violation_count,
                'is_suspended' => true
            ], 403);
        }

        return response()->json(['message' => 'Ghi nhận vi phạm', 'violation_count' => $attempt->violation_count]);
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