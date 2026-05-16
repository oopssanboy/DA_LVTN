<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\Choice;
use App\Http\Requests\QuestionRequest;
use App\Http\Resources\QuestionResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuestionController extends Controller
{
    // Lấy danh sách câu hỏi (có thể lọc theo subject, topic, difficulty, type)
    public function index(Request $request)
    {
        $query = Question::with('choices');

        if ($request->has('subject')) {
            $query->where('subject', 'like', '%' . $request->subject . '%');
        }
        if ($request->has('topic')) {
            $query->where('topic', $request->topic);
        }
        if ($request->has('difficulty')) {
            $query->where('difficulty', $request->difficulty);
        }
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $questions = $query->latest()->paginate(15);

        return QuestionResource::collection($questions);
    }

    // Lấy chi tiết một câu hỏi
    public function show(Question $question)
    {
        $question->load('choices');
        return new QuestionResource($question);
    }

    // Tạo mới câu hỏi (kèm choices nếu có)
    public function store(QuestionRequest $request)
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();
            $data['created_by'] = auth()->id();

            $question = Question::create($data);

            // Nếu là single/multiple thì tạo choices
            if (in_array($question->type, ['single', 'multiple']) && isset($data['choices'])) {
                foreach ($data['choices'] as $choice) {
                    Choice::create([
                        'question_id' => $question->id,
                        'choice_key' => $choice['key'],
                        'choice_text' => $choice['text'],
                    ]);
                }
            }

            DB::commit();

            return (new QuestionResource($question->load('choices')))
                ->response()
                ->setStatusCode(201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Tạo câu hỏi thất bại', 'error' => $e->getMessage()], 500);
        }
    }

    // Cập nhật câu hỏi (có thể thay đổi cả choices)
    public function update(QuestionRequest $request, Question $question)
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();
            $question->update($data);

            // Nếu là single/multiple, cập nhật lại choices
            if (in_array($question->type, ['single', 'multiple']) && isset($data['choices'])) {
                // Xoá choices cũ
                $question->choices()->delete();
                // Tạo mới
                foreach ($data['choices'] as $choice) {
                    Choice::create([
                        'question_id' => $question->id,
                        'choice_key' => $choice['key'],
                        'choice_text' => $choice['text'],
                    ]);
                }
            } else {
                // Nếu chuyển từ single/multiple sang fill_blank, xoá hết choices
                $question->choices()->delete();
            }

            DB::commit();

            return new QuestionResource($question->load('choices'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Cập nhật câu hỏi thất bại', 'error' => $e->getMessage()], 500);
        }
    }

    // Xoá câu hỏi
    public function destroy(Question $question)
    {
        try {
            DB::beginTransaction();
            $question->choices()->delete(); // xoá choices trước
            $question->delete();
            DB::commit();

            return response()->json(['message' => 'Xoá câu hỏi thành công'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Xoá thất bại', 'error' => $e->getMessage()], 500);
        }
    }
}