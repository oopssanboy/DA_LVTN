<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cloudinary Configuration
    |--------------------------------------------------------------------------
    */

    // Đưa trực tiếp API Key vào tham số thứ 2 của hàm env() để dự phòng
    'cloud_url' => env('CLOUDINARY_URL', 'cloudinary://617698749186417:78FMPgEtI0LFRn7stS1YtxtPPec@dpywl6fkb'),

    'upload_preset' => env('CLOUDINARY_UPLOAD_PRESET'),

    'notification_url' => env('CLOUDINARY_NOTIFICATION_URL'),
];