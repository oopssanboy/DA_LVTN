<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamMatrix;
use App\Models\ExamQuestion;
use App\Models\Question;
use App\Http\Requests\ExamRequest;
use App\Http\Resources\ExamResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExamController extends Controller
{
    public function index(Request $request)
    {
        $query = Exam::with(['class', 'matrices']);
        
        // Nếu là giảng viên, chỉ lấy kỳ thi của lớp mình dạy
        if (auth()->user()->role === 'teacher') {
            $query->whereHas('class.course', function($q) {
                $q->where('teacher_id', auth()->user()->id);
            });
        }

        if ($request->has('class_id')) {
            $query->where('class_id', $request->input('class_id'));
        }

        $exams = $query->latest()->paginate(15);
        return ExamResource::collection($exams);
    }

    public function show($id)
    {
        $exam = Exam::with(['class', 'matrices', 'questions'])->findOrFail($id);
        return response()->json(new ExamResource($exam));
    }

    public function store(ExamRequest $request)
    {
        $data = $request->validated();
        $matrices = $data['matrices'];
        unset($data['matrices']);

        // Kiểm tra tổng quantity có bằng total_questions không
        $totalQuantity = collect($matrices)->sum('quantity');
        if ($totalQuantity != $data['total_questions']) {
            return response()->json([
                'message' => 'Tổng số câu hỏi trong ma trận (' . $totalQuantity . ') không khớp với tổng số câu hỏi của kỳ thi (' . $data['total_questions'] . ').'
            ], 422);
        }

        DB::beginTransaction();
        try {
            $exam = Exam::create($data);

            foreach ($matrices as $matrix) {
                ExamMatrix::create([
                    'exam_id' => $exam->id,
                    'topic_id' => $matrix['topic_id'],
                    'difficulty' => $matrix['difficulty'],
                    'quantity' => $matrix['quantity']
                ]);
            }

            DB::commit();
            $exam->load('matrices');
            return response()->json(['message' => 'Tạo kỳ thi thành công', 'data' => new ExamResource($exam)], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi tạo kỳ thi'.$e->getMessage(), 'error' => $e->getMessage()], 500);
        }
    }

    public function generateExam($id)
    {
        $exam = Exam::findOrFail($id);
        
        DB::beginTransaction();
        try {
            ExamQuestion::where('exam_id', $exam->id)->delete();
            
            $matrices = ExamMatrix::where('exam_id', $exam->id)->get();
            $selectedQuestions = [];
            
            foreach ($matrices as $matrix) {
                $questions = Question::where('topic_id', $matrix->topic_id)
                    ->where('difficulty', $matrix->difficulty)
                    ->inRandomOrder()
                    ->limit($matrix->quantity)
                    ->get();
                
                if ($questions->count() < $matrix->quantity) {
                    throw new \Exception("Chủ đề ID {$matrix->topic_id} độ khó {$matrix->difficulty} không đủ câu hỏi trong ngân hàng.");
                }

                foreach ($questions as $q) {
                    $selectedQuestions[] = [
                        'exam_id' => $exam->id, 
                        'question_id' => $q->id,
                        'created_at' => now(),
                        'updated_at' => now()
                    ];
                }
            }
            
            ExamQuestion::insert($selectedQuestions);
            DB::commit();
            return response()->json(['message' => 'Đã sinh đề thi thành công từ ma trận']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi sinh đề thi'.$e->getMessage(), 'error' => $e->getMessage()], 400);
        }
    }

    public function update(ExamRequest $request, $id)
    {
        $exam = Exam::findOrFail($id);
        $data = $request->validated();
        
        DB::beginTransaction();
        try {
            $exam->update($data);
            
            if (isset($data['matrices'])) {
                ExamMatrix::where('exam_id', $exam->id)->delete();
                foreach ($data['matrices'] as $matrix) {
                    ExamMatrix::create([
                        'exam_id' => $exam->id,
                        'topic_id' => $matrix['topic_id'],
                        'difficulty' => $matrix['difficulty'],
                        'quantity' => $matrix['quantity']
                    ]);
                }
            }
            DB::commit();
            return response()->json(['message' => 'Cập nhật thành công', 'data' => new ExamResource($exam)]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi cập nhật', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $exam = Exam::findOrFail($id);
        $exam->delete();
        return response()->json(['message' => 'Xóa kỳ thi thành công']);
    }
    // Bật/Tắt trạng thái kỳ thi
    public function toggleStatus($id)
    {
        $exam = Exam::findOrFail($id);
        $exam->is_active = !$exam->is_active;
        $exam->save();

        $statusText = $exam->is_active ? 'Đã mở khóa' : 'Đã khóa';
        return response()->json([
            'message' => $statusText . ' phòng thi thành công!',
            'is_active' => $exam->is_active
        ]);
    }
}