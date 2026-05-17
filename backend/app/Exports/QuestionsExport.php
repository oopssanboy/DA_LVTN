<?php

namespace App\Exports;

use App\Models\Question;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class QuestionsExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        // Lấy tất cả câu hỏi kèm đáp án
        return Question::with('choices')->get();
    }

    public function headings(): array
    {
        return [
            'subject', 'topic', 'content', 'type', 'difficulty',
            'correct_answer', 'score', 'explanation',
            'choice_a', 'choice_b', 'choice_c', 'choice_d'
        ];
    }

    public function map($question): array
    {
        $choices = $question->choices->keyBy('choice_key');
        
        return [
            $question->subject,
            $question->topic,
            strip_tags($question->content),
            $question->type,
            $question->difficulty,
            $question->correct_answer,
            $question->score,
            $question->explanation,
            // Dùng hàm optional() thay cho ?-> để không bị lỗi trên các bản PHP cũ
            optional($choices->get('A'))->choice_text ?? '',
            optional($choices->get('B'))->choice_text ?? '',
            optional($choices->get('C'))->choice_text ?? '',
            optional($choices->get('D'))->choice_text ?? '',
        ];
    }
}