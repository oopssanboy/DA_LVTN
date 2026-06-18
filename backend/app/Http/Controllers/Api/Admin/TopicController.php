<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Topic;
use Illuminate\Http\Request;

class TopicController extends Controller
{
    // Lấy danh sách Chủ đề
    public function index(Request $request)
    {
        $query = Topic::with('subject')->orderBy('created_at', 'desc');
        
        // Hỗ trợ lọc chủ đề theo môn học (Nếu sau này form tạo câu hỏi cần lọc)
        if ($request->has('subject_id') && $request->subject_id != '') {
            $query->where('subject_id', $request->subject_id);
        }

        $topics = $query->get();

        return response()->json([
            'message' => 'Lấy danh sách chủ đề thành công',
            'data' => $topics
        ], 200);
    }

    // Thêm mới Chủ đề
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

    // Cập nhật Chủ đề
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

    // Xóa Chủ đề
    public function destroy($id)
    {
        $topic = Topic::findOrFail($id);
        
        // Do bảng questions có khóa ngoại topic_id, nếu cascade delete được setup ở DB thì nó sẽ tự xóa câu hỏi.
        // Còn nếu không, bạn có thể kiểm tra xem có câu hỏi nào đang dùng topic này không trước khi xóa.
        
        $topic->delete();

        return response()->json([
            'message' => 'Xóa chủ đề thành công'
        ], 200);
    }
}