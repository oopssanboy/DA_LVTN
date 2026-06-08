<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Subject;

class SubjectController extends Controller
{
    public function index(Request $request)
    {
        $subjects = Subject::withCount(['courses', 'topics', 'questions'])
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($subjects, 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|unique:subjects,code|max:50',
            'name' => 'required|string|max:255',
        ]);

        $subject = Subject::create([
            'code' => $request->input('code'),
            'name' => $request->input('name'),
        ]);

        return response()->json(['message' => 'Tạo môn học thành công', 'data' => $subject], 201);
    }

    public function show($id)
    {
        $subject = Subject::with(['courses', 'topics'])->find($id);
        if (!$subject) {
            return response()->json(['message' => 'Không tìm thấy môn học','id_subject'=> $id], 404);
        }
        return response()->json($subject, 200);
    }

    public function update(Request $request, $id)
    {
        $subject = Subject::find($id);
        if (!$subject) {
            return response()->json(['message' => 'Không tìm thấy môn học'], 404);
        }

        $request->validate([
            'code' => 'required|string|max:50|unique:subjects,code,' . $id,
            'name' => 'required|string|max:255',
        ]);

        $subject->update([
            'code' => $request->input('code'),
            'name' => $request->input('name'),
        ]);

        return response()->json(['message' => 'Cập nhật môn học thành công', 'data' => $subject], 200);
    }

    public function destroy($id)
    {
        $subject = Subject::find($id);
        if (!$subject) {
            return response()->json(['message' => 'Không tìm thấy môn học'], 404);
        }

        $subject->delete();
        return response()->json(['message' => 'Xóa môn học thành công'], 200);
    }
}