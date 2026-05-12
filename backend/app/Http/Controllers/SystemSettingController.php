<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SystemSetting;

class SystemSettingController extends Controller
{
    public function getSettings()
    {
        // Luôn lấy dòng cấu hình đầu tiên (id = 1), nếu chưa có thì tạo mặc định
        $settings = SystemSetting::firstOrCreate(
            ['id' => 1],
            [
                'app_name' => 'Hệ thống thi trắc nghiệm',
                'contact_email' => 'admin@truong.edu.vn',
                'allow_registration' => true,
                'maintenance_mode' => false
            ]
        );
        return response()->json($settings);
    }

    public function updateSettings(Request $request)
    {
        $settings = SystemSetting::find(1);
        $settings->update([
            'app_name' => $request->app_name,
            'contact_email' => $request->contact_email,
            'allow_registration' => $request->allow_registration,
            'maintenance_mode' => $request->maintenance_mode,
        ]);

        return response()->json(['message' => 'Cập nhật thành công', 'data' => $settings]);
    }
}