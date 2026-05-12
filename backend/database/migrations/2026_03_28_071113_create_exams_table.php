<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->string('title'); // Tên kỳ thi
            $table->string('subject'); // Môn thi
            $table->integer('duration'); // Thời gian làm bài (phút)
            $table->integer('total_questions'); // Số lượng câu hỏi cần lấy
            $table->dateTime('start_time')->nullable(); // Thời gian bắt đầu
            $table->dateTime('end_time')->nullable(); // Thời gian kết thúc
            $table->string('password')->nullable(); // Mật khẩu phòng thi (nếu có)
            $table->boolean('is_active')->default(false); // Trạng thái Đóng/Mở
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exams');
    }
};
