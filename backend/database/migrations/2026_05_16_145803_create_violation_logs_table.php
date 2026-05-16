<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('violation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('exam_attempts')->onDelete('cascade');
            $table->string('type');
            $table->text('detail')->nullable();
            $table->timestamps();

            $table->index('attempt_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('violation_logs');
    }
};