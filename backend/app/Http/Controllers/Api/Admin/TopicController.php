<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Topic;
use Illuminate\Http\Request;

class TopicController extends Controller
{

    public function index(Request $request)
    {
        $query = Topic::with('subject');

        if ($request->has('subject_id') && $request->subject_id != '') {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where('name', 'like', '%' . $search . '%');
        }

        $perPage = $request->input('per_page', 10);
        $topics = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($topics);
    }


    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'name' => 'required|string|max:255',
        ]);

        $topic = Topic::create($validated);

        return response()->json([
            'message' => 'Thêm chủ đề thành công', 
            'data' => $topic
        ], 201);
    }

    
    public function update(Request $request, $id)
    {
        $topic = Topic::findOrFail($id);
        
        $validated = $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'name' => 'required|string|max:255',
        ]);

        $topic->update($validated);

        return response()->json([
            'message' => 'Cập nhật chủ đề thành công', 
            'data' => $topic
        ], 200);
    }

  
    public function destroy($id)
    {
        $topic = Topic::findOrFail($id);
        
        $topic->delete();

        return response()->json([
            'message' => 'Xóa chủ đề thành công'
        ], 200);
    }
}