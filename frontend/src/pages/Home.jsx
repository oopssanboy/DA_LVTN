import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {  GraduationCap, ShieldCheck, UserCheck, BarChart, PlayCircle, MapPin, Phone, Mail } from 'lucide-react';
import { VscServerProcess } from "react-icons/vsc";
import { GrSystem } from "react-icons/gr";
import { TbDeviceAnalytics } from "react-icons/tb";
import FloatingContact from '../components/common/FloatingContact';
import GuestLayout from '../components/common/GuestLayout';

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
        <GuestLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-8">
                    Hệ thống quản lý thi và đánh giá<br className="hidden sm:block" />
                    <span className="text-blue-600">Năng lực lập trình trực tuyến</span>
                </h1>
                <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Nền tảng kiểm tra trực tuyến chuẩn mực. Áp dụng giám sát thời gian thực, ma trận đề thông minh và hệ thống phân quyền 1-1 bảo mật cao.
                </p>
                <div className="flex justify-center gap-4">
                    {user ? (
                        <button onClick={handleDashboardRedirect} className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 shadow-sm transition flex items-center gap-2">
                            <PlayCircle className="w-6 h-6" /> Vào Không Gian Làm Việc
                        </button>
                    ) : (
                        <Link to="/login" className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 shadow-sm transition">
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
                
                <h4 className="text-4xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">Tại sao chọn EduTech?</h4>
                <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">Nền tảng của chúng tôi cung cấp đầy đủ công cụ để bạn từ một người mới bắt đầu trở thành lập trình viên chuyên nghiệp.</p>
                <div className="grid md:grid-cols-3 gap-8 mt-12 mb-16">
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
            </div>
        </GuestLayout>
    );
}