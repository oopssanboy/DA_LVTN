<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2>Chào bạn,</h2>
    
    @if($action === 'added')
        <p>Bạn vừa được Giảng viên / Ban quản trị phân công vào lớp học: <strong style="color: #0284c7;">{{ $classData->name }}</strong>.</p>
        <p>Thuộc đợt: <strong>{{ $classData->cohort->name ?? 'N/A' }}</strong></p>
        <p>Hãy truy cập vào hệ thống để cập nhật lịch học và theo dõi các kỳ thi sắp tới nhé.</p>
        <br>
        <a href="{{ $frontendUrl }}" style="padding: 10px 20px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Vào hệ thống ngay</a>
    @else
        <p>Hệ thống xin thông báo, tên của bạn đã được rút khỏi danh sách lớp học: <strong style="color: #e11d48;">{{ $classData->name }}</strong>.</p>
        <p>Nếu bạn cho rằng đây là sự nhầm lẫn, vui lòng liên hệ lại với Giảng viên phụ trách hoặc Admin hệ thống để được hỗ trợ.</p>
    @endif
    
    <br><br>
    <p>Trân trọng,<br><strong>Đội ngũ NQ EduTech</strong></p>
</body>
</html>