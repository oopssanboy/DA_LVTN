import { ShieldCheck, Target, Zap } from 'lucide-react';
import GuestLayout from '../components/common/GuestLayout';

export default function About() {
    return (
         <GuestLayout>
        <div className="min-h-screen bg-slate-50 pt-10 pb-20 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-blue-600 p-12 text-center text-white">
                    <h1 className="text-4xl font-extrabold mb-4">Về NQ EduTech</h1>
                    <p className="text-lg opacity-90 max-w-2xl mx-auto">Hệ thống thi và đánh giá năng lực lập trình trực tuyến thế hệ mới, tiên phong trong việc ứng dụng công nghệ Realtime.</p>
                </div>
                
                <div className="p-8 md:p-12 space-y-12">
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800 border-l-4 border-blue-600 pl-4">Tầm nhìn & Sứ mệnh</h2>
                        <p className="text-slate-600 leading-relaxed">
                            NQ EduTech được xây dựng với mục tiêu chuyển đổi số quy trình thi cử và đánh giá tại các trường Đại học/Cao đẳng. Chúng tôi giải quyết triệt để các vấn đề về gian lận thi cử, tính minh bạch trong chấm điểm và tự động hóa quy trình hậu kiểm, khiếu nại.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3"/>
                            <h3 className="font-bold text-slate-800 mb-2">Bảo mật tuyệt đối</h3>
                            <p className="text-sm text-slate-500">Giám sát hành vi chuyển tab, cảnh báo gian lận theo thời gian thực.</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                            <Zap className="w-10 h-10 text-amber-500 mx-auto mb-3"/>
                            <h3 className="font-bold text-slate-800 mb-2">Hiệu suất cao</h3>
                            <p className="text-sm text-slate-500">Hỗ trợ hàng ngàn sinh viên làm bài thi đồng thời mà không nghẽn mạng.</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                            <Target className="w-10 h-10 text-blue-500 mx-auto mb-3"/>
                            <h3 className="font-bold text-slate-800 mb-2">Đánh giá chuẩn xác</h3>
                            <p className="text-sm text-slate-500">Thuật toán sinh đề ma trận ngẫu nhiên, phân tích phổ điểm chi tiết.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </GuestLayout>
    );
}