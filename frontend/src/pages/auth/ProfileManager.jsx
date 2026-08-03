import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Camera, User, Mail, Shield, Loader2, Key } from 'lucide-react';

export default function ProfileManager() {
    const { user, setUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
    const [loading, setLoading] = useState(false);
    
   
    const [pwdData, setPwdData] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
    const [pwdLoading, setPwdLoading] = useState(false);

    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 20 * 1024 * 1024) {
                toast.error('Kích thước ảnh tối đa là 5MB');
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData();
        formData.append('name', name);
        if (avatarFile) formData.append('avatar', avatarFile);

        const toastId = toast.loading('Đang tải ảnh lên Cloudinary...');
        try {
            const res = await api.post('/auth/profile', formData);
            toast.success('Cập nhật thành công!', { id: toastId });
            setUser(res.data.user); 
        } catch (error) {
            if (error.response?.status === 422) {
                const errors = error.response.data.errors;
                const errorMessages = Object.values(errors).flat().join('\n');
                toast.error(`Dữ liệu không hợp lệ:\n${errorMessages}`, { id: toastId });
            } else {
                toast.error(error.response?.data?.message || 'Có lỗi xảy ra', { id: toastId });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPwdLoading(true);
        try {
            await api.put('/auth/password', pwdData);
            toast.success('Đổi mật khẩu thành công!');
            setPwdData({ current_password: '', new_password: '', new_password_confirmation: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi đổi mật khẩu');
        } finally {
            setPwdLoading(false);
        }
    };

    const roleLabels = { student: 'Học viên', teacher: 'Giảng viên', proctor: 'Giám thị', admin: 'Quản trị viên' };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Hồ sơ cá nhân</h1>
                <p className="text-slate-500 mt-1">Quản lý thông tin hiển thị và bảo mật tài khoản.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><User className="w-5 h-5 text-blue-600"/> Thông tin cơ bản</h2>
                    
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-bold text-slate-400">{user?.name?.charAt(0)}</span>
                                    )}
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition transform hover:scale-110"
                                >
                                    <Camera className="w-5 h-5" />
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                            </div>
                            
                            <div className="flex-1 w-full space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Họ và tên hiển thị</label>
                                    <input 
                                        type="text" value={name} onChange={e => setName(e.target.value)} required
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium" 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Chức danh</label>
                                        <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 font-medium flex items-center gap-2">
                                           {roleLabels[user?.role]}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Mã định danh</label>
                                        <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 font-medium font-mono">
                                            {user?.code}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-md flex items-center gap-2 disabled:opacity-70">
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />} Lưu thay đổi
                            </button>
                        </div>
                    </form>
                </div>

    
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Mail className="w-5 h-5"/> Tài khoản đăng nhập</h2>
                        <div className="px-4 py-3 rounded-xl border border-slate-400 font-medium break-all">
                            {user?.email}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">* Email đăng nhập không thể tự thay đổi. Vui lòng liên hệ Admin nếu cần hỗ trợ.</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Key className="w-5 h-5 text-amber-600"/> Đổi mật khẩu</h2>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <input 
                                    type="password" placeholder="Mật khẩu hiện tại" required
                                    value={pwdData.current_password} onChange={e => setPwdData({...pwdData, current_password: e.target.value})}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-amber-500 text-sm" 
                                />
                            </div>
                            <div>
                                <input 
                                    type="password" placeholder="Mật khẩu mới" required minLength="6"
                                    value={pwdData.new_password} onChange={e => setPwdData({...pwdData, new_password: e.target.value})}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-amber-500 text-sm" 
                                />
                            </div>
                            <div>
                                <input 
                                    type="password" placeholder="Xác nhận mật khẩu mới" required minLength="6"
                                    value={pwdData.new_password_confirmation} onChange={e => setPwdData({...pwdData, new_password_confirmation: e.target.value})}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-amber-500 text-sm" 
                                />
                            </div>
                            <button type="submit" disabled={pwdLoading} className="w-full py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-70">
                                {pwdLoading && <Loader2 className="w-4 h-4 animate-spin" />} Cập nhật mật khẩu
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}