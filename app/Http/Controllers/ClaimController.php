<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClaimRequest;
use App\Models\ActivityLog;
use App\Models\Claim;
use App\Models\Report;
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

        $claim = DB::transaction(function () use ($request, $report, $user) {
            $claim = Claim::create([
                'report_id' => $report->id,
                'user_id' => $user->id,
                'proof_description' => $request->validated('proof_description'),
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
                // Update the parent report to "claimed"
                $claim->report->update(['status' => 'claimed']);

                // Auto-reject all other pending claims on this report
                Claim::where('report_id', $claim->report_id)
                    ->where('id', '!=', $claim->id)
                    ->where('claim_status', 'pending')
                    ->update(['claim_status' => 'rejected']);
            }

            ActivityLog::log(
                $user->id,
                "claim_{$newStatus}",
                "Admin {$newStatus} claim #{$claim->id} on report #{$claim->report_id}"
            );
        });

        // Send SMS notifications (fire-and-forget, non-blocking)
        try {
            $smsService = new \App\Services\SmsService();
            $report = $claim->report;
            $claimant = $claim->user;
            $reportOwner = $report->user;

            // Notify the claimant
            if ($claimant) {
                $claimantMsg = $newStatus === 'approved'
                    ? "Claimio: Your claim on \"{$report->item_name}\" has been APPROVED! Please visit the office to collect your item."
                    : "Claimio: Your claim on \"{$report->item_name}\" has been rejected. If you believe this is an error, please contact the admin.";

                if ($claimant->phone_number) {
                    $smsService->send($claimant->phone_number, $claimantMsg, $claimant->email);
                }
            }

            // Notify the report owner (only on approval)
            if ($newStatus === 'approved' && $reportOwner) {
                $ownerMsg = "Claimio: A claim on your report \"{$report->item_name}\" has been approved. The item has been marked as claimed.";

                if ($reportOwner->phone_number) {
                    $smsService->send($reportOwner->phone_number, $ownerMsg, $reportOwner->email);
                }
            }
        } catch (\Exception $e) {
            // SMS failure should never block the claim action
            \Illuminate\Support\Facades\Log::error('SMS notification error: ' . $e->getMessage());
        }

        $claim->load(['user:id,name,email', 'report']);

        return response()->json([
            'success' => true,
            'message' => "Claim {$newStatus} successfully.",
            'data' => $claim,
        ]);
    }
}
