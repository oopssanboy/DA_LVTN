<?php

namespace App\Http\Controllers\Api\Proctor;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; 
use App\Events\ViolationUpdated;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ProctorController extends Controller
{

    public function getActiveExams() 
    {
        $now = Carbon::now();
        $exams = Exam::where('is_active', true)
            ->where(function($q) use ($now) {
                $q->whereNull('start_time')->orWhere('start_time', '<=', $now);
            })
            ->where(function($q) use ($now) {
                $q->whereNull('end_time')->orWhere('end_time', '>=', $now);
            })
            ->with(['class', 'subject'])
            ->withCount(['attempts as active_attempts' => function ($q) {
                $q->where('status', 'in_progress');
            }])
            ->get();

        return response()->json($exams);
    }

 
    public function getAttempts($examId) 
    {
        $exam = Exam::findOrFail($examId);
        $attempts = ExamAttempt::where('exam_id', $exam->id)
            ->with(['student.user', 'violationLogs'])
            ->orderBy('started_at', 'desc')
            ->get();
        
        $attempts->map(function ($attempt) use ($exam) {
            $attempt->student_name = $attempt->student->name ?? 'Sinh viên';
            $attempt->student_code = $attempt->student->student_code ?? '';
            
            if ($attempt->status === 'in_progress') {
                $examDuration = $exam->duration * 60;
                $elapsed = now()->timestamp - Carbon::parse($attempt->started_at)->timestamp;
                $attempt->remaining_seconds = max(0, $examDuration - $elapsed);
            } else {
                $attempt->remaining_seconds = 0;
            }
            return $attempt;
        });

        return response()->json([
            'exam' => $exam,
            'attempts' => $attempts
        ]);
    }

    public function forceSubmit($attemptId)
    {
        $attempt = ExamAttempt::findOrFail($attemptId);

        if ($attempt->status !== 'in_progress') {
            return response()->json(['message' => 'Bài thi không ở trạng thái đang tiến hành'], 400);
        }

   
        $submitController = new \App\Http\Controllers\Api\Student\ExamAttemptController();
        $submitController->autoSubmitExam($attempt); 

        $attempt->update(['status' => 'suspended']);

 
        broadcast(new ViolationUpdated($attempt->exam_id, $attempt->id, 'forced_submit', 'Bài thi của bạn đã bị thu bởi giám thị!'));

        return response()->json(['message' => 'Đã thu bài thành công', 'score' => $attempt->fresh()->total_score]);
    }

    public function sendWarning(Request $request, $attemptId)
    {
        $request->validate(['message' => 'required|string']);
        $attempt = ExamAttempt::findOrFail($attemptId);
        

        broadcast(new ViolationUpdated($attempt->exam_id, $attempt->id, 'warning', $request->message));
        
        return response()->json(['message' => 'Đã gửi cảnh báo thành công']);
    }
}