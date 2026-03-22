<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ClaimController;
use App\Http\Controllers\Admin\AdminController;

use App\Http\Controllers\Admin\MatchController;

// ───────────────────────────────────────────────
// Public Routes (no authentication required)
// ───────────────────────────────────────────────

// Google OAuth
Route::get('/auth/google/redirect', [GoogleAuthController::class , 'redirect'])
    ->name('auth.google.redirect');
Route::get('/auth/google/callback', [GoogleAuthController::class , 'callback'])
    ->name('auth.google.callback');

// Public report browsing (returns PublicReportResource — no description)
Route::get('/reports', [ReportController::class , 'index'])->name('reports.index');
Route::get('/reports/{report}', [ReportController::class , 'show'])->name('reports.show');

// Public claim viewing (see who claimed a report)
Route::get('/reports/{report}/claims', [ClaimController::class , 'index'])->name('claims.index');

// ───────────────────────────────────────────────
// Protected Routes (require valid Sanctum token)
// ───────────────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {
    // Authenticated user
    Route::get('/user', function (Request $request) {
            return $request->user();
        }
    )->name('api.user');

    // User's own profile routes
    Route::get('/user/reports', [\App\Http\Controllers\ProfileController::class, 'reports'])->name('user.reports');
    Route::get('/user/claims', [\App\Http\Controllers\ProfileController::class, 'claims'])->name('user.claims');
    Route::put('/user/profile', [\App\Http\Controllers\ProfileController::class, 'updateProfile'])->name('user.profile.update');

    // Reports — create, update, delete
    Route::post('/reports', [ReportController::class , 'store'])->name('reports.store');
    Route::put('/reports/{report}', [ReportController::class , 'update'])->name('reports.update');
    Route::delete('/reports/{report}', [ReportController::class , 'destroy'])->name('reports.destroy');

    // Notifications
    Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/read', [\App\Http\Controllers\NotificationController::class, 'markAllRead'])->name('notifications.markAllRead');
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markRead'])->name('notifications.markRead');

    // Claims — submit a claim on a report
    Route::post('/reports/{report}/claims', [ClaimController::class , 'store'])->name('claims.store');
});

// ───────────────────────────────────────────────
// Admin Routes (auth:sanctum + admin middleware)
// ───────────────────────────────────────────────

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // Dashboard stats
    Route::get('/stats', [AdminController::class , 'stats'])->name('admin.stats');

    // Full report listing (admin sees everything)
    Route::get('/reports', [AdminController::class , 'reports'])->name('admin.reports');

    // Update report status (pending → matched → claimed → returned)
    Route::put('/reports/{report}/status', [AdminController::class , 'updateReportStatus'])
        ->name('admin.reports.update-status');

    // Mark as Returned
    Route::put('/reports/{report}/return', [AdminController::class, 'markReturned'])
        ->name('admin.reports.return');

    // Restore Expired Report
    Route::put('/reports/{report}/restore', [AdminController::class, 'restoreReport'])
        ->name('admin.reports.restore');

    // CSV export
    Route::get('/reports/export', [AdminController::class , 'export'])->name('admin.reports.export');

    // Approve or reject a claim
    Route::put('/claims/{claim}/status', [ClaimController::class , 'updateStatus'])
        ->name('admin.claims.update-status');

    // Claims history (admin)
    Route::get('/claims', [AdminController::class, 'claimsHistory'])->name('admin.claims.history');

    // Potential matches
    Route::get('/matches', [MatchController::class, 'index'])->name('admin.matches.index');
    Route::put('/matches/{match}/confirm', [MatchController::class, 'confirm'])->name('admin.matches.confirm');
    Route::put('/matches/{match}/dismiss', [MatchController::class, 'dismiss'])->name('admin.matches.dismiss');
});
