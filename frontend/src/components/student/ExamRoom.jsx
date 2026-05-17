// Tôi sẽ viết lại gọn hơn, sử dụng Tailwind, bỏ Bootstrap hoàn toàn
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Send, AlertCircle } from 'lucide-react';
import axios from '../../services/axios';

export default function ExamRoom() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchExam();
    attachAntiCheat();
    return () => { if (timerRef.current) clearInterval(timerRef.current); detachAntiCheat(); };
  }, []);

  const fetchExam = async () => {
    try {
      const res = await axios.get(`/student/exams/attempts/${attemptId}`);
      const data = res.data;
      setQuestions(data.questions);
      const initial = {};
      data.questions.forEach(q => { if (q.saved_answer) initial[q.id] = q.saved_answer; });
      setAnswers(initial);
      setTimeLeft(data.exam.remaining_seconds);
      startTimer(data.exam.remaining_seconds);
    } catch (err) { alert('Lỗi tải bài thi'); navigate('/student/home'); }
  };

  const startTimer = (sec) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswerChange = (qid, val) => {
    setAnswers(prev => ({ ...prev, [qid]: val }));
    axios.post(`/student/exams/attempts/${attemptId}/save-answer`, { question_id: qid, answer_text: val }).catch(() => {});
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await axios.post(`/student/exams/attempts/${attemptId}/submit`);
      navigate(`/student/exam-result/${attemptId}`);
    } catch (err) { alert('Nộp bài thất bại'); setSubmitting(false); }
  };

  const attachAntiCheat = () => {
    const prevent = (e) => { e.preventDefault(); };
    document.addEventListener('contextmenu', prevent);
    document.addEventListener('copy', prevent);
    document.addEventListener('paste', prevent);
  };
  const detachAntiCheat = () => {
    document.removeEventListener('contextmenu', () => {});
    document.removeEventListener('copy', () => {});
    document.removeEventListener('paste', () => {});
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0'+s : s}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm px-6 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600">Phòng thi</h1>
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-full">
          <Clock size={18} />
          <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-xl shadow-sm border p-5">
            <p className="font-semibold mb-3"><span className="text-indigo-600">Câu {idx+1}:</span> {q.content}</p>
            {q.type === 'single' && q.choices?.map(c => (
              <label key={c.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input type="radio" name={`q${q.id}`} value={c.key} checked={answers[q.id] === c.key} onChange={() => handleAnswerChange(q.id, c.key)} className="w-4 h-4 text-indigo-600" />
                <span>{c.key}. {c.text}</span>
              </label>
            ))}
            {q.type === 'multiple' && q.choices?.map(c => {
              const selected = answers[q.id] ? answers[q.id].split(',') : [];
              return (
                <label key={c.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" value={c.key} checked={selected.includes(c.key)} onChange={(e) => {
                    let newVal = [...selected];
                    if (e.target.checked) newVal.push(c.key);
                    else newVal = newVal.filter(k => k !== c.key);
                    handleAnswerChange(q.id, newVal.join(','));
                  }} className="w-4 h-4 text-indigo-600 rounded" />
                  <span>{c.key}. {c.text}</span>
                </label>
              );
            })}
            {q.type === 'fill_blank' && (
              <input type="text" value={answers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="w-full border rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Nhập câu trả lời..." />
            )}
          </div>
        ))}
        <div className="flex justify-end">
          <button onClick={handleSubmit} disabled={submitting} className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md disabled:opacity-50">
            {submitting ? 'Đang nộp...' : 'Nộp bài'}
          </button>
        </div>
      </div>
    </div>
  );
}