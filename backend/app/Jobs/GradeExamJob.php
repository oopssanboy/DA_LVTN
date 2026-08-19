<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\ExamAttempt;
use App\Http\Controllers\Api\Student\ExamAttemptController;

class GradeExamJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $attemptId;

    public function __construct($attemptId)
    {
        $this->attemptId = $attemptId;
        $this->onQueue('grading'); 
    }

    public function handle()
    {
        $attempt = ExamAttempt::find($this->attemptId);
        
        if ($attempt && $attempt->status === 'wait') {
            $controller = app(ExamAttemptController::class);
            $controller->autoSubmitExam($attempt);
        }
    }
}