import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaClock, FaShieldAlt } from 'react-icons/fa';
import axios from 'axios';
import Swal from 'sweetalert2';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

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
  const [examId, setExamId] = useState(null); // 👈 state riêng để subscribe

  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');
  const timerRef = useRef(null);
  const echoRef = useRef(null);

  // 1. Khởi tạo Echo chỉ 1 lần
  useEffect(() => {
    console.log("🔄 Khởi tạo Echo...");
    const echoInstance = new Echo({
      broadcaster: 'reverb',
      key: import.meta.env.VITE_REVERB_APP_KEY,
      wsHost: import.meta.env.VITE_REVERB_HOST || '127.0.0.1',
      wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
      wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
      forceTLS: false,
      enabledTransports: ['ws', 'wss'],
    });

    echoInstance.connector.pusher.connection.bind('connected', () => {
      console.log('✅ WebSocket connected (sinh viên)');
      Swal.fire({
        toast: true, position: 'bottom-end', icon: 'success',
        title: 'Đã kết nối hệ thống giám sát', showConfirmButton: false, timer: 2000
      });
    });

    echoInstance.connector.pusher.connection.bind('error', (err) => {
      console.error('❌ WebSocket error:', err);
    });

    echoRef.current = echoInstance;
    return () => {
      if (echoRef.current) echoRef.current.disconnect();
    };
  }, []);

  // 2. Fetch dữ liệu bài thi và lấy examId
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
          navigate('/student/home');
          return;
        }
        console.log("📦 Dữ liệu exam:", data.exam);
        setExam(data.exam);
        setExamId(data.exam.exam_id); // 👈 phải có id
        console.log("🆔 Đã set examId:", data.exam.id);
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
        Swal.fire('Lỗi truy cập', err.message, 'error').then(()=> navigate('/student/home'));
      });
  }, [attemptId, token, API_URL, navigate]);

  // 3. Lắng nghe realtime event khi có examId
  useEffect(() => {
      console.log("🔁 Effect lắng nghe chạy, examId =", examId, "echoRef =", !!echoRef.current);
    if (!examId || !echoRef.current) {
      console.log("⏳ Chưa có examId hoặc Echo chưa sẵn sàng");
      return;
    }

    const channelName = `exam.${examId}`;
    console.log(`📡 Đang lắng nghe channel: ${channelName}`);
    const channel = echoRef.current.channel(channelName);

    const handleRealtimeEvent = (data) => {
      console.log("📩 [Sinh viên] Nhận event:", data);
      if (parseInt(data.attemptId) !== parseInt(attemptId)) return; // chỉ xử lý đúng lượt thi

      if (data.type === 'warning') {
        Swal.fire({
          title: 'CẢNH BÁO TỪ GIÁM THỊ!',
          text: data.message || 'Yêu cầu bạn tập trung làm bài, nghiêm túc thi!',
          icon: 'warning',
          confirmButtonColor: '#f59e0b',
          allowOutsideClick: false
        });
      } 
      else if (data.type === 'force_submit') {
        Swal.fire({
          title: 'ĐÌNH CHỈ THI!',
          text: data.message || 'Bài thi của bạn đã bị cưỡng chế thu và khóa lại!',
          icon: 'error',
          confirmButtonColor: '#ef4444',
          allowOutsideClick: false
        }).then(() => {
          navigate('/student/home');
        });
      }
    };

    channel.listen('.violation.updated', handleRealtimeEvent);

    return () => {
      console.log(`👋 Rời kênh ${channelName}`);
      if (echoRef.current) {
        echoRef.current.leaveChannel(channelName);
      }
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
          navigate('/student/home');
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
        Swal.fire('Lỗi truy cập', err.message, 'error').then(()=> navigate('/student/home'));
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

  // Lắng nghe gian lận cục bộ ở Client 
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && !result && !isLoading) {
        try {
          const res = await axios.post(`${API_URL}/student/exams/attempts/${attemptId}/log-violation`, {
            type: 'tab_switch', detail: 'Sinh viên chuyển tab hoặc thu nhỏ trình duyệt'
          }, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }});
          
          setCheatCount(res.data.violation_count);
          Swal.fire({
            title: 'CẢNH BÁO!',
            text: `Bạn vừa rời khỏi màn hình làm bài! Số lần vi phạm: ${res.data.violation_count}/3`,
            icon: 'warning', confirmButtonColor: '#f59e0b'
          });
        } catch (error) {
          if (error.response && error.response.status === 403) {
            setCheatCount(3);
            Swal.fire({
              title: 'ĐÌNH CHỈ THI!',
              text: error.response.data.message || 'BẠN ĐÃ VI PHẠM QUY CHẾ QUÁ 3 LẦN. HỆ THỐNG ĐÃ TỰ ĐỘNG THU BÀI!',
              icon: 'error', confirmButtonColor: '#ef4444', allowOutsideClick: false
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
            type: violationType, detail: `Thực hiện hành vi: ${e.type}`
          }, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }});
          
          setCheatCount(res.data.violation_count);
          Swal.fire({
            title: 'CẢNH BÁO!',
            text: 'Hành động sao chép tài liệu hoặc mở chuột phải bị cấm trong phòng thi!',
            icon: 'warning', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false
          });
        } catch (error) {
          if (error.response && error.response.status === 403) {
            setCheatCount(3);
            Swal.fire({
              title: 'ĐÌNH CHỈ THI!',
              text: error.response.data.message || 'BẠN ĐÃ VI PHẠM QUY CHẾ QUÁ 3 LẦN. HỆ THỐNG ĐÃ TỰ ĐỘNG THU BÀI!',
              icon: 'error', confirmButtonColor: '#ef4444', allowOutsideClick: false
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
    } catch (err) {}
  };

  const handleSubmit = async (isAuto = false) => {
    if (result) return;
    if (!isAuto) {
      const confirm = await Swal.fire({
        title: 'Xác nhận nộp bài?',
        text: 'Bạn chắc chắn muốn kết thúc kỳ thi để tính điểm?',
        icon: 'question', showCancelButton: true,
        confirmButtonColor: '#10b981', cancelButtonColor: '#6b7280',
        confirmButtonText: 'Vâng, nộp bài', cancelButtonText: 'Làm tiếp'
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
      
      Swal.fire({
        title: 'Đã nộp bài!', text: 'Bài thi của bạn đã được ghi nhận chấm điểm.',
        icon: 'success', confirmButtonColor: '#10b981'
      }).then(() => { navigate('/student/home'); });
    } catch (err) {
      Swal.fire('Lỗi nộp bài', err.message, 'error').then(() => navigate('/student/home'));
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

  if (isLoading) return <div className="text-center py-20 font-medium">Đang mở khóa niêm phong cấu trúc đề thi...</div>;

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
                <div key={q.id} className={`h-9 w-9 flex items-center justify-center font-bold text-xs rounded-lg transition border ${answers[q.id] ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                  {index + 1}
                </div>
              ))}
            </div>
            <button onClick={() => handleSubmit(false)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition shadow-sm shadow-emerald-500/10 active:scale-[0.98]">
              NỘP BÀI THI NGAY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}