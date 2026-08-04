<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ViolationAction extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_id', 'attempt_id', 'teacher_id', 'action', 
        'reason', 'status', 'approved_by', 'approved_at'
    ];

    public function report() { return $this->belongsTo(Report::class); }
    public function attempt() { return $this->belongsTo(ExamAttempt::class); }
    

    public function teacher() { return $this->belongsTo(User::class, 'teacher_id'); }

    public function approver() { return $this->belongsTo(User::class, 'approved_by'); }
}