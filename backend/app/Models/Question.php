<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by', 'subject', 'topic', 'content', 'type',
        'difficulty', 'correct_answer', 'score', 'explanation'
    ];

    protected $casts = [
        'score' => 'float',
    ];

    // Quan hệ: một câu hỏi có nhiều lựa chọn (chỉ dùng với single/multiple)
    public function choices()
    {
        return $this->hasMany(Choice::class);
    }

    // Quan hệ: người tạo (giảng viên)
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scope lọc theo chủ đề, độ khó, loại
    public function scopeOfTopic($query, $topic)
    {
        return $query->where('topic', $topic);
    }

    public function scopeOfDifficulty($query, $difficulty)
    {
        return $query->where('difficulty', $difficulty);
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }
}