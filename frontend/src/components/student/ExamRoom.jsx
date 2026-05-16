import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../services/axios';

export default function ExamRoom() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);
  const violationCount = useRef(0);

  useEffect(() => {
    fetchExamData();
    attachAntiCheat();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      detachAntiCheat();
    };
  }, []);

  const fetchExamData = async () => {
    try {
      // Giả sử có API GET để lấy thông tin attempt hiện tại (đã có start nhưng không nên dùng lại start)
      // Tạm thời dùng start nhưng nếu attempt đã tồn tại thì nó trả về lỗi. Thay bằng API get attempt info.
      // Ở đây tôi sẽ dùng endpoint /student/exams/attempts/{attemptId} (cần tạo thêm)
      // Để nhanh, tôi gọi lại start với examId lấy từ attempt? Không ổn.
      // Giải pháp: thêm route GET /student/exams/attempts/{attempt}
      const res = await axios.get(`/student/exams/attempts/${attemptId}`);
      const data = res.data;
      setExamData(data.exam);
      setQuestions(data.questions);
      const initialAnswers = {};
      data.questions.forEach(q => {
        if (q.saved_answer) initialAnswers[q.id] = q.saved_answer;
      });
      setAnswers(initialAnswers);
      setTimeLeft(data.exam.remaining_seconds);
      startTimer(data.exam.remaining_seconds);
    } catch (err) {
      console.error(err);
      alert('Không thể tải bài thi');
      navigate('/student/home');
    }
  };

  // Thêm API GET trong backend (ExamAttemptController)
  // public function getAttempt(ExamAttempt $attempt) {...}

  const startTimer = (seconds) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    axios.post(`/student/exams/attempts/${attemptId}/save-answer`, {
      question_id: questionId,
      answer_text: value
    }).catch(err => console.error('Auto-save failed'));
  };

  const handleSubmit = async (auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const res = await axios.post(`/student/exams/attempts/${attemptId}/submit`);
      alert(`Nộp bài thành công! Điểm: ${res.data.score}`);
      navigate(`/student/exam-result/${attemptId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi nộp bài');
      setSubmitting(false);
    }
  };

  const attachAntiCheat = () => {
    const preventEvent = (e) => {
      e.preventDefault();
      logViolation('copy_paste');
    };
    document.addEventListener('contextmenu', preventEvent);
    document.addEventListener('copy', preventEvent);
    document.addEventListener('paste', preventEvent);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        logViolation('devtools');
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) logViolation('tab_switch');
    });
    window.__antiCheatHandlers = { preventEvent };
  };

  const detachAntiCheat = () => {
    if (window.__antiCheatHandlers) {
      document.removeEventListener('contextmenu', window.__antiCheatHandlers.preventEvent);
      document.removeEventListener('copy', window.__antiCheatHandlers.preventEvent);
      document.removeEventListener('paste', window.__antiCheatHandlers.preventEvent);
    }
  };

  const logViolation = async (type) => {
    violationCount.current++;
    await axios.post(`/student/exams/attempts/${attemptId}/log-violation`, { type });
    if (violationCount.current >= 3) {
      alert('Bạn đã vi phạm quá 3 lần, bài thi sẽ bị nộp tự động');
      handleSubmit(true);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' + s : s}`;
  };

  if (!examData) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="fixed top-0 right-0 bg-red-600 text-white p-3 rounded-bl-lg z-50 text-xl font-bold">
        Thời gian: {formatTime(timeLeft)}
      </div>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">{examData.title}</h2>
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-4 rounded shadow mb-4">
            <p className="font-semibold">Câu {idx+1}: {q.content}</p>
            {q.type === 'single' && q.choices && (
              <div className="mt-2 space-y-1">
                {q.choices.map(choice => (
                  <label key={choice.key} className="block">
                    <input
                      type="radio"
                      name={`q${q.id}`}
                      value={choice.key}
                      checked={answers[q.id] === choice.key}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="mr-2"
                    />
                    {choice.key}. {choice.text}
                  </label>
                ))}
              </div>
            )}
            {q.type === 'multiple' && q.choices && (
              <div className="mt-2 space-y-1">
                {q.choices.map(choice => {
                  const selected = answers[q.id] ? answers[q.id].split(',') : [];
                  return (
                    <label key={choice.key} className="block">
                      <input
                        type="checkbox"
                        value={choice.key}
                        checked={selected.includes(choice.key)}
                        onChange={(e) => {
                          let newVal = [...selected];
                          if (e.target.checked) newVal.push(choice.key);
                          else newVal = newVal.filter(k => k !== choice.key);
                          handleAnswerChange(q.id, newVal.join(','));
                        }}
                        className="mr-2"
                      />
                      {choice.key}. {choice.text}
                    </label>
                  );
                })}
              </div>
            )}
            {q.type === 'fill_blank' && (
              <input
                type="text"
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                className="mt-2 border p-2 w-full rounded"
                placeholder="Nhập câu trả lời..."
              />
            )}
          </div>
        ))}
        <button
          onClick={() => handleSubmit()}
          disabled={submitting}
          className="bg-orange-600 text-white px-6 py-3 rounded hover:bg-orange-700 disabled:opacity-50"
        >
          {submitting ? 'Đang nộp...' : 'Nộp bài'}
        </button>
      </div>
    </div>
  );
}