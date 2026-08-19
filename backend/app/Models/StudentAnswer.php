<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
    'attempt_id', 'question_id', 'choice_id', 'answer_text', 
    'is_correct', 'score_earned', 'language', 'judge_status', 
    'execution_time', 'memory_usage', 'test_case_results'
];
    protected $casts = [
    'test_case_results' => 'array', 
];

    public function attempt()
    {
        return $this->belongsTo(ExamAttempt::class, 'attempt_id');
    }

    public function question()
    {
        return $this->belongsTo(Question::class);
    }
}