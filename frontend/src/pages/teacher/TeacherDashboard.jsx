import { useState, useEffect } from 'react';
import { BookOpen, FileText, CheckSquare, BarChart, Plus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function TeacherDashboard() {
    const [stats, setStats] = useState({ questions: 0, exams: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [qRes, eRes] = await Promise.all([
                    api.get('/teacher/questions'),
                    api.get('/teacher/exams')
                ]);
                
                // Hỗ trợ cả chuẩn Resource và Paginate mặc định của Laravel
                const totalQuestions = qRes.data.meta?.total || qRes.data.total || 0;
                const totalExams = eRes.data.meta?.total || eRes.data.total || 0;

                setStats({ questions: totalQuestions, exams: totalExams });
            } catch (error) {
                console.error("Lỗi tải thống kê", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto font-sans pb-10">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Không gian Giảng viên</h1>
                <p className="text-slate-500 mt-1">Quản lý ngân hàng câu hỏi, kỳ thi và báo cáo học vụ.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><BookOpen className="w-6 h-6" /></div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">---</h3>
                    <p className="text-slate-500 text-sm mt-1">Lớp đang phụ trách (Sắp cập nhật)</p>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><FileText className="w-6 h-6" /></div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">{stats.questions}</h3>
                    <p className="text-slate-500 text-sm mt-1">Câu hỏi trong ngân hàng</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><CheckSquare className="w-6 h-6" /></div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">{stats.exams}</h3>
                    <p className="text-slate-500 text-sm mt-1">Kỳ thi đã tạo</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><BarChart className="w-6 h-6" /></div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">---</h3>
                    <p className="text-slate-500 text-sm mt-1">Báo cáo (Sắp cập nhật)</p>
                </div>
            </div>

            <h2 className="text-xl font-bold text-slate-800 mt-10 mb-4">Lối tắt thao tác</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to="/teacher/questions/create" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 transition flex gap-4 items-center group">
                    <div className="p-4 bg-slate-50 text-slate-600 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition"><Plus className="w-6 h-6"/></div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition">Soạn câu hỏi mới</h4>
                        <p className="text-sm text-slate-500">Thêm câu hỏi trắc nghiệm hoặc điền khuyết.</p>
                    </div>
                </Link>
                <Link to="/teacher/exams/create" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 transition flex gap-4 items-center group">
                    <div className="p-4 bg-slate-50 text-slate-600 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition"><CheckSquare className="w-6 h-6"/></div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition">Tạo kỳ thi mới</h4>
                        <p className="text-sm text-slate-500">Thiết lập thời gian và cấu hình ma trận đề thi.</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}