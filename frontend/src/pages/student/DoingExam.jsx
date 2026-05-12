import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaClock, FaCheckCircle, FaExclamationCircle, FaHome, FaTimesCircle, FaListUl, FaShieldAlt } from 'react-icons/fa';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function DoingExam() {
    const { id } = useParams();
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

    useEffect(() => {
        fetch(`${API_URL}/student/exams/${id}/do`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'completed') {
                Swal.fire({
                    title: 'Đã hoàn thành',
                    text: 'Bạn đã nộp bài thi này rồi!',
                    icon: 'info',
                    confirmButtonColor: '#2563eb'
                }).then(() => navigate('/student/home'));
                return;
            }
            setExam(data.exam);
            setQuestions(data.questions);
            setAnswers(data.saved_answers || {});
            setTimeLeft(data.time_left_seconds);
            setIsLoading(false);
        })
        .catch(err => {
            console.error(err);
            Swal.fire('Lỗi', 'Không thể tải đề thi!', 'error');
        });
    }, [id, navigate, token, API_URL]);

    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0 && !result) { 
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        autoSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [timeLeft, result]);

    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.hidden && !result) { 
                Swal.fire({
                    title: 'CẢNH BÁO!',
                    text: 'Bạn vừa rời khỏi màn hình làm bài! Hành vi này đã được ghi nhận.',
                    icon: 'warning',
                    confirmButtonColor: '#f59e0b'
                });

                try {
                    const res = await axios.post(`${API_URL}/exams/${id}/log-violation`, {}, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    setCheatCount(res.data.cheat_count);
                    
                    if (res.data.forced) {
                        Swal.fire({
                            title: 'ĐÌNH CHỈ THI!',
                            text: 'BẠN ĐĐ VI PHẠM QUY CHẾ QUÁ NHIỀU LẦN. HỆ THỐNG ĐÃ TỰ ĐỘNG THU BÀI!',
                            icon: 'error',
                            confirmButtonColor: '#ef4444'
                        }).then(() => navigate('/student/home'));
                    }
                } catch (error) {
                    console.error("Lỗi khi ghi nhận vi phạm", error);
                }
            }
        };

        const handlePreventCheating = (e) => {
            if (!result) { 
                e.preventDefault();
                Swal.fire({
                    title: 'CẢNH BÁO!',
                    text: 'Hành động copy/paste/chuột phải không được phép trong phòng thi!',
                    icon: 'warning',
                    toast: true,
                    position: 'top-end',
                    timer: 3000,
                    showConfirmButton: false
                });
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
    }, [id, navigate, token, API_URL, result]);

    const handleSelectAnswer = (questionId, option) => {
        if (result) return; 

        const newAnswers = { ...answers, [questionId]: option };
        setAnswers(newAnswers);

        fetch(`${API_URL}/student/exams/${id}/save-progress`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ answers: newAnswers })
        });
    };

    const autoSubmit = () => {
        if (result) return;
        Swal.fire({
            title: 'Hết giờ!',
            text: 'Thời gian làm bài đã kết thúc. Hệ thống đang tự động nộp bài...',
            icon: 'info',
            timer: 3000,
            showConfirmButton: false
        }).then(() => {
            handleSubmit(true); 
        });
    };

    const handleSubmit = async (isAuto = false) => {
        if (result) return;

        if (!isAuto) {
            const confirm = await Swal.fire({
                title: 'Nộp bài thi?',
                text: 'Bạn có chắc chắn muốn nộp bài ngay bây giờ?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2563eb',
                cancelButtonColor: '#94a3b8',
                confirmButtonText: 'Đồng ý nộp',
                cancelButtonText: 'Kiểm tra lại'
            });
            if (!confirm.isConfirmed) return;
        }

        try {
            const response = await axios.post(
                `${API_URL}/exams/${id}/submit`,
                { answers },
                { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
            );
            setResult(response.data);
            window.scrollTo(0, 0); 
        } catch (error) {
            console.error("Lỗi khi nộp bài", error);
            if (error.response && error.response.status === 422) {
                Swal.fire('Lỗi dữ liệu!', 'Dữ liệu nộp bài không hợp lệ!', 'error');
            } else {
                Swal.fire('Lỗi hệ thống!', 'Không thể nộp bài lúc này!', 'error');
            }
        }
    };

    const formatTime = (seconds) => {
        if (!seconds || seconds < 0) return "00:00";
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const scrollToQuestion = (qId) => {
        const el = document.getElementById(`question-${qId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    if (isLoading) return (
        <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}></div>
            <h5 className="text-muted fw-medium">Đang chuẩn bị đề thi...</h5>
        </div>
    );

    // GIAO DIỆN SAU KHI NỘP BÀI (KẾT QUẢ)
    if (result) {
        return (
            <div className="container py-5" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="card shadow-sm border-0" style={{ borderRadius: '16px' }}>
                            <div className="card-body p-4 p-md-5">
                                <div className="text-center mb-5">
                                    <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex p-3 mb-3">
                                        <FaCheckCircle className="fs-1" />
                                    </div>
                                    <h4 className="fw-bold text-dark">NỘP BÀI THÀNH CÔNG</h4>
                                    <p className="text-muted">Bài thi của bạn đã được hệ thống ghi nhận.</p>
                                </div>

                                <div className="row text-center mb-5 g-4">
                                    <div className="col-md-6">
                                        <div className="p-4 bg-light rounded-4 h-100" style={{ border: '1px solid #e2e8f0' }}>
                                            <h6 className="text-muted fw-medium mb-2 text-uppercase" style={{ letterSpacing: '0.5px', fontSize: '13px' }}>Điểm số</h6>
                                            <h1 className="fw-bold text-primary mb-0 display-4">{result.score} <span className="fs-5 text-muted">/ 10</span></h1>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="p-4 bg-light rounded-4 h-100" style={{ border: '1px solid #e2e8f0' }}>
                                            <h6 className="text-muted fw-medium mb-2 text-uppercase" style={{ letterSpacing: '0.5px', fontSize: '13px' }}>Số câu đúng</h6>
                                            <h1 className="fw-bold text-success mb-0 display-4">{result.correct_count} <span className="fs-5 text-muted">/ {result.total_questions}</span></h1>
                                        </div>
                                    </div>
                                </div>

                                <h6 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
                                    <FaListUl className="text-muted"/> Chi tiết đáp án
                                </h6>
                                <div className="d-flex flex-column gap-3">
                                    {result.details.map((item, index) => (
                                        <div key={item.question_id} className="p-4 rounded-3" style={{ backgroundColor: item.is_correct ? '#f0fdf4' : '#fef2f2', border: `1px solid ${item.is_correct ? '#bbf7d0' : '#fecaca'}` }}>
                                            <div className="fw-medium mb-3 text-dark d-flex align-items-start gap-2">
                                                <span className="badge bg-secondary bg-opacity-10 text-secondary mt-1">Câu {index + 1}</span> 
                                                <span dangerouslySetInnerHTML={{ __html: item.question_text }} />
                                            </div>
                                            <div className="d-flex flex-wrap gap-2 mt-2">
                                                <span className={`badge ${item.is_correct ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-danger bg-opacity-10 text-danger border border-danger'} px-3 py-2 fw-medium rounded`}>
                                                    {item.is_correct ? <FaCheckCircle className="me-1"/> : <FaTimesCircle className="me-1"/>}
                                                    Lựa chọn: {item.user_answer || 'Không làm'}
                                                </span>
                                                {!item.is_correct && (
                                                    <span className="badge bg-success text-white px-3 py-2 fw-medium rounded d-flex align-items-center">
                                                        <FaCheckCircle className="me-1"/>
                                                        Đáp án đúng: {item.correct_answer}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="text-center mt-5 pt-3 border-top">
                                    <button className="btn btn-light text-primary border rounded-pill px-5 py-2 fw-medium shadow-sm hover-lift" onClick={() => navigate('/student/home')}>
                                        <FaHome className="me-2" /> Trở về trang chủ
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // GIAO DIỆN LÀM BÀI
    return (
        <div className="container-fluid py-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <div className="row g-4">
                <div className="col-lg-9 col-md-8">
                    <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
                        <div className="card-body p-4 d-flex justify-content-between align-items-center">
                            <div>
                                <h4 className="fw-bold text-dark mb-1">{exam?.title}</h4>
                                <p className="text-muted mb-0 small d-flex gap-3">
                                    <span>Môn thi: <strong className="text-dark fw-medium">{exam?.subject}</strong></span>
                                    <span>Số lượng: <strong className="text-dark fw-medium">{questions.length} câu</strong></span>
                                </p>
                            </div>
                            {cheatCount > 0 && (
                                <div className="badge bg-danger bg-opacity-10 text-danger border border-danger px-3 py-2 rounded-pill d-flex align-items-center gap-1 shadow-sm">
                                    <FaShieldAlt /> Vi phạm: {cheatCount}/3
                                </div>
                            )}
                        </div>
                    </div>

                    {questions.map((q, index) => (
                        <div key={q.id} id={`question-${q.id}`} className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px', scrollMarginTop: '20px' }}>
                            <div className="card-body p-4">
                                <div className="d-flex gap-3 mb-3 align-items-start border-bottom pb-3">
                                    <span className="badge bg-light text-muted border px-3 py-2 rounded" style={{ fontSize: '14px' }}>Câu {index + 1}</span>
                                    <div className="text-dark fw-medium fs-6 mt-1" dangerouslySetInnerHTML={{ __html: q.content }} />
                                </div>
                                <div className="row g-3">
                                    {['A', 'B', 'C', 'D'].map((opt) => {
                                        const optionField = `option_${opt.toLowerCase()}`;
                                        const isSelected = answers[q.id] === opt;
                                        
                                        return (
                                            <div className="col-md-6" key={opt}>
                                                <div 
                                                    className={`p-3 border rounded-3 transition-all ${isSelected ? 'border-primary bg-primary bg-opacity-10' : 'bg-white border-light'}`}
                                                    style={{ cursor: 'pointer', borderColor: isSelected ? '#3b82f6' : '#e2e8f0' }}
                                                    onClick={() => handleSelectAnswer(q.id, opt)}
                                                >
                                                    <div className="form-check m-0 d-flex align-items-center gap-3">
                                                        <input 
                                                            className="form-check-input mt-0" 
                                                            type="radio" 
                                                            style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                                            name={`question-${q.id}`} 
                                                            checked={isSelected}
                                                            onChange={() => {}} 
                                                        />
                                                        <label className="form-check-label text-dark w-100" style={{ cursor: 'pointer', fontSize: '15px' }}>
                                                            <strong className={`${isSelected ? 'text-primary' : 'text-muted'} me-2`}>{opt}.</strong> {q[optionField]}
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="col-lg-3 col-md-4">
                    <div className="card shadow-sm border-0 sticky-top" style={{ top: '20px', borderRadius: '16px' }}>
                        <div className="card-body p-4 text-center border-bottom">
                            <h6 className="text-muted fw-bold small text-uppercase mb-2 d-flex justify-content-center align-items-center gap-1">
                                <FaClock /> Thời gian còn lại
                            </h6>
                            <div className={`py-3 rounded-4 ${timeLeft <= 300 ? 'bg-danger bg-opacity-10 text-danger flash-border' : 'bg-light text-primary'}`}>
                                <h1 className="fw-bold font-monospace mb-0 display-4" style={{ letterSpacing: '2px' }}>
                                    {formatTime(timeLeft)}
                                </h1>
                            </div>
                        </div>
                        
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between mb-3 small fw-medium text-muted">
                                <span><span className="text-primary fw-bold">{Object.keys(answers).length}</span> đã làm</span>
                                <span><span className="text-danger fw-bold">{questions.length - Object.keys(answers).length}</span> chưa làm</span>
                            </div>

                            <div className="d-flex flex-wrap gap-2 mb-4 justify-content-start">
                                {questions.map((q, index) => {
                                    const isAnswered = !!answers[q.id];
                                    return (
                                        <button 
                                            key={q.id}
                                            onClick={() => scrollToQuestion(q.id)}
                                            className={`btn btn-sm ${isAnswered ? 'btn-primary border-0' : 'btn-light text-muted border'}`}
                                            style={{ width: '36px', height: '36px', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px' }}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            <button onClick={() => handleSubmit(false)} className="btn btn-success w-100 fw-bold py-3 shadow-sm hover-lift border-0" style={{ borderRadius: '12px', fontSize: '16px' }}>
                                NỘP BÀI THI
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                .transition-all { transition: all 0.2s ease; }
                .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important; }
                .form-check-input:checked { background-color: #2563eb; border-color: #2563eb; }
                .flash-border { border: 2px solid #f87171; animation: pulse 1.5s infinite; }
                @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(248, 113, 113, 0); } 100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0); } }
            `}</style>
        </div>
    );
}