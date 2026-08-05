<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PostExamController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\SubjectController;
use App\Http\Controllers\Api\Admin\CourseController;
use App\Http\Controllers\Api\Admin\ClassController;
use App\Http\Controllers\Api\Admin\CohortController;
use App\Http\Controllers\Api\Admin\TopicController;
use App\Http\Controllers\Api\Admin\ExpulsionController;
use App\Http\Controllers\Api\Admin\ViolationActionController;
use App\Http\Controllers\Api\Teacher\QuestionController;
use App\Http\Controllers\Api\Teacher\ExamController;
use App\Http\Controllers\Api\Teacher\TeacherDashboardController;
use App\Http\Controllers\Api\Teacher\StatisticsController;
use App\Http\Controllers\Api\Proctor\ProctorController;
use App\Http\Controllers\Api\Student\ExamAttemptController; 
use App\Http\Controllers\Api\Student\ProgressController; 





Route::prefix('v1/auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'sendResetLinkEmail']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::get('/public/courses', [PublicController::class, 'getCourses']);
    Route::get('/public/teachers', [PublicController::class, 'getTeachers']);
});



Route::middleware('auth:sanctum')->prefix('v1')->group(function () {

    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::put('/password', [AuthController::class, 'changePassword']);
        Route::get('/notifications', [NotificationController::class, 'myNotifications']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    });

    Route::middleware('role:admin')->prefix('admin')->group(function () {

        Route::get('dashboard-stats', [DashboardController::class, 'getStats']);
        Route::apiResource('users', UserController::class);
        Route::patch('/users/{id}/status', [UserController::class, 'toggleStatus']);

        Route::apiResource('topics', TopicController::class);

        Route::apiResource('subjects', SubjectController::class);
        Route::apiResource('courses', CourseController::class);
        Route::apiResource('cohorts', CohortController::class);
        Route::apiResource('classes', ClassController::class);
        Route::post('classes/{id}/enroll', [ClassController::class, 'enrollStudents']);
        Route::post('questions/import', [QuestionController::class, 'import']);
        Route::get('questions/export', [QuestionController::class, 'export']);
        Route::get('/questions/stats', [QuestionController::class, 'getStats']);
        Route::apiResource('questions', QuestionController::class);

        Route::apiResource('exams', ExamController::class);
        Route::post('exams/{id}/generate', [ExamController::class, 'generateExam']);

        Route::patch('exams/{id}/status', [ExamController::class, 'toggleStatus']);
        Route::get('expulsions', [ExpulsionController::class, 'index']);
        Route::put('expulsions/{id}/resolve', [ExpulsionController::class, 'resolve']);
        Route::get('violation-actions', [ViolationActionController::class, 'index']);
        Route::patch('violation-actions/{id}/resolve', [ViolationActionController::class, 'resolve']);
        Route::apiResource('notifications', NotificationController::class);
    });


    Route::middleware('role:admin,teacher')->prefix('teacher')->group(function () {
 
        

        Route::apiResource('exams', ExamController::class);
        Route::post('exams/{id}/generate', [ExamController::class, 'generateExam']);
        Route::post('questions/import', [QuestionController::class, 'import']);
        Route::get('questions/export', [QuestionController::class, 'export']);
        Route::get('/questions/stats', [QuestionController::class, 'getStats']);
        Route::apiResource('questions', QuestionController::class);

        Route::get('topics', [TopicController::class, 'index']);

        Route::patch('exams/{id}/status', [ExamController::class, 'toggleStatus']);
        Route::get('classes', [ClassController::class, 'index']);
        Route::get('subjects', [SubjectController::class, 'index']);
        Route::get('classes', [ClassController::class, 'index']);
        Route::get('classes/{id}', [ClassController::class, 'show']);
        Route::post('classes/{id}/enroll', [ClassController::class, 'enrollStudents']);
        Route::get('students', [UserController::class, 'index']);
        Route::get('users', [UserController::class, 'index']);
        Route::get('courses', [CourseController::class, 'index']);

        Route::get('post-exams', [PostExamController::class, 'getTeacherPostExams']);
        Route::get('reports/{id}/details', [PostExamController::class, 'getReportDetails']);
        Route::patch('reports/{id}/resolve', [PostExamController::class, 'resolveReport']);
        Route::post('attempts/{attemptId}/resolve-violation', [PostExamController::class, 'resolveIndividualViolation']);
        Route::get('complaints/{id}/details', [PostExamController::class, 'getComplaintDetails']);
        Route::patch('complaints/{id}/resolve', [PostExamController::class, 'resolveComplaint']);


        Route::get('dashboard-stats', [TeacherDashboardController::class, 'getStats']);
        Route::get('statistics/{exam}/overview', [StatisticsController::class, 'overview']);
        Route::get('statistics/{exam}/score-distribution', [StatisticsController::class, 'scoreDistribution']);
        Route::get('statistics/{exam}/questions', [StatisticsController::class, 'questionStatistics']);
        Route::get('statistics/{exam}/export-pdf', [StatisticsController::class, 'exportPdf']);
        Route::get('statistics/{exam}/export-excel', [StatisticsController::class, 'exportExcel']);
        Route::apiResource('notifications', NotificationController::class);
    });


    Route::middleware('role:admin,proctor')->prefix('proctor')->group(function () {
        Route::get('active-exams', [ProctorController::class, 'getActiveExams']);
        Route::get('exams/{examId}/attempts', [ProctorController::class, 'getAttempts']);
        Route::post('attempts/{attemptId}/warn', [ProctorController::class, 'sendWarning']);
        Route::post('attempts/{attemptId}/force-submit', [ProctorController::class, 'forceSubmit']);
        Route::get('reports', [PostExamController::class, 'getProctorReports']);
        Route::post('reports', [PostExamController::class, 'storeReport']);
        Route::get('exams/{examId}/summary', [PostExamController::class, 'getExamSummaryForReport']);
    });


    Route::middleware('role:admin,student')->prefix('student')->group(function () {
        Route::get('exams/available', [ExamAttemptController::class, 'getAvailableExams']);
        Route::post('exams/{examId}/start', [ExamAttemptController::class, 'startExam']);
        Route::get('attempts/{attemptId}', [ExamAttemptController::class, 'getAttempt']);
        Route::patch('attempts/{attemptId}/answers', [ExamAttemptController::class, 'saveAnswer']);
        Route::post('attempts/{attemptId}/submit', [ExamAttemptController::class, 'submitExam']);
        Route::post('attempts/{attemptId}/violation', [ExamAttemptController::class, 'logViolation']);
        Route::get('attempts/{attemptId}/result', [ExamAttemptController::class, 'getResult']);
        Route::get('history', [ExamAttemptController::class, 'getHistory']);
        Route::get('enrolled-courses', [ProgressController::class, 'getEnrolledCourses']);
        Route::get('radar-stats', [ProgressController::class, 'getRadarStats']);
        Route::get('learning-path', [ProgressController::class, 'getLearningPath']);
        Route::get('complaints', [PostExamController::class, 'getStudentComplaints']);
        Route::post('complaints', [PostExamController::class, 'storeComplaint']);
    });
});