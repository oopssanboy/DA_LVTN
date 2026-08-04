<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\{ExpulsionRequest, Notification, Student, User, Teacher};
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use App\Mail\ViolationResolutionMail; 

class ExpulsionController extends Controller
{
    public function index()
    {
        $requests = ExpulsionRequest::with(['exam', 'teacher'])->latest()->get();
        
        $formattedRequests = $requests->map(function($req) {
            $student = Student::find($req->student_id);
            if (!$student) {
                $student = Student::where('user_id', $req->student_id)->first();
            }
            $teacher = Teacher::where('user_id', $req->teacher_id)->first();
            if (!$teacher) {
                $teacher = Teacher::find($req->teacher_id); 
            }
            
            $teacherName = $teacher ? $teacher->name : ($req->teacher->email ?? 'Giảng viên (ID: '.$req->teacher_id.')');
            
            return [
                'id' => $req->id,
                'student_name' => $student ? ($student->name ?? 'Không rõ') : 'Sinh viên (ID: '.$req->student_id.')',
                'student_code' => $student ? ($student->student_code ?? 'N/A') : 'N/A',
                'teacher_name' => $teacherName,
                'exam_title' => $req->exam ? $req->exam->title : 'Không có dữ liệu',
                'reason' => $req->reason,
                'status' => $req->status,
                'admin_note' => $req->admin_note,
            ];
        });

        return response()->json([
            'message' => 'Lấy danh sách thành công',
            'data' => $formattedRequests
        ], 200);
    }

    public function resolve(Request $request, $id)
    {
        $request->validate([
            'action' => 'required|in:approve,reject',
            'admin_note' => 'required|string'
        ]);

        $exp = ExpulsionRequest::findOrFail($id);
        
        $exp->update([
            'status' => $request->action === 'approve' ? 'approved' : 'rejected',
            'admin_note' => $request->admin_note
        ]);

        $student = Student::find($exp->student_id);
        if (!$student) {
            $student = Student::where('user_id', $exp->student_id)->first();
        }

 
        if ($request->action === 'approve') {
            $targetUser = $student ? $student->user : User::find($exp->student_id);
            
            if ($targetUser) {

                $targetUser->update(['is_active' => 0]); 

                Notification::create([
                    'user_id' => $targetUser->id,
                    'sender_id' => Auth::id() ?? 1,
                    'title' => 'Quyết định buộc thôi học',
                    'content' => "Tài khoản của bạn đã bị khóa do vi phạm quy chế nghiêm trọng. Ghi chú từ BQT: {$request->admin_note}",
                    'target_role' => 'student'
                ]);
              
                try {
                    $studentEmail = $targetUser->email;
                    $studentName = $student ? $student->name : 'Học viên';
                    $emailContent = "Chào {$studentName},\n\n";
                    $emailContent .= "Tài khoản của bạn trên hệ thống NQ EduTech đã bị KHÓA (Quyết định buộc thôi học) do vi phạm quy chế nghiêm trọng.\n";
                    $emailContent .= "Ghi chú từ Ban quản trị: {$request->admin_note}\n\n";
                    $emailContent .= "Mọi thắc mắc vui lòng liên hệ trực tiếp với Phòng Đào tạo hệ thống.";

                    Mail::to($studentEmail)->send(new ViolationResolutionMail($emailContent, 'THÔNG BÁO KHẨN: Quyết định buộc thôi học - NQ EduTech'));
                    
                } catch (\Exception $e) {
                  
                }
            }
        }

        $statusText = $request->action === 'approve' ? 'ĐÃ PHÊ DUYỆT (Đuổi học)' : 'BỊ TỪ CHỐI';
        $studentNameNotify = $student ? $student->name : 'Sinh viên';
        
        Notification::create([
            'user_id' => $exp->teacher_id,
            'sender_id' => Auth::id() ?? 1,
            'title' => 'Kết quả đề xuất kỷ luật',
            'content' => "Đề xuất kỷ luật SV {$studentNameNotify} {$statusText}. Ghi chú của Admin: {$request->admin_note}",
            'target_role' => 'teacher'
        ]);

        return response()->json(['message' => 'Đã xử lý hồ sơ kỷ luật thành công!']);
    }
}