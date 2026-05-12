<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    use HasFactory;
    protected $fillable = [
        'title', 'subject', 'duration', 'total_questions', 'start_time', 'end_time', 'password', 'is_active'
    ];

    public function questions() {
        return $this->belongsToMany(Question::class, 'exam_question');
    }
}