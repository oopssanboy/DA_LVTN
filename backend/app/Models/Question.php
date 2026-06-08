<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    protected $fillable = ['teacher_id', 'subject_id', 'topic_id', 'type', 'difficulty', 'content', 'score'];

    public function teacher() { return $this->belongsTo(Teacher::class, 'teacher_id', 'user_id'); }
    public function subject() { return $this->belongsTo(Subject::class); }
    public function topic() { return $this->belongsTo(Topic::class); }
    public function choices() { return $this->hasMany(Choice::class); }
    public function fillBlankAnswers()  { return $this->hasMany(FillBlankAnswer::class);}
}