<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamMatrix;
use App\Models\ExamAttempt;
use App\Models\Question;
use App\Models\StudentAnswer;
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

    // Xem danh sách kết quả bài thi của học viên trong kỳ thi này
    public function attempts(Request $request, Exam $exam)
    {
        $attempts = ExamAttempt::with(['student'])
            ->where('exam_id', $exam->id)
            ->when($request->status, function($query, $status) {
                return $query->where('status', $status);
            })
            ->orderByDesc('total_score') // Xếp điểm cao nhất lên đầu
            ->paginate(15);

        return response()->json($attempts);
    }

    // Bật/Tắt kỳ thi nhanh chóng
    public function updateStatus(Request $request, Exam $exam)
    {
        $request->validate([
            'is_active' => 'required|boolean'
        ]);

        $exam->update(['is_active' => $request->is_active]);

        return response()->json([
            'message' => 'Cập nhật trạng thái kỳ thi thành công',
            'is_active' => $exam->is_active
        ]);
    }

    // Xem thống kê tổng quan của kỳ thi
    public function statistics(Exam $exam)
    {
        $totalAttempts = ExamAttempt::where('exam_id', $exam->id)->count();
        $submittedAttempts = ExamAttempt::where('exam_id', $exam->id)->where('status', 'submitted');

        $totalSubmitted = $submittedAttempts->count();
        $passed = (clone $submittedAttempts)->where('is_passed', true)->count();
        $failed = $totalSubmitted - $passed;

        $averageScore = $totalSubmitted > 0 ? $submittedAttempts->avg('total_score') : 0;
        $maxScore = $totalSubmitted > 0 ? $submittedAttempts->max('total_score') : 0;
        $minScore = $totalSubmitted > 0 ? $submittedAttempts->min('total_score') : 0;

        return response()->json([
            'total_attempts' => $totalAttempts,
            'total_submitted' => $totalSubmitted,
            'passed' => $passed,
            'failed' => $failed,
            'pass_rate' => $totalSubmitted > 0 ? round(($passed / $totalSubmitted) * 100, 2) : 0,
            'average_score' => round($averageScore, 2),
            'max_score' => round($maxScore, 2),
            'min_score' => round($minScore, 2),
        ]);
    }

    // Xem chi tiết bài làm của một học viên (dành cho Admin/Giáo viên)
    public function attemptDetail(Exam $exam, ExamAttempt $attempt)
    {
        // Đảm bảo bài thi thuộc về đúng kỳ thi
        if ($attempt->exam_id !== $exam->id) {
            return response()->json(['message' => 'Bài làm không thuộc kỳ thi này'], 400);
        }

        $attempt->load(['student', 'violationLogs']); // Lấy thêm log vi phạm quy chế
        $questions = $exam->questions()->with('choices')->get();
        $answers = StudentAnswer::where('attempt_id', $attempt->id)->get()->keyBy('question_id');

        $details = $questions->map(function ($q) use ($answers) {
            $ans = $answers->get($q->id);
            return [
                'question_id' => $q->id,
                'content' => $q->content,
                'type' => $q->type,
                'choices' => $q->type != 'fill_blank' ? $q->choices : null,
                'user_answer' => $ans ? $ans->answer_text : '',
                'correct_answer' => $q->correct_answer,
                'is_correct' => $ans ? $ans->is_correct : false,
                'score_earned' => $ans ? $ans->score_earned : 0,
            ];
        });

        return response()->json([
            'attempt' => $attempt,
            'details' => $details,
        ]);
    }
}