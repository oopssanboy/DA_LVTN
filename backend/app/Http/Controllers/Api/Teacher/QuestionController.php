<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\Choice;
use App\Models\FillBlankAnswer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\QuestionsImport;
use App\Exports\QuestionsExport;

class QuestionController extends Controller
{
    // Lấy danh sách câu hỏi (Có bộ lọc)
    public function index(Request $request)
    {
        $query = Question::with(['subject', 'topic', 'choices', 'fillBlankAnswers']);
        
        // Nếu là giảng viên, ưu tiên hiển thị câu hỏi của họ (tùy nghiệp vụ bạn muốn khóa hay mở)
        if (Auth::user()->role === 'teacher') {
            $query->where('teacher_id', Auth::id());
        }

        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->input('subject_id'));
        }
        if ($request->has('topic_id')) {
            $query->where('topic_id', $request->input('topic_id'));
        }
        if ($request->has('difficulty')) {
            $query->where('difficulty', $request->input('difficulty'));
        }
        
        $questions = $query->orderBy('created_at', 'desc')->paginate(15);
        return response()->json($questions, 200);
    }

    // Tạo câu hỏi mới và lưu đáp án
    public function store(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'topic_id' => 'required|exists:topics,id',
            'type' => 'required|in:single,multiple,fill_blank',
            'difficulty' => 'required|in:easy,medium,hard',
            'content' => 'required|string',
            'score' => 'required|numeric|min:0.1',
        ]);

        DB::beginTransaction();
        try {
            $question = Question::create([
                'teacher_id' => Auth::user()->role === 'teacher' ? Auth::id() : null,
                'subject_id' => $request->input('subject_id'),
                'topic_id' => $request->input('topic_id'),
                'type' => $request->input('type'),
                'difficulty' => $request->input('difficulty'),
                'content' => $request->input('content'), 
                'score' => $request->input('score'),
            ]);

            // Xử lý lưu đáp án trắc nghiệm
            if (in_array($request->input('type'), ['single', 'multiple']) && $request->has('choices')) {
                foreach ($request->input('choices') as $choiceData) {
                    Choice::create([
                        'question_id' => $question->id,
                        'choice_key' => $choiceData['choice_key'] ?? null,
                        'choice_text' => $choiceData['choice_text'],
                        'is_correct' => $choiceData['is_correct'] ?? false,
                    ]);
                }
            }

            // Xử lý lưu đáp án điền khuyết
            if ($request->input('type') === 'fill_blank' && $request->has('fill_blank_answers')) {
                foreach ($request->input('fill_blank_answers') as $answerText) {
                    FillBlankAnswer::create([
                        'question_id' => $question->id,
                        'accepted_text' => $answerText,
                    ]);
                }
            }

            DB::commit();
            $question->load(['choices', 'fillBlankAnswers']);
            return response()->json(['message' => 'Tạo câu hỏi thành công', 'data' => $question], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi tạo câu hỏi', 'error' => $e->getMessage()], 500);
        }
    }

    // Xem chi tiết câu hỏi
    public function show($id)
    {
        $question = Question::with(['subject', 'topic', 'choices', 'fillBlankAnswers'])->find($id);
        
        if (!$question) {
            return response()->json(['message' => 'Không tìm thấy câu hỏi'], 404);
        }
        return response()->json($question, 200);
    }

    // Cập nhật câu hỏi và ghi đè đáp án
    public function update(Request $request, $id)
    {
        $question = Question::find($id);
        if (!$question) {
            return response()->json(['message' => 'Không tìm thấy câu hỏi'], 404);
        }

        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'topic_id' => 'required|exists:topics,id',
            'type' => 'required|in:single,multiple,fill_blank',
            'difficulty' => 'required|in:easy,medium,hard',
            'content' => 'required|string',
            'score' => 'required|numeric|min:0.1',
        ]);

        DB::beginTransaction();
        try {
            $question->update([
                'subject_id' => $request->input('subject_id'),
                'topic_id' => $request->input('topic_id'),
                'type' => $request->input('type'),
                'difficulty' => $request->input('difficulty'),
                'content' => $request->input('content'),
                'score' => $request->input('score'),
            ]);

            // Cập nhật đáp án trắc nghiệm: Xóa cũ tạo mới cho an toàn dữ liệu
            if (in_array($request->input('type'), ['single', 'multiple'])) {
                Choice::where('question_id', $question->id)->delete();
                if ($request->has('choices')) {
                    foreach ($request->input('choices') as $choiceData) {
                        Choice::create([
                            'question_id' => $question->id,
                            'choice_key' => $choiceData['choice_key'] ?? null,
                            'choice_text' => $choiceData['choice_text'],
                            'is_correct' => $choiceData['is_correct'] ?? false,
                        ]);
                    }
                }
            }

            // Cập nhật đáp án điền khuyết
            if ($request->input('type') === 'fill_blank') {
                FillBlankAnswer::where('question_id', $question->id)->delete();
                if ($request->has('fill_blank_answers')) {
                    foreach ($request->input('fill_blank_answers') as $answerText) {
                        FillBlankAnswer::create([
                            'question_id' => $question->id,
                            'accepted_text' => $answerText,
                        ]);
                    }
                }
            }

            DB::commit();
            $question->load(['choices', 'fillBlankAnswers']);
            return response()->json(['message' => 'Cập nhật câu hỏi thành công', 'data' => $question], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi cập nhật câu hỏi', 'error' => $e->getMessage()], 500);
        }
    }

    // Xóa câu hỏi (DB đã cấu hình CASCADE nên các choices sẽ tự xóa theo)
    public function destroy($id)
    {
        $question = Question::find($id);
        if (!$question) {
            return response()->json(['message' => 'Không tìm thấy câu hỏi'], 404);
        }

        $question->delete();
        return response()->json(['message' => 'Xóa câu hỏi thành công'], 200);
    }
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240', // max 10MB
        ]);





        try {
            Excel::import(new QuestionsImport, $request->file('file'));
            return response()->json(['message' => 'Import câu hỏi thành công'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi import file'.$e->getMessage(), 'error' => $e->getMessage()], 500);
        }
    }

    public function export()
    {
        try {
            return Excel::download(new QuestionsExport, 'ngan_hang_cau_hoi.xlsx');
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi export dữ liệu', 'error' => $e->getMessage()], 500);
        }
    }
}