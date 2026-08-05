<?php

namespace App\Imports;

use App\Models\User;
use App\Models\Student;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class UsersImport implements ToCollection, WithHeadingRow 
{
    public function collection(Collection $rows)
    {
        DB::beginTransaction();
        try {
            foreach ($rows as $index => $row) {
                
                $rowNum = $index + 2; 

                if (empty($row['email']) || empty($row['name']) || empty($row['student_code'])) {
                    throw new \Exception("Lỗi ở dòng {$rowNum}: Tên, Email và Mã học viên không được để trống.");
                }

                $emailExists = User::where('email', $row['email'])->exists();
                if ($emailExists) {
                    throw new \Exception("Lỗi ở dòng {$rowNum}: Email '{$row['email']}' đã tồn tại trong hệ thống.");
                }

     
                $codeExists = Student::where('student_code', $row['student_code'])->exists();
                if ($codeExists) {
                    throw new \Exception("Lỗi ở dòng {$rowNum}: Mã học viên '{$row['student_code']}' đã được sử dụng.");
                }

                $user = User::create([
                    'email' => $row['email'],
                    'name' => $row['name'],
                    'password' => Hash::make($row['password'] ?? '123456'), 
                    'role' => 'student'
                ]);

                Student::create([
                    'user_id' => $user->id,
                    'student_code' => $row['student_code'],
                    'name' => $row['name']
                ]);
            }
            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            
            throw $e; 
        }
    }
}