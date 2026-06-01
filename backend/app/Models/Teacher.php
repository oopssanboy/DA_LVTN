<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    protected $primaryKey = 'user_id';
    public $incrementing = false;
    public $timestamps = false;
    protected $fillable = ['user_id', 'teacher_code', 'name', 'department'];

    public function user() { return $this->belongsTo(User::class, 'user_id'); }
    public function courses() { return $this->hasMany(Course::class, 'teacher_id', 'user_id'); }
    public function questions() { return $this->hasMany(Question::class, 'teacher_id', 'user_id'); }
}