<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Topic extends Model
{
    protected $fillable = ['subject_id', 'name'];
    public function subject() { return $this->belongsTo(Subject::class); }
    public function questions() { return $this->hasMany(Question::class); }
}