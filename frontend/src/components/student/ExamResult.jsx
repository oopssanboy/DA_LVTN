import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import axios from '../../services/axios';

export default function ExamResult() {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);

  useEffect(() => {
    axios.get(`/student/exams/attempts/${attemptId}/result`).then(res => setResult(res.data));
  }, []);

  if (!result) return <div className="p-6 text-center">Đang tải...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-md p-6 mb-6 text-center">
        <h2 className="text-2xl font-bold">Kết quả bài thi</h2>
        <p className="text-4xl font-bold text-indigo-600 mt-2">{result.total_score} / 10</p>
        <p className="mt-1">{result.is_passed ? '🎉 Đạt' : '📘 Chưa đạt'}</p>
      </div>
      <div className="space-y-4">
        {result.details.map((d, idx) => (
          <div key={d.question_id} className="bg-white rounded-xl border p-5">
            <div className="flex justify-between items-start">
              <p className="font-medium"><span className="text-indigo-600">Câu {idx+1}:</span> {d.content}</p>
              {d.is_correct ? <CheckCircle className="text-green-500" size={20} /> : <XCircle className="text-red-500" size={20} />}
            </div>
            <p className="text-sm text-gray-600 mt-2">Đáp án của bạn: {d.user_answer || '(chưa trả lời)'}</p>
            {!d.is_correct && <p className="text-sm text-gray-600">Đáp án đúng: {d.correct_answer}</p>}
            {d.explanation && <p className="text-sm text-gray-500 mt-2 italic">💡 {d.explanation}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}