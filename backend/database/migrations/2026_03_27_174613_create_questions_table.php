<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->string('subject'); // Thuộc môn nào
            $table->text('content'); // Nội dung câu hỏi (chứa HTML từ trình soạn thảo)
            $table->string('option_a');
            $table->string('option_b');
            $table->string('option_c');
            $table->string('option_d');
            $table->char('correct_answer', 1); // Đáp án đúng: A, B, C, D
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('medium'); // Độ khó
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
