<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $primaryKey = 'user_id';
    public $incrementing = false;
    public $timestamps = false; 
    protected $fillable = ['user_id', 'student_code', 'name'];

    public function user() { return $this->belongsTo(User::class, 'user_id'); }
    public function enrollments() { return $this->hasMany(ClassEnrollment::class, 'student_id', 'user_id'); }
    public function attempts() { return $this->hasMany(ExamAttempt::class, 'student_id', 'user_id'); }
}