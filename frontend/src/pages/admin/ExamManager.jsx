import { useState, useEffect } from 'react';
import { FaPlus, FaRandom, FaPlay, FaPause, FaEdit, FaTrash, FaClock, FaBook, FaChartBar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function ExamManager() {
    const [exams, setExams] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        title: '', subject: '', duration: 60, total_questions: 40, start_time: '', end_time: '', password: ''
    });

    const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api') + '/exams';
    const token = localStorage.getItem('token');

    useEffect(() => { fetchExams(); }, []);

    const fetchExams = async () => {
        try {
            const res = await fetch(API_URL, { 
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } 
            });
            if (!res.ok) throw new Error('Lỗi kết nối Backend (Có thể chưa migrate database)');
            const data = await res.json();
            setExams(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Lỗi fetchExams:", error);
        }
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const method = modalMode === 'add' ? 'POST' : 'PUT';
        const url = modalMode === 'add' ? API_URL : `${API_URL}/${editingId}`;

        try {
            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi lưu dữ liệu');
            
            Swal.fire('Thành công!', modalMode === 'add' ? 'Đã thêm kỳ thi mới.' : 'Đã cập nhật kỳ thi.', 'success');
            setShowModal(false);
            fetchExams();
        } catch (error) {
            Swal.fire('Lỗi!', error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStatus = async (id) => {
        try {
            await fetch(`${API_URL}/${id}/toggle-status`, { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } 
            });
            fetchExams();
        } catch (error) {
            Swal.fire('Lỗi!', 'Không thể thay đổi trạng thái!', 'error');
        }
    };

    const generateQuestions = async (id, subject, total) => {
        const confirm = await Swal.fire({
            title: 'Tạo đề thi?',
            text: `Xác nhận lấy ngẫu nhiên ${total} câu hỏi môn ${subject}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Tạo đề',
            cancelButtonText: 'Hủy'
        });

        if (!confirm.isConfirmed) return;
        
        try {
            const res = await fetch(`${API_URL}/${id}/generate-questions`, { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } 
            });
            const data = await res.json();
            if (data.error) Swal.fire('Lỗi!', data.error, 'error');
            else {
                Swal.fire('Thành công!', 'Đã tạo đề thi thành công!', 'success');
                fetchExams();
            }
        } catch (error) {
            Swal.fire('Lỗi server!', 'Đã có lỗi xảy ra khi random câu hỏi!', 'error');
        }
    };

    const deleteExam = async (id) => {
        const confirm = await Swal.fire({
            title: 'Xóa kỳ thi?',
            text: 'Mọi đề thi và kết quả liên quan sẽ bị mất không thể khôi phục!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Đồng ý xóa',
            cancelButtonText: 'Hủy'
        });

        if (!confirm.isConfirmed) return;
        
        await fetch(`${API_URL}/${id}`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        Swal.fire('Đã xóa!', 'Kỳ thi đã được xóa khỏi hệ thống.', 'success');
        fetchExams();
    };

    const openModal = (mode, exam = null) => {
        setModalMode(mode);
        if (mode === 'edit') {
            setEditingId(exam.id);
            setFormData({
                title: exam.title, subject: exam.subject, duration: exam.duration, 
                total_questions: exam.total_questions, password: exam.password || '',
                start_time: exam.start_time ? new Date(exam.start_time).toISOString().slice(0, 16) : '',
                end_time: exam.end_time ? new Date(exam.end_time).toISOString().slice(0, 16) : '',
            });
        } else {
            setFormData({ title: '', subject: '', duration: 60, total_questions: 40, start_time: '', end_time: '', password: '' });
        }
        setShowModal(true);
    };

    return (
        <div className="container-fluid py-2">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold text-dark mb-1">Quản lý Kỳ thi</h3>
                    <p className="text-muted small mb-0">Danh sách các kỳ thi và cấu hình đề</p>
                </div>
                <button className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-medium shadow-sm border-0" 
                        style={{ borderRadius: '8px', backgroundColor: '#2563eb' }} onClick={() => openModal('add')}>
                    <FaPlus /> Thêm Kỳ Thi
                </button>
            </div>

            <div className="card shadow-sm border-0" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th className="py-3 px-4 border-0 text-muted fw-semibold" style={{ fontSize: '13px' }}>KỲ THI & MÔN HỌC</th>
                                <th className="py-3 px-3 border-0 text-muted fw-semibold" style={{ fontSize: '13px' }}>CẤU HÌNH</th>
                                <th className="py-3 px-3 border-0 text-muted fw-semibold text-center" style={{ fontSize: '13px' }}>SỐ CÂU</th>
                                <th className="py-3 px-3 border-0 text-muted fw-semibold text-center" style={{ fontSize: '13px' }}>TRẠNG THÁI</th>
                                <th className="py-3 px-4 border-0 text-muted fw-semibold text-end" style={{ fontSize: '13px' }}>THAO TÁC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exams.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-5 text-muted">Chưa có kỳ thi nào</td></tr>
                            ) : exams.map(exam => (
                                <tr key={exam.id}>
                                    <td className="px-4 py-3 border-bottom-0 border-top">
                                        <div className="fw-bold text-dark" style={{ fontSize: '15px' }}>{exam.title}</div>
                                        <div className="text-muted small d-flex align-items-center gap-1 mt-1">
                                            <FaBook className="text-primary opacity-75" /> {exam.subject}
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 border-bottom-0 border-top">
                                        <div className="d-flex flex-column gap-1">
                                            <span className="text-dark fw-medium small d-flex align-items-center gap-1">
                                                <FaClock className="text-muted"/> {exam.duration} phút
                                            </span>
                                            {exam.start_time && <small className="text-muted" style={{ fontSize: '12px' }}>BĐ: {new Date(exam.start_time).toLocaleDateString('vi-VN')}</small>}
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 border-bottom-0 border-top text-center">
                                        <span className={`badge rounded-pill px-3 py-2 ${exam.questions_count >= exam.total_questions ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                                            {exam.questions_count} / {exam.total_questions}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 border-bottom-0 border-top text-center">
                                        {exam.is_active 
                                            ? <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">Đang Mở</span>
                                            : <span className="badge bg-secondary bg-opacity-10 text-secondary px-3 py-2 rounded-pill">Đã Đóng</span>
                                        }
                                    </td>
                                    <td className="px-4 py-3 border-bottom-0 border-top text-end">
                                        <div className="d-inline-flex gap-2">
                                            <button className={`btn btn-sm ${exam.is_active ? 'btn-light text-warning' : 'btn-light text-success'} d-flex align-items-center justify-content-center rounded-circle`} 
                                                    style={{ width: '32px', height: '32px' }} title={exam.is_active ? "Đóng thi" : "Mở thi"} onClick={() => toggleStatus(exam.id)}>
                                                {exam.is_active ? <FaPause /> : <FaPlay />}
                                            </button>
                                            <button className="btn btn-sm btn-light text-primary d-flex align-items-center justify-content-center rounded-circle" 
                                                    style={{ width: '32px', height: '32px' }} title="Random đề thi" onClick={() => generateQuestions(exam.id, exam.subject, exam.total_questions)}>
                                                <FaRandom />
                                            </button>
                                            <button className="btn btn-sm btn-light text-info d-flex align-items-center justify-content-center rounded-circle" 
                                                    style={{ width: '32px', height: '32px' }} title="Sửa" onClick={() => openModal('edit', exam)}><FaEdit /></button>
                                            <button className="btn btn-sm btn-light text-danger d-flex align-items-center justify-content-center rounded-circle" 
                                                    style={{ width: '32px', height: '32px' }} title="Xóa" onClick={() => deleteExam(exam.id)}><FaTrash /></button>
                                            
                                            <button 
                                                onClick={() => navigate(`/admin/exams/${exam.id}/report`)}
                                                className="btn btn-sm btn-light text-primary fw-medium px-3 d-flex align-items-center gap-1"
                                                style={{ borderRadius: '6px' }}
                                            >
                                                <FaChartBar /> Thống Kê
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow" style={{ borderRadius: '16px' }}>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
                                    <h5 className="modal-title fw-bold text-dark">{modalMode === 'add' ? 'Thêm Kỳ Thi Mới' : 'Cập Nhật Kỳ Thi'}</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                </div>
                                <div className="modal-body px-4 py-3">
                                    <div className="mb-3">
                                        <label className="form-label text-muted fw-medium small mb-1">Tên kỳ thi <span className="text-danger">*</span></label>
                                        <input type="text" className="form-control bg-light border-0 py-2" name="title" value={formData.title} onChange={handleInputChange} placeholder="VD: Thi Giữa Kỳ Môn Web" required style={{ borderRadius: '8px' }}/>
                                    </div>
                                    
                                    <div className="row g-3 mb-3">
                                        <div className="col-8">
                                            <label className="form-label text-muted fw-medium small mb-1">Môn học (Khớp NHCH) <span className="text-danger">*</span></label>
                                            <input type="text" className="form-control bg-light border-0 py-2" name="subject" value={formData.subject} onChange={handleInputChange} placeholder="VD: Lập trình Web" required style={{ borderRadius: '8px' }}/>
                                        </div>
                                        <div className="col-4">
                                            <label className="form-label text-muted fw-medium small mb-1">Lấy Số Câu <span className="text-danger">*</span></label>
                                            <input type="number" className="form-control bg-light border-0 py-2" name="total_questions" value={formData.total_questions} onChange={handleInputChange} min="1" required style={{ borderRadius: '8px' }}/>
                                        </div>
                                    </div>

                                    <div className="row g-3 mb-3">
                                        <div className="col-4">
                                            <label className="form-label text-muted fw-medium small mb-1">Thời gian (Phút) <span className="text-danger">*</span></label>
                                            <input type="number" className="form-control bg-light border-0 py-2" name="duration" value={formData.duration} onChange={handleInputChange} min="1" required style={{ borderRadius: '8px' }}/>
                                        </div>
                                        <div className="col-8">
                                            <label className="form-label text-muted fw-medium small mb-1">Mật khẩu (Tùy chọn)</label>
                                            <input type="text" className="form-control bg-light border-0 py-2" name="password" value={formData.password} onChange={handleInputChange} placeholder="Bỏ trống nếu không cần" style={{ borderRadius: '8px' }}/>
                                        </div>
                                    </div>

                                    <div className="row g-3 mb-2">
                                        <div className="col-6">
                                            <label className="form-label text-muted fw-medium small mb-1">Bắt đầu (Tùy chọn)</label>
                                            <input type="datetime-local" className="form-control bg-light border-0 py-2" name="start_time" value={formData.start_time} onChange={handleInputChange} style={{ borderRadius: '8px' }}/>
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label text-muted fw-medium small mb-1">Kết thúc (Tùy chọn)</label>
                                            <input type="datetime-local" className="form-control bg-light border-0 py-2" name="end_time" value={formData.end_time} onChange={handleInputChange} style={{ borderRadius: '8px' }}/>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 px-4 pb-4 pt-0">
                                    <button type="button" className="btn btn-light px-4" style={{ borderRadius: '8px' }} onClick={() => setShowModal(false)}>Hủy</button>
                                    <button type="submit" className="btn btn-primary px-4 border-0" style={{ borderRadius: '8px', backgroundColor: '#2563eb' }} disabled={isLoading}>{isLoading ? 'Đang lưu...' : 'Lưu lại'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}