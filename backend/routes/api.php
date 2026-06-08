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
use App\Http\Controllers\Api\Student\ExamAttemptController; // Đã thêm Controller của Sinh viên



// Nhóm API KHÔNG cần xác thực
Route::prefix('v1/auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// Nhóm API BẮT BUỘC ĐĂNG NHẬP (Sanctum)
Route::middleware('auth:sanctum')->prefix('v1')->group(function () {

    // --- 1. CHUNG CHO MỌI ROLE ĐÃ ĐĂNG NHẬP ---
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::put('/password', [AuthController::class, 'changePassword']);
    });

    // --- 2. MODULE ADMIN (CHỈ MÌNH ADMIN ĐƯỢC VÀO) ---
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        // Quản lý User
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::patch('/users/{id}/status', [UserController::class, 'toggleStatus']);

        // Quản lý Đào tạo
        Route::apiResource('subjects', SubjectController::class);
        Route::apiResource('courses', CourseController::class);
        Route::apiResource('classes', ClassController::class);
        Route::post('classes/{id}/enroll', [ClassController::class, 'enrollStudents']);
        Route::post('questions/import', [QuestionController::class, 'import']);
        Route::get('questions/export', [QuestionController::class, 'export']);
        Route::apiResource('questions', QuestionController::class);

        Route::apiResource('exams', ExamController::class);
        Route::post('exams/{id}/generate', [ExamController::class, 'generateExam']);
    });

    // --- 3. MODULE GIẢNG VIÊN (ADMIN VÀ GIẢNG VIÊN ĐƯỢC VÀO) ---
    Route::middleware('role:admin,teacher')->prefix('teacher')->group(function () {
        // Quản lý Câu hỏi
        Route::apiResource('questions', QuestionController::class);

        // Quản lý Kỳ thi
        Route::apiResource('exams', ExamController::class);
        Route::post('exams/{id}/generate', [ExamController::class, 'generateExam']);
        Route::post('questions/import', [QuestionController::class, 'import']);
        Route::get('questions/export', [QuestionController::class, 'export']);
        Route::apiResource('questions', QuestionController::class);
        
        Route::apiResource('exams', ExamController::class);
        Route::post('exams/{id}/generate', [ExamController::class, 'generateExam']);
    });

    // --- 4. MODULE GIÁM THỊ (ADMIN VÀ GIÁM THỊ ĐƯỢC VÀO) ---
    // (Lưu ý: Có thể thêm 'teacher' nếu bạn cho phép giảng viên tự gác thi lớp của họ)
    Route::middleware('role:admin,proctor')->prefix('proctor')->group(function () {
        Route::get('active-exams', [ProctorController::class, 'getActiveExams']);
        Route::get('exams/{examId}/attempts', [ProctorController::class, 'getAttempts']);
        Route::post('attempts/{attemptId}/warn', [ProctorController::class, 'sendWarning']);
        Route::post('attempts/{attemptId}/force-submit', [ProctorController::class, 'forceSubmit']);
    });

    // --- 5. MODULE SINH VIÊN (ADMIN VÀ SINH VIÊN ĐƯỢC VÀO) ---
    // (Admin có thể vào để test luồng làm bài nếu cần)
    Route::middleware('role:admin,student')->prefix('student')->group(function () {
        Route::get('exams/available', [ExamAttemptController::class, 'getAvailableExams']);
        Route::post('exams/{examId}/start', [ExamAttemptController::class, 'startExam']);
        Route::get('attempts/{attemptId}', [ExamAttemptController::class, 'getAttempt']);
        Route::patch('attempts/{attemptId}/answers', [ExamAttemptController::class, 'saveAnswer']);
        Route::post('attempts/{attemptId}/submit', [ExamAttemptController::class, 'submitExam']);
        Route::post('attempts/{attemptId}/violation', [ExamAttemptController::class, 'logViolation']);
        Route::get('attempts/{attemptId}/result', [ExamAttemptController::class, 'getResult']);
    });
});