<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    protected $fillable = [
        'subject_id', 'teacher_id', 'title', 'duration', 'total_questions',
        'password', 'passing_score', 'shuffle_questions', 'shuffle_options',
        'start_time', 'end_time', 'is_active', 'show_answers', 'is_practice'
    ];
    protected $casts = [
        'is_active' => 'boolean',
        'show_answers' => 'boolean',
        'is_practice' => 'boolean',
        'shuffle_questions' => 'boolean',
        'shuffle_options' => 'boolean',
        'passing_score' => 'float',
        'total_questions' => 'integer',
        'duration' => 'integer',
    ];

    public function classes() { 
        return $this->belongsToMany(Classes::class, 'exam_classes', 'exam_id', 'class_id'); 
    }
    public function subject() { return $this->belongsTo(Subject::class); }
    public function teacher() { return $this->belongsTo(User::class, 'teacher_id'); }
    public function matrices() { return $this->hasMany(ExamMatrix::class); }
    public function questions() { return $this->hasMany(ExamQuestion::class); }
    public function proctors() { 
        return $this->belongsToMany(User::class, 'exam_proctors', 'exam_id', 'proctor_id'); 
    }
    public function attempts() { return $this->hasMany(ExamAttempt::class); }
}