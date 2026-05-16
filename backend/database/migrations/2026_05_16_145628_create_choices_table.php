<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('choices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->onDelete('cascade');
            $table->enum('choice_key', ['A', 'B', 'C', 'D']);
            $table->text('choice_text');
            $table->timestamps();

            $table->unique(['question_id', 'choice_key']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('choices');
    }
};