<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\{Report, Complaint, ExamAttempt, Exam, Notification, StudentAnswer, ClassEnrollment};
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;

class PostExamController extends Controller
{

    public function getProctorReports()
    {
        return response()->json(Report::with('exam')->where('proctor_id', Auth::id())->latest()->get());
    }

    public function getExamSummaryForReport($examId)
    {
        $exam = Exam::with(['classes', 'subject'])->findOrFail($examId);
        
        $classIds = $exam->classes->pluck('id');
        $totalStudents = ClassEnrollment::whereIn('class_id', $classIds)->count();
        
        $attempts = ExamAttempt::with(['student.user', 'violationLogs'])->where('exam_id', $examId)->get();
        $participated = $attempts->count();

        $violations = [];
        foreach($attempts as $att) {
            foreach($att->violationLogs as $log) {
                $violations[] = [
                    'student_name' => $att->student->name,
                    'student_code' => $att->student->student_code,
                    'type' => $log->type,
                    'detail' => $log->detail,
                    'time' => $log->created_at->format('H:i A')
                ];
            }
        }

        return response()->json([
            'exam' => $exam,
            'total_students' => $totalStudents,
            'participated' => $participated,
            'violations' => $violations
        ]);
    }

    public function storeReport(Request $request)
    {
        $request->validate([
            'exam_id' => 'required|exists:exams,id', 
            'content' => 'required|string'
        ]);

        $exam = Exam::with('classes.teachers')->find($request->input('exam_id'));
        $teacher = $exam?->classes?->first()?->teachers?->first();

        $report = Report::create([
            'exam_id' => $request->input('exam_id'),
            'proctor_id' => Auth::id(),
            'teacher_id' => $teacher?->id ?? 1,
            'title' => 'Báo cáo ca thi: ' . $exam->title,
            'content' => $request->input('content'),
            'status' => 'sent',
            'sent_at' => now()
        ]);

        return response()->json(['message' => 'Lập báo cáo tổng kết thành công']);
    }


    public function getTeacherPostExams()
    {
        $teacherId = Auth::id();
        $reports = Report::with(['exam.subject', 'proctor'])->where('teacher_id', $teacherId)->latest()->get();
        $complaints = Complaint::with(['studentUser.student', 'exam.subject'])
            ->whereHas('exam.classes.teachers', function($q) use ($teacherId) {
                $q->where('users.id', $teacherId);
            })->latest()->get();

        return response()->json(['reports' => $reports, 'complaints' => $complaints]);
    }

    public function getReportDetails($reportId)
    {
        $report = Report::with(['exam.classes', 'proctor'])->findOrFail($reportId);
        
        $attempts = ExamAttempt::with(['student.user', 'violationLogs'])
                        ->where('exam_id', $report->exam_id)
                        ->get();
        
        $violators = [];
        foreach($attempts as $att) {
            if ($att->violationLogs->count() > 0) {
                $violators[] = [
                    'attempt_id' => $att->id,
                    'student_name' => $att->student->name ?? 'Khuyết danh',
                    'student_code' => $att->student->student_code ?? 'N/A',
                    'current_score' => $att->total_score,
                    'status' => $att->status,
                    'violation_count' => $att->violation_count,
                    'logs' => $att->violationLogs->map(function($log) {
                        return [
                            'type' => $log->type,
                            'detail' => $log->detail,
                            'time' => $log->created_at->format('H:i A')
                        ];
                    })
                ];
            }
        }

        return response()->json([
            'report' => $report,
            'participated_count' => $attempts->count(),
            'violators' => $violators
        ]);
    }

    public function resolveReport(Request $request, $id)
    {
        $request->validate([
            'action' => 'required|in:warn,cancel_exam,deduct_points',
            'resolution' => 'required|string',
            'penalty_points' => 'nullable|numeric|min:0'
        ]);

        $report = Report::with('exam')->findOrFail($id);

        DB::beginTransaction();
        try {
            if ($request->action === 'cancel_exam') {
                ExamAttempt::where('exam_id', $report->exam_id)->update(['total_score' => 0, 'is_passed' => false, 'status' => 'suspended']);
            } elseif ($request->action === 'deduct_points') {
                $penalty = floatval($request->penalty_points ?? 0);
                $attempts = ExamAttempt::where('exam_id', $report->exam_id)->where('violation_count', '>', 0)->get();
                foreach($attempts as $att) {
                    $newScore = max(0, $att->total_score - $penalty);
                    $isPassed = $newScore >= $report->exam->passing_score;
                    $att->update(['total_score' => $newScore, 'is_passed' => $isPassed]);
                }
            }

            $report->update([
                'resolution' => $request->resolution,
                'status' => 'processed',
                'resolved_at' => now()
            ]);

            Notification::create([
                'user_id' => $report->proctor_id, 'sender_id' => Auth::id(),
                'title' => 'Biên bản đã xử lý', 'content' => "Giảng viên đã xử lý biên bản: {$report->title}",
                'target_role' => 'proctor'
            ]);

            DB::commit();
            return response()->json(['message' => 'Đã xử lý biên bản chung']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi xử lý: '.$e->getMessage()], 500);
        }
    }

    public function resolveIndividualViolation(Request $request, $attemptId)
    {
        $request->validate([
            'action' => 'required|in:cancel_exam,adjust_score,request_expulsion',
            'reason' => 'required|string',
            'new_score' => 'nullable|numeric|min:0|max:10'
        ]);

        $attempt = ExamAttempt::with(['student.user', 'exam'])->findOrFail($attemptId);
        $action = $request->action;

        DB::beginTransaction();
        try {
            $emailContent = "Chào bạn,\n\nGiảng viên đã xử lý vi phạm của bạn trong môn {$attempt->exam->title}.\nLý do: {$request->reason}\n";

            if ($action === 'cancel_exam') {
                $attempt->update(['total_score' => 0, 'is_passed' => false, 'status' => 'suspended']);
                $emailContent .= "Kết quả: BÀI THI BỊ HỦY (0 điểm).";
            } elseif ($action === 'adjust_score') {
                $newScore = max(0, floatval($request->new_score));
                $isPassed = $newScore >= $attempt->exam->passing_score;
                $attempt->update(['total_score' => $newScore, 'is_passed' => $isPassed]);
                $emailContent .= "Kết quả: Điểm của bạn bị điều chỉnh thành {$newScore}.";
            } elseif ($action === 'request_expulsion') {
                Notification::create([
                    'user_id' => 1,
                    'sender_id' => Auth::id(),
                    'title' => 'Yêu cầu xem xét đuổi học',
                    'content' => "Giảng viên yêu cầu kỷ luật/đuổi học SV: {$attempt->student->name} ({$attempt->student->student_code}) do vi phạm nghiêm trọng trong kỳ thi: {$attempt->exam->title}. Lý do: {$request->reason}",
                    'target_role' => 'admin'
                ]);
                $emailContent .= "Kết quả: Hệ thống đã ghi nhận vi phạm nghiêm trọng và chuyển hồ sơ lên Ban quản trị xem xét kỷ luật/đuổi học.";
            }

            Mail::raw($emailContent, function ($message) use ($attempt) {
                $message->to($attempt->student->user->email)->subject('Thông báo xử lý vi phạm - NQ EduTech');
            });

            DB::commit();
            return response()->json(['message' => 'Đã xử lý vi phạm cá nhân thành công']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi xử lý: '.$e->getMessage()], 500);
        }
    }

    public function getComplaintDetails($complaintId)
    {
        $complaint = Complaint::with(['studentUser.student', 'exam'])->findOrFail($complaintId);
        $attempt = ExamAttempt::with('violationLogs')->where('exam_id', $complaint->exam_id)->where('student_id', $complaint->student_id)->first();
        
        $answers = [];
        if ($attempt) {
            $answers = StudentAnswer::with(['question.choices', 'question.fillBlankAnswers'])->where('attempt_id', $attempt->id)->get();
        }

        return response()->json(['complaint' => $complaint, 'attempt' => $attempt, 'answers' => $answers]);
    }

    public function resolveComplaint(Request $request, $id)
    {
        $request->validate([
            'action' => 'required|in:none,cancel_exam,adjust_score',
            'reason' => 'required|string',
            'new_score' => 'nullable|numeric|min:0|max:10'
        ]);

        $complaint = Complaint::with(['studentUser', 'exam'])->findOrFail($id);
        $attempt = ExamAttempt::where('exam_id', $complaint->exam_id)->where('student_id', $complaint->student_id)->first();

        DB::beginTransaction();
        try {
            if ($attempt) {
                if ($request->action === 'cancel_exam') {
                    $attempt->update(['total_score' => 0, 'is_passed' => false, 'status' => 'suspended']);
                } elseif ($request->action === 'adjust_score') {
                    $isPassed = $request->new_score >= $complaint->exam->passing_score;
                    $attempt->update(['total_score' => $request->new_score, 'is_passed' => $isPassed]);
                }
            }

            $complaint->update(['response' => $request->reason, 'status' => 'resolved']);
        
            $emailContent = "Chào bạn,\n\nGiảng viên đã xử lý khiếu nại môn {$complaint->exam->title}.\nPhản hồi từ Giảng viên: {$request->reason}\n";
            if ($request->action === 'cancel_exam') $emailContent .= "Kết quả: BÀI THI BỊ HỦY (0 điểm).";
            if ($request->action === 'adjust_score') $emailContent .= "Kết quả: Điểm được điều chỉnh thành {$request->new_score}.";

            Mail::raw($emailContent, function ($message) use ($complaint) {
                $message->to($complaint->studentUser->email)->subject('Kết quả xử lý khiếu nại - NQ EduTech');
            });

            DB::commit();
            return response()->json(['message' => 'Đã xử lý khiếu nại thành công']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi xử lý: '.$e->getMessage()], 500);
        }
    }

 
    public function getStudentComplaints()
    {
        $complaints = Complaint::with('exam.subject')
            ->where('student_id', Auth::id())
            ->latest()
            ->get();
            
        return response()->json($complaints);
    }

    public function storeComplaint(Request $request)
    {
        $request->validate([
            'exam_id' => 'required|exists:exams,id',
            'type' => 'required|string|in:grade_review,technical_issue',
            'content' => 'required|string',
            'evidence' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:20480'
        ]);

        $evidenceUrl = null;
        if ($request->hasFile('evidence')) {
            $cloudinary = app(\Cloudinary\Cloudinary::class);
            $result = $cloudinary->uploadApi()->upload($request->file('evidence')->getRealPath(), [
                'resource_type' => 'auto'
            ]);
            $evidenceUrl = $result['secure_url'];
        }

        Complaint::create([
            'student_id' => Auth::id(),
            'exam_id' => $request->input('exam_id'),
            'type' => $request->input('type'),
            'content' => $request->input('content'),
            'evidence_url' => $evidenceUrl,
            'status' => 'pending'
        ]);

        return response()->json(['message' => 'Gửi yêu cầu khiếu nại thành công']);
    }
}