<?php

namespace App\Imports;

use App\Models\Question;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class QuestionImport implements ToCollection, WithHeadingRow
{
    public function collection(Collection $rows)
    {
        DB::transaction(function () use ($rows) {
            foreach ($rows as $row) {
                // Bỏ qua các dòng không có nội dung câu hỏi
                if (!isset($row['content']) || empty(trim($row['content']))) {
                    continue;
                }

                // Tạo câu hỏi
                $question = Question::create([
                    'subject'        => $row['subject'] ?? 'Chưa phân loại',
                    'topic'          => $row['topic'] ?? 'Chưa phân loại',
                    'content'        => $row['content'],
                    'type'           => $row['type'] ?? 'single', // single, multiple, fill_blank
                    'difficulty'     => $row['difficulty'] ?? 'medium', // easy, medium, hard
                    'correct_answer' => (string) $row['correct_answer'],
                    'score'          => $row['score'] ?? 1,
                    'explanation'    => $row['explanation'] ?? null,
                ]);

                // Thêm các lựa chọn nếu là trắc nghiệm
                if (in_array($question->type, ['single', 'multiple'])) {
                    $choices = [
                        'A' => $row['choice_a'] ?? null,
                        'B' => $row['choice_b'] ?? null,
                        'C' => $row['choice_c'] ?? null,
                        'D' => $row['choice_d'] ?? null,
                    ];

                    foreach ($choices as $key => $text) {
                        if (!empty($text)) {
                            $question->choices()->create([
                                'choice_key'  => $key,
                                'choice_text' => $text,
                            ]);
                        }
                    }
                }
            }
        });
    }
}