<?php

namespace App\Services;

use App\Models\PotentialMatch;
use App\Models\Report;
use Illuminate\Support\Facades\Log;

/**
 * MatchingService
 *
 * Automatically detects potential matches between lost and found reports
 * based on category, item name keywords, and description keywords.
 *
 * Scoring (max 100):
 *   - Exact category match:           +40
 *   - Item name keyword overlap:      up to +40
 *   - Description keyword overlap:    up to +20
 *
 * A match is saved if the total score is >= 40.
 */
class MatchingService
{
    /**
     * Find and save potential matches for a newly submitted report.
     */
    public function findMatches(Report $report): void
    {
        try {
            // Determine the opposite type to match against
            $oppositeType = $report->type === 'lost' ? 'found' : 'lost';

            // Only match against pending or matched reports (not claimed/returned)
            $candidates = Report::where('type', $oppositeType)
                ->whereIn('status', ['pending', 'matched'])
                ->get();

            foreach ($candidates as $candidate) {
                $score = $this->calculateScore($report, $candidate);

                if ($score >= 55) {
                    // Determine which is lost and which is found
                    $lostId = $report->type === 'lost' ? $report->id : $candidate->id;
                    $foundId = $report->type === 'found' ? $report->id : $candidate->id;

                    // Prevent duplicates
                    PotentialMatch::firstOrCreate(
                        [
                            'lost_report_id' => $lostId,
                            'found_report_id' => $foundId,
                        ],
                        [
                            'similarity_score' => $score / 100,
                            'status' => 'pending',
                        ]
                    );
                }
            }
        } catch (\Exception $e) {
            Log::error('MatchingService error: ' . $e->getMessage());
        }
    }

    /**
     * Calculate similarity score between two reports.
     */
private function calculateScore(Report $a, Report $b): int
    {
        $score = 0;
        $hasNameOverlap = false;

        // 1. Item name keyword overlap (Up to +70 points)
        // Shifted missing category points here. Uses 'min' to avoid penalizing adjectives.
        $nameWordsA = $this->extractKeywords($a->item_name);
        $nameWordsB = $this->extractKeywords($b->item_name);
        $nameOverlap = count(array_intersect($nameWordsA, $nameWordsB));
        
        $minNameWords = min(count($nameWordsA), count($nameWordsB));
        if ($minNameWords === 0) $minNameWords = 1; 
        
        $nameScore = (int) round(($nameOverlap / $minNameWords) * 70);
        
        if ($nameOverlap > 0) {
            $hasNameOverlap = true;
        }
        
        $score += $nameScore;

        // 2. Description keyword overlap (Up to +30 points)
        // Uses 'min' so users aren't penalized for writing long, helpful descriptions!
        if ($a->description && $b->description) {
            $descWordsA = $this->extractKeywords($a->description);
            $descWordsB = $this->extractKeywords($b->description);
            $descOverlap = count(array_intersect($descWordsA, $descWordsB));
            
            $minDescWords = min(count($descWordsA), count($descWordsB));
            if ($minDescWords === 0) $minDescWords = 1; 
            
            $score += (int) round(($descOverlap / $minDescWords) * 30);
        }

        // 3. Campus match bonus (Still required/helpful, but doesn't break the match if missing)
        if ($a->campus && $b->campus && $a->campus === $b->campus) {
            $score += 10; 
        }

        // Require at least some item name overlap to prevent random matching
        if ($score >= 55 && !$hasNameOverlap) {
            return 0; 
        }

        return min($score, 100);
    }
    /**
     * Extract meaningful keywords from a string.
     * Filters out common stop words and short words.
     */
    private function extractKeywords(string $text): array
    {
        $stopWords = ['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'is', 'was', 'it', 'my', 'with', 'this', 'that', 'from', 'i'];

        $words = preg_split('/[\s,.\-_\/]+/', strtolower(trim($text)));
        $words = array_filter($words, function ($word) use ($stopWords) {
            return strlen($word) > 2 && !in_array($word, $stopWords);
        });

        return array_values(array_unique($words));
    }
}
