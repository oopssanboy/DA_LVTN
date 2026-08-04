<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cohort;
use Illuminate\Http\Request;

class CohortController extends Controller
{
    public function index(Request $request)
    {
        $query = Cohort::with(['course'])
            ->withCount('classes')
            ->orderBy('created_at', 'desc');

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhereHas('course', function ($q2) use ($search) {
                      $q2->where('title', 'like', '%' . $search . '%')
                         ->orWhere('code', 'like', '%' . $search . '%');
                  });
            });
        }

        $perPage = $request->input('per_page', 10);
        $cohorts = $query->paginate($perPage);

        return response()->json($cohorts);
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