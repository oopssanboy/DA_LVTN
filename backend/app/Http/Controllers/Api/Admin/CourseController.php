<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Course;

class CourseController extends Controller
{
    
    public function index(Request $request)
    {
        $query = Course::with(['subjects', 'cohorts'])
            ->orderBy('created_at', 'desc');

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', '%' . $search . '%')
                  ->orWhere('title', 'like', '%' . $search . '%');
            });
        }

        $perPage = $request->input('per_page', 10);
        $courses = $query->paginate($perPage);

        return response()->json($courses);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|unique:courses,code',
            'title' => 'required|string|max:255',
            'subject_ids' => 'nullable|array', 
            'subject_ids.*' => 'exists:subjects,id'
        ]);

        $course = Course::create($request->only(['code', 'title', 'description']));
        
        if ($request->has('subject_ids')) {
            $course->subjects()->sync($request->subject_ids);
        }

        return response()->json(['message' => 'Tạo chương trình thành công', 'data' => $course->load('subjects')], 201);
    }

    public function update(Request $request, $id)
    {
        $course = Course::findOrFail($id);
        $request->validate([
            'code' => 'required|string|unique:courses,code,' . $id,
            'title' => 'required|string|max:255',
            'subject_ids' => 'nullable|array'
        ]);

        $course->update($request->only(['code', 'title', 'description']));

        if ($request->has('subject_ids')) {
            $course->subjects()->sync($request->subject_ids);
        }

        return response()->json(['message' => 'Cập nhật chương trình thành công', 'data' => $course->load('subjects')]);
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