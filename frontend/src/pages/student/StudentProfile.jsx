import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Key, Save, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function StudentProfile() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [passwords, setPasswords] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '' 
    });

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        
        if (passwords.new_password !== passwords.new_password_confirmation) {
            toast.error('Mật khẩu mới không khớp nhau!');
            return;
        }

        setLoading(true);
        try {
            await api.put('/auth/password', passwords);
            toast.success('Đổi mật khẩu thành công!');
            setPasswords({ current_password: '', new_password: '', new_password_confirmation: '' });
        } catch (error) {
            const errs = error.response?.data?.errors;
            if (errs) {
                Object.values(errs).forEach(err => toast.error(err[0]));
            } else {
                toast.error(error.response?.data?.message || 'Lỗi khi đổi mật khẩu');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            <h1 className="text-2xl font-bold text-slate-800">Hồ sơ cá nhân</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
        
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                            <User className="w-12 h-12" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">{user?.name || 'Học viên'}</h2>
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold mt-2">
                            {user?.code || 'Chưa cập nhật mã số'}
                        </span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                        <h3 className="font-bold text-slate-800 border-b pb-2">Thông tin liên hệ</h3>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                            <Mail className="w-5 h-5 text-slate-400" />
                            <span className="break-all">{user?.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                            <Shield className="w-5 h-5 text-slate-400" />
                            <span className="capitalize">Vai trò: {user?.role}</span>
                        </div>
                    </div>
                </div>

           
                <div className="md:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Key className="w-5 h-5 text-amber-500" /> Đổi mật khẩu
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Đảm bảo tài khoản của bạn đang sử dụng một mật khẩu mạnh và an toàn.</p>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="p-6 space-y-5">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Mật khẩu hiện tại</label>
                                <input 
                                    type="password" 
                                    required 
                                    value={passwords.current_password}
                                    onChange={(e) => setPasswords({...passwords, current_password: e.target.value})}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition" 
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Mật khẩu mới</label>
                                <input 
                                    type="password" 
                                    required 
                                    minLength={6}
                                    value={passwords.new_password}
                                    onChange={(e) => setPasswords({...passwords, new_password: e.target.value})}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition" 
                                    placeholder="Ít nhất 6 ký tự"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Xác nhận mật khẩu mới</label>
                                <input 
                                    type="password" 
                                    required 
                                    minLength={6}
                                    value={passwords.new_password_confirmation}
                                    onChange={(e) => setPasswords({...passwords, new_password_confirmation: e.target.value})}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition" 
                                    placeholder="Nhập lại mật khẩu mới"
                                />
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition flex items-center gap-2 disabled:opacity-70"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5" />} 
                                    Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}