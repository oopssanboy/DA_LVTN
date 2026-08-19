<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TestCase extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_id', 'input_data', 'expected_output', 'is_hidden'
    ];

    public function question()
    {
        return $this->belongsTo(Question::class);
    }
}