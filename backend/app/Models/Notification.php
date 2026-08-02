<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'user_id', 'sender_id', 'title', 'content', 'type', 
        'link_url', 'is_read', 'target_role', 'target_class_id'
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function targetClass()
    {
        return $this->belongsTo(Classes::class, 'target_class_id');
    }
}