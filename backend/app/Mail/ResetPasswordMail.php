<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue; 
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends Mailable implements ShouldQueue 
{
    use Queueable, SerializesModels;

    public $otp;

    public function __construct($otp)
    {
        $this->otp = $otp;
    }

    public function build()
    {
        return $this->subject('Mã xác thực Khôi phục mật khẩu - NQ EduTech')
                    ->html('
                        <div style="font-family: Arial, sans-serif; padding: 20px;">
                            <h2>Khôi phục mật khẩu</h2>
                            <p>Bạn đã yêu cầu đặt lại mật khẩu. Dưới đây là mã xác thực (OTP) của bạn:</p>
                            <h1 style="color: #2563eb; letter-spacing: 5px;">' . $this->otp . '</h1>
                            <p>Mã này có hiệu lực trong vòng 15 phút.</p>
                            <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
                        </div>
                    ');
    }
}