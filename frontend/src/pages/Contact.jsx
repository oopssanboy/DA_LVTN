import { MapPin, Phone, Mail, Send } from 'lucide-react';
import GuestLayout from '../components/common/GuestLayout';

export default function Contact() {
    return (
        <GuestLayout>
        <div className="min-h-screen bg-slate-50 pt-10 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Liên hệ với chúng tôi</h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">Bạn có câu hỏi hoặc cần hỗ trợ kỹ thuật? Đội ngũ NQ EduTech luôn sẵn sàng lắng nghe và giải đáp.</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-900 text-white p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10 space-y-8">
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Thông tin liên hệ</h3>
                                <p className="text-slate-400">Điền vào biểu mẫu hoặc liên hệ trực tiếp với chúng tôi qua các kênh sau:</p>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0"><MapPin className="text-blue-400"/></div>
                                    <div>
                                        <h4 className="font-bold text-lg">Địa chỉ</h4>
                                        <p className="text-slate-400">180 Cao Lỗ, Phường 4, Quận 8, TP.HCM</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0"><Phone className="text-emerald-400"/></div>
                                    <div>
                                        <h4 className="font-bold text-lg">Điện thoại</h4>
                                        <p className="text-slate-400">0964 789 010</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0"><Mail className="text-amber-400"/></div>
                                    <div>
                                        <h4 className="font-bold text-lg">Email</h4>
                                        <p className="text-slate-400">dh52201285@student.stu.edu.vn</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

            
                    <div className="p-10 lg:p-12">
                        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Đã gửi tin nhắn thành công!'); }}>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Họ và tên</label>
                                    <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition" placeholder="Nguyễn Văn A" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Địa chỉ Email</label>
                                    <input type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition" placeholder="email@example.com" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Chủ đề</label>
                                <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition" placeholder="Bạn cần hỗ trợ vấn đề gì?" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nội dung tin nhắn</label>
                                <textarea required rows="4" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition resize-none" placeholder="Nhập chi tiết nội dung cần liên hệ..."></textarea>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md transition flex items-center justify-center gap-2">
                                <Send className="w-5 h-5"/> Gửi Tin Nhắn
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        </GuestLayout>
    );
    
}