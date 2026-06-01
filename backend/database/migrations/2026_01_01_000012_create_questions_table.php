<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('teacher_id')->nullable();
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignId('topic_id')->constrained('topics')->onDelete('cascade');
            $table->enum('type', ['single', 'multiple', 'fill_blank']);
            $table->enum('difficulty', ['easy', 'medium', 'hard']);
            $table->text('content');
            $table->double('score')->default(1.0);
            $table->timestamps();

            $table->foreign('teacher_id')->references('user_id')->on('teachers')->onDelete('set null');
        });
    }
    public function down(): void { Schema::dropIfExists('questions'); }
};