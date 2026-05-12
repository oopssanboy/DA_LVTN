<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Tạo tài khoản Admin (Dùng updateOrCreate để không bị lỗi trùng email khi chạy lại)
        User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'Quản trị viên',
                'password' => Hash::make('123456'), 
                'role' => 1, 
                'phone' => '0999888777',
                'class' => null,
            ]
        );

        // 2. Tạo 10 User mẫu không dùng thư viện Faker
        $classes = ['12A1', 'CNTT1', 'KTPM2', 'ĐTVT1'];

        for ($i = 1; $i <= 10; $i++) {
            User::create([
                'name' => 'Sinh viên ' . $i,
                'email' => 'student' . $i . '@gmail.com',
                'email_verified_at' => now(),
                'password' => Hash::make('123456'),
                'role' => 0, 
                // Sử dụng hàm array_rand của PHP để lấy ngẫu nhiên class
                'class' => $classes[array_rand($classes)], 
                'phone' => '0912' . str_pad($i, 6, '0', STR_PAD_LEFT),
                'remember_token' => Str::random(10),
            ]);
        }
    }
}
