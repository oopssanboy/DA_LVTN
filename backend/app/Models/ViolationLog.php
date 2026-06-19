<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ViolationLog extends Model
{
    use HasFactory;

   
    protected $fillable = [
        'attempt_id',
        'type',
        'detail'
    ];


    public function attempt()
    {
        return $this->belongsTo(ExamAttempt::class, 'attempt_id');
    }
}