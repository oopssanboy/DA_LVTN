import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUsers, FaFileAlt, FaQuestionCircle, FaHistory, FaCheckCircle, FaBan, FaSpinner } from 'react-icons/fa';

export default function ReportDashboard() {
    const [stats, setStats] = useState(null);
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get(`${API_URL}/admin/dashboard/statistics`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.data);
            } catch (error) {
                console.error('Lỗi lấy dữ liệu thống kê:', error);
            }
        };
        fetchStats();
    }, [API_URL, token]);

    if (!stats) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
            </div>
        </div>
    );

    const statCards = [
        { title: 'Tổng Sinh Viên', value: stats.total_students, icon: <FaUsers size={26} />, color: 'primary' },
        { title: 'Tổng Kỳ Thi', value: stats.total_exams, icon: <FaFileAlt size={26} />, color: 'success' },
        { title: 'Ngân Hàng Câu Hỏi', value: stats.total_questions, icon: <FaQuestionCircle size={26} />, color: 'warning' },
        { title: 'Lượt Làm Bài', value: stats.total_attempts, icon: <FaHistory size={26} />, color: 'info' }
    ];

    return (
        <div className="container-fluid py-2">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold text-dark mb-0">Thống Kê Tổng Quan</h3>
            </div>
            
            {/* 4 Thẻ Thống Kê */}
            <div className="row g-4 mb-4">
                {statCards.map((card, idx) => (
                    <div className="col-md-6 col-xl-3" key={idx}>
                        <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '16px' }}>
                            <div className="card-body p-4 d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted fw-medium mb-1" style={{ fontSize: '14px' }}>{card.title}</p>
                                    <h3 className="fw-bold mb-0 text-dark">{card.value}</h3>
                                </div>
                                <div className={`bg-${card.color} bg-opacity-10 text-${card.color} rounded-circle d-flex align-items-center justify-content-center`} style={{ width: '56px', height: '56px' }}>
                                    {card.icon}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bảng hoạt động gần đây */}
            <div className="card shadow-sm border-0" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div className="card-header bg-white py-3 border-bottom-0">
                    <h5 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>Hoạt Động Nộp Bài Gần Đây</h5>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 border-top">
                        <thead className="table-light">
                            <tr>
                                <th className="px-4 py-3 border-0 text-muted fw-semibold" style={{ fontSize: '13px' }}>SINH VIÊN</th>
                                <th className="py-3 border-0 text-muted fw-semibold" style={{ fontSize: '13px' }}>KỲ THI</th>
                                <th className="py-3 border-0 text-muted fw-semibold" style={{ fontSize: '13px' }}>TRẠNG THÁI</th>
                                <th className="py-3 border-0 text-muted fw-semibold" style={{ fontSize: '13px' }}>ĐIỂM SỐ</th>
                                <th className="py-3 border-0 text-muted fw-semibold" style={{ fontSize: '13px' }}>THỜI GIAN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recent_attempts.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-5 text-muted">Chưa có hoạt động nào.</td></tr>
                            ) : (
                                stats.recent_attempts.map(attempt => (
                                    <tr key={attempt.id}>
                                        <td className="px-4 py-3 border-bottom-0 border-top">
                                            <div className="fw-bold text-dark">{attempt.user?.name}</div>
                                            <div className="small text-muted">{attempt.user?.class || 'Chưa cập nhật lớp'}</div>
                                        </td>
                                        <td className="fw-medium text-dark border-bottom-0 border-top">{attempt.exam?.title}</td>
                                        <td className="border-bottom-0 border-top">
                                            {attempt.status === 'completed' ? <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill"><FaCheckCircle className="me-1"/>Hoàn thành</span> :
                                             attempt.status === 'forced_submitted' ? <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2 rounded-pill"><FaBan className="me-1"/>Bị đình chỉ</span> :
                                             <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill"><FaSpinner className="me-1"/>Đang thi</span>}
                                        </td>
                                        <td className="fw-bold text-primary border-bottom-0 border-top fs-5">{attempt.score !== null ? `${attempt.score}/10` : '-'}</td>
                                        <td className="text-muted small border-bottom-0 border-top">{new Date(attempt.created_at).toLocaleString('vi-VN')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}