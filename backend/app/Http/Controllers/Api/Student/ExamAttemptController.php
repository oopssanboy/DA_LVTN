<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\StudentAnswer;
use App\Models\ViolationLog;
use App\Events\ViolationUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExamAttemptController extends Controller
{
    // 1. Danh sách kỳ thi mà học viên được tham gia (dựa trên lớp đã ghi danh)
    public function availableExams()
    {
        $student = auth()->user();
        $now = now();

        $exams = Exam::whereHas('class', function ($q) use ($student) {
            $q->whereHas('enrollments', function ($sq) use ($student) {
                $sq->where('student_id', $student->id);
            });
        })
            ->where('start_time', '<=', $now)
            ->where('end_time', '>=', $now)
            ->where('is_active', true)
            ->with('class.course')
            ->get();

        // Thêm trạng thái đã thi hay chưa
        foreach ($exams as $exam) {
            $attempt = ExamAttempt::where('exam_id', $exam->id)
                ->where('student_id', $student->id)
                ->first();
            $exam->attempt_status = $attempt ? $attempt->status : 'not_started';
            $exam->attempt_id = $attempt ? $attempt->id : null;
        }

        return response()->json($exams);
    }

    // 2. Bắt đầu thi: tạo exam_attempt, sinh đề riêng cho học viên (dựa trên exam_questions đã được tạo sẵn từ ma trận)
    public function start(Request $request, Exam $exam) // 👉 Thêm Request $request vào tham số đầu vào
    {
        $student = auth()->user();

        // Kiểm tra thời gian
        $now = now();
        if ($now < $exam->start_time || $now > $exam->end_time) {
            return response()->json(['message' => 'Kỳ thi chưa bắt đầu hoặc đã kết thúc'], 400);
        }

        // Kiểm tra đã có attempt chưa
        $existing = ExamAttempt::where('exam_id', $exam->id)
            ->where('student_id', $student->id)
            ->first();
        if ($existing && $existing->status != 'submitted') {
            return response()->json(['message' => 'Bạn đã có một lượt thi đang tiến hành', 'attempt_id' => $existing->id], 400);
        }
        if ($existing && $existing->status == 'submitted') {
            return response()->json(['message' => 'Bạn đã nộp bài thi này rồi'], 400);
        }

        // 👉 THÊM LOGIC KIỂM TRA MẬT KHẨU KỲ THI TẠI ĐÂY
        // Nếu kỳ thi có đặt password (trường password trong db khác null hoặc rỗng)
        if (!empty($exam->password)) {
            // Kiểm tra xem phía frontend có gửi password lên không, hoặc password gửi lên có trùng khớp không
            if (!$request->has('password') || $request->password !== $exam->password) {
                return response()->json(['message' => 'Mật khẩu phòng thi không chính xác!'], 403);
            }
        }

        // Lấy danh sách câu hỏi của kỳ thi (giữ nguyên logic cũ phía dưới...)
        $examQuestions = $exam->questions()->with('choices')->get();
        // Lấy danh sách câu hỏi của kỳ thi (đã được tạo sẵn trong bảng exam_questions)
        $examQuestions = $exam->questions()->with('choices')->get();
        if ($examQuestions->isEmpty()) {
            return response()->json(['message' => 'Đề thi chưa được tạo, vui lòng liên hệ giảng viên'], 500);
        }

        // Nếu cần xáo trộn câu hỏi
        if ($exam->shuffle_questions) {
            $examQuestions = $examQuestions->shuffle();
        }

        // Tạo attempt
        $attempt = ExamAttempt::create([
            'exam_id' => $exam->id,
            'student_id' => $student->id,
            'started_at' => $now,
            'status' => 'in_progress',
            'violation_count' => 0,
        ]);

        // 👉 THÊM: Phát tín hiệu có sinh viên mới tham gia để Giám thị load lại bảng ngay
        try {
            broadcast(new ViolationUpdated($attempt->exam_id, $attempt->id, 'joined', 'Sinh viên vừa vào phòng thi'));
        } catch (\Exception $e) {}

        // Lưu danh sách câu hỏi kèm thứ tự (có thể lưu vào bảng riêng nếu cần, nhưng ta sẽ dùng student_answers để lưu câu trả lời)
        // Không cần lưu lại danh sách câu hỏi vì đã có exam_questions. Nhưng để phòng khi giảng viên thay đổi đề sau khi thi,
        // nên clone danh sách câu hỏi vào bảng `attempt_questions` (tuỳ chọn). Ở đây tôi tạm thời dùng exam_questions làm gốc.

        return response()->json([
            'attempt_id' => $attempt->id,
            'exam' => [
                'title' => $exam->title,
                'duration' => $exam->duration,
                'remaining_seconds' => $exam->duration * 60,
            ],
            'questions' => $examQuestions->map(function ($q) use ($attempt) {
                // Với mỗi câu hỏi, kiểm tra xem đã có answer chưa (auto-save)
                $savedAnswer = StudentAnswer::where('attempt_id', $attempt->id)
                    ->where('question_id', $q->id)
                    ->first();
                return [
                    'id' => $q->id,
                    'content' => $q->content,
                    'type' => $q->type,
                    'choices' => $q->type != 'fill_blank' ? $q->choices->map(function ($c) {
                        return ['key' => $c->choice_key, 'text' => $c->choice_text];
                    }) : null,
                    'saved_answer' => $savedAnswer ? $savedAnswer->answer_text : null,
                ];
            }),
        ]);
    }

    // 3. Auto-save đáp án
    public function saveAnswer(Request $request, ExamAttempt $attempt)
    {
        // Đảm bảo sinh viên đăng nhập chỉ được phép xem lượt thi của chính họ
        if ($attempt->student_id !== auth()->id()) {
            return response()->json(['message' => 'Bạn không có quyền truy cập lượt thi này!1111111'], 0.53);
        } // cần Policy đảm bảo học viên sở hữu attempt

        $request->validate([
            'question_id' => 'required|exists:questions,id',
            'answer_text' => 'nullable|string',
        ]);

        $answer = StudentAnswer::updateOrCreate(
            [
                'attempt_id' => $attempt->id,
                'question_id' => $request->question_id,
            ],
            [
                'answer_text' => $request->answer_text,
            ]
        );

        return response()->json(['message' => 'Lưu thành công']);
    }

    // 4. Ghi nhận vi phạm
    // Ghi nhận vi phạm
    public function logViolation(Request $request, ExamAttempt $attempt)
    {
        $request->validate([
            'type' => 'required|string|in:tab_switch,right_click,copy_paste,devtools',
            'detail' => 'nullable|string',
        ]);

        ViolationLog::create([
            'attempt_id' => $attempt->id, 
            'type' => $request->type,
            'detail' => $request->detail,
        ]);

        $attempt->increment('violation_count');

        try {
            broadcast(new ViolationUpdated($attempt->exam_id, $attempt->id, 'violation', $request->type));
        } catch (\Exception $e) {}

        // 👉 ĐÃ THÊM: Nếu quá 3 lần, ép thu bài đồng thời bắn tín hiệu bắt Frontend kích hoạt popup đuổi khỏi phòng thi
        if ($attempt->violation_count >= 3 && $attempt->status == 'in_progress') {
            $this->performSubmit($attempt);
            try {
                broadcast(new ViolationUpdated($attempt->exam_id, $attempt->id, 'force_submit', 'Vi phạm quá 3 lần'));
            } catch (\Exception $e) {}

            return response()->json([
                'message' => 'Bạn đã vi phạm quy chế thi quá 3 lần. Hệ thống tự động thu bài khóa lượt thi!',
                'violation_count' => $attempt->violation_count
            ], 403);
        }

        return response()->json([
            'message' => 'Đã ghi nhận vi phạm thành công',
            'violation_count' => $attempt->violation_count
        ]);
    }

    // 5. Nộp bài và chấm điểm
    public function submit(ExamAttempt $attempt)
    {
        if ($attempt->status !== 'in_progress') {
            return response()->json(['message' => 'Bài thi đã được nộp trước đó'], 400);
        }
        return $this->performSubmit($attempt);
    }

    // Logic nộp bài và chấm điểm
    public function performSubmit(ExamAttempt $attempt)
    {
        DB::beginTransaction();
        try {
            $exam = $attempt->exam;
            $totalScore = 0;
            $maxTotal = 0;

            $questions = $exam->questions()->get();

            foreach ($questions as $question) {
                $studentAnswer = StudentAnswer::where('attempt_id', $attempt->id)
                    ->where('question_id', $question->id)
                    ->first();

                $answerText = ($studentAnswer && !is_null($studentAnswer->answer_text)) ? $studentAnswer->answer_text : '';
                $isCorrect = false;
                $scoreEarned = 0;

                switch ($question->type) {
                    case 'single':
                        $isCorrect = ($answerText == $question->correct_answer);
                        $scoreEarned = $isCorrect ? $question->score : 0;
                        break;
                    case 'multiple':
                        $correctSet = explode(',', $question->correct_answer);
                        $userSet = $answerText ? explode(',', $answerText) : [];
                        $isCorrect = (count(array_diff($correctSet, $userSet)) == 0 && count(array_diff($userSet, $correctSet)) == 0);
                        $scoreEarned = $isCorrect ? $question->score : 0;
                        break;
                    case 'fill_blank':
                        $correctAnswers = explode('|', strtolower($question->correct_answer));
                        $userAnswer = strtolower(trim($answerText));
                        $isCorrect = in_array($userAnswer, $correctAnswers);
                        $scoreEarned = $isCorrect ? $question->score : 0;
                        break;
                }

                if ($studentAnswer) {
                    $studentAnswer->update([
                        'is_correct' => $isCorrect,
                        'score_earned' => $scoreEarned,
                    ]);
                } else {
                    StudentAnswer::create([
                        'attempt_id' => $attempt->id,
                        'question_id' => $question->id,
                        'answer_text' => $answerText !== '' ? $answerText : 'Không có câu trả lời',
                        'is_correct' => $isCorrect,
                        'score_earned' => $scoreEarned,
                    ]);
                }

                $totalScore += $scoreEarned;
                $maxTotal += $question->score;
            }

            $finalScore = $maxTotal > 0 ? round(($totalScore / $maxTotal) * 10, 2) : 0;
            $isPassed = $finalScore >= $exam->passing_score;

            $attempt->update([
                'ended_at' => now(),
                'total_score' => $finalScore,
                'is_passed' => $isPassed,
                'status' => 'submitted',
            ]);

            DB::commit();

            // 👉 ĐÃ THÊM: Phát realtime báo cho Giám thị biết sinh viên đã nộp xong để đổi trạng thái trên bảng
            try {
                broadcast(new ViolationUpdated($attempt->exam_id, $attempt->id, 'submitted', 'Sinh viên đã nộp bài'));
            } catch (\Exception $e) {}

            return response()->json([
                'message' => 'Nộp bài thành công',
                'score' => $finalScore,
                'is_passed' => $isPassed,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error($e->getMessage());
            return response()->json(['message' => 'Có lỗi xảy ra khi nộp bài'], 500);
        }
    }

    // 6. Xem kết quả chi tiết
    public function result(ExamAttempt $attempt)
    {
        if ($attempt->status !== 'submitted') {
            return response()->json(['message' => 'Bài thi chưa được nộp'], 400);
        }

        $questions = $attempt->exam->questions()->with('choices')->get();
        $answers = StudentAnswer::where('attempt_id', $attempt->id)->get()->keyBy('question_id');

        $details = $questions->map(function ($q) use ($answers) {
            $ans = $answers->get($q->id);
            return [
                'question_id' => $q->id,
                'content' => $q->content,
                'type' => $q->type,
                'user_answer' => $ans ? $ans->answer_text : '',
                'correct_answer' => $q->correct_answer,
                'is_correct' => $ans ? $ans->is_correct : false,
                'score_earned' => $ans ? $ans->score_earned : 0,
                'explanation' => $q->explanation,
            ];
        });

        return response()->json([
            'attempt_id' => $attempt->id,
            'total_score' => $attempt->total_score,
            'is_passed' => $attempt->is_passed,
            'details' => $details,
        ]);
    }
    public function getAttempt(ExamAttempt $attempt)
    {
        // Đảm bảo sinh viên đăng nhập chỉ được phép xem lượt thi của chính họ
        if ($attempt->student_id !== auth()->id()) {
            return response()->json(['message' => 'Bạn không có quyền truy cập lượt thi này!'], 0.53);
        }
        $exam = $attempt->exam;
        $examQuestions = $exam->questions()->with('choices')->get();
        if ($exam->shuffle_questions)
            $examQuestions = $examQuestions->shuffle();

        $savedAnswers = StudentAnswer::where('attempt_id', $attempt->id)->get()->keyBy('question_id');

        $remainingSeconds = max(0, ($exam->duration * 60) - now()->diffInSeconds($attempt->started_at));

        return response()->json([
            'attempt_id' => $attempt->id,
            'exam' => [
                'title' => $exam->title,
                'duration' => $exam->duration,
                'remaining_seconds' => $remainingSeconds,
                'exam_id' => $exam->id,
            ],
            'questions' => $examQuestions->map(function ($q) use ($savedAnswers) {
                // Sử dụng ->get($id) của Laravel Collection để tránh bị báo lỗi sập trang nếu key chưa tồn tại
                $saved = $savedAnswers->get($q->id);
                return [
                    'id' => $q->id,
                    'content' => $q->content,
                    'type' => $q->type,
                    'choices' => $q->type != 'fill_blank' ? $q->choices->map(fn($c) => ['key' => $c->choice_key, 'text' => $c->choice_text]) : null,
                    'saved_answer' => $saved ? $saved->answer_text : null,
                ];
            }),
        ]);
    }
    // Lấy lịch sử thi của sinh viên
    public function history()
    {
        $student = auth()->user();

        $history = ExamAttempt::where('student_id', $student->id)
            ->where('status', 'submitted')
            ->with('exam:id,title') // Lấy thêm thông tin bài thi
            ->orderBy('ended_at', 'desc')
            ->get()
            ->map(function ($attempt) {
                return [
                    'id' => $attempt->id,
                    'exam_title' => $attempt->exam->title ?? 'Không xác định',
                    'score' => $attempt->total_score,
                    'is_passed' => $attempt->is_passed,
                    'completed_at' => $attempt->ended_at,
                ];
            });

        return response()->json($history);
    }
}