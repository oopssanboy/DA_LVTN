<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use Illuminate\Http\Request;

class CertificateController extends Controller
{
    public function getUserCertificates(Request $request)
    {
        $certificates = Certificate::with('course')
            ->where('student_id', $request->user()->id)
            ->get();
        return response()->json($certificates);
    }

    public function issue(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:users,id',
            'course_id' => 'required|exists:courses,id',
            'issued_date' => 'required|date'
        ]);

        $certificate = Certificate::create($request->all());
        return response()->json(['message' => 'Cấp chứng chỉ thành công', 'certificate' => $certificate]);
    }
}