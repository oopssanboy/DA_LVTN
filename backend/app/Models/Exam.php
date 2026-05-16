<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_id', 'title', 'subject', 'duration', 'total_questions',
        'start_time', 'end_time', 'password', 'is_active',
        'shuffle_questions', 'shuffle_options', 'passing_score'
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'is_active' => 'boolean',
        'shuffle_questions' => 'boolean',
        'shuffle_options' => 'boolean',
    ];

    // Quan hệ: kỳ thi thuộc về một lớp
    public function class()
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    // Ma trận sinh đề
    public function matrices()
    {
        return $this->hasMany(ExamMatrix::class);
    }

    // Danh sách câu hỏi đã được sinh cho kỳ thi (dùng chung cho tất cả học viên)
    public function questions()
    {
        return $this->belongsToMany(Question::class, 'exam_questions')
                    ->withPivot('order')
                    ->orderBy('pivot_order');
    }

    // Các lượt thi của học viên
    public function attempts()
    {
        return $this->hasMany(ExamAttempt::class);
    }
}