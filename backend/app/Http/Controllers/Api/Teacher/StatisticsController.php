<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\StudentAnswer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ExamResultsExport;

class StatisticsController extends Controller
{
    public function __construct()
    {
        $this->middleware('role:teacher,admin');
    }

    public function overview(Exam $exam)
    {
        $attempts = $exam->attempts()->where('status', 'submitted')->get();
        $count = $attempts->count();
        if ($count == 0) {
            return response()->json([
                'total_students' => 0,
                'avg_score' => 0,
                'pass_rate' => 0,
                'max_score' => 0,
                'min_score' => 0,
            ]);
        }

        $scores = $attempts->pluck('total_score');
        $passed = $attempts->where('is_passed', true)->count();

        return response()->json([
            'total_students' => $count,
            'avg_score' => round($scores->avg(), 2),
            'pass_rate' => round(($passed / $count) * 100, 2),
            'max_score' => $scores->max(),
            'min_score' => $scores->min(),
        ]);
    }

   
    public function scoreDistribution(Exam $exam)
    {
        $attempts = $exam->attempts()->where('status', 'submitted')->get();
        $buckets = [];
        for ($i = 0; $i <= 9; $i++) {
            $buckets["$i-".($i+1)] = 0;
        }
        foreach ($attempts as $attempt) {
            $score = $attempt->total_score;
            $bucketIndex = floor($score);
            if ($bucketIndex >= 0 && $bucketIndex <= 9) {
                $key = "$bucketIndex-".($bucketIndex+1);
                $buckets[$key]++;
            }
        }
        return response()->json($buckets);
    }

   
    public function questionStatistics(Exam $exam)
    {
        $questions = $exam->questions()->with('choices')->get();
        $totalAttempts = $exam->attempts()->where('status', 'submitted')->count();
        if ($totalAttempts == 0) {
            return response()->json([]);
        }

        $stats = [];
        foreach ($questions as $question) {
            $answers = StudentAnswer::whereIn('attempt_id', $exam->attempts()->pluck('id'))
                ->where('question_id', $question->id)
                ->get();

            $correctCount = $answers->where('is_correct', true)->count();
            $wrongCount = $answers->where('is_correct', false)->count();
            $notAnswered = $totalAttempts - $answers->count();

            $choiceStats = [];
            if (in_array($question->type, ['single', 'multiple'])) {
                foreach ($question->choices as $choice) {
                    $choiceStats[$choice->choice_key] = 0;
                }
                foreach ($answers as $ans) {
                    $selectedKeys = explode(',', $ans->answer_text);
                    foreach ($selectedKeys as $key) {
                        if (isset($choiceStats[$key])) $choiceStats[$key]++;
                    }
                }
            }

            $stats[] = [
                'question_id' => $question->id,
                'content' => $question->content,
                'type' => $question->type,
                'correct_rate' => $totalAttempts > 0 ? round(($correctCount / $totalAttempts) * 100, 2) : 0,
                'correct_count' => $correctCount,
                'wrong_count' => $wrongCount,
                'not_answered' => $notAnswered,
                'choice_selection' => $choiceStats,
            ];
        }
        return response()->json($stats);
    }

   
    public function studentSkillAnalysis(Request $request, Exam $exam = null)
    {
        $studentId = $request->input('student_id');
        $query = StudentAnswer::with(['question', 'attempt'])
            ->whereHas('attempt', function ($q) use ($exam, $studentId) {
                if ($exam) $q->where('exam_id', $exam->id);
                if ($studentId) $q->where('student_id', $studentId);
                $q->where('status', 'submitted');
            });

        $answers = $query->get();
        $topics = [];
        foreach ($answers as $ans) {
            $topic = $ans->question->topic;
            if (!isset($topics[$topic])) {
                $topics[$topic] = ['total' => 0, 'correct' => 0];
            }
            $topics[$topic]['total']++;
            if ($ans->is_correct) $topics[$topic]['correct']++;
        }

        $result = [];
        foreach ($topics as $topic => $data) {
            $result[] = [
                'topic' => $topic,
                'score' => $data['total'] > 0 ? round(($data['correct'] / $data['total']) * 10, 2) : 0,
            ];
        }
        return response()->json($result);
    }

    public function exportPdf(Exam $exam)
    {
        $attempts = $exam->attempts()
            ->with('student')
            ->where('status', 'submitted')
            ->orderBy('total_score', 'desc')
            ->get();

        $overview = $this->overview($exam)->getData();
        $questionStats = $this->questionStatistics($exam)->getData();

        $pdf = Pdf::loadView('reports.exam-pdf', [
            'exam' => $exam,
            'attempts' => $attempts,
            'overview' => $overview,
            'questionStats' => $questionStats,
        ]);
        return $pdf->download("bao-cao-{$exam->id}.pdf");
    }

    public function exportExcel(Exam $exam)
    {
        return Excel::download(new ExamResultsExport($exam), "ket-qua-{$exam->id}.xlsx");
    }
}