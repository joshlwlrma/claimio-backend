<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\PotentialMatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * MatchController
 *
 * Admin-only controller for reviewing potential matches between
 * lost and found reports detected by MatchingService.
 */
class MatchController extends Controller
{
    /**
     * List all pending potential matches.
     */
    public function index(): JsonResponse
    {
        try {
            $matches = PotentialMatch::where('status', 'pending')
                ->with([
                    'lostReport:id,type,item_name,description,category,location,status,created_at,user_id',
                    'lostReport.user:id,name',
                    'foundReport:id,type,item_name,description,category,location,status,created_at,user_id',
                    'foundReport.user:id,name',
                ])
                ->orderBy('similarity_score', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $matches,
            ]);
        } catch (\Exception $e) {
            Log::error('MatchController index error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch matches'], 500);
        }
    }

    /**
     * Confirm a potential match.
     * Sets both reports to "matched" status and logs the action.
     */
    public function confirm(PotentialMatch $match): JsonResponse
    {
        try {
            DB::transaction(function () use ($match) {
                $match->update(['status' => 'confirmed']);

                // Update both reports to matched
                $match->lostReport->update(['status' => 'matched']);
                $match->foundReport->update(['status' => 'matched']);

                // Dismiss other pending matches involving these reports
                PotentialMatch::where('id', '!=', $match->id)
                    ->where('status', 'pending')
                    ->where(function ($q) use ($match) {
                        $q->where('lost_report_id', $match->lost_report_id)
                          ->orWhere('found_report_id', $match->found_report_id)
                          ->orWhere('lost_report_id', $match->found_report_id)
                          ->orWhere('found_report_id', $match->lost_report_id);
                    })
                    ->update(['status' => 'dismissed']);

                ActivityLog::create([
                    'user_id' => auth()->id(),
                    'action' => 'match_confirmed',
                    'description' => "Confirmed match between Lost Report #{$match->lost_report_id} and Found Report #{$match->found_report_id} (Score: {$match->similarity_score}%)",
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Match confirmed. Both reports have been marked as "matched".',
            ]);
        } catch (\Exception $e) {
            Log::error('MatchController confirm error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to confirm match'], 500);
        }
    }

    /**
     * Dismiss a potential match (false positive).
     */
    public function dismiss(PotentialMatch $match): JsonResponse
    {
        try {
            $match->update(['status' => 'dismissed']);

            ActivityLog::create([
                'user_id' => auth()->id(),
                'action' => 'match_dismissed',
                'description' => "Dismissed match between Lost Report #{$match->lost_report_id} and Found Report #{$match->found_report_id}",
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Match dismissed.',
            ]);
        } catch (\Exception $e) {
            Log::error('MatchController dismiss error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to dismiss match'], 500);
        }
    }
}
