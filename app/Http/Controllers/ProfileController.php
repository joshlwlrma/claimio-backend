<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Resources\FullReportResource;

/**
 * ProfileController
 *
 * Handles fetching the authenticated user's own reports and claims.
 * Used by the frontend Profile page.
 */
class ProfileController extends Controller
{
    /**
     * Get the authenticated user's own reports.
     * Includes all fields (using FullReportResource since user is owner).
     * Paginated.
     */
    public function reports(Request $request): JsonResponse
    {
        $reports = $request->user()
            ->reports()
            ->with(['images', 'user:id,name,email', 'claims.user:id,name,email'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => FullReportResource::collection($reports->items()),
            'meta' => [
                'current_page' => $reports->currentPage(),
                'last_page' => $reports->lastPage(),
                'per_page' => $reports->perPage(),
                'total' => $reports->total(),
            ],
        ]);
    }

    /**
     * Get the authenticated user's own claims.
     * Includes the related report information.
     */
    public function claims(Request $request): JsonResponse
    {
        $claims = $request->user()
            ->claims()
            ->with('report.images')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $claims,
        ]);
    }
}
