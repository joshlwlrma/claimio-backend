<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * SmsLog Model
 *
 * Logs every SMS attempt for auditing and debugging.
 */
class SmsLog extends Model
{
    protected $table = 'sms_logs';

    protected $fillable = [
        'recipient',
        'message',
        'status',
        'response',
    ];
}
