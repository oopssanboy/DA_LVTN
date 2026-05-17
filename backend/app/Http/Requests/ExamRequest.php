<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExamRequest extends FormRequest
{
    public function authorize()
    {
        return auth()->user() && in_array(auth()->user()->role, ['teacher', 'admin']);
    }

    public function rules()
    {
        return [
            'class_id' => 'required|exists:classes,id',
            'title' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'duration' => 'required|integer|min:1',
            'total_questions' => 'required|integer|min:1',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after:start_time',
            'password' => 'nullable|string|min:4',
            'is_active' => 'boolean',
            'shuffle_questions' => 'boolean',
            'shuffle_options' => 'boolean',
            'passing_score' => 'required|numeric|min:0|max:10',
            // matrices là một mảng các dòng, mỗi dòng có topic, difficulty, quantity
            'matrices' => 'required|array|min:1',
            'matrices.*.topic' => 'required|string|max:255',
            'matrices.*.difficulty' => 'required|in:easy,medium,hard',
            'matrices.*.quantity' => 'required|integer|min:1',
        ];
    }

    public function messages()
    {
        return [
            'matrices.required' => 'Vui lòng thiết lập ít nhất một dòng ma trận.',
            'total_questions' => 'Tổng số câu hỏi phải bằng tổng quantity trong ma trận.',
        ];
    }

    // Tùy chọn: kiểm tra tổng quantity có bằng total_questions không (nên làm ở controller)
}