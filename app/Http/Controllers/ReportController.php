<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReportRequest;
use App\Http\Requests\UpdateReportRequest;
use App\Http\Resources\FullReportResource;
use App\Http\Resources\PublicReportResource;
use App\Models\ActivityLog;
use App\Models\Report;
use App\Models\ReportImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * ReportController
 *
 * Full CRUD for lost/found reports with image uploads.
 * All actions are protected by auth:sanctum middleware
 * (except index and show which are public for browsing).
 *
 * Security: public endpoints return PublicReportResource (no description/
 * location/contact_number/images). Only the owner or an admin receives
 * FullReportResource with all sensitive fields.
 */
class ReportController extends Controller
{
    /**
     * List reports with optional filters and pagination.
     *
     * Query params:
     *   ?type=lost|found
     *   ?category=Electronics
     *   ?status=pending|matched|claimed|returned
     *   ?q=search term  (searches item_name only — description is hidden)
     *   ?page=1
     *
     * Always returns PublicReportResource — no sensitive data leaked.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Report::with(['user:id,name,email', 'images']);

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        // Filter by category
        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Search by item name only (description is hidden from public)
        if ($request->filled('q')) {
            $search = $request->input('q');
            $query->where('item_name', 'LIKE', "%{$search}%");
        }

        // Order by newest first, paginate 15 per page
        $reports = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => PublicReportResource::collection($reports->items()),
            'meta' => [
                'current_page' => $reports->currentPage(),
                'last_page' => $reports->lastPage(),
                'per_page' => $reports->perPage(),
                'total' => $reports->total(),
            ],
        ]);
    }

    /**
     * Show a single report.
     *
     * - If the requester is the report owner or an admin → FullReportResource
     * - Otherwise → PublicReportResource (no description/location/images)
     */
    public function show(Request $request, Report $report): JsonResponse
    {
        $user = $request->user(); // null if unauthenticated

        $isOwner = $user && $user->id === $report->user_id;
        $isAdmin = $user && $user->role === 'admin';

        if ($isOwner || $isAdmin) {
            $report->load(['images', 'user:id,name,email', 'claims.user:id,name,email']);

            return response()->json([
                'success' => true,
                'data' => new FullReportResource($report),
            ]);
        }

        $report->load(['user:id,name', 'images']);

        return response()->json([
            'success' => true,
            'data' => new PublicReportResource($report),
        ]);
    }

    /**
     * Store a new lost/found report with optional image attachments.
     *
     * Flow:
     * 1. Validate input via StoreReportRequest
     * 2. Create the report record (status = pending)
     * 3. Loop through uploaded images, generate UUID filenames,
     *    store in storage/app/public/reports/
     * 4. Save each image path to report_images table
     * 5. Log the action to activity_logs
     * 6. Return FullReportResource (the user IS the owner)
     */
    public function store(StoreReportRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        // Wrap in a transaction so report + images + log are atomic
        $report = DB::transaction(function () use ($validated, $request, $user) {
            // 1. Create the report
            $report = Report::create([
                'user_id' => $user->id,
                'type' => $validated['type'],
                'item_name' => $validated['item_name'],
                'category' => $validated['category'] ?? 'other',
                'description' => $validated['description'],
                'location' => $validated['location'],
                'date_occurrence' => $validated['date_occurrence'] ?? now()->toDateString(),
                'contact_number' => $validated['contact_number'] ?? null,
                'status' => 'pending',
                'resolved_at' => null,
            ]);

            // 2. Handle image uploads
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();
                    $path = $image->storeAs('reports', $filename, 'public');

                    ReportImage::create([
                        'report_id' => $report->id,
                        'image_path' => $path,
                    ]);
                }
            }

            // 3. Log the activity
            ActivityLog::log(
                $user->id,
                'report_submitted',
                "Submitted a {$validated['type']} report: \"{$validated['item_name']}\" (Report #{$report->id})"
            );

            return $report;
        });

        $report->load(['images', 'user:id,name,email']);

        return response()->json([
            'success' => true,
            'message' => 'Report submitted successfully.',
            'data' => new FullReportResource($report),
        ], 201);
    }

    /**
     * Update an existing report. Owner-only (enforced by UpdateReportRequest).
     *
     * Supports partial updates — only send the fields you want to change.
     * New images are appended; to remove old images, pass remove_images[].
     * Returns FullReportResource (the user IS the owner).
     */
    public function update(UpdateReportRequest $request, Report $report): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        DB::transaction(function () use ($validated, $request, $report, $user) {
            // 1. Update report fields (only those sent)
            $report->update(collect($validated)->except(['images'])->toArray());

            // 2. Handle new image uploads (append to existing)
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();
                    $path = $image->storeAs('reports', $filename, 'public');

                    ReportImage::create([
                        'report_id' => $report->id,
                        'image_path' => $path,
                    ]);
                }
            }

            // 3. Handle image removal (optional: send remove_images[] with image IDs)
            if ($request->filled('remove_images')) {
                $imagesToRemove = ReportImage::where('report_id', $report->id)
                    ->whereIn('id', $request->input('remove_images'))
                    ->get();

                foreach ($imagesToRemove as $img) {
                    Storage::disk('public')->delete($img->image_path);
                    $img->delete();
                }
            }

            // 4. Log the activity
            ActivityLog::log(
                $user->id,
                'report_updated',
                "Updated report #{$report->id}: \"{$report->item_name}\""
            );
        });

        $report->load(['images', 'user:id,name,email']);

        return response()->json([
            'success' => true,
            'message' => 'Report updated successfully.',
            'data' => new FullReportResource($report),
        ]);
    }

    /**
     * Delete a report and its associated images from disk.
     * Allowed for the report owner or an admin.
     */
    public function destroy(Request $request, Report $report): JsonResponse
    {
        $user = $request->user();

        // Authorization: owner or admin
        if ($user->id !== $report->user_id && $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to delete this report.',
            ], 403);
        }

        DB::transaction(function () use ($report, $user) {
            // 1. Delete images from disk
            foreach ($report->images as $img) {
                Storage::disk('public')->delete($img->image_path);
            }

            // 2. Log before deleting (so we have the report data)
            ActivityLog::log(
                $user->id,
                'report_deleted',
                "Deleted report #{$report->id}: \"{$report->item_name}\""
            );

            // 3. Delete report (cascades to report_images via FK)
            $report->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Report deleted successfully.',
        ]);
    }
}
