<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Imports\UsersImport;
use Maatwebsite\Excel\Facades\Excel;
class UserController extends Controller
{
    
    public function index(Request $request)
    {
        $query = User::where('role', 0)->select('id', 'name', 'email', 'phone','class');

        if ($request->has('search') && $request->search != '') {
            $keyword = $request->search;
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'LIKE', '%' . $keyword . '%')
                  ->orWhere('email', 'LIKE', '%' . $keyword . '%')
                  ->orWhere('phone', 'LIKE', '%' . $keyword . '%');
            });
        }

        if ($request->has('sort_class') && in_array($request->sort_class, ['asc', 'desc'])) {
            $query->orderBy('class', $request->sort_class);
        } else {
            $query->orderBy('id', 'desc'); 
        }
        $students = $query->get();

        return response()->json($students);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:15',
            'class' => 'nullable|string|max:50', 
        ]);

        $student = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'class' => $request->class, 
            'password' => Hash::make('123456'), 
            'role' => 0 
        ]);
        return response()->json([
            'message' => 'Thêm sinh viên thành công!',
            'student' => $student
        ], 201); 
    }

    public function update(Request $request, $id)
    {
        $student = User::find($id);

        if (!$student) {
            return response()->json(['message' => 'Không tìm thấy sinh viên!'], 404);
        }
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
            'phone' => 'nullable|string|max:15',
            'class' => 'nullable|string|max:50', 
        ]);

        $student->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'class' => $request->class, 
        ]);

        return response()->json([
            'message' => 'Cập nhật thông tin thành công!',
            'student' => $student
        ]);
    }

    public function destroy($id)
    {
        $student = User::find($id);

        if (!$student) {
            return response()->json(['message' => 'Không tìm thấy sinh viên!'], 404);
        }

        $student->delete();

        return response()->json([
            'message' => 'Đã xóa sinh viên thành công!'
        ]);
    }
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:2048'
        ], [
            'file.required' => 'Vui lòng chọn file Excel.',
            'file.mimes' => 'Định dạng file không hợp lệ. Chỉ nhận file .xlsx, .xls, .csv'
        ]);

        try {
            Excel::import(new UsersImport, $request->file('file'));
            
            return response()->json([
                'message' => 'Import danh sách sinh viên thành công!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Có lỗi xảy ra trong quá trình Import: ' . $e->getMessage()
            ], 500);
        }
    }
}