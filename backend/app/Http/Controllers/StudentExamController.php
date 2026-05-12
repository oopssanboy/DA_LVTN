<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\ExamAttempt;
use Illuminate\Http\Request;
use App\Mail\ExamResultMail;
use Illuminate\Support\Facades\Mail;

class StudentExamController extends Controller
{
    // Lấy đề thi và Khởi tạo phiên làm bài
    public function getExam($examId) {
        $user = auth()->user();
        
        // 1. Lấy thông tin kỳ thi (Chỉ lấy kỳ thi đang mở)
        $exam = Exam::where('is_active', true)->findOrFail($examId);

        // 2. Lấy danh sách câu hỏi BẢO MẬT: 
        // Ẩn tuyệt đối cột 'correct_answer' để sinh viên không thể F12 xem trộm
        $questions = $exam->questions()->select('questions.id', 'content', 'option_a', 'option_b', 'option_c', 'option_d')->inRandomOrder()->get();

        // 3. Tìm hoặc Tạo mới phiên làm bài (Phòng trường hợp F5 rớt mạng)
        $attempt = ExamAttempt::firstOrCreate(
            ['user_id' => $user->id, 'exam_id' => $exam->id],
            ['started_at' => now(), 'answers' => []]
        );

        // 4. Tính toán thời gian còn lại (Phút)
        $elapsedMinutes = now()->diffInMinutes($attempt->started_at);
        $timeLeft = max(0, $exam->duration - $elapsedMinutes); // Trả về số phút còn lại

        return response()->json([
            'exam' => $exam,
            'questions' => $questions,
            'saved_answers' => $attempt->answers ?? (object)[], // Trả về các câu đã làm lưu nháp trước đó
            'time_left_seconds' => $timeLeft * 60, // Đổi ra giây cho Frontend đếm ngược
            'status' => $attempt->status
        ]);
    }

    // API Lưu nháp bài làm (Auto-save)
    public function saveProgress(Request $request, $examId) {
        $user = auth()->user();
        $attempt = ExamAttempt::where('user_id', $user->id)->where('exam_id', $examId)->firstOrFail();
        
        if ($attempt->status === 'completed') {
            return response()->json(['message' => 'Bài thi đã nộp, không thể sửa!'], 403);
        }

        // Lưu đáp án vào CSDL dạng JSON
        $attempt->answers = $request->answers; 
        $attempt->save();

        return response()->json(['message' => 'Đã lưu nháp']);
    }

    public function getAvailableExams() {
        // Chỉ lấy các kỳ thi có is_active = true
        $exams = Exam::where('is_active', true)
                     ->orderBy('id', 'desc')
                     ->get(['id', 'title', 'subject', 'duration', 'total_questions', 'start_time', 'end_time', 'password']); 
        
        // Map lại dữ liệu để frontend biết kỳ thi có mật khẩu hay không (KHÔNG trả về mật khẩu thật)
        $exams->transform(function($exam) {
            $exam->has_password = !empty($exam->password);
            unset($exam->password); // Xóa password thật trước khi gửi về Frontend để bảo mật
            return $exam;
        });

        return response()->json($exams);
    }

    // API Kiểm tra mật khẩu phòng thi
    public function checkPassword(Request $request, $id) {
        $exam = Exam::findOrFail($id);
        
        if (!empty($exam->password) && $exam->password !== $request->password) {
            return response()->json(['error' => 'Mật khẩu phòng thi không chính xác!'], 403);
        }

        return response()->json(['message' => 'Hợp lệ, đang vào phòng thi...']);
    }

    public function getHistory() {
        $user = auth()->user();

        // Lấy danh sách các bài thi đã nộp (status = completed), mới nhất lên đầu
        // Sử dụng eager loading 'with' để lấy thông tin kỳ thi (exam) nhằm tối ưu truy vấn
        $history = ExamAttempt::with('exam:id,title,total_questions') 
            ->where('user_id', $user->id)
            ->where('status', 'completed')
            ->orderBy('submitted_at', 'desc')
            ->get();

        // Format lại dữ liệu trả về cho chuẩn với frontend React
        $formattedHistory = $history->map(function ($attempt) {
            $totalQuestions = $attempt->exam ? $attempt->exam->total_questions : 0;
            
            // Tính toán số câu đúng: giả sử điểm thi hệ 10
            // Số câu đúng = (Điểm / 10) * Tổng số câu hỏi
            $correctAnswers = $totalQuestions > 0 ? round(($attempt->score / 10) * $totalQuestions) : 0;

            return [
                'id' => $attempt->id,
                'exam_title' => $attempt->exam ? $attempt->exam->title : 'Kỳ thi đã bị xóa',
                'score' => round($attempt->score, 2),
                'correct_answers' => $correctAnswers,
                'total_questions' => $totalQuestions,
                'completed_at' => $attempt->submitted_at ?? $attempt->updated_at,
            ];
        });

        return response()->json($formattedHistory);
    }

    public function submit(Request $request, $examId)
    {
        $request->validate([
            'answers' => 'nullable|array', 
        ]);

        $exam = Exam::with('questions')->findOrFail($examId);
        $user = $request->user();
        $answers = $request->answers ?? [];

        $correctCount = 0;
        $totalQuestions = $exam->questions->count();
        $details = [];

        foreach ($exam->questions as $question) {
            $userAnswer = $answers[$question->id] ?? null;
            $isCorrect = $userAnswer === $question->correct_answer;
            
            if ($isCorrect) {
                $correctCount++;
            }

            $details[] = [
                'question_id' => $question->id,
                'question_text' => $question->content,
                'user_answer' => $userAnswer,
                'correct_answer' => $question->correct_answer,
                'is_correct' => $isCorrect
            ];
        }

        // Tính điểm hệ 10
        $score = $totalQuestions > 0 ? round(($correctCount / $totalQuestions) * 10, 2) : 0;
        $isPassed = $score >= 5.0; // Giả sử 5.0 là điểm chuẩn để đậu

        // Lưu vào CSDL
        $attempt = ExamAttempt::where('user_id', $user->id)
            ->where('exam_id', $exam->id)
            ->firstOrFail();

        $attempt->update([
            'score' => $score,
            'total_correct' => $correctCount,
            'total_questions' => $totalQuestions,
            'is_passed' => $isPassed,
            'details' => json_encode($details),
            'status' => 'completed',
            'submitted_at' => now()
        ]);

        Mail::to($user->email)->queue(new ExamResultMail($score, $details));

        return response()->json([
            'message' => 'Nộp bài thành công!',
            'score' => $score,
            'correct_count' => $correctCount,
            'total_questions' => $totalQuestions,
            'details' => $details
        ]);
    }

    // Sửa lại tham số truyền vào là $examId
    public function logViolation($examId)
    {
        $user = auth()->user();
        
        // Tìm phiên làm bài dựa trên user_id và exam_id
        $attempt = ExamAttempt::where('user_id', $user->id)
            ->where('exam_id', $examId)
            ->firstOrFail(); // Sẽ báo lỗi nếu sinh viên chưa bắt đầu làm bài này

        $attempt->cheat_count += 1;
        
        // Nếu vi phạm quá 3 lần, tự động thu bài
        if ($attempt->cheat_count >= 3) {
            $attempt->status = 'forced_submitted';
            $attempt->submitted_at = now(); // <--- Sửa 'completed_at' thành 'submitted_at'
            $attempt->save();
            
            return response()->json(['message' => 'Bài thi đã bị thu do vi phạm quy chế quá nhiều lần.', 'forced' => true]);
        }

        $attempt->save();
        return response()->json(['message' => 'Đã ghi nhận hành vi vi phạm.', 'cheat_count' => $attempt->cheat_count]);
    }
}