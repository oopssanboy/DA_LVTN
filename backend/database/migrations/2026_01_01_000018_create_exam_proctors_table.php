<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('exam_proctors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->unsignedBigInteger('proctor_id');
            $table->timestamps();

            $table->foreign('proctor_id')->references('user_id')->on('proctors')->onDelete('cascade');
        });
    }
    public function down(): void { Schema::dropIfExists('exam_proctors'); }
};