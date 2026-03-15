<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ActivityLog Model
 *
 * Immutable audit trail for critical user actions.
 * Only created_at is recorded (no updated_at — logs are never modified).
 */
class ActivityLog extends Model
{
    /**
     * Disable updated_at — activity logs are immutable records.
     */
    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'action_type',
        'description',
    ];

    // ──────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────

    /**
     * The user who performed this action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ──────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────

    /**
     * Quick static helper to create an activity log entry.
     *
     * Usage: ActivityLog::log($userId, 'report_submitted', 'Created report #5');
     */
    public static function log(int $userId, string $actionType, ?string $description = null): static
    {
        return static::create([
            'user_id' => $userId,
            'action_type' => $actionType,
            'description' => $description,
        ]);
    }
}
