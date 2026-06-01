<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ExamAttempt extends Model
{
    protected $fillable = [
        'exam_id', 'student_id', 'status', 'total_score', 
        'is_passed', 'violation_count', 'started_at', 'ended_at'
    ];

    public function exam() { return $this->belongsTo(Exam::class); }
    public function student() { return $this->belongsTo(Student::class, 'student_id', 'user_id'); }
    public function answers() { return $this->hasMany(StudentAnswer::class, 'attempt_id'); }
    public function violationLogs() { return $this->hasMany(ViolationLog::class, 'attempt_id'); }
}