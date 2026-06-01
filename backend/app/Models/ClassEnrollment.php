<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ClassEnrollment extends Model
{
    protected $fillable = ['class_id', 'student_id'];

    public function classes() { return $this->belongsTo(Classes::class, 'class_id'); }
    public function student() { return $this->belongsTo(Student::class, 'student_id', 'user_id'); }
}