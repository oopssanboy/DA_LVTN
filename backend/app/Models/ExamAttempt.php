<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamAttempt extends Model
{
    use HasFactory;
    protected $fillable = ['user_id', 'exam_id', 'answers', 'started_at', 'submitted_at', 'status', 'score'];
    
    // Tự động ép kiểu chuỗi JSON trong CSDL thành Array trong PHP
    protected $casts = [
        'answers' => 'array',
        'started_at' => 'datetime',
    ];
    
    public function exam()
    {
        return $this->belongsTo(Exam::class, 'exam_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id'); 
        // Đảm bảo cột trong bảng exam_attempts của bạn tên là 'user_id'
    }
}
