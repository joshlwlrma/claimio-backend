<?php

namespace App\Services;

use App\Models\SmsLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * SmsService
 *
 * Sends SMS notifications via SMS API PH.
 * Smart fallback: SMS → Email → silent fail.
 *
 * Phone number format: converts 09xx to +639xx.
 */
class SmsService
{
    private string $apiUrl = 'https://smsapiph.onrender.com/api/v1/send/sms';
    private string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.smsapi.key', 'sk-2b10diku9cacazg2cl1blikcuesqx4qd');
    }

    /**
     * Send an SMS to a recipient.
     *
     * @param string $recipient Phone number (09xx or +639xx)
     * @param string $message   The message body
     * @param string|null $userEmail Fallback email address
     * @return bool
     */
    public function send(string $recipient, string $message, ?string $userEmail = null): bool
    {
        // Format phone number
        $formatted = $this->formatPhoneNumber($recipient);

        if (!$formatted) {
            Log::warning("SmsService: invalid phone number — {$recipient}");

            // Fallback to email
            if ($userEmail) {
                return $this->sendEmailFallback($userEmail, $message);
            }

            return false;
        }

        try {
            $response = Http::withHeaders([
                'x-api-key' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl, [
                'recipient' => $formatted,
                'message' => $message,
            ]);

            $success = $response->successful();

            // Log the attempt
            SmsLog::create([
                'recipient' => $formatted,
                'message' => $message,
                'status' => $success ? 'sent' : 'failed',
                'response' => $response->body(),
            ]);

            if (!$success) {
                Log::warning("SmsService: API returned {$response->status()} — {$response->body()}");

                // Fallback to email
                if ($userEmail) {
                    return $this->sendEmailFallback($userEmail, $message);
                }
            }

            return $success;
        } catch (\Exception $e) {
            Log::error("SmsService error: " . $e->getMessage());

            SmsLog::create([
                'recipient' => $formatted,
                'message' => $message,
                'status' => 'failed',
                'response' => $e->getMessage(),
            ]);

            // Fallback to email
            if ($userEmail) {
                return $this->sendEmailFallback($userEmail, $message);
            }

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

    /**
     * Fallback: send notification via email (simplified).
     */
    private function sendEmailFallback(string $email, string $message): bool
    {
        try {
            // Using raw mail as a simple fallback
            Mail::raw("Claimio Notification:\n\n{$message}", function ($msg) use ($email) {
                $msg->to($email)->subject('Claimio Notification');
            });

            Log::info("SmsService: fallback email sent to {$email}");
            return true;
        } catch (\Exception $e) {
            Log::error("SmsService email fallback error: " . $e->getMessage());
            return false;
        }
    }
}
