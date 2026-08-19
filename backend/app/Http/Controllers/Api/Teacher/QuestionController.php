<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\Choice;
use App\Models\FillBlankAnswer;
use App\Models\TestCase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\QuestionsImport;
use App\Exports\QuestionsExport;

class QuestionController extends Controller
{
    private function normalizeContent($content)
    {
        $text = html_entity_decode($content, ENT_QUOTES, 'UTF-8');
        $text = strip_tags($text);
        $text = preg_replace('/\s+/u', ' ', $text);
        return mb_strtolower(trim($text), 'UTF-8');
    }

    public function index(Request $request)
    {
        $query = Question::with(['subject', 'topic', 'choices', 'fillBlankAnswers', 'testCases'])
        ->withCount('examQuestions');

        if (Auth::user()->role === 'teacher') {
            $query->where('teacher_id', Auth::id());
        }

        if ($request->has('subject_id') && $request->subject_id != '') {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('content', 'like', '%' . $search . '%')
                  ->orWhereHas('topic', function ($q2) use ($search) {
                      $q2->where('name', 'like', '%' . $search . '%');
                  });
            });
        }

        if ($request->has('difficulty') && $request->difficulty != '') {
            $query->where('difficulty', $request->difficulty);
        }

        if ($request->has('type') && $request->type != '') {
            $query->where('type', $request->type);
        }

        $perPage = $request->input('per_page', 10);
        $questions = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($questions);
    }

    public function checkSimilarity(Request $request)
    {
        $subjectId = $request->subject_id;
        $excludeId = $request->exclude_id; 

        $normalized = $this->normalizeContent($request->input('content'));
        $hash = hash('sha256', $normalized);

        $query = Question::where('subject_id', $subjectId);
        if (Auth::user()->role === 'teacher') {
            $query->where('teacher_id', Auth::id());
        }

        $exactMatchQuery = clone $query;
        $exactMatch = $exactMatchQuery->where('question_hash', $hash)
            ->when($excludeId, function($q) use ($excludeId) {
                return $q->where('id', '!=', $excludeId);
            })
            ->exists();

        if ($exactMatch) {
            return response()->json(['status' => 'exact_match', 'message' => 'Câu hỏi đã tồn tại chính xác 100% trong kho câu hỏi của bạn.']);
        }

        $otherQuestionsQuery = clone $query;
        $otherQuestions = $otherQuestionsQuery->when($excludeId, function($q) use ($excludeId) {
                return $q->where('id', '!=', $excludeId);
            })->get();

        $maxSim = 0;
        $similarContent = '';
        $len1 = strlen($normalized);

        foreach ($otherQuestions as $q) {
            $qNormalized = $this->normalizeContent($q->content);
            $len2 = strlen($qNormalized);
            
            if ($len1 == 0 || $len2 == 0) continue;
      
            if (min($len1, $len2) / max($len1, $len2) < 0.7) {
                continue;
            }

            similar_text($normalized, $qNormalized, $percent);
            if ($percent > 80 && $percent > $maxSim) {
                $maxSim = $percent;
                $similarContent = strip_tags($q->content);
            }
        }

        if ($maxSim > 80) {
            return response()->json([
                'status' => 'similar_match',
                'similarity_percent' => round($maxSim),
                'similar_content' => $similarContent,
                'owner' => 'bạn'
            ]);
        }

        return response()->json(['status' => 'safe']);
    }
   
    public function store(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'topic_id' => 'required|exists:topics,id',
            'type' => 'required|in:single,multiple,fill_blank,coding',
            'difficulty' => 'required|in:easy,medium,hard',
            'content' => 'required|string',
            'score' => 'required|numeric|min:0.1',
            'allowed_languages' => 'nullable|array',
            'allowed_languages.*' => 'string|in:cpp,python,java,php',
        ]);

        $normalized = $this->normalizeContent($request->input('content'));
        $hash = hash('sha256', $normalized);

        $existsQuery = Question::where('subject_id', $request->subject_id)->where('question_hash', $hash);
        if (Auth::user()->role === 'teacher') {
            $existsQuery->where('teacher_id', Auth::id());
        }

        if ($existsQuery->exists()) {
            return response()->json(['message' => 'Nội dung câu hỏi đã tồn tại chính xác trong ngân hàng của bạn.'], 422);
        }
        
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
                'time_limit' => $request->input('type') === 'coding' ? $request->input('time_limit', 2000) : null,
                'memory_limit' => $request->input('type') === 'coding' ? $request->input('memory_limit', 128000) : null,
                'allowed_languages' => $request->input('type') === 'coding' ? $request->input('allowed_languages', ['cpp', 'python', 'java', 'php']) : null,
                'question_hash' => $hash,
            ]);

            if (in_array($request->input('type'), ['single', 'multiple']) && $request->has('choices')) {
                foreach ($request->input('choices') as $choiceData) {
                    Choice::create([
                        'question_id' => $question->id,
                        'choice_key' => $choiceData['choice_key'] ?? null,
                        'choice_text' => $choiceData['choice_text'],
                        'is_correct' => $choiceData['is_correct'] ?? false,
                    ]);
                }
            } elseif ($request->input('type') === 'fill_blank' && $request->has('fill_blank_answers')) {
                foreach ($request->input('fill_blank_answers') as $answerText) {
                    FillBlankAnswer::create([
                        'question_id' => $question->id,
                        'accepted_text' => $answerText,
                    ]);
                }
            } elseif ($request->input('type') === 'coding' && $request->has('test_cases')) {
                foreach ($request->input('test_cases') as $tc) {
                    TestCase::create([
                        'question_id' => $question->id,
                        'input_data' => $tc['input_data'] ?? null,
                        'expected_output' => $tc['expected_output'],
                        'is_hidden' => $tc['is_hidden'] ?? false,
                    ]);
                }
            }

            DB::commit();
            $question->load(['choices', 'fillBlankAnswers', 'testCases']);
            return response()->json(['message' => 'Tạo câu hỏi thành công', 'data' => $question], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi tạo câu hỏi: '.$e->getMessage(), 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $question = Question::with(['subject', 'topic', 'choices', 'fillBlankAnswers', 'testCases'])->find($id);
        
        if (!$question) {
            return response()->json(['message' => 'Không tìm thấy câu hỏi'], 404);
        }
        return response()->json($question, 200);
    }

    public function update(Request $request, $id)
    {
        $question = Question::find($id);
        if (!$question) {
            return response()->json(['message' => 'Không tìm thấy câu hỏi'], 404);
        }
        if ($question->examQuestions()->exists()) {
            return response()->json(['message' => 'Câu hỏi đã được sử dụng trong kỳ thi, không thể chỉnh sửa. Vui lòng tạo câu hỏi mới.'], 403);
        }

        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'topic_id' => 'required|exists:topics,id',
            'type' => 'required|in:single,multiple,fill_blank,coding', 
            'difficulty' => 'required|in:easy,medium,hard',
            'content' => 'required|string',
            'score' => 'required|numeric|min:0.1',
            'allowed_languages' => 'nullable|array',
            'allowed_languages.*' => 'string|in:cpp,python,java,php',
        ]);

        $normalized = $this->normalizeContent($request->input('content'));
        $hash = hash('sha256', $normalized);

        $existsQuery = Question::where('subject_id', $request->subject_id)->where('question_hash', $hash)->where('id', '!=', $id);
        if (Auth::user()->role === 'teacher') {
            $existsQuery->where('teacher_id', Auth::id());
        }

        if ($existsQuery->exists()) {
            return response()->json(['message' => 'Nội dung câu hỏi đã tồn tại trong ngân hàng của bạn.'], 422);
        }
        
        DB::beginTransaction();
        try {
            $question->update([
                'subject_id' => $request->input('subject_id'),
                'topic_id' => $request->input('topic_id'),
                'type' => $request->input('type'),
                'difficulty' => $request->input('difficulty'),
                'content' => $request->input('content'),
                'score' => $request->input('score'),
                'time_limit' => $request->input('type') === 'coding' ? $request->input('time_limit', 2000) : null,
                'memory_limit' => $request->input('type') === 'coding' ? $request->input('memory_limit', 128000) : null,
                'allowed_languages' => $request->input('type') === 'coding' ? $request->input('allowed_languages', ['cpp', 'python', 'java', 'php']) : null,
                'question_hash' => $hash,
            ]);

           
            Choice::where('question_id', $question->id)->delete();
            FillBlankAnswer::where('question_id', $question->id)->delete();
            TestCase::where('question_id', $question->id)->delete();

            if (in_array($request->input('type'), ['single', 'multiple']) && $request->has('choices')) {
                foreach ($request->input('choices') as $choiceData) {
                    Choice::create([
                        'question_id' => $question->id,
                        'choice_key' => $choiceData['choice_key'] ?? null,
                        'choice_text' => $choiceData['choice_text'],
                        'is_correct' => $choiceData['is_correct'] ?? false,
                    ]);
                }
            } elseif ($request->input('type') === 'fill_blank' && $request->has('fill_blank_answers')) {
                foreach ($request->input('fill_blank_answers') as $answerText) {
                    FillBlankAnswer::create([
                        'question_id' => $question->id,
                        'accepted_text' => $answerText,
                    ]);
                }
            } elseif ($request->input('type') === 'coding' && $request->has('test_cases')) {
                foreach ($request->input('test_cases') as $tc) {
                    TestCase::create([
                        'question_id' => $question->id,
                        'input_data' => $tc['input_data'] ?? null,
                        'expected_output' => $tc['expected_output'],
                        'is_hidden' => $tc['is_hidden'] ?? false,
                    ]);
                }
            }

            DB::commit();
            $question->load(['choices', 'fillBlankAnswers', 'testCases']);
            return response()->json(['message' => 'Cập nhật câu hỏi thành công', 'data' => $question], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi cập nhật câu hỏi', 'error' => $e->getMessage()], 500);
        }
    }

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
            'file' => 'required|file|mimes:xlsx,xls,csv,txt|max:10240',
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
    
    public function getStats()
    {
        $query = Question::select('topic_id', 'difficulty', 'type', DB::raw('count(*) as total'));
        
        if (Auth::check() && Auth::user()->role === 'teacher') {
            $query->where('teacher_id', Auth::id());
        }
        
        $stats = $query->groupBy('topic_id', 'difficulty', 'type')->get();
            
        return response()->json(['data' => $stats]);
    }
}