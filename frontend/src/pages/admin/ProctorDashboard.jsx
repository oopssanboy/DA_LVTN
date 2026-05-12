import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaEye, FaSync, FaExclamationTriangle, FaBan, FaCheckCircle, FaSpinner } from 'react-icons/fa';

export default function ProctorDashboard() {
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [attempts, setAttempts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await axios.get(`${API_URL}/exams`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const activeExams = res.data.filter(e => e.is_active);
                setExams(activeExams);
            } catch (error) {
                console.error("Lỗi lấy danh sách kỳ thi", error);
            }
        };
        fetchExams();
    }, [API_URL, token]);

    const fetchAttempts = async () => {
        if (!selectedExam) return;
        try {
            const res = await axios.get(`${API_URL}/admin/exams/${selectedExam}/active-attempts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAttempts(res.data);
        } catch (error) {
            console.error("Lỗi lấy danh sách giám sát", error);
        }
    };

    useEffect(() => {
        if (selectedExam) {
            setIsLoading(true);
            fetchAttempts().finally(() => setIsLoading(false));
            
            const intervalId = setInterval(() => {
                fetchAttempts();
            }, 5000); 
            
            return () => clearInterval(intervalId); 
        } else {
            setAttempts([]);
        }
    }, [selectedExam]);

    const handleForceSubmit = async (attemptId, studentName) => {
        const confirm = await Swal.fire({
            title: 'ĐÌNH CHỈ THI?',
            text: `XÁC NHẬN: Bạn muốn đình chỉ và THU BÀI của sinh viên [ ${studentName} ] ngay lập tức?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Đình chỉ ngay',
            cancelButtonText: 'Hủy'
        });

        if (confirm.isConfirmed) {
            try {
                await axios.post(`${API_URL}/admin/exam-attempts/${attemptId}/force-submit`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('Thành công!', 'Đã đình chỉ và thu bài thành công.', 'success');
                fetchAttempts(); 
            } catch (error) {
                Swal.fire('Lỗi!', 'Có lỗi xảy ra khi thực hiện lệnh thu bài!', 'error');
                console.error(error);
            }
        }
    };

    return (
        <div className="container-fluid py-2">
            <h3 className="fw-bold mb-4 d-flex align-items-center text-dark">
                <FaEye className="me-2 text-primary" /> Hệ Thống Giám Sát
            </h3>

            <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
                <div className="card-body p-4">
                    <div className="row align-items-end g-3">
                        <div className="col-md-9">
                            <label className="form-label text-muted fw-medium small mb-2">CHỌN PHÒNG THI ĐANG DIỄN RA</label>
                            <select 
                                className="form-select form-select-lg bg-light border-0 py-3 fs-6"
                                style={{ borderRadius: '10px', boxShadow: 'none' }}
                                value={selectedExam}
                                onChange={(e) => setSelectedExam(e.target.value)}
                            >
                                <option value="">-- Vui lòng chọn một phòng thi --</option>
                                {exams.map(exam => (
                                    <option key={exam.id} value={exam.id}>
                                        {exam.title} (Môn: {exam.subject})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <button className="btn btn-outline-primary w-100 py-3 fw-medium d-flex justify-content-center align-items-center gap-2" 
                                    style={{ borderRadius: '10px' }}
                                    onClick={fetchAttempts} disabled={!selectedExam || isLoading}>
                                <FaSync className={`${isLoading ? 'fa-spin' : ''}`} /> Làm mới tức thì
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {selectedExam && (
                <div className="card shadow-sm border-0" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    <div className="card-header bg-white py-3 border-bottom px-4">
                        <h5 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>Trạng thái sinh viên trong phòng</h5>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="py-3 px-4 border-0 text-muted fw-semibold" style={{ fontSize: '13px' }}>HỌ VÀ TÊN / EMAIL</th>
                                        <th className="py-3 px-3 border-0 text-muted fw-semibold" style={{ fontSize: '13px' }}>LỚP</th>
                                        <th className="py-3 px-3 border-0 text-muted fw-semibold" style={{ fontSize: '13px' }}>GIỜ VÀO THI</th>
                                        <th className="py-3 px-3 border-0 text-muted fw-semibold text-center" style={{ fontSize: '13px' }}>TRẠNG THÁI</th>
                                        <th className="py-3 px-3 border-0 text-muted fw-semibold text-center" style={{ fontSize: '13px' }}>CẢNH BÁO VI PHẠM</th>
                                        <th className="py-3 px-4 border-0 text-muted fw-semibold text-end" style={{ fontSize: '13px' }}>HÀNH ĐỘNG</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attempts.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5 text-muted">
                                                Chưa có sinh viên nào bắt đầu tham gia kỳ thi này.
                                            </td>
                                        </tr>
                                    ) : (
                                        attempts.map(attempt => (
                                            <tr key={attempt.id} style={{ backgroundColor: attempt.cheat_count >= 2 && attempt.status === 'in_progress' ? '#fffbeb' : 'transparent' }}>
                                                <td className="px-4 py-3 border-bottom-0 border-top">
                                                    <div className="fw-bold text-dark">{attempt.user?.name || 'Unknown'}</div>
                                                    <div className="text-muted small">{attempt.user?.email}</div>
                                                </td>
                                                <td className="px-3 py-3 border-bottom-0 border-top text-dark fw-medium">{attempt.user?.class || 'N/A'}</td>
                                                <td className="px-3 py-3 border-bottom-0 border-top text-muted">{new Date(attempt.started_at).toLocaleTimeString('vi-VN')}</td>
                                                
                                                <td className="px-3 py-3 border-bottom-0 border-top text-center">
                                                    {attempt.status === 'in_progress' && <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill"><FaSpinner className="fa-spin me-1"/> Đang làm bài</span>}
                                                    {attempt.status === 'completed' && <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill"><FaCheckCircle className="me-1"/> Đã nộp bài</span>}
                                                    {attempt.status === 'forced_submitted' && <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2 rounded-pill"><FaBan className="me-1"/> Bị đình chỉ</span>}
                                                </td>
                                                
                                                <td className="px-3 py-3 border-bottom-0 border-top text-center">
                                                    {attempt.cheat_count > 0 ? (
                                                        <span className={`badge ${attempt.cheat_count >= 3 ? 'bg-danger text-white' : 'bg-warning text-dark'} px-3 py-2 rounded-pill`}>
                                                            <FaExclamationTriangle className="me-1" /> {attempt.cheat_count} lần
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                
                                                <td className="px-4 py-3 border-bottom-0 border-top text-end">
                                                    <button 
                                                        className="btn btn-sm btn-danger fw-medium px-3"
                                                        style={{ borderRadius: '8px' }}
                                                        onClick={() => handleForceSubmit(attempt.id, attempt.user?.name)}
                                                        disabled={attempt.status !== 'in_progress'}
                                                    >
                                                        Thu bài ngay
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}