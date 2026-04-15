<?php

namespace App\Services;

use App\Models\SmsLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * SmsService
 *
 * Sends SMS notifications via SMS API PH.
 * Rate limit: 1 per 10 seconds.
 * Phone number format: converts 09xx to +639xx.
 */
class SmsService
{
    private string $apiUrl = 'https://unismsapi.com/api/sms';
    private string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.unisms.key');
    }

    /**
     * Send an SMS to a recipient.
     *
     * @param string $phoneNumber Phone number (09xx or +639xx)
     * @param string $message     The message body
     * @param int|null $userId    User ID for logging
     * @return bool
     */
    public function send(string $phoneNumber, string $message, ?int $userId = null): bool
    {
        // Format phone number
        $formatted = $this->formatPhoneNumber($phoneNumber);

        if (!$formatted) {
            Log::error("SmsService: invalid phone number — {$phoneNumber}");
            
            // Log failed attempt
            SmsLog::create([
                'user_id' => $userId,
                'recipient' => $phoneNumber,
                'message' => $message,
                'status' => 'failed',
            ]);

            return false;
        }

        try {
            $response = Http::withBasicAuth($this->apiKey, '')
                ->post($this->apiUrl, [
                    'recipient' => $formatted,
                    'content' => $message,
                ]);

            $success = $response->successful();

            // Log the attempt
            SmsLog::create([
                'user_id' => $userId,
                'recipient' => $formatted,
                'message' => $message,
                'status' => $success ? 'sent' : 'failed',
            ]);

            if (!$success) {
                Log::error("SmsService: API returned {$response->status()} — {$response->body()}");
            }

            return $success;
        } catch (\Exception $e) {
            Log::error("SmsService error: " . $e->getMessage());

            SmsLog::create([
                'user_id' => $userId,
                'recipient' => $formatted,
                'message' => $message,
                'status' => 'failed',
            ]);

            return false;
        }
    }

    /**
     * Format phone number to +63 format.
     */
    private function formatPhoneNumber(string $number): ?string
    {
        // Remove spaces, dashes, parens
        $number = preg_replace('/[\s\-\(\)]+/', '', $number);

        // Already in +63 format
        if (preg_match('/^\+639\d{9}$/', $number)) {
            return $number;
        }

        // 09xx format (Philippine mobile)
        if (preg_match('/^09\d{9}$/', $number)) {
            return '+63' . substr($number, 1);
        }

        return null;
    }
}
