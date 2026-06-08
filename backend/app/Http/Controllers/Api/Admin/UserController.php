<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Proctor;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    // Lấy danh sách người dùng (có phân trang và lọc)
    public function index(Request $request)
    {
        $query = User::with(['student', 'teacher', 'proctor']);

        // Lọc theo vai trò nếu có
        if ($request->has('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        // Lọc theo trạng thái
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        // Tìm kiếm theo email
        if ($request->has('search')) {
            $query->where('email', 'like', '%' . $request->search . '%');
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($users, 200);
    }

    // Tạo người dùng mới & Hồ sơ tương ứng
    public function store(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'role' => 'required|in:admin,teacher,proctor,student',
            'name' => 'required_unless:role,admin|string|max:191',
            'code' => 'required_unless:role,admin|string|max:191',
            'department' => 'nullable|string|max:191' // Chỉ dùng cho teacher
        ]);

        DB::beginTransaction();
        try {
            // 1. Tạo tài khoản đăng nhập
            $user = User::create([
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'is_active' => true,
            ]);

            // 2. Tạo profile dựa trên role
            if ($request->role === 'student') {
                Student::create([
                    'user_id' => $user->id,
                    'student_code' => $request->code,
                    'name' => $request->name,
                ]);
            } elseif ($request->role === 'teacher') {
                Teacher::create([
                    'user_id' => $user->id,
                    'teacher_code' => $request->code,
                    'name' => $request->name,
                    'department' => $request->department,
                ]);
            } elseif ($request->role === 'proctor') {
                Proctor::create([
                    'user_id' => $user->id,
                    'proctor_code' => $request->code,
                    'name' => $request->name,
                ]);
            }

            DB::commit();
            
            // Trả về dữ liệu vừa tạo kèm profile
            $user->load(['student', 'teacher', 'proctor']);
            return response()->json(['message' => 'Tạo người dùng thành công', 'data' => $user], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi hệ thống khi tạo người dùng', 'error' => $e->getMessage()], 500);
        }
    }

    // Xem chi tiết 1 người dùng
    public function show($id)
    {
        $user = User::with(['student', 'teacher', 'proctor'])->find($id);
        
        if (!$user) {
            return response()->json(['message' => 'Không tìm thấy người dùng'], 404);
        }

        return response()->json($user, 200);
    }

    // Cập nhật người dùng (Email, Role, Thông tin Profile)
    public function update(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'Không tìm thấy người dùng'], 404);
        }

        $request->validate([
            'email' => 'required|email|unique:users,email,' . $id,
            'role' => 'required|in:admin,teacher,proctor,student',
            'name' => 'required_unless:role,admin|string|max:191',
            'code' => 'required_unless:role,admin|string|max:191',
        ]);

        DB::beginTransaction();
        try {
            // Cập nhật bảng Users
            $user->email = $request->email;
            $user->role = $request->role;
            if ($request->has('password') && !empty($request->password)) {
                $user->password = Hash::make($request->password);
            }
            $user->save();

            // Cập nhật Profile (Nếu có sự thay đổi Role, lý tưởng nhất là báo lỗi hoặc xóa profile cũ tạo profile mới. 
            // Ở đây giả định User không đổi Role, chỉ cập nhật Name và Code)
            if ($user->role === 'student' && $user->student) {
                $user->student->update([
                    'student_code' => $request->code,
                    'name' => $request->name,
                ]);
            } elseif ($user->role === 'teacher' && $user->teacher) {
                $user->teacher->update([
                    'teacher_code' => $request->code,
                    'name' => $request->name,
                    'department' => $request->department ?? $user->teacher->department,
                ]);
            } elseif ($user->role === 'proctor' && $user->proctor) {
                $user->proctor->update([
                    'proctor_code' => $request->code,
                    'name' => $request->name,
                ]);
            }

            DB::commit();
            $user->load(['student', 'teacher', 'proctor']);
            return response()->json(['message' => 'Cập nhật thành công', 'data' => $user], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi khi cập nhật', 'error' => $e->getMessage()], 500);
        }
    }

    // Khóa / Mở khóa tài khoản (PATCH Status)
    public function toggleStatus($id)
    {
        $user = User::find($id);
        
        if (!$user) {
            return response()->json(['message' => 'Không tìm thấy người dùng'], 404);
        }

        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Bạn không thể tự khóa tài khoản của chính mình'], 400);
        }

        $user->is_active = !$user->is_active;
        $user->save();

        $statusMessage = $user->is_active ? 'Mở khóa' : 'Khóa';

        return response()->json([
            'message' => "Đã {$statusMessage} tài khoản thành công",
            'is_active' => $user->is_active
        ], 200);
    }
}