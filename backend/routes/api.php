<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\StudentExamController;
use App\Http\Controllers\NotificationController; 
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SystemSettingController;


Route::middleware('throttle:20,1')->post('/login', [AuthController::class, 'login']);

Route::get('/notifications', [NotificationController::class, 'getActiveNotifications']); 

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/update-profile', [AuthController::class, 'updateProfile']);
    Route::prefix('admin')->group(function () {
        Route::apiResource('notifications', NotificationController::class);
        
        Route::get('/exams/{id}/active-attempts', [ExamController::class, 'getActiveAttempts']);
        Route::post('/exam-attempts/{id}/force-submit', [ExamController::class, 'forceSubmit']);

        Route::get('/dashboard/statistics', [DashboardController::class, 'getStatistics']);
        Route::get('/settings', [SystemSettingController::class, 'getSettings']);
        Route::post('/settings', [SystemSettingController::class, 'updateSettings']);
        
    });
  
    Route::post('/users/import', [UserController::class, 'import']);
    Route::apiResource('users', UserController::class); 

    Route::post('/questions/import', [QuestionController::class, 'import']);
    Route::apiResource('questions', QuestionController::class);

    Route::post('/exams/{id}/toggle-status', [ExamController::class, 'toggleStatus']);
    Route::post('/exams/{id}/generate-questions', [ExamController::class, 'generateQuestions']);
    Route::apiResource('exams', ExamController::class);

    Route::get('/student/exams/{id}/do', [StudentExamController::class, 'getExam']);
    Route::post('/student/exams/{id}/save-progress', [StudentExamController::class, 'saveProgress']);
    Route::get('/student/exams', [StudentExamController::class, 'getAvailableExams']);
    Route::post('/student/exams/{id}/check-password', [StudentExamController::class, 'checkPassword']);
    Route::get('/student/exams/history', [StudentExamController::class, 'getHistory']);

    Route::post('/exams/{id}/log-violation', [StudentExamController::class, 'logViolation']);
    Route::middleware('throttle:60,1')->post('/exams/{exam}/submit', [StudentExamController::class, 'submit']);
    Route::get('/exams/{exam}/statistics', [ExamController::class, 'statistics']);
    Route::get('/exams/{exam}/export', [ExamController::class, 'export']);
});