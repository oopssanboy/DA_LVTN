<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FillBlankAnswer extends Model
{
    protected $fillable = ['question_id', 'accepted_text'];

    public function question()
    {
        return $this->belongsTo(Question::class);
    }
}