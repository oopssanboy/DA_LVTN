<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Subject;
use App\Models\ExamAttempt;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function getStats()
    {

        $totalStudents = User::where('role', 'student')->count();
        $totalTeachers = User::where('role', 'teacher')->count();
        $totalCourses = Subject::count(); 
        $totalAttempts = ExamAttempt::count();


        $sixMonthsAgo = Carbon::now()->subMonths(5)->startOfMonth();
        $attemptsPerMonth = ExamAttempt::select(
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


        $submittedAttempts = ExamAttempt::where('status', 'submitted')->get();
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

        $recentUsers = User::where('role', 'student')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function($user) {
       
                $displayName = $user->username; 
                $student = DB::table('students')->where('user_id', $user->id)->first();
                
                if ($student) {
                    $displayName = $student->name;
                }

                return [
                    'name' => $displayName,
                    'email' => $user->email, 
                    'date' => $user->created_at ? $user->created_at->format('d/m/Y') : 'N/A',
                    'status' => $user->is_active == 1 ? 'active' : 'locked'
                ];
            });

        return response()->json([
            'data' => [
                'stats' => [
                    'totalStudents' => $totalStudents,
                    'totalTeachers' => $totalTeachers,
                    'totalCourses' => $totalCourses,
                    'totalAttempts' => $totalAttempts,
                ],
                'revenueData' => $revenueData,
                'passRateData' => $passRateData,
                'recentUsers' => $recentUsers
            ]
        ], 200);
    }
}