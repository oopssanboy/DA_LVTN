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
        Schema::create('exam_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->json('answers')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('submitted_at')->nullable();
            
            // 1. Thêm 'forced_submitted' vào enum của status
            $table->enum('status', ['in_progress', 'completed', 'forced_submitted'])->default('in_progress');
            
            $table->float('score')->nullable();
            
            // 2. Thêm cột cheat_count để đếm số lần vi phạm
            $table->integer('cheat_count')->default(0); 
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_attempts');
    }
};
