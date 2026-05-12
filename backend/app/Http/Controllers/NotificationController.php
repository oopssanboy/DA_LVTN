<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Notification;

class NotificationController extends Controller
{
    public function getActiveNotifications() {
        return response()->json(Notification::where('is_active', true)->orderBy('created_at', 'desc')->get());
    }

    public function index() {
        return response()->json(Notification::orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request) {
        $data = $request->validate(['title' => 'required', 'content' => 'required', 'is_active' => 'boolean']);
        $notification = Notification::create($data);
        return response()->json(['message' => 'Tạo thông báo thành công', 'data' => $notification]);
    }

    public function destroy($id) {
        Notification::findOrFail($id)->delete();
        return response()->json(['message' => 'Đã xóa thông báo']);
    }
}
