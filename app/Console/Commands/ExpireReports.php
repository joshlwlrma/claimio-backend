<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Report;
use App\Models\ActivityLog;

class ExpireReports extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reports:expire';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Find all expired reports and mark their status as expired';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $expiredReports = Report::where('expires_at', '<=', now())
            ->whereNotIn('status', ['expired', 'returned', 'claimed'])
            ->whereNull('archived_at')
            ->get();

        $count = $expiredReports->count();

        if ($count === 0) {
            $this->info("No reports to expire.");
            return;
        }

        foreach ($expiredReports as $report) {
            $report->status = 'expired';
            $report->save();

            $days = $report->type === 'lost' ? 90 : 30;
            $appMsg = "Your report for '{$report->item_name}' has expired after {$days} days and has been archived.";
            \App\Services\NotificationService::notify($report->user_id, 'report_expired', $appMsg);

            ActivityLog::create([
                'user_id' => null,
                'action_type' => 'report_expired',
                'description' => "Report #{$report->id} '{$report->item_name}' auto-expired",
            ]);
        }

        ActivityLog::create([
            'user_id' => null,
            'action_type' => 'reports_auto_expired',
            'description' => "{$count} reports auto-expired today",
        ]);

        $this->info("Successfully expired {$count} reports.");
    }
}
