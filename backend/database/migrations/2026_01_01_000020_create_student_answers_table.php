<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('student_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('exam_attempts')->onDelete('cascade');
            $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');
            $table->foreignId('choice_id')->nullable()->constrained('choices')->onDelete('cascade');
            $table->text('answer_text')->nullable(); 
            $table->boolean('is_correct')->nullable();
            $table->double('score_earned')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('student_answers'); }
};