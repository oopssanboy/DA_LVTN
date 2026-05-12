<?php

namespace App\Imports;

use App\Models\Question;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class QuestionsImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        return new Question([
            'subject'        => $row['subject'] ?? $row['mon_hoc'],
            'content'        => $row['content'] ?? $row['noi_dung'],
            'option_a'       => $row['option_a'] ?? $row['dap_an_a'],
            'option_b'       => $row['option_b'] ?? $row['dap_an_b'],
            'option_c'       => $row['option_c'] ?? $row['dap_an_c'],
            'option_d'       => $row['option_d'] ?? $row['dap_an_d'],
            'correct_answer' => strtoupper($row['correct_answer'] ?? $row['dap_an_dung']),
            'difficulty'     => strtolower($row['difficulty'] ?? $row['do_kho']) ?? 'medium',
        ]);
    }
}
