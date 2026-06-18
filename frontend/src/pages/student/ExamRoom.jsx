import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

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
    const hasFetched = useRef(false);

    useEffect(() => {
        if (!hasFetched.current) {
            fetchExamData();
            hasFetched.current = true;
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            
            // Ngắt kết nối toàn bộ Echo khi component bị hủy (học viên rời phòng/f5)
            if (echoRef.current) {
                echoRef.current.disconnect();
                echoRef.current = null;
            }
        };
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

            const initialAnswers = {};
            data.questions.forEach(q => {
                if (q.saved_choice_id) initialAnswers[q.id] = q.saved_choice_id;
                else if (q.saved_answer_text) initialAnswers[q.id] = q.saved_answer_text;
            });
            setAnswers(initialAnswers);

            startTimer(data.remaining_seconds);
            setupEcho(data.exam.id);

        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể tải đề thi');
            navigate('/student/my-exams');
        } finally {
            setLoading(false);
        }
    };

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

    // 🔥 FIX ĐỒNG HỒ 00:00:00 CHUẨN
    const formatTime = (seconds) => {
        if (seconds === null || isNaN(seconds) || seconds < 0) return '00:00:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const setupEcho = (examId) => {
        // 🔥 ĐÃ SỬA: Nếu đang có kết nối cũ thì phải ngắt nó đi trước khi tạo cái mới
        if (echoRef.current) {
            echoRef.current.disconnect();
        }

        try {
            const appKey = import.meta.env.VITE_REVERB_APP_KEY;
            if (!appKey) {
                console.warn("⚠️ Không tìm thấy cấu hình VITE_REVERB_APP_KEY. Chế độ giám sát Realtime tạm tắt.");
                return;
            }

            echoRef.current = new Echo({
                broadcaster: 'reverb',
                key: appKey,
                wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
                wsPort: import.meta.env.VITE_REVERB_PORT || 8000,
                wssPort: import.meta.env.VITE_REVERB_PORT || 8000,
                forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
                enabledTransports: ['ws', 'wss'],
            });

            echoRef.current.channel(`exam.${examId}`)
                .listen('.violation.updated', (e) => {
                    if (e.attemptId === parseInt(attemptId)) {
                        if (e.type === 'forced_submit') {
                            clearInterval(timerRef.current);
                            Swal.fire('Bị thu bài!', 'Giám thị đã buộc nộp bài thi của bạn.', 'error').then(() => {
                                navigate(`/student/exam-result/${attemptId}`);
                            });
                        } else if (e.type === 'warning') {
                            // Cảnh báo chỉ hiện 1 lần duy nhất!
                            toast.error(`⚠️ Cảnh báo từ Giám thị: ${e.message}`, { duration: 6000 });
                        }
                    }
                });
        } catch (err) {
            console.error("❌ Lỗi kết nối Socket Realtime:", err);
        }
    };

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && !isSubmitting && timeLeft > 0) {
                handleViolation('Chuyển tab hoặc rời khỏi màn hình thi');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isSubmitting, timeLeft]);

    const handleViolation = async (reason) => {
        try {
            const res = await api.post(`/student/attempts/${attemptId}/violation`, { type: reason });
            setCheatCount(res.data.violation_count);
            Swal.fire('Cảnh báo!', `Hành vi: ${reason}. Vi phạm lần: ${res.data.violation_count}/3`, 'warning');
        } catch (error) {
            if (error.response?.status === 403) {
                clearInterval(timerRef.current);
                setIsSubmitting(true);
                Swal.fire('ĐÌNH CHỈ THI', error.response.data.message, 'error').then(() => {
                    navigate(`/student/exam-result/${attemptId}`);
                });
            }
        }
    };

    const handleAnswerChange = async (questionId, value, isFillBlank = false) => {
        const newAnswers = { ...answers, [questionId]: value };
        setAnswers(newAnswers);

        try {
            const payload = { question_id: questionId };
            if (isFillBlank) payload.answer_text = value;
            else payload.choice_id = value;

            await api.patch(`/student/attempts/${attemptId}/answers`, payload);
        } catch (error) {
            console.error('Auto-save đáp án thất bại.');
        }
    };

    const handleManualSubmit = () => {
        Swal.fire({
            title: 'Xác nhận nộp bài?',
            text: "Hành động này không thể hoàn tác sau khi gửi.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#cbd5e1',
            confirmButtonText: 'Vâng, Nộp bài'
        }).then((result) => {
            if (result.isConfirmed) submitExam();
        });
    };

    const handleAutoSubmit = () => {
        Swal.fire('Hết giờ!', 'Hệ thống tự động thu bài...', 'info');
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
            toast.error('Có lỗi xảy ra khi nộp bài');
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>;

    // 🔥 FIX MÀN HÌNH TRẮNG: Trích xuất Text an toàn tuyệt đối ra khỏi Object trước khi render JSX
    const safeSubjectName = typeof exam?.subject === 'object' ? exam?.subject?.name : (exam?.subject || 'Chưa cập nhật');

    return (
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start pb-20 font-sans mt-6 px-4">
            <div className="flex-1 w-full space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h1 className="text-2xl font-bold text-slate-800">{exam?.title}</h1>
                    <p className="text-slate-500 mt-1">{safeSubjectName} - {exam?.duration} Phút</p>
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
                                    className="w-full md:w-1/2 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition bg-slate-50"
                                />
                            ) : (
                                q.choices.map(c => (
                                    <label key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${answers[q.id] === c.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                                        <input
                                            type={q.type === 'single' ? 'radio' : 'checkbox'}
                                            name={`question-${q.id}`}
                                            checked={answers[q.id] === c.id}
                                            onChange={() => handleAnswerChange(q.id, c.id)}
                                            className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-700 font-medium">{c.text}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="w-full lg:w-80 lg:sticky lg:top-24 space-y-4 shrink-0">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500 mb-2 font-medium text-sm uppercase tracking-wider">
                        <Clock className="w-5 h-5" /> Thời gian còn lại
                    </div>
                    <div className={`text-4xl font-black font-mono tracking-tight ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
                        {formatTime(timeLeft)}
                    </div>
                    
                    {cheatCount > 0 && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-200 text-sm font-bold w-full justify-center">
                            <ShieldAlert className="w-5 h-5" /> Vi phạm: {cheatCount}/3
                        </div>
                    )}
                </div>

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
                                        ${isAnswered ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-400'}`}
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
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> NỘP BÀI THI</>}
                </button>
            </div>
        </div>
    );
}