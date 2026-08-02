<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2>Chào {{ $student->student->name ?? $student->name }},</h2>
    
    <p>Giảng viên vừa mở một kỳ thi mới cho lớp học của bạn. Dưới đây là thông tin chi tiết:</p>
    
    <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #0284c7; margin-bottom: 20px;">
        <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 8px;">📚 <strong>Tên kỳ thi:</strong> {{ $exam->title }}</li>
            <li style="margin-bottom: 8px;">📖 <strong>Môn học:</strong> {{ $exam->subject->name ?? 'Chưa cập nhật' }}</li>
            <li style="margin-bottom: 8px;">⏱️ <strong>Thời gian làm bài:</strong> {{ $exam->duration }} phút</li>
            <li style="margin-bottom: 8px;">🔓 <strong>Mở phòng thi:</strong> {{ $exam->start_time ? \Carbon\Carbon::parse($exam->start_time)->format('H:i d/m/Y') : 'Tự do' }}</li>
            <li>🔒 <strong>Đóng phòng thi:</strong> {{ $exam->end_time ? \Carbon\Carbon::parse($exam->end_time)->format('H:i d/m/Y') : 'Không giới hạn' }}</li>
        </ul>
    </div>

    <p>Bạn hãy sắp xếp thời gian ôn tập và tham gia làm bài đúng hạn nhé. Chúc bạn đạt điểm cao!</p>
    
    <br>
    <a href="{{ $frontendUrl }}" style="padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Đến phòng thi</a>
    
    <br><br>
    <p>Trân trọng,<br><strong>Đội ngũ NQ EduTech</strong></p>
</body>
</html>