import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {  GraduationCap, ShieldCheck, UserCheck, BarChart, PlayCircle, MapPin, Phone, Mail } from 'lucide-react';
import { VscServerProcess } from "react-icons/vsc";
import { GrSystem } from "react-icons/gr";
import { TbDeviceAnalytics } from "react-icons/tb";
import FloatingContact from '../components/common/FloatingContact';

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
         

            <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="w-8 h-8 text-blue-600" />
                        <span className="font-bold text-2xl text-slate-900 tracking-tight">NQ EduTech</span>
                    </div>
                    <div className="flex items-center gap-4">
                            <a href="#" className="text-lg font-medium text-slate-600 hidden sm:block">Khóa học</a>
                            <a href="#" className="text-lg font-medium text-slate-600 hidden sm:block">Kỳ thi đánh giá</a>
                            <a href="#" className="text-lg font-medium text-slate-600 hidden sm:block">Giảng viên</a>
                            <a href="#" className="text-lg font-medium text-slate-600 hidden sm:block">Liên hệ</a>
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

          
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-8">
                    Hệ thống quản lý thi và đánh giá<br className="hidden sm:block" />
                    <span className="text-blue-600">Năng lực lập trình trực tuyến</span>
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

             
                <div className="grid md:grid-cols-3 gap-8 mt-24 mb-16">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-left hover:shadow-md transition">
                        <ShieldCheck className="w-12 h-12 text-blue-600 mb-6" />
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Giám sát Realtime</h3>
                        <p className="text-slate-500 text-sm">Phát hiện và cảnh báo tức thời hành vi gian lận thông qua Socket Reverb.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-left hover:shadow-md transition">
                        <UserCheck className="w-12 h-12 text-blue-600 mb-6" />
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Radar Năng lực</h3>
                        <p className="text-slate-500 text-sm">Đánh giá năng lực và gợi ý học tập.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-left hover:shadow-md transition">
                        <BarChart className="w-12 h-12 text-blue-600 mb-6" />
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Phân tích chuyên sâu</h3>
                        <p className="text-slate-500 text-sm">Thống kê phổ điểm, độ phân cách câu hỏi và lập báo cáo học vụ chi tiết.</p>
                    </div>
                </div>
                <h4 className="text-4xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">
                    Tại sao chọn EduTech?
                </h4>
                <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Nền tảng của chúng tôi cung cấp đầy đủ công cụ để bạn từ một người mới bắt đầu trở thành lập trình viên chuyên nghiệp.
                </p>
                <div className="grid md:grid-cols-3 gap-8 mt-24 mb-16">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-left hover:shadow-md transition">
                        <VscServerProcess className="w-12 h-12 text-blue-600 mb-6" />
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Lộ trình rõ ràng</h3>
                        <p className="text-slate-500 text-sm">Hệ thống tự động thiết kế lộ trình học tập phù hợp với năng lực hiện tại của bạn.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-left hover:shadow-md transition">
                        <GrSystem className="w-12 h-12 text-blue-600 mb-6" />
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Hệ thống thi đa dạng</h3>
                        <p className="text-slate-500 text-sm">Trắc nghiệm, điền khuyết, đánh giá kỹ năng toàn diện với bộ đếm giờ chuẩn.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-left hover:shadow-md transition">
                        <TbDeviceAnalytics className="w-12 h-12 text-blue-600 mb-6" />
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Phân tích năng lực</h3>
                        <p className="text-slate-500 text-sm">Biểu đồ Radar Chart theo dõi chi tiết điểm mạnh và điểm yếu từng kỹ năng.</p>
                    </div>
                </div>
            </main>

        
            <footer className="bg-[#111111] text-slate-300 pt-6 pb-2 mt-auto border-t-[4px]">
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
                                <li><a href="#" className="text-slate-400 hover:text-blue-500 transition-colors">Giới thiệu Đồ án</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-blue-500 transition-colors">Tính năng nổi bật</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-blue-500 transition-colors">Hướng dẫn cho Sinh viên</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-blue-500 transition-colors">Hướng dẫn cho Giảng viên</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-blue-500 transition-colors">Hỗ trợ kỹ thuật</a></li>
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
                                    width="100%" 
                                    height="100%" 
                                    style={{ border: 0 }} 
                                    allowFullScreen="" 
                                    loading="lazy" 
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Bản đồ STU"
                                ></iframe>
                            </div>
                        </div>
                    </div>

      
                    <div className="border-t border-slate-800 pt-2 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                        <p>© 2026 NQ EduTech. Hệ thống quản lý thi và đánh giá năng lực lập trình trực tuyến.</p>
                        
                        <div className="flex items-center gap-3">
                      
                            <a href="#" className="w-8 h-8 rounded-full  flex items-center justify-center bg-blue-600 hover:text-white transition group">
                                <svg className="w-4 h-4 fill-current text-slate-400 text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </a>
                           
                            <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-600 hover:text-white transition group">
                                <svg className="w-4 h-4 fill-current text-slate-400 text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                                </svg>
                            </a>
                           
                            <a href="#" className="w-8 h-8 rounded-full  flex items-center justify-center bg-red-600 hover:text-white transition group">
                                <svg className="w-4 h-4 fill-current text-slate-400 text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
            <FloatingContact />
        </div>
    );
}