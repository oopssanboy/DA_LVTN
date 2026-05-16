import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../../services/axios';

export default function ExamResult() {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);

  useEffect(() => {
    axios.get(`/student/exams/attempts/${attemptId}/result`)
      .then(res => setResult(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!result) return <div>Đang tải...</div>;

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold">Kết quả bài thi</h2>
        <p className="text-lg">Điểm tổng: <strong className="text-orange-600">{result.total_score}</strong> / 10</p>
        <p>Kết quả: {result.is_passed ? 'Đạt' : 'Không đạt'}</p>
      </div>
      <div className="space-y-4">
        {result.details.map((detail, idx) => (
          <div key={detail.question_id} className="border rounded p-4 bg-white">
            <p><strong>Câu {idx+1}:</strong> {detail.content}</p>
            <p>Đáp án của bạn: {detail.user_answer || '(chưa trả lời)'}</p>
            <p>Đáp án đúng: {detail.correct_answer}</p>
            <p className={detail.is_correct ? 'text-green-600' : 'text-red-600'}>
              {detail.is_correct ? 'Đúng' : 'Sai'} - Điểm: {detail.score_earned}
            </p>
            {detail.explanation && <p className="text-gray-600 mt-2">Giải thích: {detail.explanation}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}