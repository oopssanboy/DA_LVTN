<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamMatrix extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id', 'topic', 'difficulty', 'quantity'
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }
}