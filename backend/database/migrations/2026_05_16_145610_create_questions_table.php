<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users');
            $table->string('subject');
            $table->string('topic');
            $table->text('content');
            $table->enum('type', ['single', 'multiple', 'fill_blank']);
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('medium');
            $table->text('correct_answer');
            $table->float('score')->default(1.0);
            $table->text('explanation')->nullable();
            $table->timestamps();

            $table->index(['subject', 'topic', 'difficulty']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('questions');
    }
};