<?php

namespace App\Services;

use App\Models\Notification;

class NotificationService
{
    /**
     * Create a new notification for a user.
     *
     * @param int $userId The ID of the recipient user
     * @param string $type The type of notification (e.g., claim_approved, item_matched)
     * @param string $message The human-readable notification text
     * @return Notification
     */
    public static function notify(int $userId, string $type, string $message): Notification
    {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'message' => $message,
        ]);
    }
}
