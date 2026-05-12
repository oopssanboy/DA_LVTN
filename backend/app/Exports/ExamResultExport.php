<?php

namespace App\Exports;

use App\Models\ExamAttempt;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\Exportable; // Thêm dòng này

class ExamResultExport implements FromCollection, WithHeadings, WithMapping
{
    use Exportable; // Sử dụng trait này

    protected $examId;

    public function __construct($examId)
    {
        $this->examId = $examId;
    }

    public function collection()
    {
        // Thêm kiểm tra tồn tại để tránh lỗi 500 nếu query rỗng
        return ExamAttempt::with('user')
            ->where('exam_id', $this->examId)
            ->get();
    }

    public function headings(): array
    {
        return ['Mã SV/User ID', 'Tên sinh viên', 'Điểm', 'Kết quả', 'Ngày thi'];
    }

    public function map($attempt): array
    {
        return [
            $attempt->user_id,
            // Dùng optional() hoặc null coalescing để bảo vệ code
            optional($attempt->user)->name ?? 'N/A', 
            $attempt->score,
            $attempt->is_passed ? 'Đậu' : 'Rớt',
            // Kiểm tra created_at trước khi format
            $attempt->created_at ? $attempt->created_at->format('d/m/Y H:i') : 'N/A',
        ];
    }
}