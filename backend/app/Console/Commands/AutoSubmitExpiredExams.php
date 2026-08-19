<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ExamAttempt;
use Carbon\Carbon;
use App\Http\Controllers\Api\Student\ExamAttemptController;

class AutoSubmitExpiredExams extends Command
{
    protected $signature = 'exams:auto-submit';

    protected $description = 'Tự động thu và chấm bài các kỳ thi đã quá giờ do học viên mất mạng hoặc mất điện';

    public function handle()
    {
        $attempts = ExamAttempt::with('exam')->where('status', 'in_progress')->get();
        
        $controller = app(ExamAttemptController::class);
        $count = 0;

        foreach ($attempts as $attempt) {
            if (!$attempt->exam) continue;

            $startedAt = Carbon::parse($attempt->started_at);
            
            $expiresAt = $startedAt->copy()->addMinutes($attempt->exam->duration)->addMinutes(2);

            if (Carbon::now()->greaterThanOrEqualTo($expiresAt)) {
                $this->info("Đang tự động thu bài cho Attempt ID: {$attempt->id} (Học viên: {$attempt->student_id})");
                
                try {
                 
                    $controller->autoSubmitExam($attempt);
                    $count++;
                } catch (\Exception $e) {
                    $this->error("Lỗi khi chấm Attempt ID {$attempt->id}: " . $e->getMessage());
                }
            }
        }

        $this->info("Quét hoàn tất! Đã tự động thu và chấm điểm {$count} bài thi mồ côi.");
        
        return Command::SUCCESS;
    }
}