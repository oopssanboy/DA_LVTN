<?php

namespace Database\Seeders;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Tạo tài khoản Admin
        User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'Quản trị viên',
                'password' => Hash::make('123456'), 
                'role' => 'admin', // Sử dụng giá trị ENUM từ CSDL mới
                'is_active' => 1,
            ]
        );

        // 2. Tạo tài khoản Teacher (Giáo viên) để có thể tạo Khóa học
        $teacher = User::updateOrCreate(
            ['email' => 'teacher@gmail.com'],
            [
                'name' => 'Giáo viên Chủ nhiệm',
                'password' => Hash::make('123456'), 
                'role' => 'teacher',
                'is_active' => 1,
            ]
        );
        $proctor = User::updateOrCreate(
            ['email' => 'proctor@gmail.com'],
            [
                'name' => 'Giám thị 1',
                'password' => Hash::make('123456'), 
                'role' => 'proctor',
                'is_active' => 1,
            ]
        );

        // 3. Tạo 1 Khóa học (Course) mẫu cho Giáo viên
        $courseId = DB::table('courses')->insertGetId([
            'title' => 'Khóa học Đại cương',
            'description' => 'Khóa học dành cho sinh viên các lớp',
            'teacher_id' => $teacher->id,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // 4. Tạo các Lớp học (Classes) thuộc Khóa học trên
        $classNames = ['12A1', 'CNTT1', 'KTPM2', 'ĐTVT1'];
        $classIds = [];
        
        foreach ($classNames as $className) {
            $classIds[] = DB::table('classes')->insertGetId([
                'course_id' => $courseId,
                'name' => $className,
                'start_date' => Carbon::now()->toDateString(),
                'end_date' => Carbon::now()->addMonths(6)->toDateString(),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }

        // 5. Tạo Sinh viên và gán vào Lớp học (Class Enrollments)
        for ($i = 1; $i <= 10; $i++) {
            $student = User::updateOrCreate(
                ['email' => 'student' . $i . '@gmail.com'],
                [
                    'name' => 'Sinh viên ' . $i,
                    'email_verified_at' => now(),
                    'password' => Hash::make('123456'),
                    'role' => 'student', // Sử dụng giá trị ENUM
                    'is_active' => 1,
                    'remember_token' => Str::random(10),
                ]
            );

            // Đăng ký (Enroll) sinh viên vào một lớp học ngẫu nhiên
            DB::table('class_enrollments')->insert([
                'class_id' => $classIds[array_rand($classIds)],
                'student_id' => $student->id,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }
    }
}