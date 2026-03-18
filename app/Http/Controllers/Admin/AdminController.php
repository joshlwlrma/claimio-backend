<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Claim;
use App\Models\User;
use App\Models\ActivityLog;
use App\Http\Resources\FullReportResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AdminController extends Controller
{
    /**
     * Get admin dashboard statistics
     */
    public function stats()
    {
        try {
            $stats = [
                'total_reports' => Report::count(),
                'lost_reports' => Report::where('type', 'lost')->count(),
                'found_reports' => Report::where('type', 'found')->count(),
                'pending_claims' => Claim::where('claim_status', 'pending')->count(),
                'approved_claims' => Claim::where('claim_status', 'approved')->count(),
                'rejected_claims' => Claim::where('claim_status', 'rejected')->count(),
                'total_users' => User::where('role', 'student')->count(),
                'resolved_reports' => Report::whereIn('status', ['claimed', 'returned'])->count(),
            ];

            // Recent activity (last 7 days)
            $recentActivity = ActivityLog::with('user')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($log) {
                    return [
                        'id' => $log->id,
                        'user' => $log->user->name,
                        'action' => $log->action,
                        'description' => $log->description,
                        'created_at' => $log->created_at->toISOString(),
                    ];
                });

            // Reports by status
            $reportsByStatus = Report::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray();

            // Reports by category
            $reportsByCategory = Report::select('category', DB::raw('count(*) as count'))
                ->whereNotNull('category')
                ->groupBy('category')
                ->orderBy('count', 'desc')
                ->pluck('count', 'category')
                ->toArray();

            return response()->json([
                'stats' => $stats,
                'recent_activity' => $recentActivity,
                'reports_by_status' => $reportsByStatus,
                'reports_by_category' => $reportsByCategory,
            ]);
        } catch (\Exception $e) {
            Log::error('Admin stats error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch statistics'], 500);
        }
    }

    /**
     * Get all reports for admin (paginated, full details)
     */
    public function reports(Request $request)
    {
        try {
            $query = Report::with(['user', 'images', 'claims.user'])
                ->orderBy('created_at', 'desc');

            // Filter by status if provided
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            // Filter by type if provided
            if ($request->has('type') && $request->type) {
                $query->where('type', $request->type);
            }

            // Filter by category if provided
            if ($request->has('category') && $request->category) {
                $query->where('category', $request->category);
            }

            // Search by item name or description
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('item_name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('location', 'like', "%{$search}%");
                });
            }

            // Date range filter
            if ($request->has('date_from') && $request->date_from) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->has('date_to') && $request->date_to) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            $reports = $query->paginate(15);

            return FullReportResource::collection($reports);
        } catch (\Exception $e) {
            Log::error('Admin reports error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch reports'], 500);
        }
    }

    /**
     * Update report status (admin only)
     */
    public function updateReportStatus(Request $request, Report $report)
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:pending,matched,claimed,returned',
                'notes' => 'nullable|string|max:500',
            ]);

            $oldStatus = $report->status;
            $newStatus = $validated['status'];

            // Validate status transitions
            if (!$this->isValidStatusTransition($oldStatus, $newStatus)) {
                return response()->json([
                    'message' => 'Invalid status transition from ' . $oldStatus . ' to ' . $newStatus
                ], 422);
            }

            // Update report status
            $report->status = $newStatus;
            
            // Set resolved_at if report is being marked as returned
            if ($newStatus === 'returned') {
                $report->resolved_at = now();
            }

            $report->save();

            // Log the status change
            $description = "Report #{$report->id} status changed from {$oldStatus} to {$newStatus}";
            if ($validated['notes']) {
                $description .= ". Notes: {$validated['notes']}";
            }

            ActivityLog::create([
                'user_id' => auth()->id(),
                'action' => 'report_status_updated',
                'description' => $description,
            ]);

            // If status is being changed to 'returned', auto-reject all pending claims
            if ($newStatus === 'returned') {
                Claim::where('report_id', $report->id)
                    ->where('claim_status', 'pending')
                    ->update(['claim_status' => 'rejected']);

                ActivityLog::create([
                    'user_id' => auth()->id(),
                    'action' => 'claims_auto_rejected',
                    'description' => "All pending claims for Report #{$report->id} auto-rejected due to status change to 'returned'",
                ]);
            }

            return response()->json([
                'message' => 'Report status updated successfully',
                'report' => new FullReportResource($report->load(['user', 'images', 'claims.user']))
            ]);
        } catch (\Exception $e) {
            Log::error('Admin update report status error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update report status'], 500);
        }
    }

    /**
     * Export reports to CSV
     */
    public function export(Request $request)
    {
        try {
            $query = Report::with(['user', 'claims']);

            // Period-based filtering
            if ($request->has('period') && $request->period) {
                $now = Carbon::now();
                switch ($request->period) {
                    case 'weekly':
                        $query->where('created_at', '>=', $now->subDays(7));
                        break;
                    case 'monthly':
                        $query->where('created_at', '>=', $now->subDays(30));
                        break;
                    case 'semestral':
                        $query->where('created_at', '>=', $now->subMonths(6));
                        break;
                    case 'custom':
                        // Falls through to date_from/date_to below
                        break;
                }
            }

            // Apply same filters as reports() method
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }
            if ($request->has('type') && $request->type) {
                $query->where('type', $request->type);
            }
            if ($request->has('category') && $request->category) {
                $query->where('category', $request->category);
            }
            if ($request->has('date_from') && $request->date_from) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->has('date_to') && $request->date_to) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            $reports = $query->orderBy('created_at', 'desc')->get();

            $filename = 'claimio_reports_export_' . date('Y-m-d_H-i-s') . '.csv';

            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ];

            $callback = function () use ($reports) {
                $file = fopen('php://output', 'w');

                // CSV Header
                fputcsv($file, [
                    'ID',
                    'Type',
                    'Item Name',
                    'Category',
                    'Description',
                    'Location',
                    'Date Occurred',
                    'Contact Number',
                    'Status',
                    'Reported By',
                    'Reporter Email',
                    'Created At',
                    'Resolved At',
                    'Number of Claims',
                    'Approved Claims'
                ]);

                // CSV Data
                foreach ($reports as $report) {
                    fputcsv($file, [
                        $report->id,
                        $report->type,
                        $report->item_name,
                        $report->category ?? 'N/A',
                        $report->description ?? 'N/A',
                        $report->location ?? 'N/A',
                        $report->date_occurrence ? $report->date_occurrence->format('Y-m-d') : 'N/A',
                        $report->contact_number ?? 'N/A',
                        $report->status,
                        $report->user->name,
                        $report->user->email,
                        $report->created_at->format('Y-m-d H:i:s'),
                        $report->resolved_at ? $report->resolved_at->format('Y-m-d H:i:s') : 'N/A',
                        $report->claims->count(),
                        $report->claims->where('claim_status', 'approved')->count(),
                    ]);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            Log::error('Admin export error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to export reports'], 500);
        }
    }

    /**
     * Validate if status transition is allowed
     */
    private function isValidStatusTransition($from, $to)
    {
        $validTransitions = [
            'pending' => ['matched', 'claimed', 'returned'],
            'matched' => ['claimed', 'returned', 'pending'],
            'claimed' => ['returned', 'matched', 'pending'],
            'returned' => ['pending'], // Allow reopening returned items
        ];

        return in_array($to, $validTransitions[$from] ?? []);
    }
}
