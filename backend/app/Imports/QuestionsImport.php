<?php

namespace App\Imports;

use App\Models\Question;
use App\Models\Choice;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class QuestionsImport implements ToCollection, WithHeadingRow
{
    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            // Bỏ qua các dòng trống (nếu không có môn học hoặc nội dung)
            if (empty($row['subject']) && empty($row['mon_hoc'])) {
                continue;
            }

            // 1. Lưu thông tin vào bảng questions
            $type = $row['type'] ?? $row['loai_cau_hoi'] ?? 'single';
            $rawAnswer = (string)($row['correct_answer'] ?? $row['dap_an_dung'] ?? '');
            
            // Logic: Trắc nghiệm thì in hoa (A, B, C, D). Điền khuyết thì giữ nguyên chữ gốc.
            $correctAnswer = in_array($type, ['single', 'multiple']) ? strtoupper($rawAnswer) : $rawAnswer;

            // 1. Lưu thông tin vào bảng questions
            $question = Question::create([
                'subject'        => $row['subject'] ?? $row['mon_hoc'] ?? 'Mặc định',
                'topic'          => $row['topic'] ?? $row['chu_de'] ?? 'Chung',
                'content'        => $row['content'] ?? $row['noi_dung'] ?? '',
                'type'           => $type,
                'difficulty'     => strtolower($row['difficulty'] ?? $row['do_kho'] ?? 'medium'),
                'correct_answer' => $correctAnswer, // <-- Dùng biến đã được check ở trên
                'score'          => $row['score'] ?? $row['diem'] ?? 1,
                'explanation'    => $row['explanation'] ?? $row['giai_thich'] ?? null,
                'created_by'     => auth()->id(),
            ]);

            // 2. Nếu là câu hỏi trắc nghiệm thì lưu tiếp vào bảng choices
            if (in_array($question->type, ['single', 'multiple'])) {
                
                // Hỗ trợ đọc cả tiếng Anh lẫn tiếng Việt từ file Excel
                $choicesData = [
                    'A' => $row['choice_a'] ?? $row['lua_chon_a'] ?? $row['option_a'] ?? $row['dap_an_a'] ?? '',
                    'B' => $row['choice_b'] ?? $row['lua_chon_b'] ?? $row['option_b'] ?? $row['dap_an_b'] ?? '',
                    'C' => $row['choice_c'] ?? $row['lua_chon_c'] ?? $row['option_c'] ?? $row['dap_an_c'] ?? '',
                    'D' => $row['choice_d'] ?? $row['lua_chon_d'] ?? $row['option_d'] ?? $row['dap_an_d'] ?? '',
                ];

                // Lặp để tạo từng đáp án
                foreach ($choicesData as $key => $text) {
                    if (!empty(trim((string)$text))) { // Chỉ tạo choice nếu cột đó có chữ
                        Choice::create([
                            'question_id' => $question->id,
                            'choice_key'  => $key,
                            'choice_text' => $text,
                        ]);
                    }
                }
            }
        }
    }
}