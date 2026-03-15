<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * ReportImage Model
 *
 * Stores the file path for an image attached to a report.
 * Images are stored on the public disk under reports/.
 */
class ReportImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_id',
        'image_path',
    ];

    /**
     * Appended attributes included in JSON serialization.
     */
    protected $appends = ['image_url'];

    // ──────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────

    /**
     * The report this image belongs to.
     */
    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    // ──────────────────────────────────────────────
    // Accessors
    // ──────────────────────────────────────────────

    /**
     * Get the full public URL for this image.
     *
     * Converts the stored relative path (e.g. "reports/uuid.jpg")
     * into a full URL (e.g. "http://localhost/storage/reports/uuid.jpg").
     */
    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image_path) {
            return null;
        }

        return Storage::disk('public')->url($this->image_path);
    }
}
