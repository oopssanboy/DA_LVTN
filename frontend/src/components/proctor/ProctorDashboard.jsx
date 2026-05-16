import { useEffect, useState } from 'react';
import axios from '../../services/axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

export default function ProctorDashboard() {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [echo, setEcho] = useState(null);

  useEffect(() => {
    fetchActiveExams();
    // Khởi tạo Echo (cần cấu hình theo Reverb hoặc Pusher)
    const echoInstance = new Echo({
      broadcaster: 'reverb',
      key: import.meta.env.VITE_REVERB_APP_KEY,
      wsHost: import.meta.env.VITE_REVERB_HOST,
      wsPort: import.meta.env.VITE_REVERB_PORT,
      forceTLS: false,
      enabledTransports: ['ws', 'wss'],
    });
    setEcho(echoInstance);
    return () => {
      if (echoInstance) echoInstance.disconnect();
    };
  }, []);

  const fetchActiveExams = async () => {
    try {
      const res = await axios.get('/proctor/active-exams');
      setExams(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttempts = async (examId) => {
    try {
      const res = await axios.get(`/proctor/exams/${examId}/attempts`);
      setAttempts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectExam = (exam) => {
    setSelectedExam(exam);
    fetchAttempts(exam.id);
    // Subscribe vào channel realtime
    if (echo) {
      echo.channel(`proctor.exam.${exam.id}`).listen('.violation.updated', (e) => {
        // Cập nhật lại danh sách attempts khi có sự kiện
        fetchAttempts(exam.id);
      });
    }
  };

  const forceSubmit = async (attemptId) => {
    if (window.confirm('Bạn có chắc muốn force submit bài thi này?')) {
      try {
        await axios.post(`/proctor/attempts/${attemptId}/force-submit`);
        alert('Đã force submit');
        fetchAttempts(selectedExam.id);
      } catch (err) {
        alert(err.response?.data?.message || 'Lỗi');
      }
    }
  };

  const sendWarning = async (attemptId) => {
    const msg = prompt('Nhập nội dung cảnh báo:');
    if (msg) {
      try {
        await axios.post(`/proctor/attempts/${attemptId}/warn`, { message: msg });
        alert('Đã gửi cảnh báo');
      } catch (err) {
        alert('Lỗi gửi cảnh báo');
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Proctor Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Kỳ thi đang diễn ra</h2>
          {exams.map(exam => (
            <div key={exam.id} className="border-b py-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSelectExam(exam)}>
              <div className="font-medium">{exam.title}</div>
              <div className="text-sm text-gray-600">Số thí sinh đang thi: {exam.active_attempts}</div>
            </div>
          ))}
        </div>
        <div className="md:col-span-2 bg-white p-4 rounded shadow">
          {selectedExam ? (
            <>
              <h2 className="text-xl font-semibold mb-2">{selectedExam.title}</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th>Họ tên</th>
                      <th>Email</th>
                      <th>Bắt đầu lúc</th>
                      <th>Thời gian còn lại</th>
                      <th>Vi phạm</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map(att => (
                      <tr key={att.id} className="border-b">
                        <td>{att.student?.name}</td>
                        <td>{att.student?.email}</td>
                        <td>{new Date(att.started_at).toLocaleTimeString()}</td>
                        <td className={att.remaining_seconds < 60 ? 'text-red-600' : ''}>
                          {att.status === 'in_progress' ? Math.floor(att.remaining_seconds / 60) + ':' + (att.remaining_seconds % 60) : 'Đã nộp'}
                        </td>
                        <td>{att.violation_count}</td>
                        <td>
                          {att.status === 'in_progress' ? 'Đang thi' : (att.status === 'submitted' ? 'Đã nộp' : 'Bị khóa')}
                        </td>
                        <td>
                          {att.status === 'in_progress' && (
                            <>
                              <button onClick={() => forceSubmit(att.id)} className="bg-red-600 text-white px-2 py-1 rounded text-sm mr-2">Force nộp</button>
                              <button onClick={() => sendWarning(att.id)} className="bg-yellow-600 text-white px-2 py-1 rounded text-sm">Cảnh báo</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p>Chọn một kỳ thi để giám sát</p>
          )}
        </div>
      </div>
    </div>
  );
}