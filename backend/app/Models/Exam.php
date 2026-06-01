<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    protected $fillable = [
        'class_id', 'subject_id', 'title', 'duration', 'total_questions',
        'password', 'passing_score', 'shuffle_questions', 'shuffle_options',
        'start_time', 'end_time', 'is_active'
    ];

    public function classes() { return $this->belongsTo(Classes::class, 'class_id'); }
    public function subject() { return $this->belongsTo(Subject::class); }
    public function matrices() { return $this->hasMany(ExamMatrix::class); }
    public function questions() { return $this->hasMany(ExamQuestion::class); }
    public function proctors() { return $this->hasMany(ExamProctor::class); }
    public function attempts() { return $this->hasMany(ExamAttempt::class); }
}