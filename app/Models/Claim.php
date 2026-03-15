<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Claim Model
 *
 * Represents a user's claim on a report (typically a found item).
 * A claim includes proof of ownership and goes through an
 * approval workflow: pending → approved / rejected.
 */
class Claim extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_id',
        'user_id',
        'proof_description',
        'claim_status',
    ];

    // ──────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────

    /**
     * The report this claim is filed against.
     */
    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    /**
     * The user who filed this claim.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
