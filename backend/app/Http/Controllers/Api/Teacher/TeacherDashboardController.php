<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\ExamAttempt;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TeacherDashboardController extends Controller
{
    public function getStats()
    {
        $teacherId = auth()->id();


        $baseAttemptQuery = ExamAttempt::whereHas('exam.classes.teachers', function($q) use ($teacherId) {
            $q->where('users.id', $teacherId);
        });

  
        $totalAttempts = (clone $baseAttemptQuery)->count();

        $sixMonthsAgo = Carbon::now()->subMonths(5)->startOfMonth();
        $attemptsPerMonth = (clone $baseAttemptQuery)
            ->select(
                DB::raw('MONTH(created_at) as month'),
                DB::raw('COUNT(*) as count')
            )
            ->where('created_at', '>=', $sixMonthsAgo)
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        $revenueData = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $monthNum = $date->month;
            $revenueData[] = [
                'name' => 'Tháng ' . $monthNum,
                'value' => $attemptsPerMonth->has($monthNum) ? $attemptsPerMonth[$monthNum]->count : 0
            ];
        }

        
        $submittedAttempts = (clone $baseAttemptQuery)->where('status', 'submitted')->get();
        $totalSubmitted = $submittedAttempts->count();
        $passed = $submittedAttempts->where('is_passed', true)->count();
        $failed = $totalSubmitted - $passed;

        $passRateData = [];
        if ($totalSubmitted > 0) {
            $passRateData = [
                ['name' => 'Đậu', 'value' => round(($passed / $totalSubmitted) * 100)],
                ['name' => 'Rớt', 'value' => round(($failed / $totalSubmitted) * 100)]
            ];
        } else {
            $passRateData = [
                ['name' => 'Đậu', 'value' => 0],
                ['name' => 'Rớt', 'value' => 0]
            ];
        }

        return response()->json([
            'data' => [
                'totalAttempts' => $totalAttempts,
                'revenueData' => $revenueData,
                'passRateData' => $passRateData,
            ]
        ], 200);
    }
}