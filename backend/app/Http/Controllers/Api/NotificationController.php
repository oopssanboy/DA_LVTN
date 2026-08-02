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
   
        $query = Notification::whereNotNull('target_role')->orderBy('created_at', 'desc');

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

        if ($user->role === 'admin') {
    
            $query->whereIn('target_role', ['all', 'admin']);
        } elseif ($user->role === 'teacher') {

            $classIds = ClassTeacher::where('teacher_id', $user->id)->pluck('class_id')->toArray();
            $query->where(function($q) use ($classIds) {
                $q->whereIn('target_role', ['all', 'teacher'])
                  ->orWhere(function($subQ) use ($classIds) {
                      $subQ->where('target_role', 'class')
                           ->whereIn('target_class_id', $classIds);
                  });
            });
        } elseif ($user->role === 'student') {
            $studentId = $user->student->user_id ?? $user->id;
            $classIds = ClassEnrollment::where('student_id', $studentId)->pluck('class_id')->toArray();
            $query->where(function($q) use ($classIds) {
                $q->whereIn('target_role', ['all', 'student'])
                  ->orWhere(function($subQ) use ($classIds) {
                      $subQ->where('target_role', 'class')
                           ->whereIn('target_class_id', $classIds);
                  });
            });
        }
        return response()->json($query->limit(10)->get());
    }
}