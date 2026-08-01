<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class CourseSubject extends Pivot
{
    protected $table = 'course_subject';

    public $timestamps = false; 

    protected $fillable = [
        'course_id', 
        'subject_id'
    ];
}