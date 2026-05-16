<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\QuestionController;
use App\Http\Controllers\Api\ExamController;
use App\Http\Controllers\Api\ClassController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\Student\ExamAttemptController;
use App\Http\Controllers\Api\Proctor\ProctorController;
use App\Http\Controllers\Api\Teacher\StatisticsController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Classes (chỉ cần đọc)
    Route::get('/classes', [ClassController::class, 'index']);
    Route::get('/classes/{class}', [ClassController::class, 'show']);

    // Certificates
    Route::get('/my-certificates', [CertificateController::class, 'getUserCertificates']);
    Route::post('/certificates/issue', [CertificateController::class, 'issue'])->middleware('role:teacher,admin');

    // Role teacher/admin
    Route::middleware('role:teacher,admin')->group(function () {
        Route::apiResource('questions', QuestionController::class);
        Route::apiResource('exams', ExamController::class);
        Route::post('exams/{exam}/generate', [ExamController::class, 'generate']);
        Route::prefix('teacher')->group(function () {
            Route::get('/exams/{exam}/statistics/overview', [StatisticsController::class, 'overview']);
            Route::get('/exams/{exam}/statistics/distribution', [StatisticsController::class, 'scoreDistribution']);
            Route::get('/exams/{exam}/statistics/questions', [StatisticsController::class, 'questionStatistics']);
            Route::get('/exams/{exam}/statistics/skill', [StatisticsController::class, 'studentSkillAnalysis']);
            Route::get('/exams/{exam}/export-pdf', [StatisticsController::class, 'exportPdf']);
            Route::get('/exams/{exam}/export-excel', [StatisticsController::class, 'exportExcel']);
        });
    });

    // Student routes
    Route::middleware('role:student')->prefix('student')->group(function () {
        Route::get('/exams', [ExamAttemptController::class, 'availableExams']);
        Route::post('/exams/{exam}/start', [ExamAttemptController::class, 'start']);
        Route::post('/exams/attempts/{attempt}/save-answer', [ExamAttemptController::class, 'saveAnswer']);
        Route::post('/exams/attempts/{attempt}/log-violation', [ExamAttemptController::class, 'logViolation']);
        Route::post('/exams/attempts/{attempt}/submit', [ExamAttemptController::class, 'submit']);
        Route::get('/exams/attempts/{attempt}/result', [ExamAttemptController::class, 'result']);
        Route::get('/exams/attempts/{attempt}', [ExamAttemptController::class, 'getAttempt']);
    });

    // Proctor routes (teacher, admin, proctor)
    Route::middleware('role:teacher,admin,proctor')->prefix('proctor')->group(function () {
        Route::get('/active-exams', [ProctorController::class, 'activeExams']);
        Route::get('/exams/{exam}/attempts', [ProctorController::class, 'examAttempts']);
        Route::post('/attempts/{attempt}/force-submit', [ProctorController::class, 'forceSubmit']);
        Route::post('/attempts/{attempt}/warn', [ProctorController::class, 'sendWarning']);
    });
});