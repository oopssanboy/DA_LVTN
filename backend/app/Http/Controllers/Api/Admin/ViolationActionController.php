<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\{ViolationAction, ExamAttempt, Notification};
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use App\Mail\ViolationResolutionMail; 

class ViolationActionController extends Controller
{
    public function index()
    {
        $actions = ViolationAction::with([
            'attempt.student.user',
            'attempt.exam',
            'teacher'
        ])->latest()->get();

        $formatted = $actions->map(function($action) {
            return [
                'id' => $action->id,
                'exam_title' => $action->attempt->exam->title ?? 'N/A',
                'student_name' => $action->attempt->student->name ?? 'N/A',
                'student_code' => $action->attempt->student->student_code ?? 'N/A',
                'teacher_name' => $action->teacher->name ?? ($action->teacher->email ?? 'N/A'),
                'action_type' => $action->action, 
                'reason' => $action->reason,
                'status' => $action->status,
                'created_at' => $action->created_at->format('d/m/Y H:i:s'),
            ];
        });

        return response()->json(['data' => $formatted]);
    }

    public function resolve(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'admin_note' => 'nullable|string',
            'penalty_points' => 'nullable|numeric|min:0' 
        ]);

        $violationAction = ViolationAction::with(['attempt.student.user', 'attempt.exam'])->findOrFail($id);

        if ($violationAction->status !== 'pending') {
            return response()->json(['message' => 'Đề xuất này đã được xử lý trước đó!'], 400);
        }

        DB::beginTransaction();
        try {
            $violationAction->update([
                'status' => $request->status,
                'approved_by' => Auth::id(),
                'approved_at' => now(),
                'reason' => $violationAction->reason . ($request->admin_note ? "\n[Ghi chú từ Quản trị viên: {$request->admin_note}]" : "")
            ]);

            $attempt = $violationAction->attempt;
            $examTitle = $attempt->exam->title ?? 'Bài thi';
            $studentEmail = $attempt->student->user->email ?? null;
            if ($request->status === 'approved') {
                $emailContent = "Chào bạn,\n\nQuản trị viên đã phê duyệt quyết định kỷ luật học vụ đối với bài thi môn {$examTitle} của bạn.\nLý do: {$violationAction->reason}\n";
                $notiContent = "Lý do: {$violationAction->reason}. ";

                if ($violationAction->action === 'cancel_exam') {
                    $attempt->update(['total_score' => 0, 'is_passed' => false, 'status' => 'suspended']);
                    $emailContent .= "Kết quả: BÀI THI BỊ HỦY (0 điểm).";
                    $notiContent .= "Kết quả: BÀI THI BỊ HỦY (0 điểm).";
                } elseif ($violationAction->action === 'deduct_points') {
                    $penalty = floatval($request->penalty_points ?? 0);
                    $newScore = max(0, $attempt->total_score - $penalty);
                    $isPassed = $newScore >= ($attempt->exam->passing_score ?? 5);
                    $attempt->update(['total_score' => $newScore, 'is_passed' => $isPassed]);
                    $emailContent .= "Kết quả: Bạn bị trừ {$penalty} điểm. Điểm hiện tại là: {$newScore}.";
                    $notiContent .= "Kết quả: Bị trừ {$penalty} điểm. Điểm mới: {$newScore}.";
                } elseif ($violationAction->action === 'warn') {
                    $emailContent .= "Kết quả: Nhắc nhở cảnh cáo (Không trừ điểm).";
                    $notiContent .= "Kết quả: Nhắc nhở cảnh cáo.";
                }

                if ($studentEmail) {
                    try {
                        Mail::to($studentEmail)->send(new ViolationResolutionMail($emailContent, "Quyết định kỷ luật học vụ - {$examTitle}"));
                    } catch (\Exception $e) { }
                }

                Notification::create([
                    'user_id' => $attempt->student->user->id ?? 1,
                    'sender_id' => Auth::id() ?? 1,
                    'title' => "Quyết định kỷ luật môn {$examTitle}",
                    'content' => $notiContent,
                    'target_role' => 'student'
                ]);
            }

            $statusText = $request->status === 'approved' ? 'ĐÃ ĐƯỢC PHÊ DUYỆT' : 'BỊ TỪ CHỐI';
            $studentName = $attempt->student->name ?? 'Sinh viên';
            Notification::create([
                'user_id' => $violationAction->teacher_id,
                'sender_id' => Auth::id() ?? 1,
                'title' => 'Kết quả đề xuất xử lý vi phạm',
                'content' => "Đề xuất {$violationAction->action} cho SV {$studentName} {$statusText}." . ($request->admin_note ? " Ghi chú: {$request->admin_note}" : ""),
                'target_role' => 'teacher'
            ]);

            DB::commit();
            return response()->json(['message' => 'Đã xử lý phiếu đề xuất kỷ luật thành công!']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi hệ thống: '.$e->getMessage()], 500);
        }
    }
}