<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\User;

class PublicController extends Controller
{
  
    public function getCourses()
    {
        $courses = Subject::withCount(['topics', 'questions'])->get();
        return response()->json($courses);
    }

    public function getTeachers()
    {
        $teachers = User::where('role', 'teacher')
            ->select('id', 'email', 'avatar') 
            ->limit(8)
            ->get();
        return response()->json($teachers);
    }
}