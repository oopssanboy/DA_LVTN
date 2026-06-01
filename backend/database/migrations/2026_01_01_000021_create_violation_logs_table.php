<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('violation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('exam_attempts')->onDelete('cascade');
            $table->string('type'); 
            $table->text('detail')->nullable();
            $table->timestamps(); 
        });
    }
    public function down(): void { Schema::dropIfExists('violation_logs'); }
};