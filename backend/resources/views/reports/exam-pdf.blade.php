<!DOCTYPE html>
<html>
<head>
    <title>Báo cáo kỳ thi {{ $exam->title }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .header { text-align: center; margin-bottom: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Báo cáo kỳ thi: {{ $exam->title }}</h1>
        <p>Ngày xuất: {{ now()->format('d/m/Y H:i') }}</p>
    </div>

    <h3>Thống kê tổng quan</h3>
    <table>
        <tr><th>Tổng số thí sinh</th><td>{{ $overview->total_students }}</td></tr>
        <tr><th>Điểm trung bình</th><td>{{ $overview->avg_score }}</td></tr>
        <tr><th>Tỉ lệ đậu</th><td>{{ $overview->pass_rate }}%</td></tr>
        <tr><th>Điểm cao nhất</th><td>{{ $overview->max_score }}</td></tr>
        <tr><th>Điểm thấp nhất</th><td>{{ $overview->min_score }}</td></tr>
    </table>

    <h3>Danh sách điểm chi tiết</h3>
    <table>
        <thead>
            <tr><th>STT</th><th>Họ tên</th><th>Email</th><th>Điểm</th><th>Kết quả</th></tr>
        </thead>
        <tbody>
            @foreach($attempts as $index => $attempt)
            <tr>
                <td>{{ $index+1 }}</td>
                <td>{{ $attempt->student->name }}</td>
                <td>{{ $attempt->student->email }}</td>
                <td>{{ $attempt->total_score }}</td>
                <td>{{ $attempt->is_passed ? 'Đạt' : 'Không đạt' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <h3>Thống kê câu hỏi</h3>
    <table>
        <thead><tr><th>Câu hỏi</th><th>Tỉ lệ đúng (%)</th><th>Số đúng</th><th>Sai</th><th>Chưa trả lời</th></tr></thead>
        <tbody>
            @foreach($questionStats as $q)
            <tr>
                <td>{{ $q->content }}</td>
                <td>{{ $q->correct_rate }}</td>
                <td>{{ $q->correct_count }}</td>
                <td>{{ $q->wrong_count }}</td>
                <td>{{ $q->not_answered }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>