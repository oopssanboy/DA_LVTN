<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\StudentAnswer;
use App\Models\ClassEnrollment;
use App\Models\ExamAttempt;
use App\Models\Subject;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ProgressController extends Controller
{
    public function getEnrolledCourses()
    {
        $studentId = Auth::id();
        $enrollments = ClassEnrollment::with('classes.cohort.course')
            ->where('student_id', $studentId)
            ->get();
            
        $courses = collect();
        foreach($enrollments as $enrollment) {
            if ($enrollment->classes && $enrollment->classes->cohort && $enrollment->classes->cohort->course) {
                $course = $enrollment->classes->cohort->course;
                if(!$courses->contains('id', $course->id)) {
                    $courses->push(['id' => $course->id, 'title' => $course->title, 'code' => $course->code]);
                }
            }
        }
        return response()->json($courses->values());
    }

    public function getRadarStats(Request $request)
    {
        $studentId = Auth::id();
        $courseId = $request->input('course_id');

        $answersQuery = StudentAnswer::with(['question.subject', 'attempt'])
            ->whereHas('attempt', function($q) use ($studentId) {
                $q->where('student_id', $studentId)->where('status', 'submitted')
                  ->whereHas('exam', function($qExam) {
                      $qExam->where('is_practice', false);
                  });
            });

        if ($courseId) {
            $answersQuery->whereHas('question.subject.courses', function($q) use ($courseId) {
                $q->where('courses.id', $courseId);
            });
        }
        $answers = $answersQuery->get();

        $subjectsStat = [];
        foreach($answers as $ans) {
            if(!$ans->question || !$ans->question->subject) continue;
            $subName = $ans->question->subject->name;
            if(!isset($subjectsStat[$subName])) $subjectsStat[$subName] = ['total' => 0, 'correct' => 0];
            $subjectsStat[$subName]['total']++;
            if($ans->is_correct) $subjectsStat[$subName]['correct']++;
        }

        $radar = []; $subjectDetails = []; $topSkill = 'Chưa xác định'; $highestScore = -1;
        foreach($subjectsStat as $name => $stat) {
            $score = round(($stat['correct'] / $stat['total']) * 100, 2);
            $radar[] = ['subject' => $name, 'score' => $score, 'fullMark' => 100];
            $subjectDetails[] = ['name' => $name, 'score_percent' => $score];
            if ($score > $highestScore) { $highestScore = $score; $topSkill = $name; }
        }

        $history = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $avg = ExamAttempt::where('student_id', $studentId)
                ->where('status', 'submitted')
                ->whereHas('exam', function($qExam) { $qExam->where('is_practice', false); })
                ->whereBetween('created_at', [$date->copy()->startOfMonth(), $date->copy()->endOfMonth()])
                ->when($courseId, function($q) use ($courseId) {
                    $q->whereHas('exam.subject.courses', function($qC) use ($courseId) {
                        $qC->where('courses.id', $courseId);
                    });
                })->avg('total_score') ?? 0;

            $history[] = ['month' => 'Tháng ' . $date->month, 'avg_score' => round($avg, 1)];
        }

        return response()->json(['radar' => $radar, 'history_6_months' => $history, 'subject_details' => $subjectDetails, 'top_skill' => $topSkill]);
    }

    public function getLearningPath(Request $request)
    {
        $studentId = Auth::id();
        $courseId = $request->input('course_id');

        $enrollments = ClassEnrollment::with(['classes.cohort.course.subjects.topics'])->where('student_id', $studentId)->get();
        $courses = collect();
        foreach($enrollments as $enrollment) {
            if ($enrollment->classes && $enrollment->classes->cohort && $enrollment->classes->cohort->course) {
                $course = $enrollment->classes->cohort->course;
                if ($courseId && $course->id != $courseId) continue; 
                if(!$courses->contains('id', $course->id)) $courses->push($course);
            }
        }

        
        $passedSubjectIds = ExamAttempt::where('student_id', $studentId)
            ->where('status', 'submitted')->where('is_passed', 1)
            ->join('exams', 'exam_attempts.exam_id', '=', 'exams.id')
            ->where('exams.is_practice', false)
            ->pluck('exams.subject_id')->unique()->toArray();

        $tree = []; $totalSubjects = 0; $passedSubjects = 0;
        $currentCourseName = $courses->first() ? $courses->first()->title . ' (' . $courses->first()->code . ')' : 'Chưa tham gia khóa học';
        if (!$courseId && $courses->count() > 1) $currentCourseName = 'Tất cả khóa học';

        foreach($courses as $course) {
            $subjectsData = [];
            foreach($course->subjects as $subject) {
                $totalSubjects++;
                $isPassed = in_array($subject->id, $passedSubjectIds);
                if($isPassed) $passedSubjects++;
                $subjectsData[] = ['id' => $subject->id, 'code' => $subject->code, 'name' => $subject->name, 'is_passed' => $isPassed, 'topics' => $subject->topics->map(fn($t) => ['id' => $t->id, 'name' => $t->name])];
            }
            $tree[] = ['id' => $course->id, 'code' => $course->code, 'title' => $course->title, 'subjects' => $subjectsData];
        }

        $overallProgress = $totalSubjects > 0 ? round(($passedSubjects / $totalSubjects) * 100) : 0;

        $subjectScoresQuery = ExamAttempt::where('exam_attempts.student_id', $studentId)
            ->where('exam_attempts.status', 'submitted')
            ->join('exams', 'exam_attempts.exam_id', '=', 'exams.id')
            ->where('exams.is_practice', false)
            ->join('subjects', 'exams.subject_id', '=', 'subjects.id')
            ->when($courseId, function($q) use ($courseId) {
                $q->join('course_subject', 'subjects.id', '=', 'course_subject.subject_id')->where('course_subject.course_id', $courseId);
            });

        $subjectScores = $subjectScoresQuery->select('subjects.name', DB::raw('AVG(exam_attempts.total_score) as avg_score'))
            ->groupBy('subjects.id', 'subjects.name')->get()
            ->map(fn($item) => ['name' => $item->name, 'score' => round($item->avg_score, 1)]);

        $answersQuery = StudentAnswer::with(['question.topic', 'question.subject'])
            ->whereHas('attempt', function($q) use ($studentId) {
                $q->where('student_id', $studentId)->where('status', 'submitted')
                  ->whereHas('exam', function($q2) { $q2->where('is_practice', false); });
            })
            ->when($courseId, function($q) use ($courseId) {
                $q->whereHas('question.subject.courses', function($qC) use ($courseId) { $qC->where('courses.id', $courseId); });
            });

        $answers = $answersQuery->get();
        $topicsStat = [];
        foreach($answers as $ans) {
            if(!$ans->question || !$ans->question->topic) continue;
            $topicId = $ans->question->topic->id;
            if(!isset($topicsStat[$topicId])) {
                $topicsStat[$topicId] = ['topic_name' => $ans->question->topic->name, 'subject_name' => $ans->question->subject->name ?? 'Môn học', 'total' => 0, 'correct' => 0];
            }
            $topicsStat[$topicId]['total']++;
            if($ans->is_correct) $topicsStat[$topicId]['correct']++;
        }

        $weaknesses = [];
        foreach($topicsStat as $stat) {
            $rate = round(($stat['correct'] / $stat['total']) * 100);
            if ($rate <= 50 && $stat['total'] >= 1) {
                $weaknesses[] = ['topic' => $stat['topic_name'], 'subject' => $stat['subject_name'], 'correct_rate' => $rate, 'suggestion' => 'Ôn tập lại kiến thức cơ bản và cách vận dụng của ' . $stat['topic_name'] . '.'];
            }
        }

        return response()->json(['current_course' => $currentCourseName, 'overall_progress' => $overallProgress, 'tree' => $tree, 'subject_scores' => $subjectScores, 'weaknesses' => $weaknesses]);
    }
    public function getMyClasses()
    {
        $studentId = Auth::id(); 
        
        $enrollments = ClassEnrollment::with([
            'classes.cohort.course.subjects',
            'classes.teachers.teacher'
        ])
        ->where('student_id', $studentId)
        ->get();

        $subjects = Subject::pluck('name', 'id');
        
        $classes = $enrollments->map(function ($enrollment) use ($subjects) {
            $class = $enrollment->classes;
            if ($class && $class->teachers) {
                $class->teachers->transform(function ($teacher) use ($subjects) {
                    $teacher->setAttribute('subject_name', $subjects[$teacher->pivot->subject_id] ?? 'Chưa cập nhật');
                    return $teacher;
                });
            }
            return $class;
        })->filter();

        return response()->json(['data' => $classes->values()]);
    }
}