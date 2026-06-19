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
        return $this->belongsTo(Proctor::class, 'proctor_id', 'user_id');
    }
}