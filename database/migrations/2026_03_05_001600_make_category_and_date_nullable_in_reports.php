<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->string('category')->nullable()->default('other')->change();
            $table->date('date_occurrence')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->string('category')->nullable(false)->default(null)->change();
            $table->date('date_occurrence')->nullable(false)->change();
        });
    }
};
