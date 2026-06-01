<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $fillable = ['subject_id', 'teacher_id', 'title', 'description'];

    public function subject() { return $this->belongsTo(Subject::class); }
    public function teacher() { return $this->belongsTo(Teacher::class, 'teacher_id', 'user_id'); }
    public function classes() { return $this->hasMany(Classes::class, 'course_id'); }
}