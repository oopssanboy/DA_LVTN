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
            
            'title' => 'required|string|max:255',
            'subject_id' => 'required|exists:subjects,id',
            'class_ids' => 'required|array|min:1',
            'class_ids.*' => 'exists:classes,id',
            'proctor_ids' => 'nullable|array',
            'proctor_ids.*' => 'exists:users,id',
            'duration' => 'required|integer|min:1',
            'total_questions' => 'required|integer|min:1',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after_or_equal:start_time',
            'password' => 'nullable|string',
            'is_active' => 'boolean',
            'show_answers' => 'boolean',
            'shuffle_questions' => 'boolean',
            'shuffle_options' => 'boolean',
            'passing_score' => 'required|numeric|min:0|max:10',
           
            'matrices' => 'required|array|min:1',
            'matrices.*.topic_id' => 'required|exists:topics,id', 
            'matrices.*.difficulty' => 'required|in:easy,medium,hard',
            'matrices.*.quantity' => 'required|integer|min:1',
        ];
    }

    public function messages()
    {
        return [
            'matrices.required' => 'Vui lòng thiết lập ít nhất một dòng ma trận.',
            'matrices.*.topic_id.required' => 'Vui lòng chọn chủ đề cho ma trận.',
            'matrices.*.topic_id.exists' => 'Chủ đề được chọn không hợp lệ.',
            'matrices.*.difficulty.required' => 'Vui lòng chọn độ khó.',
            'matrices.*.quantity.required' => 'Vui lòng nhập số lượng câu hỏi.',
            'matrices.*.quantity.min' => 'Số lượng câu hỏi phải lớn hơn 0.',
        ];
    }
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $data = $this->all();

            if (isset($data['matrices']) && isset($data['total_questions'])) {
                $totalQuantity = collect($data['matrices'])->sum('quantity');
                if ($totalQuantity != $data['total_questions']) {
                    $validator->errors()->add(
                        'total_questions',
                        "Tổng số câu hỏi trong ma trận ({$totalQuantity}) không khớp với tổng số câu hỏi của kỳ thi ({$data['total_questions']})."
                    );
                }
            }

            if (!empty($data['subject_id']) && !empty($data['class_ids'])) {
                $validClassesCount = \App\Models\Classes::whereIn('id', $data['class_ids'])
                    ->whereHas('cohort.course.subjects', function($q) use ($data) {
                        $q->where('subjects.id', $data['subject_id']);
                    })->count();

            
                if ($validClassesCount !== count($data['class_ids'])) {
                    $validator->errors()->add(
                        'class_ids',
                        'Lỗi: Bạn đã chọn một hoặc nhiều Lớp không học Môn này trong chương trình đào tạo.'
                    );
                }
            }
        });
    }
}