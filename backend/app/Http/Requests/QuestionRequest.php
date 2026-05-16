<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QuestionRequest extends FormRequest
{
    public function authorize()
    {
        // Chỉ giảng viên hoặc admin mới được tạo/sửa câu hỏi
        return auth()->user() && in_array(auth()->user()->role, ['teacher', 'admin']);
    }

    public function rules()
    {
        $rules = [
            'subject' => 'required|string|max:255',
            'topic' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => ['required', Rule::in(['single', 'multiple', 'fill_blank'])],
            'difficulty' => ['required', Rule::in(['easy', 'medium', 'hard'])],
            'score' => 'nullable|numeric|min:0.1|max:10',
            'explanation' => 'nullable|string',
        ];

        // Tuỳ theo loại câu hỏi mà quy tắc correct_answer khác nhau
        if ($this->type == 'single') {
            $rules['correct_answer'] = 'required|string|in:A,B,C,D';
        } elseif ($this->type == 'multiple') {
            $rules['correct_answer'] = 'required|regex:/^[A-D](,[A-D])*$/'; // ví dụ: A,C
        } elseif ($this->type == 'fill_blank') {
            $rules['correct_answer'] = 'required|string|max:500'; // có thể nhiều đáp án cách nhau bởi |
        }

        // Nếu là single/multiple thì cần danh sách choices
        if (in_array($this->type, ['single', 'multiple'])) {
            $rules['choices'] = 'required|array|min:2|max:4';
            $rules['choices.*.key'] = 'required|string|in:A,B,C,D';
            $rules['choices.*.text'] = 'required|string|max:1000';
        }

        return $rules;
    }

    public function messages()
    {
        return [
            'correct_answer.regex' => 'Đáp án đúng phải ở dạng A,B,C (các lựa chọn cách nhau dấu phẩy)',
            'choices.required' => 'Vui lòng nhập các lựa chọn A, B, C, D',
            'choices.*.key.unique' => 'Mỗi lựa chọn chỉ xuất hiện một lần',
        ];
    }
}