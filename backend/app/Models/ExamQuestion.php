<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class ExamQuestion extends Pivot
{
    protected $table = 'exam_questions';
    protected $fillable = ['exam_id', 'question_id', 'question_score', 'order'];
    public function question()
    {
        return $this->belongsTo(Question::class, 'question_id');
    }
}