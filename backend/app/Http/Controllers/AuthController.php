<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    
    public function login(Request $request)
    {
        
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

       
        $user = User::where('email', $request->email)->first();

      
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email hoặc mật khẩu không chính xác.'
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Đăng nhập thành công',
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer'
        ]);
    }

   
    public function logout(Request $request)
    {
     
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Đã đăng xuất thành công'
        ]);
    }


    public function profile(Request $request)
    {
     
        return response()->json($request->user());
    }

   
    public function changePassword(Request $request)
    {
       
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:6|same:confirm_password',
            'confirm_password' => 'required'
        ], [
            'new_password.min' => 'Mật khẩu mới phải có ít nhất 6 ký tự.',
            'new_password.same' => 'Mật khẩu xác nhận không khớp.'
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Mật khẩu hiện tại không đúng!'
            ], 400); 
        }

       
        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'message' => 'Đổi mật khẩu thành công!'
        ]);
    }


    public function updateProfile(Request $request)
    {
        $user = $request->user();

      
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:15',
            'class' => 'nullable|string|max:50',
        ]);


        $user->name = $request->name;
        $user->phone = $request->phone;
      
        if ($user->role == 0) {
            $user->class = $request->class;
        }
        
        $user->save();

        return response()->json([
            'message' => 'Cập nhật thông tin thành công!',
            'user' => $user
        ]);
    }
}