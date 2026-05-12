<?php

namespace App\Http\Controllers;

use App\Models\Question;
use Illuminate\Http\Request;
use App\Imports\QuestionsImport;
use Maatwebsite\Excel\Facades\Excel;

class QuestionController extends Controller
{
    public function index() {
        return response()->json(Question::orderBy('id', 'desc')->get());
    }

    public function store(Request $request) {
        $data = $request->validate([
            'subject' => 'required|string',
            'content' => 'required|string',
            'option_a' => 'required|string',
            'option_b' => 'required|string',
            'option_c' => 'required|string',
            'option_d' => 'required|string',
            'correct_answer' => 'required|in:A,B,C,D',
            'difficulty' => 'required|in:easy,medium,hard',
        ]);
        $question = Question::create($data);
        return response()->json(['message' => 'Tạo thành công!', 'question' => $question]);
    }

    public function update(Request $request, $id) {
        $question = Question::findOrFail($id);
        $question->update($request->all());
        return response()->json(['message' => 'Cập nhật thành công!', 'question' => $question]);
    }

    public function destroy($id) {
        Question::destroy($id);
        return response()->json(['message' => 'Xóa thành công!']);
    }

    public function import(Request $request) {
        $request->validate(['file' => 'required|mimes:xlsx,xls,csv']);
        Excel::import(new QuestionsImport, $request->file('file'));
        return response()->json(['message' => 'Import dữ liệu thành công!']);
    }
}