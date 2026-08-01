<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class ClassTeacher extends Pivot
{
    protected $table = 'class_teacher';


    public $timestamps = false;

    protected $fillable = [
        'class_id', 
        'teacher_id'
    ];
}