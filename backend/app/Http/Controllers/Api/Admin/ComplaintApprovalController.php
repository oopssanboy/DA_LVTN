<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\{Complaint, ExamAttempt, Notification};
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ComplaintApprovalController extends Controller
{
   
    public function index()
    {
        $complaints = Complaint::with(['studentUser.student', 'exam.teacher'])
            ->whereIn('status', ['pending_approval', 'resolved', 'rejected'])
            ->whereNotNull('proposed_score')
            ->latest()
            ->get();
            
        return response()->json(['data' => $complaints]);
    }

    public function resolve(Request $request, $id)
    {
        $request->validate([
            'action' => 'required|in:approve,reject',
            'admin_note' => 'required|string'
        ]);

        $complaint = Complaint::with(['studentUser.student', 'exam'])->findOrFail($id);
        $attempt = ExamAttempt::where('exam_id', $complaint->exam_id)->where('student_id', $complaint->student_id)->first();

        if ($complaint->status !== 'pending_approval') {
            return response()->json(['message' => 'Phiếu này đã được xử lý trước đó!'], 400);
        }

        DB::beginTransaction();
        try {
            if ($request->action === 'approve') {
                if ($attempt) {
                    $isPassed = $complaint->proposed_score >= $complaint->exam->passing_score;
                    $attempt->update([
                        'total_score' => $complaint->proposed_score, 
                        'is_passed' => $isPassed
                    ]);
                }
                
                $complaint->update(['status' => 'resolved', 'admin_note' => $request->admin_note]);
                $notiContent = "Khiếu nại điểm môn {$complaint->exam->title} đã được Quản trị viên phê duyệt. Điểm mới của bạn là: {$complaint->proposed_score}.";
                $teacherContent = "Đề xuất sửa điểm cho Học viên {$complaint->studentUser->student->name} ĐÃ ĐƯỢC DUYỆT.";
                
            } else {
               
                $complaint->update(['status' => 'rejected', 'admin_note' => $request->admin_note]);
                $notiContent = "Đề xuất sửa điểm môn {$complaint->exam->title} đã BỊ TỪ CHỐI. Điểm được giữ nguyên.";
                $teacherContent = "Đề xuất sửa điểm cho Học viên {$complaint->studentUser->student->name} BỊ TỪ CHỐI.";
            }

          
            Notification::create([
                'user_id' => $complaint->studentUser->id, 'sender_id' => Auth::id() ?? 1,
                'title' => "Kết quả khiếu nại môn {$complaint->exam->title}", 
                'content' => $notiContent . " Ghi chú Quản trị viên: {$request->admin_note}", 
                'target_role' => 'student'
            ]);

            Notification::create([
                'user_id' => $complaint->exam->teacher_id, 'sender_id' => Auth::id() ?? 1,
                'title' => "Kết quả duyệt sửa điểm môn {$complaint->exam->title}", 
                'content' => $teacherContent . " Ghi chú Quản trị viên: {$request->admin_note}", 
                'target_role' => 'teacher'
            ]);

            DB::commit();
            return response()->json(['message' => 'Đã xử lý đề xuất sửa điểm thành công!']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi hệ thống: '.$e->getMessage()], 500);
        }
    }
}