import { useEffect, useState } from 'react';
import axios from '../../services/axios'; // instance axios đã cấu hình
import { useNavigate } from 'react-router-dom';

export default function ExamList() {
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await axios.get('/student/exams');
      setExams(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const startExam = async (examId) => {
    try {
      const res = await axios.post(`/student/exams/${examId}/start`);
      navigate(`/exam/${res.data.attempt_id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể bắt đầu thi');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Kỳ thi của tôi</h2>
      <div className="grid gap-4">
        {exams.map((exam) => (
          <div key={exam.id} className="border rounded-lg p-4 shadow">
            <h3 className="text-xl font-semibold">{exam.title}</h3>
            <p>Môn: {exam.subject}</p>
            <p>Thời gian: {exam.duration} phút</p>
            <p>Lớp: {exam.class?.course?.title} - {exam.class?.name}</p>
            {exam.attempt_status === 'not_started' && (
              <button onClick={() => startExam(exam.id)} className="mt-2 bg-orange-600 text-white px-4 py-2 rounded">Vào thi</button>
            )}
            {exam.attempt_status === 'in_progress' && (
              <button onClick={() => navigate(`/exam/${exam.attempt_id}`)} className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded">Tiếp tục</button>
            )}
            {exam.attempt_status === 'submitted' && (
              <button onClick={() => navigate(`/exam-result/${exam.attempt_id}`)} className="mt-2 bg-green-600 text-white px-4 py-2 rounded">Xem kết quả</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}