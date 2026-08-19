<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamMatrix;
use App\Models\ExamQuestion;
use App\Models\Question;
use App\Models\ExamAttempt;
use App\Http\Requests\ExamRequest;
use App\Http\Resources\ExamResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ExamController extends Controller
{
    private function getViewableExamQuery()
    {
        $query = Exam::with('teacher'); 
        if (auth()->check() && auth()->user()->role === 'teacher') {
            $teacherId = auth()->id();
            $query->whereHas('classes.teachers', function($q) use ($teacherId) {
                $q->where('users.id', $teacherId);
            });
        }
        return $query;
    }

    private function getEditableExamQuery()
    {
        $query = Exam::query();
        if (auth()->check() && auth()->user()->role === 'teacher') {
            $query->where('teacher_id', auth()->id());
        }
        return $query;
    }

    public function index(Request $request)
    {
        $query = $this->getViewableExamQuery()
            ->with(['classes', 'subject', 'matrices'])
            ->withCount(['attempts as in_progress_count' => function ($q) {
                $q->where('status', 'in_progress');
            }]);

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                  ->orWhereHas('subject', function ($q2) use ($search) {
                      $q2->where('name', 'like', '%' . $search . '%');
                  });
            });
        }

        if ($request->has('class_id') && $request->class_id != '') {
            $query->whereHas('classes', function($q) use ($request) {
                $q->where('classes.id', $request->class_id);
            });
        }

        if ($request->has('is_active') && $request->is_active != '') {
            $query->where('is_active', $request->is_active);
        }

        $perPage = $request->input('per_page', 10);
        $exams = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return ExamResource::collection($exams);
    }

    public function show($id)
    {
        $exam = $this->getViewableExamQuery()
                    ->with(['classes', 'proctors', 'matrices', 'questions','matrices.topic', 'questions.question.topic'])
                    ->withCount('attempts') 
                    ->findOrFail($id);
                    
        return response()->json(['data' => new ExamResource($exam)]);
    }

    public function store(ExamRequest $request)
    {
        $data = $request->validated();
        
        if (auth()->check() && auth()->user()->role === 'teacher') {
            $data['teacher_id'] = auth()->id();
        }
        
        $matrices = $data['matrices'] ?? [];
        $classIds = $data['class_ids'] ?? [];
        $proctorIds = $data['proctor_ids'] ?? [];
        
        unset($data['matrices'], $data['class_ids'], $data['proctor_ids'], $data['class_id']);

        if (!empty($proctorIds) && isset($data['start_time']) && isset($data['end_time'])) {
            $startTime = $data['start_time'];
            $endTime = $data['end_time'];
            
            $conflictingExams = Exam::where('start_time', '<', $endTime)
                ->where('end_time', '>', $startTime)
                ->whereHas('proctors', function ($q) use ($proctorIds) {
                    $q->whereIn('users.id', $proctorIds);
                })
                ->with(['proctors' => function($q) use ($proctorIds) {
                    $q->whereIn('users.id', $proctorIds);
                }])
                ->get();

            if ($conflictingExams->isNotEmpty()) {
                $conflicts = [];
                foreach ($conflictingExams as $cExam) {
                    $proctorNames = $cExam->proctors->map(function($p) { return $p->name ?? $p->email; })->implode(', ');
                    $conflicts[] = [
                        'exam_title' => $cExam->title,
                        'time' => Carbon::parse($cExam->start_time)->format('H:i d/m/Y') . ' - ' . Carbon::parse($cExam->end_time)->format('H:i d/m/Y'),
                        'proctors' => $proctorNames
                    ];
                }
                return response()->json([
                    'message' => "Lỗi phân công! Có giám thị đang bị trùng lịch.",
                    'conflicts' => $conflicts
                ], 422);
            }
        }

        $totalQuantity = collect($matrices)->sum('quantity');
        if ($totalQuantity != $data['total_questions']) {
            return response()->json(['message' => 'Tổng số câu hỏi không khớp.'], 422);
        }

        DB::beginTransaction();
        try {
            $exam = Exam::create($data);
            if (!empty($classIds)) $exam->classes()->sync($classIds);
            if (!empty($proctorIds)) $exam->proctors()->sync($proctorIds);

            foreach ($matrices as $matrix) {
                ExamMatrix::create([
                    'exam_id' => $exam->id,
                    'topic_id' => $matrix['topic_id'],
                    'question_type' => $matrix['question_type'] ?? 'all',
                    'difficulty' => $matrix['difficulty'],
                    'quantity' => $matrix['quantity'],
                    'fixed_score' => ($matrix['question_type'] === 'coding' && isset($matrix['fixed_score'])) ? $matrix['fixed_score'] : null,
                ]);
            }

            DB::commit();
            $exam->load('matrices', 'classes', 'proctors');
            return response()->json(['message' => 'Tạo kỳ thi thành công', 'data' => new ExamResource($exam)], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi tạo kỳ thi: ' . $e->getMessage()], 500);
        }
    }

    public function update(ExamRequest $request, $id)
    {
        $hasAttempts = ExamAttempt::where('exam_id', $id)->exists();
        
        $exam = $this->getEditableExamQuery()->findOrFail($id);
        $data = $request->validated();
        
        $matrices = $data['matrices'] ?? null;
        $classIds = $data['class_ids'] ?? [];
        $proctorIds = $data['proctor_ids'] ?? [];
        
        unset($data['matrices'], $data['class_ids'], $data['proctor_ids'], $data['class_id']);
        
        if ($hasAttempts) {
            unset($data['scoring_method']);
            unset($data['total_questions']);
        }
        
        $startTime = $data['start_time'] ?? $exam->start_time;
        $endTime = $data['end_time'] ?? $exam->end_time;

        if (!empty($proctorIds) && $startTime && $endTime) {
            $conflictingExams = Exam::where('id', '!=', $exam->id) 
                ->where('start_time', '<', $endTime)
                ->where('end_time', '>', $startTime)
                ->whereHas('proctors', function ($q) use ($proctorIds) {
                    $q->whereIn('users.id', $proctorIds);
                })
                ->with(['proctors' => function($q) use ($proctorIds) {
                    $q->whereIn('users.id', $proctorIds);
                }])
                ->get();

            if ($conflictingExams->isNotEmpty()) {
                $conflicts = [];
                foreach ($conflictingExams as $cExam) {
                    $proctorNames = $cExam->proctors->map(function($p) { return $p->name ?? $p->email; })->implode(', ');
                    $conflicts[] = [
                        'exam_title' => $cExam->title,
                        'time' => Carbon::parse($cExam->start_time)->format('H:i d/m/Y') . ' - ' . Carbon::parse($cExam->end_time)->format('H:i d/m/Y'),
                        'proctors' => $proctorNames
                    ];
                }
                return response()->json([
                    'message' => "Lỗi phân công! Có giám thị đang bị trùng lịch.",
                    'conflicts' => $conflicts
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            $exam->update($data);
            if (isset($request->class_ids)) $exam->classes()->sync($classIds);
            if (isset($request->proctor_ids)) $exam->proctors()->sync($proctorIds);

            if ($matrices !== null && !$hasAttempts) {
                ExamMatrix::where('exam_id', $exam->id)->delete();
                foreach ($matrices as $matrix) {
                    ExamMatrix::create([
                        'exam_id' => $exam->id, 
                        'topic_id' => $matrix['topic_id'],
                        'question_type' => $matrix['question_type'] ?? 'all',
                        'difficulty' => $matrix['difficulty'], 
                        'quantity' => $matrix['quantity'],
                        'fixed_score' => ($matrix['question_type'] === 'coding' && isset($matrix['fixed_score'])) ? $matrix['fixed_score'] : null,
                    ]);
                }
                
                if (ExamQuestion::where('exam_id', $exam->id)->exists()) {
                    $this->internalGenerateExam($exam->id);
                }
            }
            
            DB::commit();
            $exam->load('matrices', 'classes', 'proctors');
            return response()->json(['message' => 'Cập nhật thành công', 'data' => new ExamResource($exam)]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi cập nhật: ' . $e->getMessage()], 422);
        }
    }

    public function destroy($id)
    {
       $isRunning = ExamAttempt::where('exam_id', $id)->exists();
        if ($isRunning) {
            return response()->json(['message' => 'Không thể xóa! Đã có sinh viên làm bài thi này.'], 403);
        }
        $exam = $this->getEditableExamQuery()->findOrFail($id);
        $exam->delete();
        return response()->json(['message' => 'Xóa kỳ thi thành công']);
    }
  
    public function toggleStatus($id)
    {
        $exam = $this->getEditableExamQuery()->findOrFail($id);
        $exam->is_active = !$exam->is_active;
        $exam->save();
        return response()->json(['message' => 'Đổi trạng thái thành công!', 'is_active' => $exam->is_active]);
    }

    public function generateExam($id)
    {
        $hasAttempts = ExamAttempt::where('exam_id', $id)->exists();
        if ($hasAttempts) {
            return response()->json(['message' => 'Không thể sinh đề mới vì đã có dữ liệu làm bài thi của học viên.'], 403);
        }

        DB::beginTransaction();
        try {
            $this->internalGenerateExam($id);
            DB::commit();
            return response()->json(['message' => 'Đã sinh đề thi thành công từ ma trận']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi sinh đề thi: ' . $e->getMessage()], 400);
        }
    }

    private function internalGenerateExam($examId)
    {
        $exam = Exam::findOrFail($examId);
        ExamQuestion::where('exam_id', $exam->id)->delete();
        
        $matrices = ExamMatrix::where('exam_id', $exam->id)->get();
        $selectedQuestions = [];
        
        $codingMatrices = $matrices->where('question_type', 'coding');
        $regularMatrices = $matrices->where('question_type', '!=', 'coding');

        $totalCodingScore = 0;
        foreach ($codingMatrices as $cm) {
            $totalCodingScore += ($cm->quantity * ($cm->fixed_score ?? 0));
        }

        $remainingScore = 10 - $totalCodingScore;
        if ($remainingScore < 0) {
            throw new \Exception("Lỗi: Tổng điểm các câu lập trình ({$totalCodingScore}) đã vượt quá 10 điểm.");
        }

        $totalRegularQuantity = $regularMatrices->sum('quantity');
        $totalRegularWeight = 0;
        
        if ($exam->scoring_method === 'weighted') {
            foreach ($regularMatrices as $rm) {
                $weight = $rm->difficulty === 'easy' ? 1 : ($rm->difficulty === 'medium' ? 2 : 3);
                $totalRegularWeight += ($weight * $rm->quantity);
            }
        }

        if ($totalRegularQuantity > 0 && $remainingScore <= 0) {
             throw new \Exception("Lỗi: Bạn đã phân bổ hết 10 điểm cho câu Lập trình nhưng vẫn cấu hình thêm {$totalRegularQuantity} câu hỏi thường.");
        }
        foreach ($matrices as $matrix) {
            $query = Question::where('topic_id', $matrix->topic_id)
                ->where('difficulty', $matrix->difficulty)
                ->where('teacher_id', $exam->teacher_id);
            
            if ($matrix->question_type !== 'all') {
                $query->where('type', $matrix->question_type);
            } else {
                $query->where('type', '!=', 'coding');
            }

            $questions = $query->inRandomOrder()->limit($matrix->quantity)->get();
            
            if ($questions->count() < $matrix->quantity) {
                $typeLabel = $matrix->question_type !== 'all' ? "loại {$matrix->question_type}" : "lý thuyết";
                throw new \Exception("Chủ đề ID {$matrix->topic_id} độ khó {$matrix->difficulty} {$typeLabel} không đủ câu hỏi trong ngân hàng.");
            }

            $scoreForThisMatrix = 0;
            if ($matrix->question_type === 'coding') {
                $scoreForThisMatrix = $matrix->fixed_score ?? 0;
            } else {
                if ($exam->scoring_method === 'weighted' && $totalRegularWeight > 0) {
                    $diffWeight = $matrix->difficulty === 'easy' ? 1 : ($matrix->difficulty === 'medium' ? 2 : 3);
                    $scoreForThisMatrix = $remainingScore * ($diffWeight / $totalRegularWeight);
                } else {
                    $scoreForThisMatrix = $totalRegularQuantity > 0 ? ($remainingScore / $totalRegularQuantity) : 0;
                }
            }

            foreach ($questions as $q) {
                $selectedQuestions[] = [
                    'exam_id' => $exam->id, 
                    'question_id' => $q->id, 
                    'question_score' => $scoreForThisMatrix, 
                    'created_at' => now(), 
                    'updated_at' => now()
                ];
            }
        }
        
        ExamQuestion::insert($selectedQuestions);
    }
}