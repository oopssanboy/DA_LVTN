<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Subject;

class SubjectController extends Controller
{
    
    public function index(Request $request)
{
    $query = Subject::withCount([
            'courses', 
            'topics',
            'questions' => function ($q) {
                if (auth()->check() && auth()->user()->role === 'teacher') {
                    $q->where('teacher_id', auth()->id());
                }
            }
        ])->orderBy('created_at', 'desc');

    if ($request->has('search') && $request->search != '') {
        $search = $request->search;
        $query->where(function ($q) use ($search) {
            $q->where('code', 'like', '%' . $search . '%')
              ->orWhere('name', 'like', '%' . $search . '%');
        });
    }
    if (auth()->check() && auth()->user()->role === 'teacher') {
            $teacherId = auth()->id();
            
            $query->whereIn('id', function($subQuery) use ($teacherId) {
                $subQuery->select('subject_id')
                         ->from('class_teacher')
                         ->where('teacher_id', $teacherId)
                         ->whereNotNull('subject_id');
            });
        }
    
    $perPage = $request->input('per_page', 10);
    $subjects = $query->paginate($perPage);

    return response()->json($subjects);
}

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|unique:subjects,code',
            'name' => 'required|string|max:255',
        ]);

        $subject = Subject::create($request->all());
        return response()->json(['message' => 'Tạo môn học thành công', 'data' => $subject], 201);
    }

    public function update(Request $request, $id)
    {
        $subject = Subject::findOrFail($id);
        $request->validate([
            'code' => 'required|string|unique:subjects,code,' . $id,
            'name' => 'required|string|max:255',
        ]);

        $subject->update($request->all());
        return response()->json(['message' => 'Cập nhật môn học thành công', 'data' => $subject]);
    }

    public function destroy($id)
    {
        Subject::findOrFail($id)->delete();
        return response()->json(['message' => 'Xóa môn học thành công']);
    }
}