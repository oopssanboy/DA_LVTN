<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CertificateController extends Controller
{
    public function issue(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:users,id',
            'course_id' => 'required|exists:courses,id',
        ]);

        $existing = Certificate::where('student_id', $request->student_id)
            ->where('course_id', $request->course_id)
            ->first();
        if ($existing) {
            return response()->json(['message' => 'Chứng chỉ đã được cấp trước đó'], 400);
        }

        $cert = Certificate::create([
            'student_id' => $request->student_id,
            'course_id' => $request->course_id,
            'issued_date' => now(),
            'certificate_url' => null,
        ]);

        return response()->json($cert, 201);
    }

    public function getUserCertificates(Request $request)
    {
        $certs = Certificate::with('course')
            ->where('student_id', $request->user()->id)
            ->get();
        return response()->json($certs);
    }
}