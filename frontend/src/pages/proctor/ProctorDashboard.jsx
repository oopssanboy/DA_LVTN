import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Eye, Users, AlertTriangle, MonitorPlay } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProctorDashboard() {
    const [stats, setStats] = useState({ activeExams: 0, totalViolations: 0, onlineStudents: 0 });

    // Dữ liệu mô phỏng (Placeholder) cho đến khi Backend API Thống kê Giám thị hoàn thiện
    useEffect(() => {
        // Fetch dữ liệu thực tế tại đây
        setStats({
            activeExams: 2,
            totalViolations: 5,
            onlineStudents: 45
        });
    }, []);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Tổng quan Giám thị</h1>
                <p className="text-slate-500 mt-1">Theo dõi trạng thái các phòng thi đang diễn ra.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                        <MonitorPlay className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Phòng thi đang mở</p>
                        <h3 className="text-2xl font-bold text-slate-900">{stats.activeExams}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Sinh viên đang thi</p>
                        <h3 className="text-2xl font-bold text-slate-900">{stats.onlineStudents}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Cảnh báo vi phạm</p>
                        <h3 className="text-2xl font-bold text-slate-900">{stats.totalViolations}</h3>
                    </div>
                </div>
            </div>

            {/* Quick Action Card */}
            <div className="bg-blue-600 text-white p-8 rounded-2xl shadow-sm mt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-xl font-bold mb-2">Truy cập trạm giám sát</h2>
                    <p className="text-blue-100 text-sm max-w-xl">
                        Xem chi tiết tiến độ làm bài, màn hình cảnh báo gian lận và thực hiện các thao tác ép thu bài khẩn cấp đối với sinh viên vi phạm quy chế.
                    </p>
                </div>
                <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition whitespace-nowrap shadow-sm">
                    Vào phòng giám sát
                </button>
            </div>
        </div>
    );
}