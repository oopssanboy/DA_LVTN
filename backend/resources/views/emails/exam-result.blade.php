<!DOCTYPE html>
<html>
<body>
    <h2>Chào bạn,</h2>
    <p>Bạn vừa hoàn thành bài thi: <strong>{{ $exam->title }}</strong></p>
    <p>Điểm số của bạn: <strong>{{ $attempt->total_score }} / 10</strong></p>
    <p>Kết quả: <strong>{{ $attempt->is_passed ? 'Đạt' : 'Không đạt' }}</strong></p>
    
    @if($exam->show_answers)
        <p>Giảng viên đã cho phép xem lại chi tiết bài làm và đáp án. Bạn có thể xem tại link dưới đây:</p>
        <a href="{{ $frontendUrl }}" style="padding: 10px 15px; background-color: #0284c7; color: white; text-decoration: none; border-radius: 5px;">Xem chi tiết đáp án</a>
    @endif
    
    <p>Trân trọng,<br>NQ EduTech</p>
</body>
</html>