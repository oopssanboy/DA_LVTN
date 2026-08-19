<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamMatrix extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id', 'topic_id','question_type', 'difficulty', 'quantity', 'fixed_score'
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }
    public function topic()
    {
        return $this->belongsTo(Topic::class, 'topic_id');
    }
}