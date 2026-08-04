<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ViolationResolutionMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $emailContent;
    public $subjectTitle;

    public function __construct($emailContent, $subjectTitle)
    {
        $this->emailContent = $emailContent;
        $this->subjectTitle = $subjectTitle;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subjectTitle,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.violation-resolution',
        );
    }
}