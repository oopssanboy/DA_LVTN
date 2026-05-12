<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    use HasFactory;
    protected $fillable = [
        'subject', 'content', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'difficulty'
    ];
    
    public function exams() {
        return $this->belongsToMany(Exam::class, 'exam_question');
    }
}
