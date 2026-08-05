<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\{Report, Complaint, ExamAttempt, Exam, Notification, StudentAnswer, ClassEnrollment, ExpulsionRequest, ViolationAction};
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use App\Mail\ViolationResolutionMail;

class PostExamController extends Controller
{

    public function getProctorReports()
    {
        return response()->json(Report::with('exam')->where('proctor_id', Auth::id())->latest()->get());
    }

    public function getExamSummaryForReport($examId)
    {
        $exam = Exam::with(['classes', 'subject', 'teacher'])->findOrFail($examId);
        
        $classIds = $exam->classes->pluck('id');
        $totalStudents = ClassEnrollment::whereIn('class_id', $classIds)->distinct('student_id')->count('student_id');
        
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

        $exam = Exam::with('classes')->find($request->input('exam_id'));
        
    
        $classIds = $exam->classes->pluck('id');
        $totalStudents = ClassEnrollment::whereIn('class_id', $classIds)->distinct('student_id')->count('student_id');
        
        $attempts = ExamAttempt::with('violationLogs')->where('exam_id', $exam->id)->get();
        $presentCount = $attempts->count();
        $absentCount = max(0, $totalStudents - $presentCount);
        
        $violationCount = 0;
        foreach ($attempts as $att) {
            $violationCount += $att->violationLogs->count();
        }


        $report = Report::create([
            'exam_id' => $exam->id,
            'proctor_id' => Auth::id(),
      
            'teacher_id' => $exam->teacher_id ?? 1, 
            'title' => 'Biên bản ca thi: ' . $exam->title,
            'content' => $request->input('content'),
            
            'total_students' => $totalStudents,
            'present_count' => $presentCount,
            'absent_count' => $absentCount,
            'violation_count' => $violationCount,
            'start_time' => $exam->start_time,
            'end_time' => $exam->end_time ?? now(), 
            
            'status' => 'submitted', 
            'sent_at' => now()
        ]);

        Notification::create([
            'user_id' => $report->teacher_id,
            'sender_id' => Auth::id(),
            'title' => 'Biên bản ca thi mới',
            'content' => "Giám thị vừa nộp biên bản cho ca thi: {$exam->title}. Vui lòng xem xét.",
            'target_role' => 'teacher'
        ]);

        return response()->json(['message' => 'Lập biên bản ca thi thành công']);
    }


    public function getTeacherPostExams()
    {
        $teacherId = Auth::id();
        $reports = Report::with(['exam.subject', 'proctor'])->where('teacher_id', $teacherId)->latest()->get();
        $complaints = Complaint::with(['studentUser.student', 'exam.subject'])
            ->whereHas('exam', function($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId);
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
              
                $existingAction = ViolationAction::where('attempt_id', $att->id)->first();
               

                $violators[] = [
                    'attempt_id' => $att->id,
                    'student_name' => $att->student->name ?? 'Khuyết danh',
                    'student_code' => $att->student->student_code ?? 'N/A',
                    'current_score' => $att->total_score,
                    'status' => $att->status,
                    'violation_count' => $att->violation_count,
                    'handled_action' => $existingAction, 
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
           
            'status' => 'required|in:reviewing,completed,closed',
            'resolution' => 'nullable|string'
        ]);

        $report = Report::findOrFail($id);

        try {
            $report->update([
                'resolution' => $request->resolution,
                'status' => $request->status,
                'resolved_at' => in_array($request->status, ['completed', 'closed']) ? now() : null
            ]);

           
            Notification::create([
                'user_id' => $report->proctor_id,
                'sender_id' => Auth::id(),
                'title' => 'Cập nhật trạng thái biên bản',
                'content' => "Biên bản ca thi '{$report->title}' đã được cập nhật thành: {$request->status}",
                'target_role' => 'proctor'
            ]);

            return response()->json(['message' => 'Cập nhật trạng thái biên bản thành công!']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi xử lý: '.$e->getMessage()], 500);
        }
    }

    public function resolveIndividualViolation(Request $request, $attemptId)
    {
        $request->validate([
            'action' => 'required|in:warn,deduct_points,cancel_exam,request_expulsion',
            'reason' => 'required|string',
            'penalty_points' => 'nullable|numeric|min:0',
            'report_id' => 'nullable|exists:reports,id' 
        ]);

        $attempt = ExamAttempt::findOrFail($attemptId);
        $action = $request->action;

        DB::beginTransaction();
        try {
            if ($action === 'request_expulsion') {
                ExpulsionRequest::create([
                    'student_id' => $attempt->student_id,
                    'teacher_id' => Auth::id(),
                    'exam_id' => $attempt->exam_id,
                    'reason' => $request->reason,
                    'status' => 'pending'
                ]);
            } 
         
            else {
                $reasonText = $request->reason;
                if ($action === 'deduct_points' && $request->has('penalty_points')) {
                    $reasonText .= " (Đề xuất trừ: " . floatval($request->penalty_points) . " điểm)";
                }

                ViolationAction::create([
                    'report_id' => $request->report_id ?? null,
                    'attempt_id' => $attempt->id,
                    'teacher_id' => Auth::id(),
                    'action' => $action,
                    'reason' => $reasonText,
                    'status' => 'pending' 
                ]);
            }

            DB::commit();
            return response()->json([
                'message' => 'Đã tạo phiếu đề xuất kỷ luật thành công. Đang chờ Ban quản trị phê duyệt!'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi tạo đề xuất: '.$e->getMessage()], 500);
        }
    }

    public function getComplaintDetails($complaintId)
    {
        $complaint = Complaint::with(['studentUser.student', 'exam'])->findOrFail($complaintId);
        
        if ($complaint->status === 'pending') {
            $complaint->update(['status' => 'processing']);
        }
 

        $attempt = ExamAttempt::with('violationLogs')->where('exam_id', $complaint->exam_id)->where('student_id', $complaint->student_id)->first();
        
        $answers = [];
        if ($attempt) {
            $answers = StudentAnswer::with(['question.choices', 'question.fillBlankAnswers'])->where('attempt_id', $attempt->id)->get();
        }

        $report = Report::with('proctor')->where('exam_id', $complaint->exam_id)->first();

        return response()->json([
            'complaint' => $complaint, 
            'attempt' => $attempt, 
            'answers' => $answers,
            'report_context' => $report 
        ]);
    }

    public function resolveComplaint(Request $request, $id)
    {
        $request->validate([
            'action' => 'required|in:none,adjust_score',
            'reason' => 'required|string',
            'new_score' => 'nullable|numeric|min:0|max:10'
        ]);

        $complaint = Complaint::with(['studentUser', 'exam'])->findOrFail($id);

        DB::beginTransaction();
        try {
            if ($request->action === 'adjust_score') {
                $complaint->update([
                    'response' => $request->reason,
                    'proposed_score' => $request->new_score,
                    'status' => 'pending_approval' 
                ]);

               
                Notification::create([
                    'user_id' => $complaint->studentUser->id, 'sender_id' => Auth::id(),
                    'title' => "Đang xử lý khiếu nại môn {$complaint->exam->title}", 
                    'content' => "Giảng viên đã đề xuất điều chỉnh điểm thành {$request->new_score}. Đang chờ Ban quản trị phê duyệt.", 
                    'target_role' => 'student'
                ]);

                $message = 'Đã gửi đề xuất điều chỉnh điểm lên Ban quản trị thành công!';
            } else {
               
                $complaint->update([
                    'response' => $request->reason, 
                    'status' => 'rejected'
                ]);
            
                $emailContent = "Chào bạn,\n\nGiảng viên đã xử lý khiếu nại môn {$complaint->exam->title}.\nPhản hồi từ Giảng viên: {$request->reason}\nKết quả: Giữ nguyên điểm số.";
                Mail::to($complaint->studentUser->email)->send(new ViolationResolutionMail($emailContent, 'Kết quả xử lý khiếu nại - NQ EduTech'));

                Notification::create([
                    'user_id' => $complaint->studentUser->id, 'sender_id' => Auth::id(),
                    'title' => "Kết quả khiếu nại môn {$complaint->exam->title}", 
                    'content' => "Phản hồi từ Giảng viên: {$request->reason}. Kết quả: Giữ nguyên điểm số.", 
                    'target_role' => 'student'
                ]);
                
                $message = 'Đã từ chối khiếu nại và thông báo cho sinh viên.';
            }

            DB::commit();
            return response()->json(['message' => $message]);
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

        $attempt = ExamAttempt::where('exam_id', $request->input('exam_id'))
            ->where('student_id', Auth::id())
            ->first();

        if (!$attempt || $attempt->status !== 'submitted' || !$attempt->ended_at) {
            return response()->json(['message' => 'Không tìm thấy bài thi hoặc bài thi chưa được nộp hợp lệ.'], 400);
        }

        $hoursPassed = \Carbon\Carbon::parse($attempt->ended_at)->diffInHours(now());
        if ($hoursPassed > 72) {
            return response()->json(['message' => 'Đã quá thời hạn 72 giờ để gửi khiếu nại cho bài thi này.'], 403);
        }

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