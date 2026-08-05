<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Complaint extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'exam_id',
        'content',
        'evidence_url',
        'response',
        'proposed_score', 
        'admin_note',
        'status'
    ];

    public function studentUser() 
    { 
        return $this->belongsTo(User::class, 'student_id'); 
    }

    public function exam() 
    { 
        return $this->belongsTo(Exam::class, 'exam_id'); 
    }
}