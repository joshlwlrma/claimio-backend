<?php

namespace App\Console\Commands;

use App\Models\Report;
use App\Services\MatchingService;
use Illuminate\Console\Command;

class BackfillMatches extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'matches:backfill';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backfill potential matches for all existing reports';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting backfill of potential matches...');
        
        $reports = Report::all();
        $totalReports = $reports->count();
        $processed = 0;
        $skipped = 0;
        
        $this->info("Found {$totalReports} reports to process");
        
        foreach ($reports as $report) {
            // Check if matches already exist for this report
            $existingMatches = \App\Models\PotentialMatch::where('lost_report_id', $report->id)
                ->orWhere('found_report_id', $report->id)
                ->count();
                
            if ($existingMatches > 0) {
                $this->line("Skipping report #{$report->id} - {$existingMatches} matches already exist");
                $skipped++;
                continue;
            }
            
            // Find matches for this report
            $matchingService = new MatchingService();
            $matchingService->findMatches($report);
            
            // Count matches that were created for this report
            $matchCount = \App\Models\PotentialMatch::where('lost_report_id', $report->id)
                ->orWhere('found_report_id', $report->id)
                ->count();
            
            if ($matchCount > 0) {
                $this->info("Found {$matchCount} matches for report #{$report->id}");
            } else {
                $this->line("No matches found for report #{$report->id}");
            }
            
            $processed++;
            
            // Show progress every 10 reports
            if ($processed % 10 === 0) {
                $this->info("Processed {$processed}/{$totalReports} reports");
            }
        }
        
        $this->info("Backfill completed!");
        $this->info("Processed: {$processed} reports");
        $this->info("Skipped: {$skipped} reports (already had matches)");
        
        return Command::SUCCESS;
    }
}
