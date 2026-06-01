<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Proctor extends Model
{
    protected $primaryKey = 'user_id';
    public $incrementing = false;
    public $timestamps = false;
    protected $fillable = ['user_id', 'proctor_code', 'name'];

    public function user() { return $this->belongsTo(User::class, 'user_id'); }
    public function exams() { return $this->hasMany(ExamProctor::class, 'proctor_id', 'user_id'); }
}