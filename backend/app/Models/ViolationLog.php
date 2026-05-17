<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ViolationLog extends Model
{
    use HasFactory;

    // 👉 THÊM HOẶC SỬA MẢNG NÀY ĐẦY ĐỦ NHƯ SAU:
    protected $fillable = [
        'attempt_id',
        'type',
        'detail'
    ];

    // Khai báo mối quan hệ (nếu có)
    public function attempt()
    {
        return $this->belongsTo(ExamAttempt::class, 'attempt_id');
    }
}