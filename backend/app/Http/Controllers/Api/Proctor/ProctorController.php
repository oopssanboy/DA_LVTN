<?php

namespace App\Http\Controllers\Api\Proctor;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamAttempt;
use Illuminate\Http\Request;
use Illuminate\Support5\Facades\DB;
use App\Events\ViolationUpdated;

class ProctorController extends Controller
{
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

    public function examAttempts(Exam $exam)
    {
        $attempts = ExamAttempt::where('exam_id', $exam->id)
            ->with('student:id,name,email')
            ->orderBy('started_at')
            ->get(['id', 'student_id', 'started_at', 'ended_at', 'status', 'violation_count', 'total_score']);
        
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

    // Force submit một attempt khẩn cấp từ giám thị
    public function forceSubmit(ExamAttempt $attempt)
    {
        if ($attempt->status !== 'in_progress') {
            return response()->json(['message' => 'Bài thi không ở trạng thái đang tiến hành'], 400);
        }

        // Thực hiện logic tự động thu bài chấm điểm
        $submitController = new \App\Http\Controllers\Api\Student\ExamAttemptController();
        $submitController->performSubmit($attempt); 

        // 👉 ĐỒNG BỘ: Phát hành động 'force_submit' qua Event
        broadcast(new ViolationUpdated($attempt->exam_id, $attempt->id, 'force_submit', 'Bài thi của bạn đã bị thu bởi giám thị!'))->toOthers();

        return response()->json(['message' => 'Đã force submit thành công', 'score' => $attempt->fresh()->total_score]);
    }

    // Gửi cảnh báo thủ công từ ô nhập liệu văn bản
    public function sendWarning(Request $request, ExamAttempt $attempt)
    {
        $request->validate(['message' => 'required|string']);
        
        // 👉 ĐỒNG BỘ: Truyền chuẩn biến hành động 'warning' và text thông điệp $request->message
        broadcast(new ViolationUpdated($attempt->exam_id, $attempt->id, 'warning', $request->message))->toOthers();
        
        return response()->json(['message' => 'Đã gửi cảnh báo thành công']);
    }
}