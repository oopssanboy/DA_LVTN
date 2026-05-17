<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamAttempt extends Model
{
    use HasFactory;

    // Các trường này đã được sửa lại KHỚP HOÀN TOÀN với file migration
    protected $fillable = [
        'exam_id',
        'student_id',
        'started_at',
        'ended_at',
        'total_score',
        'is_passed',
        'status',
        'violation_count',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'is_passed' => 'boolean',
    ];

    // Khai báo rõ foreign_key là student_id trỏ tới bảng users
    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    // Khai báo rõ foreign_key cho ViolationLog (nếu bảng kia dùng attempt_id)
    public function violations()            
    {
        return $this->hasMany(ViolationLog::class, 'attempt_id');
    }
}