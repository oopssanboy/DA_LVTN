<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('exam_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->dateTime('started_at');
            $table->dateTime('ended_at')->nullable();
            $table->float('total_score')->nullable();
            $table->boolean('is_passed')->default(false);
            $table->enum('status', ['in_progress', 'submitted', 'suspended'])->default('in_progress');
            $table->integer('violation_count')->default(0);
            $table->timestamps();

            $table->index(['exam_id', 'student_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('exam_attempts');
    }
};