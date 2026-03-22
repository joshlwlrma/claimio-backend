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
    
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'recipient',
        'message',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
