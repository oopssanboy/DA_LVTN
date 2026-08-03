import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Mail, Key, Lock, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Mật khẩu mới
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']); // Mảng chứa 6 số OTP
    const [formData, setFormData] = useState({ password: '', password_confirmation: '' });
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const inputRefs = useRef([]);

    // Bước 1: Gửi OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/forgot-password', { email });
            toast.success(res.data.message);
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không tìm thấy tài khoản email này.');
        } finally {
            setLoading(false);
        }
    };

    // Xử lý nhập từng ô OTP
    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return; // Chỉ cho nhập số
        
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Tự động nhảy sang ô tiếp theo
        if (value !== '' && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    // Xử lý xóa lùi (Backspace) tự động nhảy về ô trước
    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && index > 0 && otp[index] === '') {
            inputRefs.current[index - 1].focus();
        }
    };

    // Bước 2: Kiểm tra OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length < 6) return toast.error('Vui lòng nhập đủ 6 số xác thực.');

        setLoading(true);
        try {
            await api.post('/auth/verify-otp', { email, otp: otpString });
            toast.success('Mã xác thực chính xác!');
            setStep(3); // Đúng mã mới cho sang bước đổi mật khẩu
        } catch (error) {
            toast.error(error.response?.data?.message || 'Mã xác thực không hợp lệ.');
        } finally {
            setLoading(false);
        }
    };

    // Bước 3: Đổi mật khẩu mới
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.password_confirmation) {
            return toast.error('Mật khẩu xác nhận không khớp.');
        }
        
        setLoading(true);
        try {
            const res = await api.post('/auth/reset-password', {
                email,
                otp: otp.join(''),
                password: formData.password
            });
            toast.success(res.data.message);
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">Khôi phục mật khẩu</h2>
                    <p className="text-slate-500 text-center text-sm mb-8">
                        {step === 1 && 'Nhập email của bạn để nhận mã xác thực.'}
                        {step === 2 && `Mã xác thực 6 số đã được gửi tới ${email}.`}
                        {step === 3 && 'Tạo mật khẩu mới cho tài khoản của bạn.'}
                    </p>

                    {/* BƯỚC 1: NHẬP EMAIL */}
                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input 
                                    type="email" placeholder="Nhập địa chỉ Email" required
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition"
                                />
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex justify-center items-center gap-2 shadow-md shadow-blue-500/20">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Nhận mã xác thực'}
                            </button>
                        </form>
                    )}

                    {/* BƯỚC 2: NHẬP MÃ OTP 6 Ô */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex justify-between gap-2 px-2">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        className="w-12 h-14 text-center text-2xl font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                    />
                                ))}
                            </div>
                            <button type="submit" disabled={loading || otp.join('').length < 6} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex justify-center items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Xác thực OTP <CheckCircle2 className="w-5 h-5" /></>}
                            </button>
                            <div className="text-center">
                                <button type="button" onClick={handleSendOTP} disabled={loading} className="text-sm font-medium text-slate-500 hover:text-blue-600 transition">
                                    Gửi lại mã?
                                </button>
                            </div>
                        </form>
                    )}

                    {/* BƯỚC 3: NHẬP MẬT KHẨU MỚI */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input 
                                    type="password" placeholder="Mật khẩu mới" required minLength="6"
                                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white transition"
                                />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input 
                                    type="password" placeholder="Xác nhận mật khẩu mới" required minLength="6"
                                    value={formData.password_confirmation} onChange={e => setFormData({...formData, password_confirmation: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white transition"
                                />
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition flex justify-center items-center gap-2 shadow-md shadow-emerald-500/20">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lưu mật khẩu mới'}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 text-center">
                        <Link to="/login" className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 transition">
                            <ArrowLeft className="w-4 h-4" /> Về trang đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}