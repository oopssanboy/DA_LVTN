<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamMatrix;
use App\Models\Question;
use App\Http\Requests\ExamRequest;
use App\Http\Resources\ExamResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExamController extends Controller
{
    // Danh sách kỳ thi (có filter theo class)
    public function index(Request $request)
    {
        $query = Exam::with(['class', 'matrices']);
        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }
        $exams = $query->latest()->paginate(15);
        return ExamResource::collection($exams);
    }

    // Chi tiết một kỳ thi
    public function show(Exam $exam)
    {
        $exam->load(['class', 'matrices', 'questions']);
        return new ExamResource($exam);
    }

    // Tạo kỳ thi và ma trận
    public function store(ExamRequest $request)
    {
        $data = $request->validated();
        $matrices = $data['matrices'];
        unset($data['matrices']);

        // Kiểm tra tổng quantity có bằng total_questions không
        $totalQuantity = collect($matrices)->sum('quantity');
        if ($totalQuantity != $data['total_questions']) {
            return response()->json([
                'message' => 'Tổng số câu hỏi trong ma trận không khớp với total_questions'
            ], 422);
        }

        DB::beginTransaction();
        try {
            $exam = Exam::create($data);
            foreach ($matrices as $matrix) {
                $exam->matrices()->create($matrix);
            }
            DB::commit();
            return new ExamResource($exam->load('matrices'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Tạo kỳ thi thất bại', 'error' => $e->getMessage()], 500);
        }
    }

    // Cập nhật kỳ thi (xóa ma trận cũ, tạo mới)
    public function update(ExamRequest $request, Exam $exam)
    {
        $data = $request->validated();
        $matrices = $data['matrices'];
        unset($data['matrices']);

        $totalQuantity = collect($matrices)->sum('quantity');
        if ($totalQuantity != $data['total_questions']) {
            return response()->json([
                'message' => 'Tổng số câu hỏi trong ma trận không khớp với total_questions'
            ], 422);
        }

        DB::beginTransaction();
        try {
            $exam->update($data);
            // Xóa ma trận cũ, tạo mới
            $exam->matrices()->delete();
            foreach ($matrices as $matrix) {
                $exam->matrices()->create($matrix);
            }
            DB::commit();
            return new ExamResource($exam->load('matrices'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Cập nhật thất bại', 'error' => $e->getMessage()], 500);
        }
    }

    // Xóa kỳ thi
    public function destroy(Exam $exam)
    {
        DB::beginTransaction();
        try {
            $exam->matrices()->delete();
            $exam->questions()->detach();
            $exam->delete();
            DB::commit();
            return response()->json(['message' => 'Xóa kỳ thi thành công']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Xóa thất bại', 'error' => $e->getMessage()], 500);
        }
    }

    // Sinh đề (lấy câu hỏi từ ngân hàng theo ma trận, lưu vào exam_questions)
    public function generate(Exam $exam)
    {
        // Kiểm tra đã có đề chưa? Nếu có thì hỏi xác nhận (có thể xóa cũ)
        // Ta sẽ xóa cũ và tạo mới
        DB::beginTransaction();
        try {
            // Xóa các câu hỏi cũ
            $exam->questions()->detach();

            $selectedQuestions = collect();
            $matrices = $exam->matrices;

            foreach ($matrices as $matrix) {
                // Lấy danh sách câu hỏi đáp ứng topic, difficulty, chưa được chọn
                $query = Question::where('subject', $exam->subject)
                    ->where('topic', $matrix->topic)
                    ->where('difficulty', $matrix->difficulty);

                // Loại trừ những câu đã được chọn trong các lần lấy trước
                if ($selectedQuestions->isNotEmpty()) {
                    $query->whereNotIn('id', $selectedQuestions->pluck('id'));
                }

                $questions = $query->inRandomOrder()->limit($matrix->quantity)->get();

                if ($questions->count() < $matrix->quantity) {
                    throw new \Exception("Không đủ câu hỏi cho ma trận: topic={$matrix->topic}, difficulty={$matrix->difficulty}");
                }

                $selectedQuestions = $selectedQuestions->merge($questions);
            }

            // Gắn các câu hỏi vào exam_questions, có thể xáo trộn thứ tự
            $order = 1;
            $syncData = [];
            foreach ($selectedQuestions->shuffle() as $question) {
                $syncData[$question->id] = ['order' => $order++];
            }
            $exam->questions()->sync($syncData);

            DB::commit();
            return response()->json([
                'message' => 'Sinh đề thi thành công',
                'total_questions' => $exam->questions()->count()
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}