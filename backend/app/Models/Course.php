<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $fillable = ['subject_id', 'teacher_id', 'title', 'description'];

    // public function subject() { return $this->belongsTo(Subject::class); }
    // public function teacher() { return $this->belongsTo(Teacher::class, 'teacher_id', 'user_id'); }
    // public function classes() { return $this->hasMany(Classes::class, 'course_id'); }
    public function cohorts()
    {
        return $this->hasMany(Cohort::class);
    }
    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'course_subject', 'course_id', 'subject_id')
                    ->using(CourseSubject::class); 
    }
}