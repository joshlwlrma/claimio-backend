<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add decision_notes to claims table.
 *
 * Stores the mandatory justification text an admin must provide
 * when approving or rejecting a claim. Required for audit compliance.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('claims', function (Blueprint $table) {
            // Nullable so existing rows without a decision are not broken.
            // Application-level validation enforces this on new decisions.
            $table->text('decision_notes')->nullable()->after('claim_status');
        });
    }

    public function down(): void
    {
        Schema::table('claims', function (Blueprint $table) {
            $table->dropColumn('decision_notes');
        });
    }
};

