<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cohort extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id', 
        'name', 
        'start_date', 
        'end_date'
    ];


    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function classes()
    {
        return $this->hasMany(Classes::class, 'cohort_id');
    }
}