<?php

use App\Http\Controllers\Api\QuestionController;
use App\Http\Controllers\Api\ExamController;
use App\Http\Controllers\Api\Student\ExamAttemptController;
use App\Http\Controllers\Api\Proctor\ProctorController;
use App\Http\Controllers\Api\Teacher\StatisticsController;
use Illuminate\Support\Facades\Route;

// Các route yêu cầu xác thực
Route::middleware('auth:sanctum')->group(function () {

    // Route cho câu hỏi – chỉ teacher/admin mới được phép
    Route::middleware('role:teacher,admin')->group(function () {
        Route::apiResource('questions', QuestionController::class);
        Route::apiResource('exams', ExamController::class);
        Route::post('exams/{exam}/generate', [ExamController::class, 'generate']);
        Route::get('/exams/{exam}/statistics/overview', [StatisticsController::class, 'overview']);
        Route::get('/exams/{exam}/statistics/distribution', [StatisticsController::class, 'scoreDistribution']);
        Route::get('/exams/{exam}/statistics/questions', [StatisticsController::class, 'questionStatistics']);
        Route::get('/exams/{exam}/statistics/skill', [StatisticsController::class, 'studentSkillAnalysis']);
        Route::get('/exams/{exam}/export-pdf', [StatisticsController::class, 'exportPdf']);
        Route::get('/exams/{exam}/export-excel', [StatisticsController::class, 'exportExcel']);
    });
    Route::middleware(['auth:sanctum', 'role:student'])->prefix('student')->group(function () {
        // Danh sách kỳ thi có thể tham gia (dựa trên lớp học của học viên)
        Route::get('/exams', [ExamAttemptController::class, 'availableExams']);
        // Bắt đầu thi
        Route::post('/exams/{exam}/start', [ExamAttemptController::class, 'start']);
        // Auto-save câu trả lời
        Route::post('/exams/attempts/{attempt}/save-answer', [ExamAttemptController::class, 'saveAnswer']);
        // Ghi nhận vi phạm
        Route::post('/exams/attempts/{attempt}/log-violation', [ExamAttemptController::class, 'logViolation']);
        // Nộp bài
        Route::post('/exams/attempts/{attempt}/submit', [ExamAttemptController::class, 'submit']);
        // Xem kết quả chi tiết
        Route::get('/exams/attempts/{attempt}/result', [ExamAttemptController::class, 'result']);
    });
    Route::middleware(['auth:sanctum', 'role:proctor,admin,teacher'])->prefix('proctor')->group(function () {
        // Danh sách kỳ thi đang diễn ra (có thể giám sát)
        Route::get('/active-exams', [ProctorController::class, 'activeExams']);
        // Danh sách thí sinh của một kỳ thi (có filter)
        Route::get('/exams/{exam}/attempts', [ProctorController::class, 'examAttempts']);
        // Force submit một attempt
        Route::post('/attempts/{attempt}/force-submit', [ProctorController::class, 'forceSubmit']);
        // Gửi cảnh báo tới thí sinh (tùy chọn)
        Route::post('/attempts/{attempt}/warn', [ProctorController::class, 'sendWarning']);
    });
    // ... các route khác (exams, classes...) sẽ thêm sau
});