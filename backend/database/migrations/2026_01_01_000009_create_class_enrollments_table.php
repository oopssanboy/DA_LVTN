<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('class_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            $table->unsignedBigInteger('student_id');
            $table->timestamps();
            
            $table->foreign('student_id')->references('user_id')->on('students')->onDelete('cascade');
        });
    }
    public function down(): void { Schema::dropIfExists('class_enrollments'); }
};