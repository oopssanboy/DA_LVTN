<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('exam_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->unsignedBigInteger('student_id');
            $table->enum('status', ['in_progress', 'submitted', 'suspended'])->default('in_progress');
            $table->double('total_score')->nullable();
            $table->boolean('is_passed')->nullable();
            $table->integer('violation_count')->default(0);
            $table->dateTime('started_at');
            $table->dateTime('ended_at')->nullable();
            $table->timestamps();

            $table->foreign('student_id')->references('user_id')->on('students')->onDelete('cascade');
        });
    }
    public function down(): void { Schema::dropIfExists('exam_attempts'); }
};