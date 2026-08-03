<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected $fillable = ['exam_id', 'proctor_id', 'teacher_id', 'title', 'content', 'resolution', 'status', 'sent_at', 'resolved_at'];
    
    public function exam() { return $this->belongsTo(Exam::class, 'exam_id'); }
    public function proctor() { return $this->belongsTo(User::class, 'proctor_id'); }
    public function teacher() { return $this->belongsTo(User::class, 'teacher_id'); }
}