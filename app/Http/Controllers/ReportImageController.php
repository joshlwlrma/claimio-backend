<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\ReportImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * ReportImageController
 *
 * Serves report images via an authenticated, access-controlled endpoint.
 * Replaces the previous approach of exposing raw storage URLs in API responses.
 *
 * Access rules for sensitive reports:
 *   - Admin          → always allowed
 *   - Report owner   → always allowed
 *   - Other users    → allowed only if they have a pending or approved claim
 *                      on this specific report
 *   - Everyone else  → 403 Forbidden
 *
 * Non-sensitive reports are served to any authenticated user.
 */
class ReportImageController extends Controller
{
    public function show(Request $request, Report $report, ReportImage $image): mixed
    {
        // Ensure the image actually belongs to the requested report
        if ($image->report_id !== $report->id) {
            return response()->json(['message' => 'Image not found.'], 404);
        }

        $user = $request->user();

        // Non-sensitive: serve to any authenticated user (route already requires auth:sanctum)
        if (!$report->is_sensitive) {
            return $this->serveImage($image);
        }

        // Sensitive report — enforce stricter access control
        $isAdmin = $user->role === 'admin';
        $isOwner = $user->id === $report->user_id;

        if ($isAdmin || $isOwner) {
            return $this->serveImage($image);
        }

        // Check for a pending or approved claim by this user on this report
        $hasClaim = $report->claims()
            ->where('user_id', $user->id)
            ->whereIn('claim_status', ['pending', 'approved'])
            ->exists();

        if ($hasClaim) {
            return $this->serveImage($image);
        }

        return response()->json([
            'message' => 'Unauthorized to view this image.',
        ], 403);
    }

    /**
     * Stream the image file from the public disk.
     */
    private function serveImage(ReportImage $image): mixed
    {
        if (!Storage::disk('public')->exists($image->image_path)) {
            return response()->json(['message' => 'Image file not found.'], 404);
        }

        return Storage::disk('public')->response($image->image_path);
    }
}
