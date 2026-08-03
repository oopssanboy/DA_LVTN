<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Cloudinary\Cloudinary;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use App\Mail\ResetPasswordMail;
use Carbon\Carbon;

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
        
        if (!$user->is_active) {
            Auth::logout();
            return response()->json(['message' => 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.'], 403);
        }

      
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
                'code' => $code,
                'avatar' => $user->avatar,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at
            ]
        ], 200);
    }

 
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
                    'avatar' => $user->avatar,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at
                ]
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi server', 'error' => $e->getMessage()], 500);
        }
    }

    
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Đăng xuất thành công'], 200);
    }

   
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

       

        return response()->json(['message' => 'Đổi mật khẩu thành công'], 200);
    }
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:191',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:20480',
        ]);

        if ($request->hasFile('avatar')) {

    $cloudinary = app(Cloudinary::class);

    $result = $cloudinary
        ->uploadApi()
        ->upload($request->file('avatar')->getRealPath());

    $user->avatar = $result['secure_url'];
    $user->save();
}

        if ($user->role === 'student' && $user->student) {
            $user->student->update(['name' => $request->name]);
            $name = $request->name;
            $code = $user->student->student_code;
        } elseif ($user->role === 'teacher' && $user->teacher) {
            $user->teacher->update(['name' => $request->name]);
            $name = $request->name;
            $code = $user->teacher->teacher_code;
        } elseif ($user->role === 'proctor' && $user->proctor) {
            $user->proctor->update(['name' => $request->name]);
            $name = $request->name;
            $code = $user->proctor->proctor_code;
        } else {
            $name = 'Quản trị viên';
            $code = 'ADMIN';
        }

        return response()->json([
            'message' => 'Cập nhật thông tin thành công',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'name' => $name,
                'code' => $code,
                'avatar' => $user->avatar,
                'created_at' => $user->created_at
            ]
        ], 200);
    }
  
    public function sendResetLinkEmail(Request $request)
    {
        $request->validate(['email' => 'required|email|exists:users,email']);
        
        $otp = rand(100000, 999999);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            ['token' => $otp, 'created_at' => Carbon::now()]
        );

        Mail::to($request->email)->send(new ResetPasswordMail($otp));

        return response()->json(['message' => 'Mã xác thực đã được đưa vào hàng đợi gửi đến email của bạn.']);
    }
  
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|numeric',
        ]);

        $record = DB::table('password_reset_tokens')
                    ->where('email', $request->email)
                    ->where('token', $request->otp)
                    ->first();

        if (!$record) {
            return response()->json(['message' => 'Mã xác thực không hợp lệ hoặc đã hết hạn.'], 400);
        }

        if (Carbon::parse($record->created_at)->addMinutes(15)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json(['message' => 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.'], 400);
        }

        return response()->json(['message' => 'Mã xác thực hợp lệ.']);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'otp' => 'required|numeric',
            'password' => 'required|string|min:6',
        ]);

        $record = DB::table('password_reset_tokens')
                    ->where('email', $request->email)
                    ->where('token', $request->otp)
                    ->first();

        if (!$record) {
            return response()->json(['message' => 'Mã xác thực không hợp lệ.'], 400);
        }


        if (Carbon::parse($record->created_at)->addMinutes(15)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json(['message' => 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.'], 400);
        }

  
        $user = \App\Models\User::where('email', $request->email)->first();
        $user->password = Hash::make($request->password);
        $user->save();

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay.']);
    }
}