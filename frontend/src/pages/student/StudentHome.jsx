import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaClock, FaBook, FaLock, FaPlayCircle, 
    FaSignOutAlt, FaHistory, FaListAlt, FaCheckCircle, FaUserGraduate, FaBell, FaUserCircle 
} from 'react-icons/fa';
import axios from 'axios';

export default function StudentHome() {
    const [exams, setExams] = useState([]);
    const [history, setHistory] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('available'); 
    
    const [showModal, setShowModal] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);
    const [passwordInput, setPasswordInput] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchNotices = async () => {
            try {
                const response = await axios.get(`${API_URL}/notifications`); 
                setNotifications(response.data);
            } catch (error) {
                console.error("Lỗi lấy thông báo", error);
            }
        };

        fetchNotices();
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        await Promise.all([fetchExams(), fetchHistory()]);
        setIsLoading(false);
    };

    const fetchExams = async () => {
        try {
            const res = await fetch(`${API_URL}/student/exams`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            const data = await res.json();
            setExams(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Lỗi tải danh sách kỳ thi:", error);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_URL}/student/exams/history`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            const data = await res.json();
            setHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Lỗi tải lịch sử thi:", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleJoinExam = (exam) => {
        if (exam.has_password) {
            setSelectedExam(exam);
            setPasswordInput('');
            setErrorMsg('');
            setShowModal(true);
        } else {
            navigate(`/student/exam/${exam.id}/do`);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/student/exams/${selectedExam.id}/check-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ password: passwordInput })
            });

            const data = await res.json();

            if (res.ok) {
                setShowModal(false);
                navigate(`/student/exam/${selectedExam.id}/do`);
            } else {
                setErrorMsg(data.error || 'Mật khẩu sai!');
            }
        } catch (error) {
            setErrorMsg('Lỗi kết nối tới máy chủ!');
        }
    };

    return (
        <div className="min-vh-100" style={{ backgroundColor: '#f8fafc' }}>
            {/* Navbar */}
            <nav className="navbar navbar-expand-lg bg-white shadow-sm mb-4 py-3 border-bottom">
                <div className="container">
                    <span className="navbar-brand fw-bold d-flex align-items-center gap-2" style={{ color: '#2563eb' }}>
                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle d-flex align-items-center justify-content-center">
                            <FaUserGraduate className="fs-5" />
                        </div>
                        CỔNG THI SINH VIÊN
                    </span>
                    <div className="d-flex align-items-center gap-3">
                        {/* NÚT TÀI KHOẢN MỚI THÊM */}
                        <button 
                            onClick={() => navigate('/student/profile')} 
                            className="btn btn-light text-primary d-flex align-items-center gap-2 fw-medium px-3 py-2 border-0"
                            style={{ borderRadius: '8px' }}
                        >
                            <FaUserCircle /> Tài khoản
                        </button>
                        
                        <div className="border-start ms-2 me-2 d-none d-sm-block" style={{ height: '24px' }}></div>
                        
                        <div className="text-end d-none d-sm-block">
                            <small className="d-block text-muted fw-medium" style={{ fontSize: '12px' }}>Xin chào,</small>
                            <span className="fw-bold text-dark">{user.name || 'Học viên'}</span>
                        </div>
                        
                        <button 
                            onClick={handleLogout} 
                            className="btn btn-light text-danger d-flex align-items-center justify-content-center fw-medium border-0"
                            style={{ borderRadius: '8px', width: '40px', height: '40px' }}
                            title="Đăng xuất"
                        >
                            <FaSignOutAlt />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container pb-5">
                <div className="row g-4">
                    {/* CỘT TRÁI: DANH SÁCH BÀI THI / LỊCH SỬ */}
                    <div className="col-lg-8">
                        {/* Segmented Control Tabs */}
                        <div className="bg-light p-1 shadow-sm d-inline-flex mb-4 align-items-center" style={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <button 
                                onClick={() => setActiveTab('available')}
                                className={`btn border-0 px-4 py-2 fw-medium d-flex align-items-center gap-2 transition-all ${activeTab === 'available' ? 'bg-white shadow-sm text-primary' : 'bg-transparent text-muted'}`}
                                style={{ borderRadius: '10px' }}
                            >
                                <FaListAlt /> Kỳ thi hiện có
                            </button>
                            <button 
                                onClick={() => setActiveTab('history')}
                                className={`btn border-0 px-4 py-2 fw-medium d-flex align-items-center gap-2 transition-all ${activeTab === 'history' ? 'bg-white shadow-sm text-primary' : 'bg-transparent text-muted'}`}
                                style={{ borderRadius: '10px' }}
                            >
                                <FaHistory /> Lịch sử làm bài
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="text-center py-5">
                                <span className="spinner-border text-primary fs-4" style={{ borderWidth: '3px' }}></span>
                                <p className="mt-3 text-muted fw-medium">Đang tải dữ liệu...</p>
                            </div>
                        ) : (
                            <div className="row g-4">
                                {/* TAB 1: KỲ THI HIỆN CÓ */}
                                {activeTab === 'available' && (
                                    exams.length === 0 ? (
                                        <div className="col-12 text-center py-5">
                                            <div className="alert bg-white border-0 shadow-sm d-inline-block px-5 py-5 text-center" style={{ borderRadius: '20px' }}>
                                                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4 mb-3">
                                                    <FaBook className="fs-1 text-primary opacity-75" />
                                                </div>
                                                <h5 className="fw-bold text-dark mb-2">Chưa có kỳ thi nào</h5>
                                                <p className="mb-0 text-muted">Hiện tại không có bài thi nào đang mở dành cho lớp của bạn.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        exams.map(exam => (
                                            <div className="col-md-6" key={exam.id}>
                                                <div className="card h-100 shadow-sm border-0 position-relative hover-card" style={{ borderRadius: '16px' }}>
                                                    {exam.has_password && (
                                                        <span className="position-absolute top-0 end-0 badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 m-3 px-2 py-1 rounded d-flex align-items-center" title="Cần mật khẩu">
                                                            <FaLock className="me-1 small" /> Có khóa
                                                        </span>
                                                    )}
                                                    <div className="card-body p-4 d-flex flex-column">
                                                        <h5 className="card-title fw-bold text-dark mb-4 pe-4" style={{ lineHeight: '1.4' }}>{exam.title}</h5>
                                                        
                                                        <div className="mb-4 flex-grow-1">
                                                            <div className="d-flex align-items-center mb-3">
                                                                <div className="bg-light p-2 rounded me-3 text-primary"><FaBook /></div>
                                                                <div>
                                                                    <div className="small text-muted fw-medium" style={{ fontSize: '12px' }}>Môn thi</div>
                                                                    <div className="fw-semibold text-dark">{exam.subject}</div>
                                                                </div>
                                                            </div>
                                                            <div className="d-flex gap-4">
                                                                <div>
                                                                    <div className="small text-muted fw-medium d-flex align-items-center gap-1 mb-1" style={{ fontSize: '12px' }}><FaClock className="text-warning"/> Thời gian</div>
                                                                    <div className="fw-semibold text-dark">{exam.duration} phút</div>
                                                                </div>
                                                                <div>
                                                                    <div className="small text-muted fw-medium d-flex align-items-center gap-1 mb-1" style={{ fontSize: '12px' }}><FaListAlt className="text-info"/> Số câu hỏi</div>
                                                                    <div className="fw-semibold text-dark">{exam.total_questions} câu</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <button 
                                                            className="btn btn-primary w-100 fw-medium py-2 d-flex align-items-center justify-content-center gap-2 border-0 mt-auto hover-lift"
                                                            style={{ borderRadius: '10px', backgroundColor: '#2563eb' }}
                                                            onClick={() => handleJoinExam(exam)}
                                                        >
                                                            <FaPlayCircle className="fs-5" /> VÀO THI NGAY
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )
                                )}

                                {/* TAB 2: LỊCH SỬ LÀM BÀI */}
                                {activeTab === 'history' && (
                                    history.length === 0 ? (
                                        <div className="col-12 text-center py-5">
                                            <div className="alert bg-white border-0 shadow-sm d-inline-block px-5 py-5 text-center" style={{ borderRadius: '20px' }}>
                                                <div className="bg-secondary bg-opacity-10 rounded-circle d-inline-flex p-4 mb-3">
                                                    <FaHistory className="fs-1 text-secondary opacity-75" />
                                                </div>
                                                <h5 className="fw-bold text-dark mb-2">Chưa có lịch sử</h5>
                                                <p className="mb-0 text-muted">Bạn chưa hoàn thành bài thi nào trên hệ thống.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        history.map(item => (
                                            <div className="col-md-6" key={item.id}>
                                                <div className="card h-100 shadow-sm border-0 hover-card" style={{ borderRadius: '16px' }}>
                                                    <div className="card-body p-4 d-flex flex-column">
                                                        <div className="d-flex justify-content-between align-items-start mb-4">
                                                            <h6 className="fw-bold mb-0 text-dark" style={{ lineHeight: '1.4' }}>{item.exam_title || 'Bài thi'}</h6>
                                                            <span className="badge bg-success bg-opacity-10 text-success px-2 py-1 rounded d-flex align-items-center gap-1">
                                                                <FaCheckCircle/> Đã nộp
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="row text-center g-3 mb-4 flex-grow-1">
                                                            <div className="col-6">
                                                                <div className="bg-light py-3 px-2 rounded h-100" style={{ border: '1px solid #f1f5f9' }}>
                                                                    <small className="text-muted d-block fw-medium mb-1" style={{ fontSize: '13px' }}>Điểm số</small>
                                                                    <strong className="text-primary fs-3 fw-bold">{item.score}<span className="fs-6 text-muted fw-normal">/10</span></strong>
                                                                </div>
                                                            </div>
                                                            <div className="col-6">
                                                                <div className="bg-light py-3 px-2 rounded h-100" style={{ border: '1px solid #f1f5f9' }}>
                                                                    <small className="text-muted d-block fw-medium mb-1" style={{ fontSize: '13px' }}>Số câu đúng</small>
                                                                    <strong className="text-success fs-3 fw-bold">{item.correct_answers}<span className="fs-6 text-muted fw-normal">/{item.total_questions || '-'}</span></strong>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-muted d-flex align-items-center justify-content-between mt-auto pt-3 border-top" style={{ fontSize: '13px' }}>
                                                            <span className="fw-medium">Thời gian nộp:</span>
                                                            <span className="d-flex align-items-center gap-1"><FaClock /> {new Date(item.completed_at || item.created_at).toLocaleString('vi-VN')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    {/* CỘT PHẢI: BẢNG TIN / THÔNG BÁO */}
                    <div className="col-lg-4">
                        <div className="card shadow-sm border-0 sticky-top" style={{ borderRadius: '16px', top: '20px', zIndex: 10 }}>
                            <div className="card-header bg-white border-bottom-0 pt-4 pb-2 px-4">
                                <h6 className="card-title fw-bold text-dark d-flex align-items-center mb-0 text-uppercase" style={{ letterSpacing: '0.5px' }}>
                                    <FaBell className="me-2 text-warning fs-5" /> Thông báo từ CTSV
                                </h6>
                            </div>
                            <div className="card-body p-4 pt-2" style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
                                {notifications.length > 0 ? (
                                    notifications.map((noti) => (
                                        <div key={noti.id} className="p-3 mb-3" style={{ backgroundColor: '#f8fafc', borderRadius: '12px', borderLeft: '3px solid #3b82f6' }}>
                                            <div className="fw-bold text-dark mb-1" style={{ fontSize: '15px' }}>{noti.title}</div>
                                            <div className="text-secondary mb-2" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '14px' }}>
                                                {noti.content}
                                            </div>
                                            <div className="text-muted d-flex align-items-center mt-2 fw-medium" style={{ fontSize: '12px' }}>
                                                <FaClock className="me-1 opacity-75"/> {new Date(noti.created_at).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-muted py-5">
                                        <div className="bg-light rounded-circle d-inline-flex p-3 mb-2"><FaBell className="fs-3 text-secondary opacity-50" /></div>
                                        <p className="mb-0 small fw-medium">Chưa có thông báo mới.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Modal Nhập Mật Khẩu tinh tế hơn */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(3px)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
                        <div className="modal-content border-0 shadow" style={{ borderRadius: '20px' }}>
                            <form onSubmit={handlePasswordSubmit}>
                                <div className="modal-body p-5 text-center">
                                    <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex p-3 mb-3">
                                        <FaLock className="fs-3" />
                                    </div>
                                    <h5 className="fw-bold text-dark mb-2">Yêu cầu Mật khẩu</h5>
                                    <p className="text-muted small mb-4">Kỳ thi <strong className="text-dark">{selectedExam?.title}</strong> yêu cầu mật khẩu để truy cập.</p>
                                    
                                    <input 
                                        type="password" 
                                        className={`form-control form-control-lg text-center bg-light border-0 py-3 ${errorMsg ? 'is-invalid' : ''}`}
                                        style={{ borderRadius: '12px', fontSize: '16px', letterSpacing: '2px' }}
                                        placeholder="••••••••" 
                                        value={passwordInput} 
                                        onChange={(e) => setPasswordInput(e.target.value)}
                                        required 
                                        autoFocus
                                    />
                                    {errorMsg && <div className="invalid-feedback mt-2 fw-medium">{errorMsg}</div>}
                                    
                                    <div className="d-flex gap-2 mt-4 pt-2">
                                        <button type="button" className="btn btn-light flex-fill fw-medium py-2" style={{ borderRadius: '10px' }} onClick={() => setShowModal(false)}>Hủy bỏ</button>
                                        <button type="submit" className="btn btn-primary flex-fill fw-medium py-2 border-0" style={{ borderRadius: '10px', backgroundColor: '#2563eb' }}>Vào thi</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`
                .hover-card { transition: all 0.2s ease-in-out; }
                .hover-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important; }
                .hover-lift { transition: transform 0.1s; }
                .hover-lift:active { transform: scale(0.98); }
                .card-body::-webkit-scrollbar { width: 4px; }
                .card-body::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
                .card-body::-webkit-scrollbar-track { background: transparent; }
            `}</style>
        </div>
    );
}