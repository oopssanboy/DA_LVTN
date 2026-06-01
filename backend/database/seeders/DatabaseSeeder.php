<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        $password = Hash::make('123456'); // Mật khẩu chung là: password

        // 1. TÀI KHOẢN NGƯỜI DÙNG (USERS)
        DB::table('users')->insert([
            ['id' => 1, 'email' => 'admin@gmail.com', 'role' => 'admin', 'password' => $password, 'is_active' => true, 'created_at' => $now],
            ['id' => 2, 'email' => 'teacher@gmail.com', 'role' => 'teacher', 'password' => $password, 'is_active' => true, 'created_at' => $now],
            ['id' => 3, 'email' => 'proctor@gmail.com', 'role' => 'proctor', 'password' => $password, 'is_active' => true, 'created_at' => $now],
            ['id' => 4, 'email' => 'student1@gmail.com', 'role' => 'student', 'password' => $password, 'is_active' => true, 'created_at' => $now],
            ['id' => 5, 'email' => 'student2@gmail.com', 'role' => 'student', 'password' => $password, 'is_active' => true, 'created_at' => $now],
        ]);

        // 2. TÀI KHOẢN MỞ RỘNG (1-1)
        DB::table('teachers')->insert(['user_id' => 2, 'teacher_code' => 'GV001', 'name' => 'ThS. Lê Triệu Ngọc Đức', 'department' => 'Khoa CNTT']);
        DB::table('proctors')->insert(['user_id' => 3, 'proctor_code' => 'GT001', 'name' => 'Giám thị Hội đồng 1']);
        DB::table('students')->insert([
            ['user_id' => 4, 'student_code' => 'DH52201285', 'name' => 'Huỳnh Ngọc Quân'],
            ['user_id' => 5, 'student_code' => 'DH52201286', 'name' => 'Nguyễn Văn Test']
        ]);

        // 3. HỌC VỤ
        $subjectId = DB::table('subjects')->insertGetId(['code' => 'IT301', 'name' => 'Lập trình Web PHP', 'created_at' => $now]);
        $courseId = DB::table('courses')->insertGetId(['subject_id' => $subjectId, 'teacher_id' => 2, 'title' => 'Khóa K22 - HK1', 'created_at' => $now]);
        $classId = DB::table('classes')->insertGetId(['course_id' => $courseId, 'name' => 'D22CQCN01-N', 'created_at' => $now]);
        
        DB::table('class_enrollments')->insert([
            ['class_id' => $classId, 'student_id' => 4, 'created_at' => $now],
            ['class_id' => $classId, 'student_id' => 5, 'created_at' => $now]
        ]);

        // 4. NGÂN HÀNG CÂU HỎI
        $topicId = DB::table('topics')->insertGetId(['subject_id' => $subjectId, 'name' => 'Cơ bản PHP', 'created_at' => $now]);

        // Câu 1 (Single)
        $q1 = DB::table('questions')->insertGetId([
            'teacher_id' => 2, 'subject_id' => $subjectId, 'topic_id' => $topicId,
            'type' => 'single', 'difficulty' => 'easy', 'content' => '<p>PHP là viết tắt của?</p>', 'score' => 5.0, 'created_at' => $now
        ]);
        DB::table('choices')->insert([
            ['question_id' => $q1, 'choice_key' => 'A', 'choice_text' => 'Personal Home Page', 'is_correct' => false],
            ['question_id' => $q1, 'choice_key' => 'B', 'choice_text' => 'PHP: Hypertext Preprocessor', 'is_correct' => true],
            ['question_id' => $q1, 'choice_key' => 'C', 'choice_text' => 'Private Hypertext', 'is_correct' => false],
        ]);

        // Câu 2 (Fill Blank)
        $q2 = DB::table('questions')->insertGetId([
            'teacher_id' => 2, 'subject_id' => $subjectId, 'topic_id' => $topicId,
            'type' => 'fill_blank', 'difficulty' => 'medium', 'content' => '<p>Lệnh in ra màn hình trong PHP là gì?</p>', 'score' => 5.0, 'created_at' => $now
        ]);
        DB::table('fill_blank_answers')->insert([
            ['question_id' => $q2, 'accepted_text' => 'echo'],
            ['question_id' => $q2, 'accepted_text' => 'print']
        ]);

        // 5. CẤU HÌNH KỲ THI
        $examId = DB::table('exams')->insertGetId([
            'class_id' => $classId, 'subject_id' => $subjectId,
            'title' => 'Thi Giữa Kỳ PHP', 'duration' => 60, 'total_questions' => 2,
            'passing_score' => 5, 'start_time' => Carbon::now()->subMinutes(10), 'end_time' => Carbon::now()->addDays(2),
            'is_active' => true, 'created_at' => $now
        ]);

        // Gắn ma trận và câu hỏi
        DB::table('exam_matrices')->insert(['exam_id' => $examId, 'topic_id' => $topicId, 'difficulty' => 'easy', 'quantity' => 2, 'created_at' => $now]);
        DB::table('exam_questions')->insert([
            ['exam_id' => $examId, 'question_id' => $q1, 'order' => 1],
            ['exam_id' => $examId, 'question_id' => $q2, 'order' => 2],
        ]);
        DB::table('exam_proctors')->insert(['exam_id' => $examId, 'proctor_id' => 3, 'created_at' => $now]);

        echo "\n✅ Hoàn tất Seed Dữ liệu chuẩn STU! Đăng nhập student1@stu.edu.vn / password để test nhé!\n";
    }
}