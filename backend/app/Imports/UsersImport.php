<?php

namespace App\Imports;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class UsersImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        // Bỏ qua nếu email đã tồn tại
        $existingUser = User::where('email', $row['email'])->first();
        if ($existingUser) {
            return null; 
        }

        return new User([
            'name'     => $row['name'],
            'email'    => $row['email'],
            'phone'    => $row['phone'] ?? null, 
            'password' => Hash::make('123456'), 
            'role'     => 0, 
            'class' => $row['class'] ?? null,
        ]);
    }
}