<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Report Model
 *
 * Represents a lost or found item report submitted by a user.
 * Each report can have multiple attached images via ReportImage.
 */
class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'item_name',
        'category',
        'description',
        'location',
        'campus',
        'date_occurrence',
        'contact_number',
        'status',
        'resolved_at',
        'is_sensitive',
        'name_on_item',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'date_occurrence' => 'date',
            'resolved_at' => 'datetime',
            'expires_at' => 'datetime',
            'is_sensitive' => 'boolean',
        ];
    }

    // ──────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────

    /**
     * The user who submitted this report.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Images attached to this report.
     */
    public function images(): HasMany
    {
        return $this->hasMany(ReportImage::class);
    }

    /**
     * Claims filed against this report.
     */
    public function claims(): HasMany
    {
        return $this->hasMany(Claim::class);
    }
}
