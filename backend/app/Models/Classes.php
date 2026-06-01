<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Classes extends Model
{
    protected $table = 'classes';
    protected $fillable = ['course_id', 'name', 'start_date', 'end_date'];

    public function course() { return $this->belongsTo(Course::class, 'course_id'); }
    public function enrollments() { return $this->hasMany(ClassEnrollment::class, 'class_id'); }
    public function exams() { return $this->hasMany(Exam::class, 'class_id'); }
}