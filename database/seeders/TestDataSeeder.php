<?php

namespace Database\Seeders;

use App\Models\Claim;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * TestDataSeeder
 *
 * Populates the database with realistic test data for documentation purposes.
 * Demonstrates the full report/claim lifecycle including a sensitive lost-item
 * report and a pending ownership claim with no decision yet applied.
 *
 * Run with:
 *   php artisan db:seed --class=TestDataSeeder
 */
class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Users ──────────────────────────────────────────────────────────

        $student = User::create([
            'name'              => 'Maria Santos',
            'email'             => 'mrsantos@tip.edu.ph',
            'password'          => Hash::make('password'),
            'role'              => 'student',
            'email_verified_at' => now(),
        ]);

        $admin = User::create([
            'name'              => 'Admin OSA',
            'email'             => 'osaadmin@tip.edu.ph',
            'password'          => Hash::make('password'),
            'role'              => 'admin',
            'email_verified_at' => now(),
        ]);

        // ── 2. Reports ────────────────────────────────────────────────────────

        // Report 1 — Lost sensitive document, submitted by Maria Santos
        $report1 = Report::create([
            'user_id'         => $student->id,
            'type'            => 'lost',
            'item_name'       => 'National ID',
            'category'        => 'Documents',
            'description'     => 'Lost near the library',
            'location'        => 'Library',
            'date_occurrence' => now()->toDateString(),
            'status'          => 'pending',
            'is_sensitive'    => true,
        ]);

        // Report 2 — Found item, submitted by Admin OSA
        $report2 = Report::create([
            'user_id'         => $admin->id,
            'type'            => 'found',
            'item_name'       => 'Blue Hydroflask',
            'category'        => 'Drinkware',
            'description'     => 'Found at canteen table',
            'location'        => 'Canteen',
            'date_occurrence' => now()->toDateString(),
            'status'          => 'pending',
            'is_sensitive'    => false,
        ]);

        // ── 3. Claim ──────────────────────────────────────────────────────────

        // Maria Santos claims the Hydroflask found by Admin OSA.
        // decision_notes is intentionally left null to demonstrate the
        // missing-field vulnerability in the claim review workflow.
        $claim = Claim::create([
            'report_id'         => $report2->id,
            'user_id'           => $student->id,
            'proof_description' => 'This is my hydroflask, it has a dent on the bottom and my name written inside the cap',
            'claim_status'      => 'pending',
            'direction'         => 'owner_claiming_found',
            // decision_notes — left null intentionally
        ]);

        // ── 4. Summary output ─────────────────────────────────────────────────

        $this->command->info('');
        $this->command->info('✅ TestDataSeeder completed successfully.');
        $this->command->info('');
        $this->command->table(
            ['Entity', 'ID', 'Details'],
            [
                ['User (student)', $student->id, "{$student->name} <{$student->email}>"],
                ['User (admin)',   $admin->id,   "{$admin->name} <{$admin->email}>"],
                ['Report 1',      $report1->id,  "Lost · {$report1->item_name} · sensitive={$report1->is_sensitive}"],
                ['Report 2',      $report2->id,  "Found · {$report2->item_name} · sensitive={$report2->is_sensitive}"],
                ['Claim',         $claim->id,    "Report #{$report2->id} · claimant user #{$student->id} · status={$claim->claim_status}"],
            ]
        );
        $this->command->info('');
    }
}
