<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExpulsionRequest extends Model
{
    use HasFactory;
    protected $fillable = ['student_id', 'teacher_id', 'exam_id', 'reason', 'status', 'admin_note'];

    public function student() { return $this->belongsTo(Student::class); }
    public function teacher() { return $this->belongsTo(User::class, 'teacher_id'); }
    public function exam() { return $this->belongsTo(Exam::class); }
}