<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    protected $fillable = ['code', 'name'];

    // public function courses() { return $this->hasMany(Course::class); }
    // public function topics() { return $this->hasMany(Topic::class); }
    // public function questions()
    // {
    //     return $this->hasMany(Question::class);
    // }
    public function courses()
    {
        return $this->belongsToMany(Course::class, 'course_subject', 'subject_id', 'course_id')
                    ->using(CourseSubject::class); 
    }

    public function topics()
    {
        return $this->hasMany(Topic::class);
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }
}