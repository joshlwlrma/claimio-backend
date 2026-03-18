<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('potential_matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lost_report_id')->constrained('reports')->onDelete('cascade');
            $table->foreignId('found_report_id')->constrained('reports')->onDelete('cascade');
            $table->decimal('similarity_score', 5, 4)->comment('Similarity score between 0.0000 and 1.0000');
            $table->enum('status', ['pending', 'confirmed', 'dismissed'])->default('pending');
            $table->timestamps();

            // Prevent duplicate matches
            $table->unique(['lost_report_id', 'found_report_id'], 'unique_match_pair');
            $table->index(['status', 'similarity_score']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('potential_matches');
    }
};
