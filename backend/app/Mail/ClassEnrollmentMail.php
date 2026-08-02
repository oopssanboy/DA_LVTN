<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ClassEnrollmentMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $classData;
    public $action;
    public $frontendUrl;

    public function __construct($classData, $action)
    {
        $this->classData = $classData;
        $this->action = $action;
        $this->frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
    }

    public function envelope(): Envelope
    {
       
        $subject = $this->action === 'added' 
            ? 'Bạn đã được thêm vào lớp học: ' . $this->classData->name 
            : 'Thông báo cập nhật danh sách lớp: ' . $this->classData->name;

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.class-enrollment',
        );
    }
}