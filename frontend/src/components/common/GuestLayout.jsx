import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, MapPin, Phone, Mail } from 'lucide-react';
import FloatingContact from '../common/FloatingContact';

export default function GuestLayout({ children }) {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    const handleDashboardRedirect = () => {
        if (!user) return navigate('/login');
        if (user.role === 'admin') return navigate('/admin/dashboard');
        if (user.role === 'teacher') return navigate('/teacher/dashboard');
        if (user.role === 'proctor') return navigate('/proctor/dashboard');
        if (user.role === 'student') return navigate('/student/dashboard');
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
     
            <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center gap-2">
                        <GraduationCap className="w-8 h-8 text-blue-600" />
                        <span className="font-bold text-2xl text-slate-900 tracking-tight">NQ EduTech</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <a href= "/" className="text-lg font-medium text-slate-600 hover:text-blue-600 hidden sm:block transition">Trang chủ</a>
                        <Link to="/courses" className="text-lg font-medium text-slate-600 hover:text-blue-600 hidden sm:block transition">Khóa học</Link>
                        <Link to="/about" className="text-lg font-medium text-slate-600 hover:text-blue-600 hidden sm:block transition">Giới thiệu</Link>
                        <Link to="/teachers" className="text-lg font-medium text-slate-600 hover:text-blue-600 hidden sm:block transition">Giảng viên</Link>
                        <Link to="/contact" className="text-lg font-medium text-slate-600 hover:text-blue-600 hidden sm:block transition">Liên hệ</Link>
                    </div>
                    <div>
                        {user ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-slate-600 hidden sm:block">Xin chào, {user.name}</span>
                                <button onClick={handleDashboardRedirect} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-blue-700 transition">
                                    Vào trang quản lý
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="bg-blue-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-blue-700 transition">
                                Đăng nhập
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

  
            <main className="flex-grow">
                {children}
            </main>

    
            <footer className="bg-[#111111] text-slate-300 pt-6 pb-2 mt-auto border-t-[4px] border-blue-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                        <div className="space-y-6">
                            <h4 className="font-bold text-lg text-white uppercase relative pb-2 mb-6">
                                NQ EDUTECH
                                <span className="absolute bottom-0 left-0 w-12 h-[2px] bg-blue-600"></span>
                            </h4>
                            <p className="text-sm leading-relaxed text-slate-400">
                                Nền tảng tổ chức thi trắc nghiệm trực tuyến tiên tiến, cung cấp giải pháp đánh giá năng lực minh bạch, an toàn và tự động hóa cho các cơ sở giáo dục.
                            </p>
                            <ul className="space-y-4 text-sm text-slate-400">
                                <li className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-blue-500 shrink-0" />
                                    <span>180 Cao Lỗ, Phường 4, Quận 8, TP.HCM</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-blue-500 shrink-0" />
                                    <span>0964 789 010</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-blue-500 shrink-0" />
                                    <span>dh52201285@student.stu.edu.vn</span>
                                </li>
                            </ul>
                        </div>

                        <div className="md:pl-10">
                            <h4 className="font-bold text-lg text-white uppercase relative pb-2 mb-6">
                                LIÊN KẾT NHANH
                                <span className="absolute bottom-0 left-0 w-12 h-[2px] bg-blue-600"></span>
                            </h4>
                            <ul className="space-y-4 text-sm">
                                <li><Link to="/" className="text-slate-400 hover:text-blue-500 transition-colors">Trang chủ hệ thống</Link></li>
                                <li><Link to="/about" className="text-slate-400 hover:text-blue-500 transition-colors">Giới thiệu nền tảng</Link></li>
                                <li><Link to="/courses" className="text-slate-400 hover:text-blue-500 transition-colors">Khóa học & Môn thi</Link></li>
                                <li><Link to="/teachers" className="text-slate-400 hover:text-blue-500 transition-colors">Đội ngũ giảng viên</Link></li>
                                <li><Link to="/contact" className="text-slate-400 hover:text-blue-500 transition-colors">Hỗ trợ kỹ thuật</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-lg text-white uppercase relative pb-2 mb-6">
                                BẢN ĐỒ VỊ TRÍ
                                <span className="absolute bottom-0 left-0 w-12 h-[2px] bg-blue-600"></span>
                            </h4>
                            <div className="w-full h-48 rounded-lg overflow-hidden border border-slate-800 shadow-inner">
                                <iframe 
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.954410427756!2d106.6778321!3d10.7379972!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f62a90e5bbd%3A0xb39e80e12d312bc8!2zMTgwIENhbyBM4buXLCBQaMaw4budbmcgNCwgUXXhuq1uIDgsIFRow6BuaCBwaOG7kSBI4buTIENow60gTWluaCwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s" 
                                    width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Bản đồ STU"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 pt-2 flex justify-center text-xs text-slate-500">
                        <p>© 2026 NQ EduTech. Hệ thống quản lý thi và đánh giá năng lực lập trình trực tuyến.</p>
                    </div>
                </div>
            </footer>
            
            <FloatingContact />
        </div>
    );
}