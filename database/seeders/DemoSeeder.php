<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Claim;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * DemoSeeder
 *
 * Populates the database with realistic demo data for testing
 * the admin dashboard. Creates fake students + reports + claims.
 *
 * Run with: php artisan db:seed --class=DemoSeeder
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // ── Create Demo Students ──────────────────────
        $students = [];
        $names = [
            'Juan Dela Cruz',
            'Maria Santos',
            'Carlo Reyes',
            'Angela Garcia',
            'Miguel Torres',
            'Sofia Mendoza',
            'Rafael Lim',
            'Isabella Cruz',
        ];

        foreach ($names as $i => $name) {
            $slug = strtolower(str_replace(' ', '', $name));
            $students[] = User::firstOrCreate(
            ['email' => "{$slug}@tip.edu.ph"],
            [
                'name' => $name,
                'role' => 'student',
                'google_id' => 'demo_' . ($i + 100),
            ]
            );
        }

        $this->command->info('✓ Created ' . count($students) . ' demo students');

        // ── Create Reports ────────────────────────────
        $reportData = [
            ['type' => 'lost', 'item_name' => 'MacBook Pro 14"', 'category' => 'Electronics', 'description' => 'Silver MacBook Pro M1, has a TIP sticker on the lid. Last used at the 3rd floor library near the window seats.', 'location' => 'Library, 3rd Floor', 'status' => 'pending'],
            ['type' => 'found', 'item_name' => 'Blue Hydroflask 32oz', 'category' => 'Personal Items', 'description' => 'Blue Hydroflask with anime stickers and a carabiner clip. Found on a bench outside the cafeteria.', 'location' => 'Cafeteria Entrance', 'status' => 'pending'],
            ['type' => 'lost', 'item_name' => 'TIP Student ID', 'category' => 'Documents', 'description' => 'TIP QC student ID for AY 2025-2026. Name on the ID is Juan Dela Cruz, BSIT program.', 'location' => 'Gymnasium', 'status' => 'pending'],
            ['type' => 'found', 'item_name' => 'Scientific Calculator', 'category' => 'School Supplies', 'description' => 'Casio fx-991ES PLUS, has initials "MG" scratched on the back. Found inside Room 401.', 'location' => 'Room 401, Building B', 'status' => 'matched'],
            ['type' => 'lost', 'item_name' => 'Black Umbrella', 'category' => 'Personal Items', 'description' => 'Automatic black umbrella with wooden handle. Left it near the guard post after the rain yesterday.', 'location' => 'Main Gate Guard Post', 'status' => 'pending'],
            ['type' => 'found', 'item_name' => 'Samsung Galaxy Buds', 'category' => 'Electronics', 'description' => 'White Samsung Galaxy Buds in charging case. Found on the desk in Computer Lab 2.', 'location' => 'Computer Lab 2', 'status' => 'claimed'],
            ['type' => 'lost', 'item_name' => 'Engineering Drawing Set', 'category' => 'School Supplies', 'description' => 'Complete Staedtler engineering drawing set in a black zippered case. Contains T-square, triangles, compass.', 'location' => 'Room 305, Drawing Lab', 'status' => 'pending'],
            ['type' => 'found', 'item_name' => 'House Keys with Keychain', 'category' => 'Personal Items', 'description' => '3 keys on a Doraemon keychain. Found hanging on the door handle of the mens restroom, 2nd floor.', 'location' => 'Restroom, 2nd Floor', 'status' => 'returned'],
            ['type' => 'lost', 'item_name' => 'Red Backpack (Jansport)', 'category' => 'Personal Items', 'description' => 'Red Jansport backpack with a small rip on the front pocket. Contains notebooks and a pencil case.', 'location' => 'Parking Area', 'status' => 'pending'],
            ['type' => 'found', 'item_name' => 'USB Flash Drive 64GB', 'category' => 'Electronics', 'description' => 'SanDisk Ultra 64GB USB 3.0, no label. Found plugged into a PC in the Computer Lab 1.', 'location' => 'Computer Lab 1', 'status' => 'pending'],
            ['type' => 'lost', 'item_name' => 'Prescription Glasses', 'category' => 'Personal Items', 'description' => 'Black-framed prescription glasses in a brown leather case. -2.50 / -3.00 prescription.', 'location' => 'Canteen', 'status' => 'matched'],
            ['type' => 'found', 'item_name' => 'TIP PE Uniform (Medium)', 'category' => 'Clothing', 'description' => 'TIP official PE shirt size Medium and black jogging pants. Found in a plastic bag near the gym entrance.', 'location' => 'Gymnasium Entrance', 'status' => 'pending'],
        ];

        $reports = [];
        foreach ($reportData as $i => $data) {
            $owner = $students[$i % count($students)];
            $reports[] = Report::create([
                'user_id' => $owner->id,
                'type' => $data['type'],
                'item_name' => $data['item_name'],
                'category' => $data['category'],
                'description' => $data['description'],
                'location' => $data['location'],
                'date_occurrence' => now()->subDays(rand(1, 30))->toDateString(),
                'contact_number' => '09' . rand(100000000, 999999999),
                'status' => $data['status'],
                'resolved_at' => $data['status'] === 'returned' ? now()->subDays(rand(1, 5)) : null,
            ]);

            ActivityLog::log($owner->id, 'report_submitted', "Submitted a {$data['type']} report: \"{$data['item_name']}\"");
        }

        $this->command->info('✓ Created ' . count($reports) . ' demo reports');

        // ── Create Claims ─────────────────────────────
        $claimProofs = [
            'It is my calculator, I can describe the scratched initials on the back — they are "MG" for Maria Garcia. I also have the original receipt from National Bookstore.',
            'Those are my Galaxy Buds. The serial number is RZ12-XXXX-4455. I can show the Samsung app pairing history.',
            'That is my ID. My student number is QC-2025-00412. I can verify my details in person at the registrar.',
            'Those keys are mine, the Doraemon keychain was a gift. I can describe the exact shape of each key.',
            'That\'s my prescription glasses. I can show my optometrist receipt with the exact prescription (-2.50 / -3.00).',
        ];

        $claimsCreated = 0;
        foreach ([3, 5, 2, 7, 10] as $j => $reportIdx) {
            if (!isset($reports[$reportIdx]))
                continue;
            $report = $reports[$reportIdx];

            // Pick a claimant different from the owner
            $claimant = $students[($reportIdx + 3) % count($students)];
            if ($claimant->id === $report->user_id) {
                $claimant = $students[($reportIdx + 5) % count($students)];
            }

            $status = match ($report->status) {
                    'claimed' => 'approved',
                    'returned' => 'approved',
                    default => 'pending',
                };

            Claim::firstOrCreate(
            ['report_id' => $report->id, 'user_id' => $claimant->id],
            [
                'proof_description' => $claimProofs[$j],
                'claim_status' => $status,
            ]
            );

            ActivityLog::log($claimant->id, 'claim_submitted', "Submitted a claim on report #{$report->id}: \"{$report->item_name}\"");
            $claimsCreated++;
        }

        $this->command->info("✓ Created {$claimsCreated} demo claims");
        $this->command->info('');
        $this->command->info('🎉 Demo data seeded! Log in and go to /admin to see everything.');
    }
}
