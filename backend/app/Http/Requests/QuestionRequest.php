<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QuestionRequest extends FormRequest
{
    public function authorize()
    {
      
        return auth()->user() && in_array(auth()->user()->role, ['teacher', 'admin']);
    }

    public function rules()
    {
        $rules = [
            'subject' => 'required|string|max:255',
            'topic' => 'required|string|max:255',
            'difficulty' => 'required|in:easy,medium,hard',
            'content' => 'required|string',
            'type' => 'required|in:multiple_choice,true_false,fill_blank',
        ];

       
        if ($this->type !== 'fill_blank') {
            $rules['choices'] = 'required|array|min:2'; 
            $rules['choices.*.content'] = 'required|string';
            $rules['choices.*.is_correct'] = 'required|boolean';
        } else {
         
            $rules['correct_answer'] = 'required|string';
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