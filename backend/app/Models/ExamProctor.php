<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExamProctor extends Model
{
    protected $fillable = ['exam_id', 'proctor_id'];

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function proctor()
    {
        // Khóa ngoại proctor_id trỏ tới user_id của bảng proctors
        return $this->belongsTo(Proctor::class, 'proctor_id', 'user_id');
    }
}