import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ShieldAlert, CheckCircle2, Loader2, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck,AlertCircle } from 'lucide-react';
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
    
   
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [markedForReview, setMarkedForReview] = useState({}); 
    
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
            navigate('/student/exams');
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

    const formatTime = (seconds) => {
        if (seconds === null || isNaN(seconds) || seconds < 0) return '00:00:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const setupEcho = (examId) => {
        if (echoRef.current) echoRef.current.disconnect();

        try {
            const appKey = import.meta.env.VITE_PUSHER_APP_KEY;
            const cluster = import.meta.env.VITE_PUSHER_APP_CLUSTER;
            
            if (!appKey) return;

            echoRef.current = new Echo({
                broadcaster: 'pusher',
                key: appKey,
                cluster: cluster,
                forceTLS: true
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
                            toast.error(`Cảnh báo từ Giám thị: ${e.message}`, { duration: 6000 });
                        }
                    }
                });
        } catch (err) {
            console.error("Lỗi kết nối Socket Pusher:", err);
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

    const toggleMarkReview = () => {
        const qId = questions[currentQuestionIndex].id;
        setMarkedForReview(prev => ({ ...prev, [qId]: !prev[qId] }));
    };

    const handleManualSubmit = () => {
       
        const totalAnswers = Object.values(answers).filter(val => val !== undefined && val !== '').length;
        const totalQuestions = questions.length;
        const unAnswered = totalQuestions - totalAnswers;
        const totalMarked = Object.values(markedForReview).filter(val => val).length;

        let warningText = "Hành động này không thể hoàn tác sau khi gửi.";
        if (unAnswered > 0 || totalMarked > 0) {
            warningText = `Bạn còn ${unAnswered} câu chưa làm và ${totalMarked} câu đang đánh dấu xem lại. Bạn có chắc chắn nộp?`;
        }

        Swal.fire({
            title: 'Xác nhận nộp bài?',
            text: warningText,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#cbd5e1',
            confirmButtonText: 'Xác nhận nộp',
            cancelButtonText: 'Kiểm tra lại'
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

    const safeSubjectName = typeof exam?.subject === 'object' ? exam?.subject?.name : (exam?.subject || 'Chưa cập nhật');
    const currentQ = questions[currentQuestionIndex];
    const isCurrentMarked = markedForReview[currentQ?.id];

    return (
        <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-80px)] pb-6 font-sans px-4 pt-4">
            
           
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 md:px-6 rounded-2xl shadow-sm border border-slate-200 mb-6 shrink-0 z-10 gap-4">
                <div className="flex-1">
                    <h1 className="text-xl md:text-2xl font-black text-slate-800 line-clamp-1">{exam?.title}</h1>
                    <p className="text-sm font-medium text-slate-500 mt-0.5">{safeSubjectName} - {exam?.duration} Phút</p>
                </div>
                
                <div className="flex items-center gap-6 shrink-0 bg-slate-50 p-2 md:px-4 rounded-xl border border-slate-100">
                    {cheatCount > 0 && (
                        <div className="inline-flex items-center gap-1.5 text-red-600 font-bold bg-red-100 px-3 py-1.5 rounded-lg text-sm animate-pulse">
                            <AlertCircle className="w-4 h-4" /> Vi phạm: {cheatCount}/3
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-black hidden sm:inline-block uppercase tracking-wide">Thời gian:</span>
                        <div className={`text-2xl font-black font-mono tracking-tight ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-black'}`}>
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                </div>
            </div>

          
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                <div className="flex-1 w-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <div className="flex-1 overflow-y-auto p-6 md:p-10">
                        {currentQ && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-start gap-4 mb-8">
                                    <span className="shrink-0 w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg shadow-sm border border-blue-200">
                                        {currentQuestionIndex + 1}
                                    </span>
                                    <div className="prose prose-slate max-w-none text-slate-800 font-medium pt-1 text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: currentQ.content }} />
                                </div>

                                <div className="pl-0 md:pl-14 space-y-4">
                                    {currentQ.type === 'fill_blank' ? (
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                            <p className="text-sm font-bold text-slate-500 mb-3">Nhập câu trả lời của bạn:</p>
                                            <input
                                                type="text"
                                                value={answers[currentQ.id] || ''}
                                                onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                                                onBlur={(e) => handleAnswerChange(currentQ.id, e.target.value, true)}
                                                placeholder="Gõ đáp án vào đây..."
                                                className="w-full md:w-2/3 p-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition text-lg font-medium shadow-sm"
                                            />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3">
                                            {currentQ.choices.map((c, i) => {
                                                const isSelected = answers[currentQ.id] === c.id;
                                                return (
                                                    <label key={c.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                        isSelected 
                                                            ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10' 
                                                            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                                    }`}>
                                                        <div className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                            isSelected ? 'border-blue-600' : 'border-slate-300'
                                                        }`}>
                                                            {isSelected && <div className="w-3 h-3 rounded-full bg-blue-600" />}
                                                        </div>
                                                        <input
                                                            type={currentQ.type === 'single' ? 'radio' : 'checkbox'}
                                                            name={`question-${currentQ.id}`}
                                                            checked={isSelected}
                                                            onChange={() => handleAnswerChange(currentQ.id, c.id)}
                                                            className="hidden"
                                                        />
                                                        <span className={`text-base font-medium ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                                                            {c.text}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                   
                    <div className="shrink-0 border-t border-slate-100 bg-slate-50 p-4 px-6 flex items-center justify-between">
                        <button 
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(prev - 1, 0))}
                            disabled={currentQuestionIndex === 0}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5" /> Trước
                        </button>
                        
                        <button 
                            onClick={toggleMarkReview}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition shadow-sm border ${
                                isCurrentMarked 
                                    ? 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-amber-600'
                            }`}
                        >
                            {isCurrentMarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />} 
                            <span className="hidden sm:inline-block">Đánh dấu xem lại</span>
                        </button>

                        <button 
                            onClick={() => setCurrentQuestionIndex(prev => Math.min(prev + 1, questions.length - 1))}
                            disabled={currentQuestionIndex === questions.length - 1}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20"
                        >
                            Tiếp <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

             
                <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-y-auto">
                        <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Danh sách câu hỏi</h3>
                        
                       
                        <div className="flex flex-wrap gap-3 mb-4 text-xs font-medium text-slate-600">
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-600"></div> Đã làm</div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500"></div> Xem lại</div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-white border border-slate-300"></div> Chưa làm</div>
                        </div>

                        <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-2">
                            {questions.map((q, index) => {
                                const isMarked = markedForReview[q.id];
                                const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                                const isActive = currentQuestionIndex === index;
                                
                                let btnClass = 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:bg-slate-50';
                                
                                if (isMarked) {
                                    btnClass = 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/30';
                                } else if (isAnswered) {
                                    btnClass = 'bg-blue-600 text-white border-blue-700 shadow-sm shadow-blue-600/30';
                                }

                                if (isActive) {
                                    btnClass += ' ring-4 ring-blue-200 scale-110 z-10';
                                }

                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentQuestionIndex(index)}
                                        className={`aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all border-2 ${btnClass}`}
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
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 transition flex items-center justify-center gap-2 disabled:opacity-70 text-lg uppercase tracking-wide shrink-0"
                    >
                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> NỘP BÀI THI</>}
                    </button>
                </div>

            </div>
        </div>
    );
}