<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; 
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ViolationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $examId;
    public $attemptId;
    public $type;
    public $message;

    public function __construct($examId, $attemptId, $type, $message = null)
    {
        $this->examId = $examId;
        $this->attemptId = $attemptId;
        $this->type = $type;
        $this->message = $message;
    }

    public function broadcastOn()
    {
        
        return new Channel('exam.' . $this->examId);
    }

    public function broadcastAs()
    {
  
        return 'violation.updated';
    }
}