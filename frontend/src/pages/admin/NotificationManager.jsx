import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaBullhorn, FaTrash, FaEyeSlash } from 'react-icons/fa';

function NotificationManager() {
    const [notifications, setNotifications] = useState([]);
    const [form, setForm] = useState({ title: '', content: '', is_active: true });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/notifications`);
            setNotifications(res.data);
        } catch (error) {
            console.error("Lỗi lấy danh sách thông báo", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post(`${API_URL}/admin/notifications`, form);
            setForm({ title: '', content: '', is_active: true });
            Swal.fire('Thành công!', 'Đã đăng thông báo thành công!', 'success');
            fetchNotifications();
        } catch (error) {
            Swal.fire('Lỗi!', 'Đã có lỗi xảy ra khi đăng thông báo.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: 'Xóa thông báo?',
            text: "Bạn có chắc chắn muốn xóa thông báo này?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        });

        if (confirm.isConfirmed) {
            try {
                await axios.delete(`${API_URL}/admin/notifications/${id}`);
                Swal.fire('Đã xóa!', 'Thông báo đã bị xóa khỏi hệ thống.', 'success');
                fetchNotifications();
            } catch (error) {
                Swal.fire('Lỗi!', 'Đã có lỗi khi xóa thông báo.', 'error');
            }
        }
    };

    return (
        <div className="container-fluid py-2">
            <div className="mb-4">
                <h3 className="fw-bold text-dark mb-1">Quản lý Thông báo</h3>
                <p className="text-muted small mb-0">Thông báo đến toàn bộ sinh viên trên hệ thống</p>
            </div>

            <div className="row g-4">
                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '16px' }}>
                        <div className="card-body p-4">
                            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
                                <FaBullhorn className="text-primary" /> Đăng Thông Báo Mới
                            </h5>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label text-muted fw-medium small mb-1">Tiêu đề</label>
                                    <input 
                                        type="text" 
                                        className="form-control bg-light border-0 py-2" 
                                        placeholder="VD: Quy chế thi cuối kỳ..."
                                        value={form.title} 
                                        onChange={e => setForm({...form, title: e.target.value})} 
                                        required 
                                        style={{ borderRadius: '8px' }}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted fw-medium small mb-1">Nội dung</label>
                                    <textarea 
                                        className="form-control bg-light border-0" 
                                        rows="5" 
                                        placeholder="Nhập nội dung chi tiết..."
                                        value={form.content} 
                                        onChange={e => setForm({...form, content: e.target.value})} 
                                        required
                                        style={{ borderRadius: '8px', padding: '12px' }}
                                    ></textarea>
                                </div>
                                <div className="form-check mb-4 bg-light p-3 rounded" style={{ borderRadius: '8px' }}>
                                    <input 
                                        className="form-check-input ms-1" 
                                        type="checkbox" 
                                        id="isActiveCheck" 
                                        checked={form.is_active}
                                        onChange={e => setForm({...form, is_active: e.target.checked})}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <label className="form-check-label fw-medium ms-2" htmlFor="isActiveCheck" style={{ cursor: 'pointer', color: '#334155' }}>
                                        Hiển thị cho sinh viên thấy
                                    </label>
                                </div>
                                <button type="submit" className="btn btn-primary w-100 py-2 fw-medium border-0" style={{ borderRadius: '8px', backgroundColor: '#2563eb' }} disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang đăng...' : 'Đăng Thông Báo'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-lg-8">
                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '16px' }}>
                        <div className="card-header bg-white py-3 border-bottom px-4" style={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                            <h5 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>Danh sách đã đăng</h5>
                        </div>
                        <div className="card-body p-0">
                            <ul className="list-group list-group-flush" style={{ borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
                                {notifications.length === 0 ? (
                                    <li className="list-group-item text-center py-5 text-muted border-0">Chưa có thông báo nào.</li>
                                ) : (
                                    notifications.map(noti => (
                                        <li key={noti.id} className="list-group-item d-flex justify-content-between align-items-start p-4 border-bottom">
                                            <div className="ms-2 me-auto">
                                                <div className="fw-bold fs-5 mb-2 text-dark d-flex align-items-center">
                                                    {noti.title} 
                                                    {!noti.is_active && <span className="badge bg-secondary bg-opacity-10 text-secondary ms-3 fw-normal d-flex align-items-center gap-1"><FaEyeSlash/> Đã ẩn</span>}
                                                </div>
                                                <div className="text-secondary" style={{ whiteSpace: 'pre-wrap', fontSize: '15px', lineHeight: '1.6' }}>{noti.content}</div>
                                                <div className="text-muted mt-3 small d-flex align-items-center gap-2">
                                                    <span className="fw-medium text-primary bg-primary bg-opacity-10 px-2 py-1 rounded">
                                                        Ngày đăng: {new Date(noti.created_at).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                            </div>
                                            <button className="btn btn-sm btn-light text-danger ms-3 d-flex align-items-center gap-1 px-3 py-2" style={{ borderRadius: '8px' }} onClick={() => handleDelete(noti.id)}>
                                                <FaTrash /> Xóa
                                            </button>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NotificationManager;