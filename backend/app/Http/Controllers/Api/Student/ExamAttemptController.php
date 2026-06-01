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
    // Lấy danh sách kỳ thi sinh viên được phép tham gia
    public function getAvailableExams()
    {
        $studentId = Auth::user()->id; // Khóa ngoại trỏ về user_id

        // Chỉ lấy các kỳ thi của lớp mà sinh viên này có ghi danh
        $classIds = ClassEnrollment::where('student_id', $studentId)->pluck('class_id');

        $now = Carbon::now();

        $exams = Exam::with(['subject', 'classes'])
            ->whereIn('class_id', $classIds)
            ->where('is_active', true)
            ->where(function($q) use ($now) {
                $q->whereNull('start_time')->orWhere('start_time', '<=', $now);
            })
            ->where(function($q) use ($now) {
                $q->whereNull('end_time')->orWhere('end_time', '>=', $now);
            })
            ->get();

        // Đính kèm trạng thái xem sinh viên đã nộp bài hay đang làm dở
        $exams = $exams->map(function ($exam) use ($studentId) {
            $attempt = ExamAttempt::where('exam_id', $exam->id)
                ->where('student_id', $studentId)
                ->first();
            $exam->attempt = $attempt;
            return $exam;
        });

        return response()->json($exams);
    }

    // Lấy lịch sử các bài đã nộp hoặc bị đình chỉ
    public function getHistory()
    {
        $studentId = Auth::user()->id;
        $attempts = ExamAttempt::with(['exam.subject'])
            ->where('student_id', $studentId)
            ->whereIn('status', ['submitted', 'suspended'])
            ->orderBy('ended_at', 'desc')
            ->get();

        return response()->json($attempts);
    }

    // Bắt đầu hoặc vào lại phòng thi
    public function startExam(Request $request, $examId)
    {
        $studentId = Auth::user()->id;
        $exam = Exam::findOrFail($examId);

        // Kiểm tra mật khẩu mã hóa phòng thi
        if ($exam->password && $request->password !== $exam->password) {
            return response()->json(['message' => 'Mật khẩu phòng thi không chính xác'], 403);
        }

        // Kiểm tra lượt thi cũ
        $attempt = ExamAttempt::where('exam_id', $examId)
            ->where('student_id', $studentId)
            ->first();

        if ($attempt) {
            if ($attempt->status !== 'in_progress') {
                return response()->json(['message' => 'Bạn đã hoàn thành bài thi này rồi.'], 403);
            }
            return response()->json([
                'message' => 'Vào lại phòng thi thành công',
                'attempt_id' => $attempt->id
            ]);
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

            // Lấy bộ khung câu hỏi tĩnh đã ghim cho mã đề này
            $examQuestions = ExamQuestion::where('exam_id', $examId)->get();
            $questions = Question::whereIn('id', $examQuestions->pluck('question_id'))->get();

            // Áp dụng thuật toán Random nếu giảng viên cho phép xáo trộn câu
            if ($exam->shuffle_questions) {
                $questions = $questions->shuffle();
            }

            // Ghi sẵn template đáp án để đảm bảo thứ tự luôn khớp khi reload trang
            foreach ($questions as $q) {
                StudentAnswer::create([
                    'attempt_id' => $attempt->id,
                    'question_id' => $q->id,
                    'choice_id' => null,
                    'answer_text' => null,
                ]);
            }

            DB::commit();

            // Phát Socket Reverb để bảng Giám thị nhảy tên Sinh viên Realtime
            event(new ViolationUpdated($examId, $attempt->id, 'joined', 'Sinh viên vừa vào phòng thi'));

            return response()->json([
                'message' => 'Khởi tạo phòng thi thành công',
                'attempt_id' => $attempt->id
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi khởi tạo đề thi: ' . $e->getMessage()], 500);
        }
    }

    // Truyền dữ liệu cấu trúc đề thi về cho React hiển thị
    public function getAttempt($attemptId)
    {
        $studentId = Auth::user()->id;
        $attempt = ExamAttempt::with(['exam.subject'])
            ->where('id', $attemptId)
            ->where('student_id', $studentId)
            ->firstOrFail();

        // Hệ thống tự bấm giờ an toàn từ phía Server (Chống Hack Timer)
        $timeElapsed = Carbon::now()->diffInSeconds(Carbon::parse($attempt->started_at));
        $totalTime = $attempt->exam->duration * 60;
        $remaining = max(0, $totalTime - $timeElapsed);

        if ($attempt->status !== 'in_progress') {
            return response()->json(array_merge($attempt->toArray(), ['remaining_seconds' => 0]));
        }

        // Lấy câu hỏi theo thứ tự đóng băng trong student_answers
        $answers = StudentAnswer::where('attempt_id', $attempt->id)
            ->orderBy('id', 'asc') 
            ->get();

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
                    return [
                        'id' => $c->id,
                        'key' => $c->choice_key,
                        'text' => $c->choice_text
                    ];
                }),
                'saved_choice_id' => $ans->choice_id, // Fetch lại lựa chọn đang tick dở
                'saved_answer_text' => $ans->answer_text,
            ];
        }

        return response()->json([
            'exam' => $attempt->exam,
            'attempt' => $attempt,
            'questions' => $questions,
            'remaining_seconds' => $remaining,
            'violation_count' => $attempt->violation_count
        ]);
    }

    // Auto-save khi sinh viên click đáp án trên Frontend
    public function saveAnswer(Request $request, $attemptId)
    {
        $request->validate([
            'question_id' => 'required|exists:questions,id',
        ]);

        $attempt = ExamAttempt::where('id', $attemptId)->where('student_id', Auth::user()->id)->firstOrFail();
        if ($attempt->status !== 'in_progress') {
            return response()->json(['message' => 'Bài thi đã đóng.'], 403);
        }

        $question = Question::findOrFail($request->question_id);

        StudentAnswer::updateOrCreate(
            ['attempt_id' => $attempt->id, 'question_id' => $question->id],
            [
                'choice_id' => $question->type !== 'fill_blank' ? $request->choice_id : null,
                'answer_text' => $question->type === 'fill_blank' ? $request->answer_text : null,
            ]
        );

        return response()->json(['message' => 'Đã lưu đáp án tạm thời']);
    }

    // Chấm điểm và nộp bài
    public function submitExam(Request $request, $attemptId)
    {
        $attempt = ExamAttempt::where('id', $attemptId)->where('student_id', Auth::user()->id)->firstOrFail();
        if ($attempt->status !== 'in_progress') {
            return response()->json(['message' => 'Bài thi đã được nộp trước đó'], 400);
        }

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

            // Ghi đè vào DB dữ liệu chấm điểm
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

        // Push Socket báo Giám thị màu xanh
        event(new ViolationUpdated($exam->id, $attempt->id, 'submitted', 'Sinh viên đã nộp bài'));

        return response()->json([
            'message' => 'Nộp bài thành công',
            'total_score' => $totalScore,
            'is_passed' => $isPassed
        ]);
    }

    // Trigger cơ chế chống gian lận
    public function logViolation(Request $request, $attemptId)
    {
        $request->validate([
            'type' => 'required|string',
            'detail' => 'nullable|string'
        ]);

        $attempt = ExamAttempt::where('id', $attemptId)->where('student_id', Auth::user()->id)->firstOrFail();

        if ($attempt->status !== 'in_progress') {
            return response()->json(['message' => 'Bài thi đã kết thúc'], 400);
        }

        ViolationLog::create([
            'attempt_id' => $attempt->id,
            'type' => $request->type,
            'detail' => $request->detail ?? 'Hành vi vi phạm',
            'created_at' => Carbon::now()
        ]);

        $attempt->increment('violation_count');

        // Bắn còi báo động qua Reverb
        event(new ViolationUpdated($attempt->exam_id, $attempt->id, 'violation', $request->type));

        // Block và đá văng nếu chạm ngưởng 3 lần cảnh cáo
        if ($attempt->violation_count >= 3) {
            $this->submitExam($request, $attemptId); 
            $attempt->update(['status' => 'suspended']); 
            
            return response()->json([
                'message' => 'BẠN ĐÃ VI PHẠM QUY CHẾ QUÁ 3 LẦN. HỆ THỐNG ĐÃ TỰ ĐỘNG THU BÀI!',
                'violation_count' => $attempt->violation_count,
                'is_suspended' => true
            ], 403);
        }

        return response()->json([
            'message' => 'Ghi nhận vi phạm thành công',
            'violation_count' => $attempt->violation_count
        ]);
    }

    // Trả kết quả chi tiết
    public function getResult($attemptId)
    {
        $studentId = Auth::user()->id;
        $attempt = ExamAttempt::with(['exam.subject', 'exam.classes'])
            ->where('id', $attemptId)
            ->where('student_id', $studentId)
            ->firstOrFail();

        if ($attempt->status === 'in_progress') {
            return response()->json(['message' => 'Bài thi chưa được nộp'], 400);
        }

        $answers = StudentAnswer::with(['question.choices', 'question.fillBlankAnswers'])
            ->where('attempt_id', $attempt->id)
            ->get();

        return response()->json([
            'attempt' => $attempt,
            'details' => $answers
        ]);
    }
}