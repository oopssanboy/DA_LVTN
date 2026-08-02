<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewExamMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $exam;
    public $student;
    public $frontendUrl;

    public function __construct($exam, $student)
    {
        $this->exam = $exam;
        $this->student = $student;
        $this->frontendUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/student/exams';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Thông báo Kỳ thi mới: ' . $this->exam->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.new-exam',
        );
    }
}