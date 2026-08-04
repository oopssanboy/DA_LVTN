<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Classes;
use App\Models\ClassTeacher;
use App\Models\ClassEnrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
  
    public function index()
    {
        $user = Auth::user();
   
    
        $query = Notification::where('type', 'broadcast')->orderBy('created_at', 'desc');

   
        if ($user->role === 'teacher') {
            $query->where('sender_id', $user->id);
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'target_role' => 'required|in:all,teacher,student,class',
            'target_class_id' => 'nullable|exists:classes,id'
        ]);

        if ($user->role === 'teacher') {
            if ($validated['target_role'] !== 'class' || empty($validated['target_class_id'])) {
                return response()->json(['message' => 'Giảng viên chỉ có thể gửi thông báo cho lớp học cụ thể.'], 403);
            }

            $isTeaching = Classes::whereHas('teachers', function($q) use ($user) {
                $q->where('users.id', $user->id);
            })->where('id', $validated['target_class_id'])->exists();

            if (!$isTeaching) {
                return response()->json(['message' => 'Bạn không phụ trách lớp học này.'], 403);
            }
        }

        $notification = Notification::create([
            'user_id' => $user->id, 
            'sender_id' => $user->id,
            'title' => $validated['title'],
            'content' => $validated['content'],
            'type' => 'broadcast',
            'target_role' => $validated['target_role'],
            'target_class_id' => $validated['target_class_id'] ?? null,
        ]);

        return response()->json(['message' => 'Đã gửi thông báo thành công', 'data' => $notification], 201);
    }

    public function destroy($id)
    {
        $user = Auth::user();
        $notification = Notification::findOrFail($id);

        if ($user->role === 'teacher' && $notification->sender_id !== $user->id) {
            return response()->json(['message' => 'Không có quyền xóa thông báo này.'], 403);
        }

        $notification->delete();
        return response()->json(['message' => 'Đã xóa thông báo thành công']);
    }

    public function myNotifications()
    {
        $user = Auth::user();
        $query = Notification::query()->orderBy('created_at', 'desc');

        $query->where(function($q) use ($user) {
         
            $q->where('user_id', $user->id)
            
              
              ->orWhere('target_role', 'all')
              
              
              ->orWhere(function($subQ) use ($user) {
                  $subQ->where('target_role', $user->role)
                       ->whereNull('user_id'); 
              });

            if ($user->role === 'teacher') {
                $classIds = ClassTeacher::where('teacher_id', $user->id)->pluck('class_id')->toArray();
                $q->orWhere(function($subQ) use ($classIds) {
                    $subQ->where('target_role', 'class')->whereIn('target_class_id', $classIds);
                });
            } elseif ($user->role === 'student') {
                $studentId = $user->student->user_id ?? $user->id;
                $classIds = ClassEnrollment::where('student_id', $studentId)->pluck('class_id')->toArray();
                $q->orWhere(function($subQ) use ($classIds) {
                    $subQ->where('target_role', 'class')->whereIn('target_class_id', $classIds);
                });
            }
        });

        $notifications = $query->limit(15)->get();

   
        $readIds = \Illuminate\Support\Facades\DB::table('notification_reads')
            ->where('user_id', $user->id)
            ->whereIn('notification_id', $notifications->pluck('id'))
            ->pluck('notification_id')
            ->toArray();

        $notifications->map(function($noti) use ($readIds) {
            $noti->is_read = in_array($noti->id, $readIds);
            return $noti;
        });

        return response()->json($notifications);
    }

   
    public function markAsRead($id)
    {
        $user = Auth::user();
        
        \Illuminate\Support\Facades\DB::table('notification_reads')->updateOrInsert(
            ['user_id' => $user->id, 'notification_id' => $id],
            ['created_at' => now()]
        );

        return response()->json(['message' => 'Đã đánh dấu đọc']);
    }
    public function markAllAsRead()
    {
    
        Notification::where('user_id', Auth::id())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Đã đánh dấu đọc tất cả']);
    }
}