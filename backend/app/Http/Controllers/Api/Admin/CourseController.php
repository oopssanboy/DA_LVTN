<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Course;

class CourseController extends Controller
{
    public function index(Request $request)
    {

        $courses = Course::with(['subject', 'teacher.user'])
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($courses, 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'nullable|exists:teachers,user_id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $course = Course::create([
            'subject_id' => $request->input('subject_id'),
            'teacher_id' => $request->input('teacher_id'),
            'title' => $request->input('title'),
            'description' => $request->input('description'),
        ]);

        return response()->json(['message' => 'Tạo khóa học thành công', 'data' => $course], 201);
    }

    public function show($id)
    {
        $course = Course::with(['subject', 'teacher.user', 'classes'])->find($id);
        if (!$course) {
            return response()->json(['message' => 'Không tìm thấy khóa học'], 404);
        }
        return response()->json($course, 200);
    }

    public function update(Request $request, $id)
    {
        $course = Course::find($id);
        if (!$course) {
            return response()->json(['message' => 'Không tìm thấy khóa học'], 404);
        }

        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'nullable|exists:teachers,user_id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $course->update([
            'subject_id' => $request->input('subject_id'),
            'teacher_id' => $request->input('teacher_id'),
            'title' => $request->input('title'),
            'description' => $request->input('description'),
        ]);

        return response()->json(['message' => 'Cập nhật khóa học thành công', 'data' => $course], 200);
    }

    public function destroy($id)
    {
        $course = Course::find($id);
        if (!$course) {
            return response()->json(['message' => 'Không tìm thấy khóa học'], 404);
        }

        $course->delete();
        return response()->json(['message' => 'Xóa khóa học thành công'], 200);
    }
}