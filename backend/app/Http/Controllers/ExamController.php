<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\Question;
use Illuminate\Http\Request;
use App\Models\ExamAttempt;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ExamResultExport;


class ExamController extends Controller
{
    public function index() {
        // Lấy danh sách kỳ thi kèm theo số lượng câu hỏi đã được random
        return response()->json(Exam::withCount('questions')->orderBy('id', 'desc')->get());
    }

    public function store(Request $request) {
        $data = $request->validate([
            'title' => 'required|string',
            'subject' => 'required|string',
            'duration' => 'required|integer',
            'total_questions' => 'required|integer',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after_or_equal:start_time',
            'password' => 'nullable|string',
        ]);
        $data['is_active'] = false; // Mặc định tạo ra là Đóng
        
        $exam = Exam::create($data);
        return response()->json(['message' => 'Tạo kỳ thi thành công!', 'exam' => $exam]);
    }

    public function update(Request $request, $id) {
        $exam = Exam::findOrFail($id);
        $exam->update($request->all());
        return response()->json(['message' => 'Cập nhật thành công!']);
    }

    public function destroy($id) {
        Exam::destroy($id);
        return response()->json(['message' => 'Xóa thành công!']);
    }

    // API Đóng/Mở kỳ thi
    public function toggleStatus($id) {
        $exam = Exam::findOrFail($id);
        $exam->is_active = !$exam->is_active;
        $exam->save();
        return response()->json(['message' => 'Đã thay đổi trạng thái kỳ thi!', 'is_active' => $exam->is_active]);
    }

    // API Random câu hỏi
    public function generateQuestions($id) {
        $exam = Exam::findOrFail($id);
        
        // Lấy ngẫu nhiên các câu hỏi thuộc môn học của kỳ thi
        $randomQuestions = Question::where('subject', $exam->subject)
                                   ->inRandomOrder()
                                   ->limit($exam->total_questions)
                                   ->pluck('id');

        // Kiểm tra xem ngân hàng câu hỏi có đủ số lượng không
        if ($randomQuestions->count() < $exam->total_questions) {
            return response()->json([
                'error' => 'Ngân hàng câu hỏi môn "' . $exam->subject . '" chỉ có ' . $randomQuestions->count() . ' câu, không đủ ' . $exam->total_questions . ' câu yêu cầu!'
            ], 400);
        }

        // Đồng bộ vào bảng trung gian (xóa câu cũ, đắp câu mới vào)
        $exam->questions()->sync($randomQuestions);

        return response()->json(['message' => 'Đã tạo xong đề thi ngẫu nhiên với ' . $exam->total_questions . ' câu hỏi!']);
    }

    public function statistics($examId)
    {
        $attempts = ExamAttempt::where('exam_id', $examId)->get();

        $totalStudents = $attempts->count();
        $passed = $attempts->where('is_passed', true)->count();
        $failed = $totalStudents - $passed;

        // Phổ điểm
        $scoreDistribution = [
            '0-3' => $attempts->whereBetween('score', [0, 3.99])->count(),
            '4-6' => $attempts->whereBetween('score', [4, 6.99])->count(),
            '7-8' => $attempts->whereBetween('score', [7, 8.99])->count(),
            '9-10' => $attempts->whereBetween('score', [9, 10])->count(),
        ];

        return response()->json([
            'total_students' => $totalStudents,
            'passed' => $passed,
            'failed' => $failed,
            'distribution' => $scoreDistribution // <-- Key này phải có
        ]);
    }

    public function export($id) {
        try {
            // Kiểm tra xem kỳ thi có tồn tại không
            $exam = Exam::findOrFail($id); 
            return Excel::download(new ExamResultExport($id), "ket-qua-thi-{$id}.xlsx");
        } catch (\Exception $e) {
            // Ghi lại lỗi thực tế vào log để debug
            \Log::error("Export Excel Error: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getActiveAttempts($id)
    {
        $attempts = ExamAttempt::with('user:id,name,email,class') // Lấy kèm thông tin user
            ->where('exam_id', $id)
            ->orderBy('started_at', 'desc')
            ->get();
            
        return response()->json($attempts);
    }

    // 2. Ép buộc thu bài (Đình chỉ thi)
    public function forceSubmit($id)
    {
        $attempt = ExamAttempt::findOrFail($id);
        
        if ($attempt->status === 'in_progress') {
            $attempt->status = 'forced_submitted';
            $attempt->submitted_at = now();
            $attempt->save();
            
            return response()->json(['message' => 'Đã thu bài sinh viên thành công.']);
        }
        
        return response()->json(['message' => 'Bài thi này đã kết thúc trước đó.'], 400);
    }
}