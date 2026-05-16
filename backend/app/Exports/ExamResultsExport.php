<?php

namespace App\Exports;

use App\Models\ExamAttempt;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ExamResultsExport implements FromCollection, WithHeadings, WithMapping
{
    protected $exam;

    public function __construct($exam)
    {
        $this->exam = $exam;
    }

    public function collection()
    {
        return ExamAttempt::with('student')
            ->where('exam_id', $this->exam->id)
            ->where('status', 'submitted')
            ->orderBy('total_score', 'desc')
            ->get();
    }

    public function headings(): array
    {
        return [
            'STT',
            'Họ tên',
            'Email',
            'Điểm số',
            'Kết quả',
            'Thời gian bắt đầu',
            'Thời gian nộp',
            'Số lần vi phạm',
        ];
    }

    public function map($attempt): array
    {
        static $index = 0;
        $index++;
        return [
            $index,
            $attempt->student->name,
            $attempt->student->email,
            $attempt->total_score,
            $attempt->is_passed ? 'Đạt' : 'Không đạt',
            $attempt->started_at,
            $attempt->ended_at,
            $attempt->violation_count,
        ];
    }
}