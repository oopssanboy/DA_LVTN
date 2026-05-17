import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaClock, FaCheckCircle, FaExclamationCircle, FaTimesCircle, FaShieldAlt } from 'react-icons/fa';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function DoingExam() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [cheatCount, setCheatCount] = useState(0);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');
  const timerRef = useRef(null);

  const examId = exam?.id;

  // 👉 BỘ LẮNG NGHE ĐỒNG BỘ TIN NHẮN REALTIME TỪ GIÁM THỊ PHÒNG THI
  useEffect(() => {
    if (!examId || !window.echo) return;

    console.log(`📡 Sinh viên kết nối thành công phòng bộ đàm: exam.${examId}`);

    const channel = window.echo.channel(`exam.${examId}`)
      .listen('.violation.updated', (data) => {
        console.log("📩 Nhận gói dữ liệu Realtime chỉ thị từ Giám thị:", data);

        // Khớp chính xác ID lượt thi của sinh viên hiện tại
        if (parseInt(data.attemptId) === parseInt(attemptId)) {
          
          // Trường hợp 1: Nhận lời nhắn nhắc nhở thủ công từ giám thị
          if (data.type === 'warning') {
            Swal.fire({
              title: 'CẢNH BÁO TỪ GIÁM THỊ!',
              text: data.message || 'Chú ý: Giám thị yêu cầu bạn tập trung làm bài, nghiêm túc thi!',
              icon: 'warning',
              confirmButtonColor: '#f59e0b',
              allowOutsideClick: false // Bắt sinh viên bấm OK mới tắt được để tăng tính răn đe
            });
          } 
          
          // Trường hợp 2: Nhận lệnh cưỡng chế thu bài khẩn cấp
          else if (data.type === 'force_submit') {
            Swal.fire({
              title: 'ĐÌNH CHỈ THI!',
              text: 'Bài thi của bạn đã bị cưỡng chế thu và khóa lại bởi hội đồng giám thị.',
              icon: 'error',
              confirmButtonColor: '#ef4444',
              allowOutsideClick: false
            }).then(() => {
              navigate('/student/home'); // Trục xuất sinh viên thẳng ra màn hình chính
            });
          }
        }
      });

    return () => {
      window.echo.leaveChannel(`exam.${examId}`);
    };
  }, [examId, attemptId, navigate]);

  // Bộ tải dữ liệu đề thi gốc
  useEffect(() => {
    fetch(`${API_URL}/student/exams/attempts/${attemptId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Lỗi tải đề thi');
        return data;
      })
      .then(data => {
        if (data.status === 'submitted') {
          setResult(data);
          setIsLoading(false);
          return;
        }
        setExam(data.exam);
        setQuestions(data.questions);
        setTimeLeft(data.remaining_seconds);
        setCheatCount(data.violation_count || 0);

        const savedAnswers = {};
        data.questions.forEach(q => {
          if (q.saved_answer) savedAnswers[q.id] = q.saved_answer;
        });
        setAnswers(savedAnswers);
        setIsLoading(false);
      })
      .catch(err => {
        Swal.fire('Lỗi truy cập', err.message, 'error');
        navigate('/student/home');
      });
  }, [attemptId, token, API_URL, navigate]);

  // Bộ đếm thời gian ngược
  useEffect(() => {
    if (timeLeft === null || result) return;
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft, result]);

  // Bộ gian lận tự động cục bộ ở client tab-switch
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && !result && !isLoading) {
        try {
          const res = await axios.post(`${API_URL}/student/exams/attempts/${attemptId}/log-violation`, {
            type: 'tab_switch',
            detail: 'Sinh viên chuyển tab hoặc thu nhỏ trình duyệt'
          }, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
          });
          setCheatCount(res.data.violation_count);
          Swal.fire({
            title: 'CẢNH BÁO!',
            text: `Bạn vừa rời khỏi màn hình làm bài! Số lần vi phạm: ${res.data.violation_count}/3`,
            icon: 'warning',
            confirmButtonColor: '#f59e0b'
          });
        } catch (error) {
          if (error.response && error.response.status === 403) {
            setCheatCount(3);
            Swal.fire({
              title: 'ĐÌNH CHỈ THI!',
              text: error.response.data.message || 'BẠN ĐÃ VI PHẠM QUY CHẾ QUÁ 3 LẦN. HỆ THỐNG ĐÃ TỰ ĐỘNG THU BÀI!',
              icon: 'error',
              confirmButtonColor: '#ef4444'
            }).then(() => navigate('/student/home'));
          }
        }
      }
    };

    const handlePreventCheating = async (e) => {
      if (!result && !isLoading) {
        e.preventDefault();
        let violationType = 'copy_paste';
        if (e.type === 'contextmenu') violationType = 'right_click';

        try {
          const res = await axios.post(`${API_URL}/student/exams/attempts/${attemptId}/log-violation`, {
            type: violationType,
            detail: `Sinh viên lận nền hành vi: ${e.type}`
          }, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
          });
          setCheatCount(res.data.violation_count);
          Swal.fire({
            title: 'CẢNH BÁO!',
            text: 'Hành động sao chép tài liệu hoặc mở chuột phải bị cấm trong phòng thi!',
            icon: 'warning',
            toast: true,
            position: 'top-end',
            timer: 3000,
            showConfirmButton: false
          });
        } catch (error) {
          if (error.response && error.response.status === 403) {
            setCheatCount(3);
            Swal.fire({
              title: 'ĐÌNH CHỈ THI!',
              text: error.response.data.message || 'BẠN ĐÃ VI PHẠM QUY CHẾ QUÁ 3 LẦN. HỆ THỐNG ĐÃ TỰ ĐỘNG THU BÀI!',
              icon: 'error',
              confirmButtonColor: '#ef4444'
            }).then(() => navigate('/student/home'));
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("copy", handlePreventCheating);
    window.addEventListener("paste", handlePreventCheating);
    window.addEventListener("contextmenu", handlePreventCheating);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("copy", handlePreventCheating);
      window.removeEventListener("paste", handlePreventCheating);
      window.removeEventListener("contextmenu", handlePreventCheating);
    };
  }, [attemptId, token, API_URL, navigate, result, isLoading]);

  const handleSelectAnswer = async (questionId, option) => {
    if (result) return;
    setAnswers(prev => ({ ...prev, [questionId]: option }));
    try {
      await fetch(`${API_URL}/student/exams/attempts/${attemptId}/save-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ question_id: questionId, answer_text: option })
      });
    } catch (err) {
      console.error("Lỗi tự động lưu tiến độ:", err);
    }
  };

  const handleSubmit = async (isAuto = false) => {
    if (result) return;
    if (!isAuto) {
      const confirm = await Swal.fire({
        title: 'Xác nhận nộp bài?',
        text: 'Bạn chắc chắn muốn kết thúc kỳ thi để tính điểm?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Vâng, nộp bài',
        cancelButtonText: 'Làm tiếp'
      });
      if (!confirm.isConfirmed) return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/student/exams/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setResult(data);
      Swal.fire('Thành công', 'Bài thi của bạn đã được lưu chấm điểm.', 'success');
    } catch (err) {
      Swal.fire('Lỗi nộp bài', err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds <= 0 || seconds === null) return "00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (isLoading) {
    return <div className="text-center py-20 text-gray-500 font-medium">Đang mở khóa niêm phong cấu trúc đề thi ma trận...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{exam?.title}</h2>
              <p className="text-sm text-gray-500 mt-1">Môn học: {exam?.subject}</p>
            </div>
            <div className="flex items-center gap-4 bg-red-50 text-red-600 px-4 py-2 rounded-xl border border-red-100 font-bold">
              <FaClock />
              <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="font-semibold text-gray-900 flex gap-2">
                  <span>Câu {idx + 1}:</span>
                  <div dangerouslySetInnerHTML={{ __html: q.content }} />
                </div>

                {q.type !== 'fill_blank' && q.choices ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4">
                    {q.choices.map(c => (
                      <label key={c.key} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition select-none text-sm">
                        <input
                          type={q.type === 'single' ? 'radio' : 'checkbox'}
                          name={`q-${q.id}`}
                          checked={answers[q.id] === c.key}
                          onChange={() => handleSelectAnswer(q.id, c.key)}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-700">{c.key}. {c.text}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="pl-4">
                    <input
                      type="text"
                      className="w-full sm:w-1/2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition text-sm"
                      placeholder="Gõ kết quả câu trả lời của bạn tại đây..."
                      value={answers[q.id] || ''}
                      onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 sticky top-6">
            <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Tiến độ bài làm</h3>
              <div className="flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-1 rounded-md border border-amber-200">
                <FaShieldAlt /> Vi phạm: {cheatCount}/3
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, index) => (
                <div
                  key={q.id}
                  className={`h-9 w-9 flex items-center justify-center font-bold text-xs rounded-lg transition border ${
                    answers[q.id] 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  {index + 1}
                </div>
              ))}
            </div>

            <button
              onClick={() => handleSubmit(false)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition shadow-sm shadow-emerald-500/10 active:scale-[0.98]"
            >
              NỘP BÀI THI NGAY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}