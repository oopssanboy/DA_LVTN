<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('exam_matrices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->foreignId('topic_id')->constrained('topics')->onDelete('cascade');
            $table->enum('difficulty', ['easy', 'medium', 'hard']);
            $table->integer('quantity');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('exam_matrices'); }
};