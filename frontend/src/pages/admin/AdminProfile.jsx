import { useState, useEffect } from 'react';
import { FaUserShield, FaLock, FaKey, FaSave, FaUserEdit } from 'react-icons/fa';
import Swal from 'sweetalert2';
import axios from 'axios';

export default function AdminProfile() {
    const [user, setUser] = useState({ name: '', email: '', phone: '', role: 'Quản trị viên' });
    const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' });
    
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const storedName = localStorage.getItem('userName') || 'Admin';
        setUser({
            name: storedUser.name || storedName,
            email: storedUser.email || 'admin@system.com',
            phone: storedUser.phone || '',
            role: 'Quản trị viên hệ thống'
        });
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsUpdatingProfile(true);
        try {
            const res = await axios.post(`${API_URL}/update-profile`, user, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Swal.fire('Thành công!', 'Cập nhật thông tin thành công!', 'success');
            localStorage.setItem('user', JSON.stringify(res.data.user));
            localStorage.setItem('userName', res.data.user.name); // Cập nhật tên hiển thị ở Sidebar
            setUser({...user, name: res.data.user.name, phone: res.data.user.phone});
        } catch (error) {
            Swal.fire('Lỗi!', error.response?.data?.message || 'Không thể cập nhật thông tin.', 'error');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

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
        <div className="container-fluid py-2">
            <div className="mb-4">
                <h3 className="fw-bold text-dark mb-1">Thiết lập tài khoản</h3>
                <p className="text-muted small mb-0">Quản lý thông tin và bảo mật</p>
            </div>

            <div className="row g-4">
                {/* CỘT TRÁI: THÔNG TIN CÁ NHÂN */}
                <div className="col-lg-5">
                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '16px' }}>
                        <div className="card-header bg-white py-4 border-bottom px-4 px-md-5" style={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                            <h5 className="mb-0 fw-bold d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
                                <FaUserEdit className="text-primary" /> Thông tin cá nhân
                            </h5>
                        </div>
                        <div className="card-body p-4 p-md-5 text-center">
                            <div className="bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center justify-content-center rounded-circle mb-4" style={{ width: '100px', height: '100px' }}>
                                <FaUserShield style={{ fontSize: '40px' }} />
                            </div>
                            <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill mb-4 fw-medium d-block mx-auto" style={{ width: 'fit-content' }}>
                                {user.role}
                            </span>

                            <form onSubmit={handleUpdateProfile} className="text-start mt-3">
                                <div className="mb-3">
                                    <label className="form-label text-muted fw-medium small mb-1">Họ và tên hiển thị <span className="text-danger">*</span></label>
                                    <input type="text" className="form-control bg-light border-0 py-2 fw-bold" required
                                           value={user.name} onChange={(e) => setUser({...user, name: e.target.value})}
                                           style={{ borderRadius: '8px', boxShadow: 'none' }}/>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted fw-medium small mb-1">Email quản trị (Cố định)</label>
                                    <input type="email" className="form-control bg-light border-0 py-2 text-muted" disabled
                                           value={user.email} style={{ borderRadius: '8px', boxShadow: 'none' }}/>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label text-muted fw-medium small mb-1">Số điện thoại liên hệ</label>
                                    <input type="text" className="form-control bg-light border-0 py-2" 
                                           value={user.phone} onChange={(e) => setUser({...user, phone: e.target.value})}
                                           placeholder="Trống" style={{ borderRadius: '8px', boxShadow: 'none' }}/>
                                </div>
                                
                                <button type="submit" className="btn btn-outline-primary w-100 px-4 py-2 fw-medium d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: '8px' }} disabled={isUpdatingProfile}>
                                    <FaSave /> {isUpdatingProfile ? 'Đang lưu...' : 'Cập nhật thông tin'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: ĐỔI MẬT KHẨU */}
                <div className="col-lg-7">
                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '16px' }}>
                        <div className="card-header bg-white py-4 border-bottom px-4 px-md-5" style={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                            <h5 className="mb-0 fw-bold d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
                                <FaLock className="text-primary" /> Đổi mật khẩu
                            </h5>
                        </div>
                        <div className="card-body p-4 p-md-5">
                            <form onSubmit={handlePasswordChange}>
                                <div className="mb-4">
                                    <label className="form-label text-muted fw-medium small mb-2">Mật khẩu hiện tại <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-0 text-muted ps-3 pe-2" style={{ borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}><FaKey /></span>
                                        <input type="password" className="form-control bg-light border-0 py-2" required
                                               value={passwords.current_password} onChange={(e) => setPasswords({...passwords, current_password: e.target.value})}
                                               placeholder="Nhập mật khẩu hiện tại" style={{ borderTopRightRadius: '8px', borderBottomRightRadius: '8px', boxShadow: 'none' }}/>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label text-muted fw-medium small mb-2">Mật khẩu mới <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-0 text-muted ps-3 pe-2" style={{ borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}><FaLock /></span>
                                        <input type="password" className="form-control bg-light border-0 py-2" required minLength="6"
                                               value={passwords.new_password} onChange={(e) => setPasswords({...passwords, new_password: e.target.value})}
                                               placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)" style={{ borderTopRightRadius: '8px', borderBottomRightRadius: '8px', boxShadow: 'none' }}/>
                                    </div>
                                </div>
                                <div className="mb-5">
                                    <label className="form-label text-muted fw-medium small mb-2">Xác nhận mật khẩu mới <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-0 text-muted ps-3 pe-2" style={{ borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}><FaLock /></span>
                                        <input type="password" className="form-control bg-light border-0 py-2" required minLength="6"
                                               value={passwords.confirm_password} onChange={(e) => setPasswords({...passwords, confirm_password: e.target.value})}
                                               placeholder="Nhập lại mật khẩu mới" style={{ borderTopRightRadius: '8px', borderBottomRightRadius: '8px', boxShadow: 'none' }}/>
                                    </div>
                                </div>
                                
                                <button type="submit" className="btn btn-primary px-4 py-2 fw-medium border-0 d-flex align-items-center gap-2" style={{ borderRadius: '8px', backgroundColor: '#2563eb' }} disabled={isUpdatingPassword}>
                                    <FaSave /> {isUpdatingPassword ? 'Đang cập nhật...' : 'Lưu mật khẩu mới'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}