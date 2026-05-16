<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ViolationLog extends Model
{
    protected $fillable = [
        'exam_attempt_id',
        'type',
        'detail',
    ];

    public function attempt()
    {
        return $this->belongsTo(ExamAttempt::class, 'exam_attempt_id');
    }
}