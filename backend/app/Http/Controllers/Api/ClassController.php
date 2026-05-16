<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classes;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function index(Request $request)
    {
        $query = Classes::with('course');
        if ($request->has('course_id')) {
            $query->where('course_id', $request->course_id);
        }
        return response()->json($query->get());
    }

    public function show(Classes $class)
    {
        return response()->json($class->load('course'));
    }
}