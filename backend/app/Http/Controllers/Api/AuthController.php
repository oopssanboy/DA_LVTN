<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // Đăng nhập hệ thống
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Tài khoản hoặc mật khẩu không chính xác'], 401);
        }

        $user = Auth::user();
        
        if (!$user->is_active) {
            Auth::logout();
            return response()->json(['message' => 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.'], 403);
        }

        // Load profile theo quan hệ 1-1
        $user->load(['student', 'teacher', 'proctor']);
        
        $name = 'Quản trị viên';
        $code = 'ADMIN';

        if ($user->role === 'student' && $user->student) {
            $name = $user->student->name;
            $code = $user->student->student_code;
        } elseif ($user->role === 'teacher' && $user->teacher) {
            $name = $user->teacher->name;
            $code = $user->teacher->teacher_code;
        } elseif ($user->role === 'proctor' && $user->proctor) {
            $name = $user->proctor->name;
            $code = $user->proctor->proctor_code;
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Đăng nhập thành công',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'name' => $name,
                'code' => $code
            ]
        ], 200);
    }

    // Lấy thông tin cá nhân
    public function me(Request $request)
    {
        try {
            $user = $request->user();
            $user->load(['student', 'teacher', 'proctor']);
            
            $name = 'Quản trị viên';
            $code = 'ADMIN';

            if ($user->role === 'student' && $user->student) {
                $name = $user->student->name;
                $code = $user->student->student_code;
            } elseif ($user->role === 'teacher' && $user->teacher) {
                $name = $user->teacher->name;
                $code = $user->teacher->teacher_code;
            } elseif ($user->role === 'proctor' && $user->proctor) {
                $name = $user->proctor->name;
                $code = $user->proctor->proctor_code;
            }

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_active' => $user->is_active,
                    'name' => $name,
                    'code' => $code,
                    'created_at' => $user->created_at
                ]
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi server', 'error' => $e->getMessage()], 500);
        }
    }

    // Đăng xuất
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Đăng xuất thành công'], 200);
    }

    // Đổi mật khẩu
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Mật khẩu hiện tại không chính xác'], 400);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        // Có thể thu hồi tất cả token cũ để bắt đăng nhập lại (tùy chọn)
        // $user->tokens()->delete();

        return response()->json(['message' => 'Đổi mật khẩu thành công'], 200);
    }
}