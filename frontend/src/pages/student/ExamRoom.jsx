import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, AlertCircle, AlertTriangle, Loader2, CheckCircle2, Play, Terminal, Code2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import Editor from '@monaco-editor/react';

window.Pusher = Pusher;

const SUPPORTED_LANGUAGES = [
    { code: 'python', name: 'Python 3', monaco: 'python', snippet: 'def solve():\n    # Viết code tại đây\n    pass\n\nif __name__ == "__main__":\n    solve()' },
    { code: 'cpp', name: 'C++ (GCC)', monaco: 'cpp', snippet: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Viết code tại đây\n    return 0;\n}' },
    { code: 'java', name: 'Java', monaco: 'java', snippet: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Viết code tại đây\n    }\n}' },
    { code: 'php', name: 'PHP', monaco: 'php', snippet: '<?php\n// Viết code tại đây\n?>' },
];

export default function ExamRoom() {
    const { attemptId } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [codeLanguages, setCodeLanguages] = useState({}); 
 
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [markedForReview, setMarkedForReview] = useState({}); 
    
    const [timeLeft, setTimeLeft] = useState(null);
    const [cheatCount, setCheatCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [terminalOutput, setTerminalOutput] = useState('');
    const [isRunningCode, setIsRunningCode] = useState(false);

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
            if (data.exam) {
                data.exam.is_practice = data.exam.is_practice === true || data.exam.is_practice === 1 || data.exam.is_practice === '1';
            }
            setExam(data.exam);
            setAttempt(data.attempt);
            setQuestions(data.questions);
            setTimeLeft(data.remaining_seconds);
            setCheatCount(data.violation_count);

            const initialAnswers = {};
            const initialLangs = {};
            data.questions.forEach(q => {
                if (q.saved_choice_id) initialAnswers[q.id] = q.saved_choice_id;
                else if (q.saved_answer_text) initialAnswers[q.id] = q.saved_answer_text;

                if (q.type === 'coding') {
                    let allowedArr = ['python', 'cpp', 'java', 'php'];
                    if (Array.isArray(q.allowed_languages) && q.allowed_languages.length > 0) {
                        allowedArr = q.allowed_languages;
                    } else if (typeof q.allowed_languages === 'string') {
                        allowedArr = [q.allowed_languages];
                    }
                    
                    // CHỐT CHẶN 1: ÉP KIỂU NGHIÊM NGẶT NGAY TỪ LÚC LOAD
                    let initLang = q.saved_language;
                    if (!initLang || !allowedArr.includes(initLang)) {
                        initLang = allowedArr[0]; // Nếu CSDL lưu sai, ép về ngôn ngữ đầu tiên hợp lệ
                    }
                    
                    initialLangs[q.id] = initLang;
                    if (!q.saved_answer_text) {
                        initialAnswers[q.id] = SUPPORTED_LANGUAGES.find(l => l.code === initLang)?.snippet || '';
                    }
                }
            });
            setAnswers(initialAnswers);
            setCodeLanguages(initialLangs);

            startTimer(data.remaining_seconds);
 
            if (!data.exam.is_practice) {
                setupEcho(data.exam.id);
                api.post(`/student/attempts/${attemptId}/violation`, {
                    type: 'Tải lại trang / Vào lại phòng thi',
                    detail: 'Học viên vừa truy cập lại vào phòng thi (Có thể do thiết bị khởi động lại, cúp điện, hoặc ấn F5)',
                    penalty: false
                }).catch(e => console.error("Lỗi ghi log sự cố:", e));
            }

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
                            Swal.fire('Bị thu bài!', 'Giám thị đã buộc nộp bài thi của bạn.', 'error').then(() => navigate(`/student/exam-result/${attemptId}`));
                        } else if (e.type === 'warning') {
                            toast.error(`Cảnh báo từ Giám thị: ${e.message}`, { duration: 6000 });
                        }
                    }
                });
        } catch (err) {}
    };

    const handleViolation = async (type, detail) => {
        if (isSubmitting || timeLeft === null || timeLeft <= 0 || exam?.is_practice) return;
        try {
            const res = await api.post(`/student/attempts/${attemptId}/violation`, { type, detail});
            setCheatCount(res.data.violation_count);
            toast.error(`CẢNH BÁO GIAN LẬN: ${detail}`, { duration: 4000 });
        } catch (error) {
            if (error.response?.status === 403 && error.response?.data?.is_suspended) {
                clearInterval(timerRef.current);
                setIsSubmitting(true);
                Swal.fire({
                    title: 'ĐÌNH CHỈ THI!',
                    text: error.response.data.message,
                    icon: 'error',
                    confirmButtonText: 'Đóng'
                }).then(() => navigate(`/student/exam-result/${attemptId}`));
            }
        }
    };

    useEffect(() => {
        if (exam?.is_practice) return;
        const handleOffline = () => toast.error('MẤT KẾT NỐI MẠNG! Bài thi đang bị gián đoạn.', { duration: Infinity, id: 'network-error' });
        const handleOnline = () => {
            toast.dismiss('network-error');
            toast.success('ĐÃ CÓ MẠNG LẠI! Hệ thống đã ghi nhận.');
            api.post(`/student/attempts/${attemptId}/violation`, { 
                type: 'Sự cố kết nối mạng', detail: 'Học viên bị rớt mạng và vừa kết nối lại thành công.', penalty: false 
            }).catch(console.error);
        };
        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, [attemptId, exam?.is_practice]);

    useEffect(() => {
        if (isSubmitting || timeLeft === null || timeLeft <= 0 || exam?.is_practice) return;

        const handleKeyDown = (e) => {
            if (e.key === 'F12') { e.preventDefault(); handleViolation('Mở mã nguồn', 'Thí sinh bấm F12 để mở Developer Tools'); }
            if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j'].includes(e.key)) { e.preventDefault(); handleViolation('Mở mã nguồn', 'Thí sinh dùng phím tắt mở Developer Tools'); }
            if (e.ctrlKey && ['U', 'u'].includes(e.key)) { e.preventDefault(); handleViolation('Mở mã nguồn', 'Thí sinh bấm Ctrl+U xem mã nguồn'); }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) handleViolation('Chuyển Tab/Thu nhỏ', 'Thí sinh vừa chuyển sang Tab khác hoặc thu nhỏ trình duyệt.');
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFullscreen(false);
                handleViolation('Thoát Fullscreen', 'Thí sinh tự ý thoát chế độ toàn màn hình.');
            } else { setIsFullscreen(true); }
        };

        const handleRestrictedActions = (e) => {
            const isInsideMonaco = e.target.closest('.monaco-editor') !== null;
            if (!isInsideMonaco) {
                e.preventDefault();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        
        document.addEventListener('copy', handleRestrictedActions);
        document.addEventListener('cut', handleRestrictedActions);
        document.addEventListener('paste', handleRestrictedActions);
        document.addEventListener('contextmenu', handleRestrictedActions);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            
            document.removeEventListener('copy', handleRestrictedActions);
            document.removeEventListener('cut', handleRestrictedActions);
            document.removeEventListener('paste', handleRestrictedActions);
            document.removeEventListener('contextmenu', handleRestrictedActions);
        };
    }, [attemptId, isSubmitting, timeLeft, exam?.is_practice]);

    const requestFullscreen = () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(() => toast.error('Trình duyệt từ chối quyền Toàn màn hình. Vui lòng thử lại!'));
        }
    };

    const handleAnswerChange = async (questionId, value, type = 'choice', codeLang = null) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));

        try {
            const payload = { question_id: questionId };
            if (type === 'fill_blank' || type === 'coding') payload.answer_text = value;
            else payload.choice_id = value;

            if (type === 'coding' && codeLang) {
                payload.language = codeLang;
            }

            await api.patch(`/student/attempts/${attemptId}/answers`, payload);
        } catch (error) { console.error('Auto-save đáp án thất bại.'); }
    };

    const handleLanguageChange = (qId, langCode) => {
        setCodeLanguages(prev => ({ ...prev, [qId]: langCode }));
 
        const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
        if (langObj && (!answers[qId] || answers[qId].trim() === '')) {
            handleAnswerChange(qId, langObj.snippet, 'coding', langCode);
        } else {
            handleAnswerChange(qId, answers[qId], 'coding', langCode);
        }
    };

    const codeSaveTimeoutRef = useRef(null);

    const handleCodeChange = (questionId, value, codeLang) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));

        if (codeSaveTimeoutRef.current) {
            clearTimeout(codeSaveTimeoutRef.current);
        }

        codeSaveTimeoutRef.current = setTimeout(async () => {
            try {
                await api.patch(`/student/attempts/${attemptId}/answers`, {
                    question_id: questionId,
                    answer_text: value,
                    language: codeLang
                });
            } catch (error) { 
                console.error('Auto-save code thất bại.'); 
            }
        }, 3000); 
    };

    const handleRunCodeTest = async (question) => {
        setIsRunningCode(true);
        setTerminalOutput('Đang biên dịch và chạy thử:\n');
        
        try {
            const code = answers[question.id];
            
            let allowedLangs = ['python', 'cpp', 'java', 'php'];
            if (Array.isArray(question.allowed_languages) && question.allowed_languages.length > 0) {
                allowedLangs = question.allowed_languages;
            } else if (typeof question.allowed_languages === 'string') {
                allowedLangs = [question.allowed_languages];
            }

            // CHỐT CHẶN 2: ÉP KIỂU NGHIÊM NGẶT TRƯỚC KHI GỬI RUN
            let lang = codeLanguages[question.id];
            if (!lang || !allowedLangs.includes(lang)) {
                lang = allowedLangs[0]; // Bắt buộc lấy ngôn ngữ hợp lệ đầu tiên
            }
            
            const res = await api.post(`/student/attempts/${attemptId}/run-code`, {
                question_id: question.id,
                source_code: code,
                language: lang,
            });

            const { results } = res.data;
            if (!results || results.length === 0) {
                setTerminalOutput(prev => prev + '\nKhông tìm thấy Test Case công khai nào.');
                setIsRunningCode(false);
                return;
            }

            let allPassed = true;

            results.forEach((item, index) => {
                const data = item.result;
                setTerminalOutput(prev => prev + `\nTest Case ${index + 1}: `);

                if (!data) {
                    setTerminalOutput(prev => prev + `${item.error}\n`);
                    allPassed = false;
                    return;
                }

                if (data.status?.id === 3) {
                    setTerminalOutput(prev => prev + `[PASS] (Time: ${data.time}s | RAM: ${data.memory}KB)\n Output: ${(data.stdout || '').trim().replace(/\n/g, '\n    ')}\n`);
                } else if (data.status?.id === 6) {
                    setTerminalOutput(prev => prev + `\n[LỖI BIÊN DỊCH]\n${data.compile_output}\n`);
                    allPassed = false;
                } else {
                    setTerminalOutput(prev => prev + `[FAIL - ${data.status?.description}]\n  Output thực tế: ${(data.stdout || 'Không có output').trim().replace(/\n/g, '\n    ')}\n  Output mong đợi: ${(item.expected || '').trim().replace(/\n/g, '\n    ')}\n`);
                    allPassed = false;
                }
            });

        } catch (error) {
            setTerminalOutput(prev => prev + '\n\n[LỖI HỆ THỐNG] - ' + (error.response?.data?.message || 'Không thể chạy thử code.'));
        } finally {
            setIsRunningCode(false);
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
        if (document.fullscreenElement) { document.exitFullscreen().catch(err => console.log(err)); }

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
        <>
            {!isFullscreen && !isSubmitting && !exam?.is_practice && timeLeft !== null && timeLeft > 0 && (
                <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center text-white px-4 text-center">
                    <AlertTriangle className="w-24 h-24 text-amber-500 mb-6 animate-pulse" />
                    <h1 className="text-3xl font-bold mb-4">Yêu Cầu Toàn Màn Hình</h1>
                    <p className="text-slate-300 mb-8 max-w-lg leading-relaxed">
                        Kỳ thi này yêu cầu tính nghiêm ngặt. Vui lòng bấm nút bên dưới để bật chế độ Toàn màn hình và bắt đầu/tiếp tục làm bài.
                        <br/>
                        <span className="text-amber-400 font-bold mt-2 inline-block">
                            Lưu ý: Hành vi cố tình thoát toàn màn hình trong lúc thi sẽ bị hệ thống xử phạt vi phạm!
                        </span>
                    </p>
                    <button onClick={requestFullscreen} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg transition-transform hover:scale-105">
                        Bật Toàn Màn Hình & Bắt Đầu
                    </button>
                </div>
            )}

            <div className={`max-w-[1400px] mx-auto flex flex-col h-[calc(100vh-80px)] pb-6 font-sans px-4 pt-4 select-none ${!isFullscreen && !exam?.is_practice && timeLeft > 0 ? 'blur-md pointer-events-none opacity-50' : ''}`}>
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 md:px-6 rounded-2xl shadow-sm border border-slate-200 mb-6 shrink-0 z-10 gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl md:text-2xl font-black text-slate-800 line-clamp-1">{exam?.title}</h1>
                            {exam?.is_practice && ( <span className="text-xs font-black uppercase px-2.5 py-1 rounded-md shrink-0 bg-slate-100 text-slate-500">Ôn tập</span> )}
                        </div>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">{safeSubjectName} - {exam?.duration} Phút</p>
                    </div>
                    
                    <div className="flex items-center gap-6 shrink-0 bg-slate-50 p-2 md:px-4 rounded-xl border border-slate-100">
                        {cheatCount > 0 && !exam?.is_practice && (
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
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar flex flex-col">
                            {currentQ && (
                                <div className={`animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col ${currentQ.type === 'coding' ? '' : 'max-w-4xl mx-auto w-full'}`}>
                                    
                                  
                                    {currentQ.type !== 'coding' && (
                                        <>
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
                                                            onBlur={(e) => handleAnswerChange(currentQ.id, e.target.value, 'fill_blank')}
                                                            placeholder="Gõ đáp án vào đây..."
                                                            className="w-full md:w-2/3 p-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition text-lg font-medium shadow-sm"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {currentQ.choices.map((c) => {
                                                            const isSelected = answers[currentQ.id] === c.id;
                                                            return (
                                                                <label key={c.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                                    isSelected ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                                                }`}>
                                                                    <div className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-blue-600' : 'border-slate-300'}`}>
                                                                        {isSelected && <div className="w-3 h-3 rounded-full bg-blue-600" />}
                                                                    </div>
                                                                    <input
                                                                        type={currentQ.type === 'single' ? 'radio' : 'checkbox'}
                                                                        name={`question-${currentQ.id}`}
                                                                        checked={isSelected}
                                                                        onChange={() => handleAnswerChange(currentQ.id, c.id)}
                                                                        className="hidden"
                                                                    />
                                                                    <span className={`text-base font-medium ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{c.text}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                              
                                    {currentQ.type === 'coding' && (
                                        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[500px]">
                                        
                                            <div className="w-full lg:w-2/5 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar border-r border-slate-100">
                                                <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
                                                    <span className="shrink-0 w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black shadow-sm border border-indigo-200">
                                                        {currentQuestionIndex + 1}
                                                    </span>
                                                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Code2 className="w-5 h-5"/> Bài toán Lập trình</h3>
                                                </div>
                                                
                                                <div className="prose prose-sm prose-slate max-w-none text-slate-700 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: currentQ.content }} />
                                                
                                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
                                                    <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Terminal className="w-4 h-4"/> Dữ liệu chạy thử</h4>
                                                    {currentQ.test_cases && currentQ.test_cases.length > 0 ? (
                                                        <div className="space-y-3">
                                                            {currentQ.test_cases.map((tc, idx) => (
                                                                <div key={idx} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                                                    <div className="bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 border-b border-slate-200">Test Case {idx + 1}</div>
                                                                    <div className="p-3 grid grid-cols-2 gap-3 text-sm font-mono">
                                                                        <div>
                                                                            <span className="text-xs text-slate-400 block mb-1">Input (stdin)</span>
                                                                            <div className="bg-slate-50 p-2 rounded border border-slate-100 min-h-[40px] whitespace-pre-wrap">{tc.input_data}</div>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-xs text-slate-400 block mb-1">Expected Output</span>
                                                                            <div className="bg-slate-50 p-2 rounded border border-slate-100 min-h-[40px] whitespace-pre-wrap">{tc.expected_output}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-slate-500 italic">Bài toán này không có test case công khai.</p>
                                                    )}
                                                </div>
                                            </div>

                                      
                                            <div className="w-full lg:w-3/5 flex flex-col h-full border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                           
                                                <div className="bg-slate-800 px-4 py-2 flex justify-between items-center shrink-0">
                                                    {(() => {
                                                        let allowed = ['python', 'cpp', 'java', 'php'];
                                                        if (Array.isArray(currentQ.allowed_languages) && currentQ.allowed_languages.length > 0) {
                                                            allowed = currentQ.allowed_languages;
                                                        } else if (typeof currentQ.allowed_languages === 'string') {
                                                            allowed = [currentQ.allowed_languages];
                                                        }

                                                        const availableLangs = SUPPORTED_LANGUAGES.filter(l => allowed.includes(l.code));
                                                        
                                                        // CHỐT CHẶN 3: ÉP KIỂU NGHIÊM NGẶT KHI RENDER DROPDOWN
                                                        let currentLang = codeLanguages[currentQ.id];
                                                        if (!currentLang || !availableLangs.find(l => l.code === currentLang)) {
                                                            currentLang = availableLangs[0]?.code;
                                                            // Tự động đồng bộ lại state nếu phát hiện dữ liệu cũ bị sai lệch
                                                            if (currentLang && !codeLanguages[currentQ.id]) {
                                                                setTimeout(() => handleLanguageChange(currentQ.id, currentLang), 0);
                                                            }
                                                        }

                                                        return (
                                                            <select 
                                                                disabled={availableLangs.length <= 1} 
                                                                value={currentLang}
                                                                onChange={(e) => handleLanguageChange(currentQ.id, e.target.value)}
                                                                className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                                            >
                                                                {availableLangs.map(lang => (
                                                                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                                                                ))}
                                                            </select>
                                                        );
                                                    })()}
                                                    
                                                    <button 
                                                        onClick={() => handleRunCodeTest(currentQ)}
                                                        disabled={isRunningCode}
                                                        className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition disabled:opacity-70"
                                                    >
                                                        {isRunningCode ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4" />}
                                                        Chạy thử (Run)
                                                    </button>
                                                </div>

                                        
                                                <div className="flex-1 min-h-[300px]">
                                                    <Editor
                                                        height="100%"
                                                        theme="vs-dark"
                                                        // Chặn hiển thị sai Monaco Theme
                                                        language={(() => {
                                                            let allowedArr = ['python', 'cpp', 'java', 'php'];
                                                            if (Array.isArray(currentQ.allowed_languages) && currentQ.allowed_languages.length > 0) {
                                                                allowedArr = currentQ.allowed_languages;
                                                            } else if (typeof currentQ.allowed_languages === 'string') {
                                                                allowedArr = [currentQ.allowed_languages];
                                                            }
                                                            let lang = codeLanguages[currentQ.id];
                                                            if (!lang || !allowedArr.includes(lang)) lang = allowedArr[0];
                                                            return SUPPORTED_LANGUAGES.find(l => l.code === lang)?.monaco || 'python';
                                                        })()}
                                                        value={answers[currentQ.id] || ''}
                                                        onChange={(val) => {
                                                            let allowedArr = ['python', 'cpp', 'java', 'php'];
                                                            if (Array.isArray(currentQ.allowed_languages) && currentQ.allowed_languages.length > 0) {
                                                                allowedArr = currentQ.allowed_languages;
                                                            } else if (typeof currentQ.allowed_languages === 'string') {
                                                                allowedArr = [currentQ.allowed_languages];
                                                            }
                                                            let lang = codeLanguages[currentQ.id];
                                                            if (!lang || !allowedArr.includes(lang)) {
                                                                lang = allowedArr[0];
                                                            }
                                                            
                                                            handleCodeChange(currentQ.id, val, lang);
                                                        }}
                                                        options={{
                                                            minimap: { enabled: false },
                                                            fontSize: 15,
                                                            wordWrap: 'on',
                                                            scrollBeyondLastLine: false,
                                                            automaticLayout: true,
                                                        }}
                                                    />
                                                </div>

                                            
                                                <div className="h-40 bg-slate-900 border-t-2 border-slate-700 p-3 overflow-y-auto shrink-0 font-mono text-sm text-slate-300 custom-scrollbar">
                                                    <div className="text-slate-500 mb-2 flex items-center gap-2"><Terminal className="w-4 h-4"/> Bảng điều khiển (Console)</div>
                                                    <pre className="whitespace-pre-wrap break-words">{terminalOutput || 'Sẵn sàng... Bấm "Chạy thử" để xem kết quả biên dịch.'}</pre>
                                                </div>
                                            </div>
                                        </div>
                                    )}
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
                                    isCurrentMarked ? 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-amber-600'
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
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-y-auto custom-scrollbar">
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

                                    if (isActive) { btnClass += ' ring-4 ring-blue-200 scale-110 z-10'; }

                                    return (
                                        <button key={q.id} onClick={() => setCurrentQuestionIndex(index)} className={`aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all border-2 ${btnClass}`}>
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
        </>
    );
}