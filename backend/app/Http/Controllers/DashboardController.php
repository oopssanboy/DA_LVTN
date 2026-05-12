<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Exam;
use App\Models\Question;
use App\Models\ExamAttempt;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function getStatistics()
    {
        // Thống kê các con số tổng quan
        $totalStudents = User::where('role', 0)->count();
        $totalExams = Exam::count();
        $totalQuestions = Question::count();
        $totalAttempts = ExamAttempt::count();

        // Lấy 5 lượt làm bài gần nhất để hiển thị bảng hoạt động
        $recentAttempts = ExamAttempt::with(['user:id,name,class', 'exam:id,title'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return response()->json([
            'total_students' => $totalStudents,
            'total_exams' => $totalExams,
            'total_questions' => $totalQuestions,
            'total_attempts' => $totalAttempts,
            'recent_attempts' => $recentAttempts
        ]);
    }
}