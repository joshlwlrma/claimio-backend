<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * PotentialMatch Model
 *
 * Represents a potential match between a lost report and a found report,
 * detected automatically when new reports are submitted.
 */
class PotentialMatch extends Model
{
    protected $fillable = [
        'lost_report_id',
        'found_report_id',
        'similarity_score',
        'status',
    ];

    // ──────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────

    public function lostReport(): BelongsTo
    {
        return $this->belongsTo(Report::class, 'lost_report_id');
    }

    public function foundReport(): BelongsTo
    {
        return $this->belongsTo(Report::class, 'found_report_id');
    }
}
