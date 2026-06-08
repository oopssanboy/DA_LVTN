import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ShieldCheck, UserCheck, BarChart, PlayCircle } from 'lucide-react';

export default function Home() {
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
            {/* Navbar */}
            <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="w-8 h-8 text-blue-600" />
                        <span className="font-bold text-xl text-slate-900 tracking-tight">NQ EduTech</span>
                    </div>
                    <div>
                        {user ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-slate-600 hidden sm:block">Xin chào, {user.name}</span>
                                <button 
                                    onClick={handleDashboardRedirect} 
                                    className="bg-blue-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-blue-700 transition"
                                >
                                    Vào trang quản lý
                                </button>
                            </div>
                        ) : (
                            <Link 
                                to="/login" 
                                className="bg-blue-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-blue-700 transition"
                            >
                                Đăng nhập
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
                    Hệ thống Đánh giá & Giám sát <br className="hidden sm:block" /> 
                    <span className="text-blue-600">Năng lực Trực tuyến</span>
                </h1>
                <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Nền tảng kiểm tra trực tuyến chuẩn mực. Áp dụng giám sát thời gian thực, ma trận đề thông minh và hệ thống phân quyền 1-1 bảo mật cao.
                </p>
                <div className="flex justify-center gap-4">
                    {user ? (
                        <button 
                            onClick={handleDashboardRedirect} 
                            className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 shadow-sm transition flex items-center gap-2"
                        >
                            <PlayCircle className="w-6 h-6" /> Vào Không Gian Làm Việc
                        </button>
                    ) : (
                        <Link 
                            to="/login" 
                            className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 shadow-sm transition"
                        >
                            Bắt đầu ngay
                        </Link>
                    )}
                </div>

                {/* Features (Cards following DesignSystem) */}
                <div className="grid md:grid-cols-3 gap-8 mt-24 mb-16">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-left hover:shadow-md transition">
                        <ShieldCheck className="w-12 h-12 text-blue-600 mb-6" />
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Giám sát Realtime</h3>
                        <p className="text-slate-500 text-sm">Phát hiện và cảnh báo tức thời hành vi gian lận thông qua Socket Reverb.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-left hover:shadow-md transition">
                        <UserCheck className="w-12 h-12 text-blue-600 mb-6" />
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Chuẩn hóa 1-1</h3>
                        <p className="text-slate-500 text-sm">Cơ sở dữ liệu mở rộng rạch ròi giữa Giảng viên, Giám thị và Sinh viên.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-left hover:shadow-md transition">
                        <BarChart className="w-12 h-12 text-blue-600 mb-6" />
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Phân tích chuyên sâu</h3>
                        <p className="text-slate-500 text-sm">Thống kê phổ điểm, độ phân cách câu hỏi và lập báo cáo học vụ chi tiết.</p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-white pt-16 pb-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        {/* Branding */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <GraduationCap className="w-8 h-8 text-blue-500" />
                                <span className="font-bold text-2xl tracking-tight text-white">NQ EduTech</span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                                Hệ thống Đánh giá & Giám sát Năng lực Trực tuyến chuẩn mực.
                            </p>
                        </div>

                        {/* Liên kết nhanh */}
                        <div>
                            <h4 className="font-bold text-lg mb-6 text-white">Liên kết nhanh</h4>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-slate-400 hover:text-white transition text-sm">Về chúng tôi</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-white transition text-sm">Tính năng</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-white transition text-sm">Bảng giá</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-white transition text-sm">Liên hệ</a></li>
                            </ul>
                        </div>

                        {/* Hỗ trợ */}
                        <div>
                            <h4 className="font-bold text-lg mb-6 text-white">Hỗ trợ</h4>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-slate-400 hover:text-white transition text-sm">Hướng dẫn sử dụng</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-white transition text-sm">Câu hỏi thường gặp</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-white transition text-sm">Chính sách bảo mật</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-white transition text-sm">Điều khoản dịch vụ</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                        <p>© 2026 NQ EduTech. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}