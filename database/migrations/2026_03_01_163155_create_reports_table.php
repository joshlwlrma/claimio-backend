<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    /**
     * Run the migrations.
     *
     * Reports represent lost or found items submitted by users.
     * - type:   "lost" or "found" — what happened to the item
     * - status: processing lifecycle (pending → matched → claimed → returned)
     * - Images are stored in the separate report_images table (1-to-many)
     */
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['lost', 'found']);
            $table->string('item_name');
            $table->string('category');
            $table->text('description');
            $table->string('location');
            $table->date('date_occurrence');
            $table->string('contact_number')->nullable();
            $table->enum('status', ['pending', 'matched', 'claimed', 'returned'])
                ->default('pending');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index('type');
            $table->index('category');
            $table->index('status');
            $table->index('date_occurrence');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
