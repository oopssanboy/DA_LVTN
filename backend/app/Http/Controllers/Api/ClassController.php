<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classes;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function index(Request $request)
    {
        $classes = Classes::with('course')->get();
        return response()->json($classes);
    }

    public function show($id)
    {
        $class = Classes::with(['course', 'enrollments'])->findOrFail($id);
        return response()->json($class);
    }
}