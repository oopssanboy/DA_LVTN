<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'exam_id', 'questions_snapshot', 'answers',
        'started_at', 'submitted_at', 'status', 'score',
        'is_passed', 'total_correct', 'total_questions', 'cheat_count',
    ];

    protected $casts = [
        'questions_snapshot' => 'array',
        'answers' => 'array',
        'started_at' => 'datetime',
        'submitted_at' => 'datetime',
        'is_passed' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function violations()            // MỚI
    {
        return $this->hasMany(ViolationLog::class);
    }
}