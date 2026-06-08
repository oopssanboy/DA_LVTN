<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\SubjectController;
use App\Http\Controllers\Api\Admin\CourseController;
use App\Http\Controllers\Api\Admin\ClassController;
use App\Http\Controllers\Api\Teacher\QuestionController;
use App\Http\Controllers\Api\Teacher\ExamController;
use App\Http\Controllers\Api\Proctor\ProctorController;


Route::prefix('v1/auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->prefix('v1')->group(function () {

    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::put('/password', [AuthController::class, 'changePassword']);
    });
    Route::prefix('admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::patch('/users/{id}/status', [UserController::class, 'toggleStatus']);

        Route::apiResource('subjects', SubjectController::class);

        Route::apiResource('courses', CourseController::class);

        Route::apiResource('classes', ClassController::class);
        Route::post('classes/{id}/enroll', [ClassController::class, 'enrollStudents']);

    });
    Route::prefix('teacher')->group(function () {
        Route::apiResource('questions', QuestionController::class);

        Route::apiResource('exams', ExamController::class);
        Route::post('exams/{id}/generate', [ExamController::class, 'generateExam']);
    });
    Route::prefix('proctor')->group(function () {
        Route::get('active-exams', [ProctorController::class, 'getActiveExams']);
        Route::get('exams/{examId}/attempts', [ProctorController::class, 'getAttempts']);
        Route::post('attempts/{attemptId}/warn', [ProctorController::class, 'sendWarning']);
        Route::post('attempts/{attemptId}/force-submit', [ProctorController::class, 'forceSubmit']);
    });
});