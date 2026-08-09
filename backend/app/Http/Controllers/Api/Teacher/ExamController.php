<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamMatrix;
use App\Models\ExamQuestion;
use App\Models\Question;
use App\Models\ExamAttempt;
use Illuminate\Support\Facades\Mail;
use App\Mail\NewExamMail;
use App\Models\ClassEnrollment;
use App\Http\Requests\ExamRequest;
use App\Http\Resources\ExamResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
                    ->with(['classes', 'proctors', 'matrices', 'questions'])
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
                        'time' => \Carbon\Carbon::parse($cExam->start_time)->format('H:i d/m/Y') . ' - ' . \Carbon\Carbon::parse($cExam->end_time)->format('H:i d/m/Y'),
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
                    'difficulty' => $matrix['difficulty'],
                    'quantity' => $matrix['quantity']
                ]);
            }

            DB::commit();
            $exam->load('matrices', 'classes', 'proctors');
            return response()->json(['message' => 'Tạo kỳ thi thành công', 'data' => new ExamResource($exam)], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi tạo kỳ thi', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(ExamRequest $request, $id)
    {
        $isRunning = ExamAttempt::where('exam_id', $id)->where('status', 'in_progress')->exists();
    if ($isRunning) {
        return response()->json(['message' => 'Không thể sửa! Đang có sinh viên làm bài thi này.'], 403);
    }
        $exam = $this->getEditableExamQuery()->findOrFail($id);
        $data = $request->validated();
        
        $matrices = $data['matrices'] ?? null;
        $classIds = $data['class_ids'] ?? [];
        $proctorIds = $data['proctor_ids'] ?? [];
        
        unset($data['matrices'], $data['class_ids'], $data['proctor_ids'], $data['class_id']);
        
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
                    $proctorNames =$cExam->proctors->map(function($p) { return$p->name ?? $p->email; })->implode(', ');$conflicts[] = [
                        'exam_title' => $cExam->title,
                        'time' => \Carbon\Carbon::parse($cExam->start_time)->format('H:i d/m/Y') . ' - ' . \Carbon\Carbon::parse($cExam->end_time)->format('H:i d/m/Y'),
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

            if ($matrices !== null) {
                ExamMatrix::where('exam_id', $exam->id)->delete();
                foreach ($matrices as $matrix) {
                    ExamMatrix::create([
                        'exam_id' => $exam->id, 'topic_id' => $matrix['topic_id'],
                        'difficulty' => $matrix['difficulty'], 'quantity' => $matrix['quantity']
                    ]);
                }
            }
            DB::commit();
            $exam->load('matrices', 'classes', 'proctors');
            return response()->json(['message' => 'Cập nhật thành công', 'data' => new ExamResource($exam)]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi cập nhật', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
       $isRunning = ExamAttempt::where('exam_id', $id)->where('status', 'in_progress')->exists();
    if ($isRunning) {
        return response()->json(['message' => 'Không thể xóa! Đang có sinh viên làm bài thi này.'], 403);
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
        $exam = $this->getEditableExamQuery()->findOrFail($id);
        
        DB::beginTransaction();
        try {
            ExamQuestion::where('exam_id', $exam->id)->delete();
            $matrices = ExamMatrix::where('exam_id', $exam->id)->get();
            $selectedQuestions = [];
            $scorePerQuestion = 10 / $exam->total_questions;
            
            foreach ($matrices as $matrix) {
                $questions = Question::where('topic_id', $matrix->topic_id)
                    ->where('difficulty', $matrix->difficulty)
                    ->where('teacher_id', $exam->teacher_id) 
                    ->inRandomOrder()
                    ->limit($matrix->quantity)
                    ->get();
                
                if ($questions->count() < $matrix->quantity) {
                    throw new \Exception("Chủ đề ID {$matrix->topic_id} độ khó {$matrix->difficulty} không đủ câu hỏi của bạn trong ngân hàng.");
                }

                foreach ($questions as $q) {
                    $selectedQuestions[] = [
                        'exam_id' => $exam->id, 
                        'question_id' => $q->id, 
                        'question_score' => $scorePerQuestion, 
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
            return response()->json(['message' => 'Lỗi sinh đề thi', 'error' => $e->getMessage()], 400);
        }
    }
}