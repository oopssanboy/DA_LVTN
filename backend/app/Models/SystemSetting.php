<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasFactory;

    // THÊM DÒNG NÀY VÀO ĐỂ MỞ KHÓA TÍNH NĂNG LƯU DỮ LIỆU
    protected $guarded = []; 
}