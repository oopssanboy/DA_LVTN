<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cohort;
use Illuminate\Http\Request;

class CohortController extends Controller
{
    public function index(Request $request)
    {
        $query = Cohort::with(['course'])->withCount('classes');
        
      
        if ($request->has('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'name' => 'required|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $cohort = Cohort::create($request->all());
        return response()->json(['message' => 'Tạo đợt tuyển sinh thành công', 'data' => $cohort], 201);
    }

    public function update(Request $request, $id)
    {
        $cohort = Cohort::findOrFail($id);
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'name' => 'required|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $cohort->update($request->all());
        return response()->json(['message' => 'Cập nhật đợt tuyển sinh thành công', 'data' => $cohort]);
    }
}