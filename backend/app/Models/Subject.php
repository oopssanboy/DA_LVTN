<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    protected $fillable = ['code', 'name'];

    public function courses() { return $this->hasMany(Course::class); }
    public function topics() { return $this->hasMany(Topic::class); }
    public function questions()
    {
        return $this->hasMany(Question::class);
    }
}