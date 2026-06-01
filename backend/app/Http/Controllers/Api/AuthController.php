<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
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
        
        // Chặn tài khoản nếu Admin đã khóa
        if (!$user->is_active) {
            Auth::logout();
            return response()->json(['message' => 'Tài khoản của bạn đã bị khóa.'], 403);
        }

        // Tải kèm thông tin profile dựa trên role mới (Chuẩn hóa 1-1)
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
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Đăng xuất thành công']);
    }

    public function getUser(Request $request)
    {
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
                'name' => $name,
                'code' => $code
            ]
        ]);
    }
}