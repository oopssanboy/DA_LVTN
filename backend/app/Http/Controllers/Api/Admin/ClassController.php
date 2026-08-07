<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Classes;
use App\Models\ClassEnrollment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\ClassEnrollmentMail;

class ClassController extends Controller
{
    public function index(Request $request)
    {
        $query = Classes::with(['cohort.course', 'teachers.teacher'])
            ->withCount(['enrollments', 'exams'])
            ->orderBy('created_at', 'desc');

        if (auth()->check() && auth()->user()->role === 'teacher') {
            $query->whereHas('teachers', function($q) {
                $q->where('users.id', auth()->id());
            });
        }

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhereHas('cohort.course', function ($q2) use ($search) {
                      $q2->where('title', 'like', '%' . $search . '%')
                         ->orWhere('code', 'like', '%' . $search . '%');
                  })
                  ->orWhereHas('teachers', function ($q2) use ($search) {
                      $q2->where('name', 'like', '%' . $search . '%')
                         ->orWhere('teacher_code', 'like', '%' . $search . '%')
                         ->orWhere('email', 'like', '%' . $search . '%');
                  });
            });
        }
        
        if ($request->has('subject_id') && $request->subject_id != '') {
            $subjectId = $request->subject_id;
            $query->whereHas('cohort.course.subjects', function ($q) use ($subjectId) {
                $q->where('subjects.id', $subjectId);
            });
        }

        $perPage = $request->input('per_page', 10);
        $classes = $query->paginate($perPage);

        

        return response()->json($classes, 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'cohort_id' => 'required|exists:cohorts,id',
            'name' => 'required|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'teacher_assignments' => 'nullable|array', 
            'teacher_assignments.*.teacher_id' => 'required|exists:users,id',
            'teacher_assignments.*.subject_id' => 'required|exists:subjects,id'
        ]);

        DB::beginTransaction();
        try {
            $class = Classes::create($request->only('cohort_id', 'name', 'start_date', 'end_date'));

            if ($request->has('teacher_assignments')) {
                $assignments = [];
                foreach ($request->teacher_assignments as $assignment) {
                    $assignments[] = [
                        'class_id' => $class->id,
                        'teacher_id' => $assignment['teacher_id'],
                        'subject_id' => $assignment['subject_id'],
                    ];
                }
                DB::table('class_teacher')->insert($assignments);
            }

            DB::commit();
            return response()->json(['message' => 'Tạo lớp học và phân công thành công', 'data' => $class->load('teachers')], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi tạo lớp học', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $class = Classes::with([
            'cohort.course.subjects', 
            'teachers.teacher',
            'enrollments.student'
        ])->find($id);

        if (!$class) {
            return response()->json(['message' => 'Không tìm thấy lớp học'], 404);
        }
        return response()->json($class, 200);
    }

    public function update(Request $request, $id)
    {
        $class = Classes::find($id);
        if (!$class) {
            return response()->json(['message' => 'Không tìm thấy lớp học'], 404);
        }

        $request->validate([
            'cohort_id' => 'required|exists:cohorts,id',
            'name' => 'required|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'teacher_assignments' => 'nullable|array',
            'teacher_assignments.*.teacher_id' => 'required|exists:users,id',
            'teacher_assignments.*.subject_id' => 'required|exists:subjects,id'
        ]);

        DB::beginTransaction();
        try {
            $class->update($request->only('cohort_id', 'name', 'start_date', 'end_date'));

            if ($request->has('teacher_assignments')) {
                DB::table('class_teacher')->where('class_id', $class->id)->delete();
                
                $assignments = [];
                foreach ($request->teacher_assignments as $assignment) {
                    $assignments[] = [
                        'class_id' => $class->id,
                        'teacher_id' => $assignment['teacher_id'],
                        'subject_id' => $assignment['subject_id'],
                    ];
                }
                DB::table('class_teacher')->insert($assignments);
            }

            DB::commit();
            return response()->json(['message' => 'Cập nhật lớp học thành công', 'data' => $class->load('teachers')], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi cập nhật lớp học', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $class = Classes::find($id);
        if (!$class) {
            return response()->json(['message' => 'Không tìm thấy lớp học'], 404);
        }

        $class->delete();
        return response()->json(['message' => 'Xóa lớp học thành công'], 200);
    }

    public function enrollStudents(Request $request, $id)
    {
        $class = Classes::find($id);
        if (!$class) {
            return response()->json(['message' => 'Không tìm thấy lớp học'], 404);
        }

        $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,user_id',
        ]);

        DB::beginTransaction();
        try {
            $oldStudentIds = ClassEnrollment::where('class_id', $class->id)->pluck('student_id')->toArray();
            $newStudentIds = array_unique($request->input('student_ids'));

            $addedIds = array_diff($newStudentIds, $oldStudentIds);
            $removedIds = array_diff($oldStudentIds, $newStudentIds);
            
            ClassEnrollment::where('class_id', $class->id)->delete();

            $enrollments = [];
            foreach ($newStudentIds as $studentId) { 
                $enrollments[] = [
                    'class_id' => $class->id,
                    'student_id' => $studentId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            ClassEnrollment::insert($enrollments);

            DB::commit();
            
            $addedUsers = User::whereIn('id', $addedIds)->get();
            foreach ($addedUsers as $user) {
                Mail::to($user->email)->send(new ClassEnrollmentMail($class, 'added'));
            }

            $removedUsers = User::whereIn('id', $removedIds)->get();
            foreach ($removedUsers as $user) {
                Mail::to($user->email)->send(new ClassEnrollmentMail($class, 'removed'));
            }
            
            return response()->json(['message' => 'Đồng bộ danh sách sinh viên vào lớp thành công'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi khi đồng bộ sinh viên', 'error' => $e->getMessage()], 500);
        }
    }
}