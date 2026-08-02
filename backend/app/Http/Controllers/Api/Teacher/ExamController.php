<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamMatrix;
use App\Models\ExamQuestion;
use App\Models\Question;
use Illuminate\Support\Facades\Mail;
use App\Mail\NewExamMail;
use App\Models\ClassEnrollment;
use App\Http\Requests\ExamRequest;
use App\Http\Resources\ExamResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExamController extends Controller
{
    private function getAuthorizedExamQuery()
    {
        $query = Exam::query();
        
        if (auth()->check() && auth()->user()->role === 'teacher') {
            $query->whereHas('classes.teachers', function($q) {
                $q->where('users.id', auth()->id());
            });
        }
        
        return $query;
    }
    public function index(Request $request)
    {
        $query = $this->getAuthorizedExamQuery()
                    ->with(['classes', 'matrices'])
                    ->withCount(['attempts as in_progress_count' => function ($q) {
                        $q->where('status', 'in_progress');
                    }]);

        if ($request->has('class_id')) {
            $query->whereHas('classes', function($q) use ($request) {
                $q->where('classes.id', $request->input('class_id'));
            });
        }

        $exams = $query->latest()->paginate(15);
        return ExamResource::collection($exams);
    }

    public function show($id)
    {
        $exam = $this->getAuthorizedExamQuery()
                    ->with(['classes', 'proctors', 'matrices', 'questions'])
                    ->findOrFail($id);
                    
        return response()->json(['data' => new ExamResource($exam)]);
    }

    public function store(ExamRequest $request)
    {
        $data = $request->validated();
        
      
        $matrices = $data['matrices'] ?? [];
        $classIds = $data['class_ids'] ?? [];
        $proctorIds = $data['proctor_ids'] ?? [];
        
        unset($data['matrices'], $data['class_ids'], $data['proctor_ids'], $data['class_id']);

  
        $totalQuantity = collect($matrices)->sum('quantity');
        if ($totalQuantity != $data['total_questions']) {
            return response()->json([
                'message' => 'Tổng số câu hỏi trong ma trận (' . $totalQuantity . ') không khớp với tổng số câu hỏi của kỳ thi (' . $data['total_questions'] . ').'
            ], 422);
        }

        DB::beginTransaction();
        try {
       
            $exam = Exam::create($data);

            if (!empty($classIds)) {
                $exam->classes()->sync($classIds);
            }
            if (!empty($proctorIds)) {
                $exam->proctors()->sync($proctorIds);
            }

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

            if (!empty($classIds)) {
                $studentIds = ClassEnrollment::whereIn('class_id', $classIds)->pluck('student_id')->unique();
                $students = \App\Models\User::whereIn('id', $studentIds)->get();

                foreach ($students as $student) {
                    Mail::to($student->email)->send(new NewExamMail($exam, $student));
                }
            }
            
            return response()->json(['message' => 'Tạo kỳ thi thành công', 'data' => new ExamResource($exam)], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi tạo kỳ thi: '.$e->getMessage(), 'error' => $e->getMessage()], 500);
        }
    }

    public function generateExam($id)
    {
        $exam = $this->getAuthorizedExamQuery()->findOrFail($id);
        
        DB::beginTransaction();
        try {
            ExamQuestion::where('exam_id', $exam->id)->delete();
            
            $matrices = ExamMatrix::where('exam_id', $exam->id)->get();
            $selectedQuestions = [];
            $scorePerQuestion = 10 / $exam->total_questions;
            
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
            return response()->json(['message' => 'Lỗi sinh đề thi: '.$e->getMessage(), 'error' => $e->getMessage()], 400);
        }
    }

    public function update(ExamRequest $request, $id)
    {
        $exam = $this->getAuthorizedExamQuery()->findOrFail($id);
        $data = $request->validated();
        
    
        $matrices = $data['matrices'] ?? null;
        $classIds = $data['class_ids'] ?? [];
        $proctorIds = $data['proctor_ids'] ?? [];
        
        unset($data['matrices'], $data['class_ids'], $data['proctor_ids'], $data['class_id']);
        
        DB::beginTransaction();
        try {
    
            $exam->update($data);
    
            if (isset($request->class_ids)) {
                $exam->classes()->sync($classIds);
            }
            if (isset($request->proctor_ids)) {
                $exam->proctors()->sync($proctorIds);
            }

            if ($matrices !== null) {
                ExamMatrix::where('exam_id', $exam->id)->delete();
                foreach ($matrices as $matrix) {
                    ExamMatrix::create([
                        'exam_id' => $exam->id,
                        'topic_id' => $matrix['topic_id'],
                        'difficulty' => $matrix['difficulty'],
                        'quantity' => $matrix['quantity']
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
        $exam = Exam::findOrFail($id);
        $exam->delete();
        return response()->json(['message' => 'Xóa kỳ thi thành công']);
    }
  
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