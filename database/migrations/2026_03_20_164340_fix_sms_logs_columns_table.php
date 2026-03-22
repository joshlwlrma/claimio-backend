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
        Schema::table('sms_logs', function (Blueprint $table) {
            $table->string('recipient', 20)->after('user_id');
            $table->string('status', 10)->default('failed')->after('message');
            $table->timestamp('created_at')->nullable()->after('status');
            $table->dropColumn('sent_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sms_logs', function (Blueprint $table) {
            $table->dropColumn(['recipient', 'status', 'created_at']);
            $table->timestamp('sent_at')->nullable()->after('message');
        });
    }
};
