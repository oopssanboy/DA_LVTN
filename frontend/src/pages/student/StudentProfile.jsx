import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import { FaUserGraduate, FaSignOutAlt, FaHome, FaLock, FaSave, FaEnvelope, FaIdCard, FaPhone, FaUserEdit } from 'react-icons/fa';

export default function StudentProfile() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');
    
    const [user, setUser] = useState({ name: '', email: '', class: '', phone: '' });
    const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' });
    
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUser({
            name: storedUser.name || '',
            email: storedUser.email || '',
            class: storedUser.class || '',
            phone: storedUser.phone || ''
        });
    }, [navigate, token]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // Hàm xử lý đổi thông tin cá nhân
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsUpdatingProfile(true);
        try {
            const res = await axios.post(`${API_URL}/update-profile`, user, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Swal.fire('Thành công!', 'Đã cập nhật thông tin cá nhân!', 'success');
            localStorage.setItem('user', JSON.stringify(res.data.user)); // Cập nhật lại localStorage
            setUser(res.data.user); // Render lại giao diện
        } catch (error) {
            Swal.fire('Lỗi!', error.response?.data?.message || 'Không thể cập nhật thông tin.', 'error');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    // Hàm xử lý đổi mật khẩu
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwords.new_password !== passwords.confirm_password) {
            Swal.fire('Lỗi!', 'Mật khẩu xác nhận không khớp!', 'error');
            return;
        }

        setIsUpdatingPassword(true);
        try {
            await axios.post(`${API_URL}/change-password`, passwords, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Swal.fire('Thành công!', 'Đổi mật khẩu thành công!', 'success');
            setPasswords({ current_password: '', new_password: '', confirm_password: '' });
        } catch (error) {
            Swal.fire('Lỗi!', error.response?.data?.message || 'Không thể đổi mật khẩu lúc này.', 'error');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    return (
        <div className="min-vh-100" style={{ backgroundColor: '#f8fafc' }}>
            <nav className="navbar navbar-expand-lg bg-white shadow-sm mb-4 py-3 border-bottom">
                <div className="container">
                    <span className="navbar-brand fw-bold d-flex align-items-center gap-2" style={{ color: '#2563eb' }}>
                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle d-flex align-items-center justify-content-center">
                            <FaUserGraduate className="fs-5" />
                        </div>
                        CỔNG THI SINH VIÊN
                    </span>
                    <div className="d-flex align-items-center gap-3">
                        <button onClick={() => navigate('/student/home')} className="btn btn-light text-primary d-flex align-items-center gap-2 fw-medium px-3 py-2 border-0" style={{ borderRadius: '8px' }}>
                            <FaHome /> Trang chủ
                        </button>
                        <div className="border-start ms-2 me-2" style={{ height: '24px' }}></div>
                        <div className="text-end d-none d-sm-block">
                            <small className="d-block text-muted fw-medium" style={{ fontSize: '12px' }}>Xin chào,</small>
                            <span className="fw-bold text-dark">{user.name || 'Học viên'}</span>
                        </div>
                        <button onClick={handleLogout} className="btn btn-light text-danger d-flex align-items-center gap-2 fw-medium px-3 py-2 border-0" style={{ borderRadius: '8px' }}>
                            <FaSignOutAlt />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container pb-5">
                <div className="row justify-content-center g-4">
                    
                    {/* CỘT TRÁI: FORM ĐỔI THÔNG TIN */}
                    <div className="col-lg-5">
                        <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '16px' }}>
                            <div className="card-header bg-white py-4 border-bottom px-4 px-md-5" style={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
                                    <FaUserEdit className="text-primary" /> Thông tin cá nhân
                                </h5>
                            </div>
                            <div className="card-body p-4 p-md-5 text-center">
                                <div className="bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center justify-content-center rounded-circle mb-4" style={{ width: '100px', height: '100px' }}>
                                    <FaUserGraduate style={{ fontSize: '40px' }} />
                                </div>
                                
                                <form onSubmit={handleUpdateProfile} className="text-start mt-2">
                                    <div className="mb-3">
                                        <label className="form-label text-muted fw-medium small mb-1">Họ và tên <span className="text-danger">*</span></label>
                                        <input type="text" className="form-control bg-light border-0 py-2 px-3 fw-bold" required
                                               value={user.name} onChange={(e) => setUser({...user, name: e.target.value})}
                                               style={{ borderRadius: '8px', boxShadow: 'none' }}/>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label text-muted fw-medium small mb-1">Địa chỉ Email (Không thể đổi)</label>
                                        <input type="email" className="form-control bg-light border-0 py-2 px-3 text-muted" disabled
                                               value={user.email} style={{ borderRadius: '8px', boxShadow: 'none' }}/>
                                    </div>
                                    <div className="row mb-4">
                                        <div className="col-6">
                                            <label className="form-label text-muted fw-medium small mb-1">Lớp học</label>
                                            <input type="text" className="form-control bg-light border-0 py-2 px-3" 
                                                   value={user.class} onChange={(e) => setUser({...user, class: e.target.value})}
                                                   placeholder="VD: 12A1" style={{ borderRadius: '8px', boxShadow: 'none' }}/>
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label text-muted fw-medium small mb-1">Số điện thoại</label>
                                            <input type="text" className="form-control bg-light border-0 py-2 px-3" 
                                                   value={user.phone} onChange={(e) => setUser({...user, phone: e.target.value})}
                                                   placeholder="Trống" style={{ borderRadius: '8px', boxShadow: 'none' }}/>
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-outline-primary w-100 py-2 fw-medium d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: '8px' }} disabled={isUpdatingProfile}>
                                        <FaSave /> {isUpdatingProfile ? 'Đang lưu...' : 'Cập nhật thông tin'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI: FORM ĐỔI MẬT KHẨU */}
                    <div className="col-lg-7">
                        <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '16px' }}>
                            <div className="card-header bg-white py-4 border-bottom px-4 px-md-5" style={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
                                    <FaLock className="text-primary" /> Bảo mật tài khoản
                                </h5>
                                <p className="text-muted small mb-0 mt-1">Đổi mật khẩu định kỳ để bảo vệ tài khoản thi của bạn.</p>
                            </div>
                            <div className="card-body p-4 p-md-5">
                                <form onSubmit={handlePasswordChange}>
                                    <div className="row mb-4">
                                        <div className="col-lg-9">
                                            <label className="form-label text-muted fw-medium small mb-2">Mật khẩu hiện tại <span className="text-danger">*</span></label>
                                            <input type="password" className="form-control bg-light border-0 py-2 px-3" required
                                                   value={passwords.current_password} onChange={(e) => setPasswords({...passwords, current_password: e.target.value})}
                                                   placeholder="Nhập mật khẩu hiện tại" style={{ borderRadius: '8px', boxShadow: 'none' }}/>
                                        </div>
                                    </div>
                                    <div className="row mb-4">
                                        <div className="col-lg-9">
                                            <label className="form-label text-muted fw-medium small mb-2">Mật khẩu mới <span className="text-danger">*</span></label>
                                            <input type="password" className="form-control bg-light border-0 py-2 px-3" required minLength="6"
                                                   value={passwords.new_password} onChange={(e) => setPasswords({...passwords, new_password: e.target.value})}
                                                   placeholder="Nhập mật khẩu mới" style={{ borderRadius: '8px', boxShadow: 'none' }}/>
                                        </div>
                                    </div>
                                    <div className="row mb-5">
                                        <div className="col-lg-9">
                                            <label className="form-label text-muted fw-medium small mb-2">Xác nhận mật khẩu mới <span className="text-danger">*</span></label>
                                            <input type="password" className="form-control bg-light border-0 py-2 px-3" required minLength="6"
                                                   value={passwords.confirm_password} onChange={(e) => setPasswords({...passwords, confirm_password: e.target.value})}
                                                   placeholder="Nhập lại mật khẩu mới" style={{ borderRadius: '8px', boxShadow: 'none' }}/>
                                        </div>
                                    </div>
                                    
                                    <button type="submit" className="btn btn-primary px-4 py-2 fw-medium border-0 d-flex align-items-center gap-2 shadow-sm" style={{ borderRadius: '8px', backgroundColor: '#2563eb' }} disabled={isUpdatingPassword}>
                                        <FaSave /> {isUpdatingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}