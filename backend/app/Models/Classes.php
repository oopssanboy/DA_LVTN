<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Classes extends Model
{
    use HasFactory;

    protected $table = 'classes'; 

    protected $fillable = [
        'cohort_id', 
        'name', 
        'start_date', 
        'end_date'
    ];

    public function cohort()
    {
        return $this->belongsTo(Cohort::class, 'cohort_id');
    }

    public function teachers()
    {
        return $this->belongsToMany(User::class, 'class_teacher', 'class_id', 'teacher_id')
                    ->using(ClassTeacher::class); 
    }

    public function enrollments()
    {
        return $this->hasMany(ClassEnrollment::class, 'class_id');
    }

    public function students()
    {
        return $this->belongsToMany(User::class, 'class_enrollments', 'class_id', 'student_id');
    }

    public function exams()
    {
        return $this->belongsToMany(Exam::class, 'exam_classes', 'class_id', 'exam_id');
    }
}