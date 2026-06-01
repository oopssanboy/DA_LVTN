<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->unsignedBigInteger('teacher_id')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->foreign('teacher_id')->references('user_id')->on('teachers')->onDelete('set null');
        });
    }
    public function down(): void { Schema::dropIfExists('courses'); }
};