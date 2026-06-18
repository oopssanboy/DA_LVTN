<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Classes;
use App\Models\ClassEnrollment;
use Illuminate\Support\Facades\DB;

class ClassController extends Controller
{
    public function index(Request $request)
    {
        $query = Classes::with(['course.subject', 'course.teacher'])
            ->withCount('enrollments')
            ->orderBy('created_at', 'desc');
        if (auth()->user()->role === 'teacher') {
            $query->whereHas('course', function($q) {
                $q->where('teacher_id', auth()->id());
            });
        }

        $classes = $query->get();
        return response()->json($classes, 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'name' => 'required|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $class = Classes::create([
            'course_id' => $request->input('course_id'),
            'name' => $request->input('name'),
            'start_date' => $request->input('start_date'),
            'end_date' => $request->input('end_date'),
        ]);

        return response()->json(['message' => 'Tạo lớp học thành công', 'data' => $class], 201);
    }

    public function show($id)
    {
        $class = Classes::with(['course.subject', 'enrollments.student'])->find($id);
        if (!$class) {
            return response()->json(['message' => 'Không tìm thấy lớp học'], 404);
        }
        return response()->json($class, 200);
    }

    public function update(Request $request, $id)
    {
        $class = Classes::find($id);
        if (!$class) {
            return response()->json(['message' => 'Không tìm thấy lớp học'], 404);
        }

        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'name' => 'required|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $class->update([
            'course_id' => $request->input('course_id'),
            'name' => $request->input('name'),
            'start_date' => $request->input('start_date'),
            'end_date' => $request->input('end_date'),
        ]);

        return response()->json(['message' => 'Cập nhật lớp học thành công', 'data' => $class], 200);
    }

    public function destroy($id)
    {
        $class = Classes::find($id);
        if (!$class) {
            return response()->json(['message' => 'Không tìm thấy lớp học'], 404);
        }

        $class->delete();
        return response()->json(['message' => 'Xóa lớp học thành công'], 200);
    }

    // Gán sinh viên vào lớp học (Import list id sinh viên)
    public function enrollStudents(Request $request, $id)
    {
        $class = Classes::find($id);
        if (!$class) {
            return response()->json(['message' => 'Không tìm thấy lớp học'], 404);
        }

        $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,user_id',
        ]);

        DB::beginTransaction();
        try {
            // Xóa danh sách cũ (đồng bộ lại từ đầu)
            ClassEnrollment::where('class_id', $class->id)->delete();

            $enrollments = [];
            foreach ($request->input('student_ids') as $studentId) {
                $enrollments[] = [
                    'class_id' => $class->id,
                    'student_id' => $studentId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            ClassEnrollment::insert($enrollments);

            DB::commit();
            return response()->json(['message' => 'Đồng bộ danh sách sinh viên vào lớp thành công'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi khi đồng bộ sinh viên', 'error' => $e->getMessage()], 500);
        }
    }
}