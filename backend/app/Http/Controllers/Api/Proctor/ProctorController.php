<?php

namespace App\Http\Controllers\Api\Proctor;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Events\ViolationUpdated; // sẽ tạo event

class ProctorController extends Controller
{
    // Lấy danh sách kỳ thi đang diễn ra (có attempt in_progress)
    public function activeExams()
    {
        $exams = Exam::where('is_active', true)
            ->where('start_time', '<=', now())
            ->where('end_time', '>=', now())
            ->withCount(['attempts as active_attempts' => function ($q) {
                $q->where('status', 'in_progress');
            }])
            ->get(['id', 'title', 'subject', 'duration', 'start_time', 'end_time']);
        return response()->json($exams);
    }

    // Lấy danh sách attempt của một kỳ thi (kèm thông tin student, violation_count)
    public function examAttempts(Exam $exam)
    {
        $attempts = ExamAttempt::where('exam_id', $exam->id)
            ->with('student:id,name,email')
            ->orderBy('started_at')
            ->get(['id', 'student_id', 'started_at', 'ended_at', 'status', 'violation_count', 'total_score']);
        
        // Thêm thời gian còn lại (nếu đang làm)
        foreach ($attempts as $attempt) {
            if ($attempt->status === 'in_progress') {
                $examDuration = $exam->duration * 60;
                $elapsed = now()->diffInSeconds($attempt->started_at);
                $attempt->remaining_seconds = max(0, $examDuration - $elapsed);
            } else {
                $attempt->remaining_seconds = 0;
            }
        }
        return response()->json($attempts);
    }

    // Force submit một attempt
    public function forceSubmit(ExamAttempt $attempt)
    {
        if ($attempt->status !== 'in_progress') {
            return response()->json(['message' => 'Bài thi không ở trạng thái đang tiến hành'], 400);
        }

        // Gọi lại logic submit (có thể tái sử dụng từ ExamAttemptController)
        $submitController = new \App\Http\Controllers\Api\Student\ExamAttemptController();
        $result = $submitController->performSubmit($attempt); // cần làm method public hoặc copy logic

        // Broadcast sự kiện cập nhật
        broadcast(new ViolationUpdated($attempt->exam_id, $attempt->id, 'force_submit'))->toOthers();

        return response()->json(['message' => 'Đã force submit thành công', 'score' => $attempt->fresh()->total_score]);
    }

    // Gửi cảnh báo (ghi log và broadcast)
    public function sendWarning(Request $request, ExamAttempt $attempt)
    {
        $request->validate(['message' => 'required|string']);
        broadcast(new ViolationUpdated($attempt->exam_id, $attempt->id, 'warning', $request->message))->toOthers();
        return response()->json(['message' => 'Đã gửi cảnh báo']);
    }
}