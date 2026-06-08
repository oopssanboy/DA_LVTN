import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ShieldAlert, CheckCircle2, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Cấu hình Pusher global nếu chưa có
window.Pusher = Pusher;

export default function ExamRoom() {
    const { attemptId } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    
    const [timeLeft, setTimeLeft] = useState(null);
    const [cheatCount, setCheatCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const timerRef = useRef(null);
    const echoRef = useRef(null);

    // 1. Lấy dữ liệu bài thi
    useEffect(() => {
        fetchExamData();
        return () => clearInterval(timerRef.current);
    }, [attemptId]);

    const fetchExamData = async () => {
        try {
            const res = await api.get(`/student/attempts/${attemptId}`);
            const data = res.data;
            
            setExam(data.exam);
            setAttempt(data.attempt);
            setQuestions(data.questions);
            setTimeLeft(data.remaining_seconds);
            setCheatCount(data.violation_count);

            // Nạp đáp án đã lưu (nếu có)
            const initialAnswers = {};
            data.questions.forEach(q => {
                if (q.saved_choice_id) initialAnswers[q.id] = q.saved_choice_id;
                else if (q.saved_answer_text) initialAnswers[q.id] = q.saved_answer_text;
            });
            setAnswers(initialAnswers);

            // Khởi động Timer & Socket
            startTimer(data.remaining_seconds);
            setupSocket(data.exam.id);

        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể tải đề thi');
            navigate('/student/dashboard');
        } finally {
            setLoading(false);
        }
    };

    // 2. Logic đếm ngược thời gian
    const startTimer = (seconds) => {
        if (timerRef.current) clearInterval(timerRef.current);
        
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // 3. Logic WebSockets (Lắng nghe Giám thị)
    const setupSocket = (examId) => {
        if (!echoRef.current) {
            echoRef.current = new Echo({
                broadcaster: 'reverb',
                key: import.meta.env.VITE_REVERB_APP_KEY,
                wsHost: import.meta.env.VITE_REVERB_HOST,
                wsPort: import.meta.env.VITE_REVERB_PORT,
                wssPort: import.meta.env.VITE_REVERB_PORT,
                forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
                enabledTransports: ['ws', 'wss'],
            });

            echoRef.current.channel(`exam.${examId}`)
                .listen('.violation.updated', (e) => {
                    if (e.attemptId === parseInt(attemptId)) {
                        if (e.type === 'forced_submit') {
                            Swal.fire('Bị thu bài!', 'Giám thị đã buộc thu bài thi của bạn.', 'error').then(() => {
                                navigate(`/student/exam-result/${attemptId}`);
                            });
                        } else if (e.type === 'warning') {
                            toast.error(`⚠️ Cảnh báo từ Giám thị: ${e.message}`, { duration: 5000 });
                        }
                    }
                });
        }
    };

    // 4. Logic Chống gian lận (Chuyển tab)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && !isSubmitting && timeLeft > 0) {
                logCheat('Rời khỏi tab thi');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isSubmitting, timeLeft]);

    const logCheat = async (reason) => {
        try {
            const res = await api.post(`/student/attempts/${attemptId}/violation`, { type: reason });
            setCheatCount(res.data.violation_count);
            Swal.fire('Cảnh báo!', `Bạn đã rời khỏi màn hình thi. Vi phạm lần: ${res.data.violation_count}/3`, 'warning');
        } catch (error) {
            if (error.response?.status === 403) {
                // Quá 3 lần -> Bị thu bài
                clearInterval(timerRef.current);
                Swal.fire('ĐÌNH CHỈ THI', error.response.data.message, 'error').then(() => {
                    navigate(`/student/exam-result/${attemptId}`);
                });
            }
        }
    };

    // 5. Lưu đáp án (Auto-save)
    const handleAnswerChange = async (questionId, value, isFillBlank = false) => {
        const newAnswers = { ...answers, [questionId]: value };
        setAnswers(newAnswers);

        try {
            const payload = { question_id: questionId };
            if (isFillBlank) payload.answer_text = value;
            else payload.choice_id = value;

            await api.patch(`/student/attempts/${attemptId}/answers`, payload);
        } catch (error) {
            toast.error('Lỗi mạng: Không thể lưu đáp án tạm thời');
        }
    };

    // 6. Nộp bài
    const handleManualSubmit = () => {
        Swal.fire({
            title: 'Nộp bài thi?',
            text: "Bạn có chắc chắn muốn nộp bài? Hành động này không thể hoàn tác.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#cbd5e1',
            confirmButtonText: 'Vâng, Nộp bài!'
        }).then((result) => {
            if (result.isConfirmed) submitExam();
        });
    };

    const handleAutoSubmit = () => {
        Swal.fire('Hết giờ!', 'Hệ thống đang tự động thu bài...', 'info');
        submitExam();
    };

    const submitExam = async () => {
        setIsSubmitting(true);
        clearInterval(timerRef.current);
        try {
            await api.post(`/student/attempts/${attemptId}/submit`);
            toast.success('Nộp bài thành công!');
            navigate(`/student/exam-result/${attemptId}`);
        } catch (error) {
            toast.error('Lỗi khi nộp bài');
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start pb-20">
            
            {/* Cột trái: Danh sách câu hỏi */}
            <div className="flex-1 w-full space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h1 className="text-2xl font-bold text-slate-800">{exam?.title}</h1>
                    <p className="text-slate-500 mt-1">{exam?.subject?.name} - {exam?.subject?.code}</p>
                </div>

                {questions.map((q, index) => (
                    <div key={q.id} id={`question-${index}`} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-start gap-4 mb-4">
                            <span className="shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                                {index + 1}
                            </span>
                            <div className="prose max-w-none text-slate-800 font-medium pt-1" dangerouslySetInnerHTML={{ __html: q.content }} />
                        </div>

                        <div className="pl-12 space-y-3">
                            {q.type === 'fill_blank' ? (
                                <input
                                    type="text"
                                    value={answers[q.id] || ''}
                                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                    onBlur={(e) => handleAnswerChange(q.id, e.target.value, true)}
                                    placeholder="Nhập câu trả lời của bạn..."
                                    className="w-full md:w-1/2 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition bg-slate-50"
                                />
                            ) : (
                                q.choices.map(c => (
                                    <label key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${answers[q.id] === c.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                                        <input
                                            type={q.type === 'single' ? 'radio' : 'checkbox'}
                                            name={`question-${q.id}`}
                                            checked={answers[q.id] === c.id}
                                            onChange={() => handleAnswerChange(q.id, c.id)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-700">{c.text}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Cột phải: Bảng điều khiển (Sticky) */}
            <div className="w-full lg:w-80 lg:sticky lg:top-24 space-y-4 shrink-0">
                
                {/* Timer & Cảnh báo */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500 mb-2 font-medium">
                        <Clock className="w-5 h-5" /> Thời gian còn lại
                    </div>
                    <div className={`text-4xl font-black font-mono tracking-tight ${timeLeft < 300 ? 'text-red-500' : 'text-slate-800'}`}>
                        {formatTime(timeLeft)}
                    </div>
                    
                    {cheatCount > 0 && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-200 text-sm font-bold">
                            <ShieldAlert className="w-4 h-4" /> Vi phạm: {cheatCount}/3
                        </div>
                    )}
                </div>

                {/* Question Grid */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Danh sách câu hỏi</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {questions.map((q, index) => {
                            const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                            return (
                                <button
                                    key={q.id}
                                    onClick={() => document.getElementById(`question-${index}`).scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                    className={`h-10 w-10 flex items-center justify-center rounded-xl text-sm font-bold transition border 
                                        ${isAnswered ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-blue-300'}`}
                                >
                                    {index + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button
                    onClick={handleManualSubmit}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 transition flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> NỘP BÀI THI</>}
                </button>
            </div>
        </div>
    );
}