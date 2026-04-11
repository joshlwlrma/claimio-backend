<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClaimRequest;
use App\Models\ActivityLog;
use App\Models\Claim;
use App\Models\Report;
use App\Services\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * ClaimController
 *
 * Handles claim submission and admin approval/rejection.
 * Claims are nested under reports: /api/reports/{report}/claims
 */
class ClaimController extends Controller
{
    /**
     * List all claims for a specific report.
     * Public — anyone can view claims on a report.
     */
    public function index(Report $report): JsonResponse
    {
        $claims = $report->claims()
            ->with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $claims,
        ]);
    }

    /**
     * Submit a claim on a report.
     *
     * Guards:
     * - Cannot claim your own report
     * - Cannot claim a report that is already claimed/returned
     * - Cannot submit duplicate claims on the same report
     */
    public function store(StoreClaimRequest $request, Report $report): JsonResponse
    {
        $user = $request->user();

        // Guard: cannot claim your own report
        if ($report->user_id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot submit a claim on your own report.',
            ], 403);
        }

        // Guard: cannot claim an archived report
        if ($report->is_archived) {
            return response()->json([
                'success' => false,
                'message' => 'This report has been archived and is no longer accepting claims.',
            ], 403);
        }

        // Guard: report must be in a claimable status
        if (!in_array($report->status, ['pending', 'matched'])) {
            return response()->json([
                'success' => false,
                'message' => 'This report is no longer accepting claims.',
            ], 422);
        }

        // Guard: no duplicate claims from the same user
        $existingClaim = Claim::where('report_id', $report->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingClaim) {
            return response()->json([
                'success' => false,
                'message' => 'You have already submitted a claim on this report.',
            ], 409);
        }

        $direction = $request->input('direction', 'owner_claiming_found');

        // New guard: validate direction against report type
        if ($direction === 'finder_reporting_found' && $report->type !== 'lost') {
            return response()->json([
                'success' => false,
                'message' => 'You can only report finding a "lost" item.',
            ], 403);
        }

        if ($direction === 'owner_claiming_found' && $report->type !== 'found') {
            return response()->json([
                'success' => false,
                'message' => 'You can only claim ownership of a "found" item.',
            ], 403);
        }

        $claim = DB::transaction(function () use ($request, $report, $user, $direction) {
            $claim = Claim::create([
                'report_id' => $report->id,
                'user_id' => $user->id,
                'proof_description' => $request->validated('proof_description') ?? 'Not applicable (Finder Report)',
                'direction' => $direction,
                'finder_message' => $request->validated('finder_message'),
                'claim_status' => 'pending',
            ]);

            ActivityLog::log(
                $user->id,
                'claim_submitted',
                "Submitted a claim on report #{$report->id}: \"{$report->item_name}\""
            );

            return $claim;
        });

        $claim->load('user:id,name,email');

        return response()->json([
            'success' => true,
            'message' => 'Claim submitted successfully.',
            'data' => $claim,
        ], 201);
    }

    /**
     * Admin: approve or reject a claim.
     *
     * When a claim is approved:
     * - The claim_status is set to "approved"
     * - The parent report status is updated to "claimed"
     * - All other pending claims on the same report are auto-rejected
     * - SMS notifications are sent to report owner and claimant
     *
     * When a claim is rejected:
     * - Only that specific claim_status is set to "rejected"
     * - SMS notification sent to claimant
     */
    public function updateStatus(Request $request, Claim $claim): JsonResponse
    {
        $user = $request->user();

        // Only admins can approve/reject
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can approve or reject claims.',
            ], 403);
        }

        $request->validate([
            'claim_status' => 'required|in:approved,rejected',
        ]);

        $newStatus = $request->input('claim_status');

        DB::transaction(function () use ($claim, $newStatus, $user) {
            $claim->update(['claim_status' => $newStatus]);

            if ($newStatus === 'approved') {
                if ($claim->direction === 'finder_reporting_found') {
                    // Update the parent report to "matched"
                    $claim->report->update(['status' => 'matched']);
                }
                else {
                    // Update the parent report to "claimed"
                    $claim->report->update(['status' => 'claimed']);
                }

                // Auto-reject all other pending claims on this report
                Claim::where('report_id', $claim->report_id)
                    ->where('id', '!=', $claim->id)
                    ->where('claim_status', 'pending')
                    ->update(['claim_status' => 'rejected']);
            }

            if ($newStatus === 'approved' && $claim->direction === 'finder_reporting_found') {
                ActivityLog::log(
                    $user->id,
                    'item_matched_via_finder',
                    "Report #{$claim->report->id} '{$claim->report->item_name}' matched — finder report approved by admin"
                );
            }
            else {
                ActivityLog::log(
                    $user->id,
                    "claim_{$newStatus}",
                    "Admin {$newStatus} claim #{$claim->id} on report #{$claim->report_id}"
                );
            }
        });

        // Send SMS and In-App notification
        try {
            $smsService = new SmsService();
            $report = $claim->report;

            if ($newStatus === 'approved' && $claim->direction === 'finder_reporting_found') {
                // Notify the report OWNER
                $owner = $report->user;
                if ($owner) {
                    $appMsg = "Good news! Someone found your lost item '{$report->item_name}'. Please visit the TIP OSA office to coordinate pickup.";
                    \App\Services\NotificationService::notify($owner->id, 'item_matched', $appMsg);

                    if ($owner->phone_number) {
                        $smsMsg = "Hi {$owner->name}! Good news — someone has found your lost item '{$report->item_name}'. Please visit the TIP OSA office to coordinate the handover. - Claimio";
                        $smsService->send($owner->phone_number, $smsMsg, $owner->id);
                    }
                }
            }
            else {
                // Keep existing behavior (notify CLAIMANT)
                $claimant = $claim->user;
                if ($claimant) {
                    if ($newStatus === 'approved') {
                        $appMsg = "Your claim for '{$report->item_name}' has been approved. Please visit the TIP OSA office to claim your item.";
                        \App\Services\NotificationService::notify($claimant->id, 'claim_approved', $appMsg);
                    }
                    else {
                        $appMsg = "Your claim for '{$report->item_name}' was not approved. Contact TIP OSA for more details.";
                        \App\Services\NotificationService::notify($claimant->id, 'claim_rejected', $appMsg);
                    }

                    if ($claimant->phone_number) {
                        $smsMsg = $newStatus === 'approved'
                            ? "Hi {$claimant->name}! Your claim for '{$report->item_name}' has been approved. Please visit the TIP OSA office to claim your item. - Claimio"
                            : "Hi {$claimant->name}! Your claim for '{$report->item_name}' was not approved. You may contact the TIP OSA office for more info. - Claimio";

                        $smsService->send($claimant->phone_number, $smsMsg, $claimant->id);
                    }
                }
            }
        }
        catch (\Exception $e) {
            // Notification failure should never block the claim action
            \Illuminate\Support\Facades\Log::error('Notification error: ' . $e->getMessage());
        }

        $claim->load(['user:id,name,email', 'report']);

        return response()->json([
            'success' => true,
            'message' => "Claim {$newStatus} successfully.",
            'data' => $claim,
        ]);
    }
}
