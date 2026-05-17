import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import { 
  FaUserGraduate, FaSignOutAlt, FaLock, FaSave, 
  FaEnvelope, FaIdCard, FaPhone, FaUserEdit, FaShieldAlt 
} from 'react-icons/fa';

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

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsUpdatingProfile(true);
        try {
            const response = await axios.put(`${API_URL}/student/profile`, user, {
                headers: { Authorization: `Bearer ${token}` }
            });
            localStorage.setItem('user', JSON.stringify(response.data.user));
            Swal.fire({
                title: 'Thành công!',
                text: 'Thông tin cá nhân đã được cập nhật.',
                icon: 'success',
                confirmButtonColor: '#2563eb'
            });
        } catch (error) {
            Swal.fire('Thất bại', error.response?.data?.message || 'Không thể cập nhật thông tin!', 'error');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (passwords.new_password !== passwords.confirm_password) {
            Swal.fire('Lỗi', 'Xác nhận mật khẩu mới không khớp!', 'error');
            return;
        }
        setIsUpdatingPassword(true);
        try {
            await axios.put(`${API_URL}/student/change-password`, passwords, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Swal.fire({
                title: 'Thành công!',
                text: 'Mật khẩu đã được thay đổi.',
                icon: 'success',
                confirmButtonColor: '#2563eb'
            });
            setPasswords({ current_password: '', new_password: '', confirm_password: '' });
        } catch (error) {
            Swal.fire('Thất bại', error.response?.data?.message || 'Không thể đổi mật khẩu!', 'error');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
            {/* Header: Tiêu đề & Nút Đăng xuất */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-5 border-b border-gray-200">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FaUserGraduate className="text-blue-600" /> Hồ sơ cá nhân
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Quản lý thông tin cá nhân và bảo mật tài khoản sinh viên</p>
                </div>
                <button 
                    onClick={handleLogout} 
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-all duration-200 shadow-sm active:scale-95 self-start sm:self-auto"
                >
                    <FaSignOutAlt /> Đăng xuất
                </button>
            </div>

            {/* Grid Layout 2 Cột bằng Tailwind */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Khối bên trái: Thông tin cá nhân */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                    <div className="border-b border-gray-100 pb-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <FaUserEdit className="text-blue-600" /> Thông tin sinh viên
                        </h2>
                    </div>
                    
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <FaIdCard className="text-gray-400" /> Họ và tên <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm" 
                                required 
                                value={user.name} 
                                onChange={(e) => setUser({...user, name: e.target.value})}
                                placeholder="Nhập họ và tên sinh viên"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <FaEnvelope className="text-gray-400" /> Địa chỉ Email <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="email" 
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm" 
                                required 
                                value={user.email} 
                                onChange={(e) => setUser({...user, email: e.target.value})}
                                placeholder="Nhập email sinh viên (@stu.edu.vn)"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <FaPhone className="text-gray-400" /> Số điện thoại
                            </label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm" 
                                value={user.phone} 
                                onChange={(e) => setUser({...user, phone: e.target.value})}
                                placeholder="Chưa cập nhật số điện thoại liên hệ"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <FaUserGraduate /> Lớp sinh hoạt cố định
                            </label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed text-sm outline-none" 
                                disabled 
                                value={user.class || 'Chưa phân lớp'} 
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all duration-150 shadow-sm shadow-blue-500/10 active:scale-[0.99]"
                            disabled={isUpdatingProfile}
                        >
                            <FaSave className="text-base" />
                            {isUpdatingProfile ? 'Đang lưu xử lý...' : 'Lưu thông tin'}
                        </button>
                    </form>
                </div>

                {/* Khối bên phải: Bảo mật & Mật khẩu */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                    <div className="border-b border-gray-100 pb-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <FaShieldAlt className="text-amber-500" /> Bảo mật tài khoản
                        </h2>
                    </div>
                    
                    <form onSubmit={handleUpdatePassword} className="space-y-4 h-[calc(100%-3rem)] flex flex-col justify-between">
                        <div className="space-y-4 w-full">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <FaLock className="text-gray-400" /> Mật khẩu hiện tại <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="password" 
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm" 
                                    required 
                                    value={passwords.current_password} 
                                    onChange={(e) => setPasswords({...passwords, current_password: e.target.value})}
                                    placeholder="Xác thực mật khẩu cũ để thay đổi"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <FaLock className="text-blue-500" /> Mật khẩu mới <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="password" 
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm" 
                                    required 
                                    minLength="6"
                                    value={passwords.new_password} 
                                    onChange={(e) => setPasswords({...passwords, new_password: e.target.value})}
                                    placeholder="Tối thiểu từ 6 ký tự trở lên"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <FaLock className="text-green-500" /> Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="password" 
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm" 
                                    required 
                                    minLength="6"
                                    value={passwords.confirm_password} 
                                    onChange={(e) => setPasswords({...passwords, confirm_password: e.target.value})}
                                    placeholder="Nhập lại mật khẩu mới để đối chiếu"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-xl transition-all duration-150 shadow-sm shadow-amber-500/10 active:scale-[0.99] mt-6"
                            disabled={isUpdatingPassword}
                        >
                            <FaSave className="text-base" />
                            {isUpdatingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
}