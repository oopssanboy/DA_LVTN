import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Download, Target, TrendingUp, Cpu, Loader2, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentRadar() {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [data, setData] = useState({ radar: [], history_6_months: [], subject_details: [], top_skill: '' });
    const [loading, setLoading] = useState(true);

    // Lấy danh sách khóa học
    useEffect(() => {
        api.get('/student/enrolled-courses')
           .then(res => setCourses(res.data))
           .catch(() => toast.error('Không thể lấy danh sách khóa học'));
    }, []);

    // Lấy dữ liệu Radar phụ thuộc vào Khóa học đã chọn
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const url = selectedCourse ? `/student/radar-stats?course_id=${selectedCourse}` : '/student/radar-stats';
            const res = await api.get(url);
            setData(res.data);
        } catch (error) {
            toast.error('Lỗi tải dữ liệu báo cáo');
        } finally {
            setLoading(false);
        }
    }, [selectedCourse]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePrint = () => window.print();

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 font-sans pb-10">
            {/* HEADER CÓ THÊM DROPDOWN CHỌN KHÓA HỌC */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Báo cáo Năng lực Học viên</h1>
                    <p className="text-slate-500 mt-1">Đánh giá toàn diện các kỹ năng lập trình của bạn dựa trên dữ liệu thi thực tế.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <select 
                            value={selectedCourse} 
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700 appearance-none cursor-pointer"
                        >
                            <option value="">-- Tất cả Khóa học --</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                    </div>
                    
                    <button onClick={handlePrint} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex justify-center items-center gap-2 shadow-sm whitespace-nowrap">
                        <Download className="w-4 h-4" /> Xuất báo cáo
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600"/></div>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                                <Target className="w-5 h-5 text-blue-500" /> Biểu đồ Radar Năng lực
                            </h2>
                            <div className="flex-1 min-h-[300px]">
                                {data.radar.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.radar}>
                                            <PolarGrid stroke="#e2e8f0" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Radar name="Kỹ năng (%)" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">Chưa có dữ liệu thi</div>
                                )}
                            </div>
                            <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600">
                                <span className="font-bold text-slate-800">Phân tích:</span> Kỹ năng <strong className="text-emerald-600">{data.top_skill}</strong> của bạn rất tốt.
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                                <TrendingUp className="w-5 h-5 text-emerald-500" /> Tiến độ Điểm TB (6 tháng qua)
                            </h2>
                            <div className="flex-1 min-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.history_6_months} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                        <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="avg_score" name="Điểm trung bình" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-8">
                            <Cpu className="w-5 h-5 text-purple-500" /> Chi tiết theo môn học
                        </h2>
                        <div className="space-y-6">
                            {data.subject_details.length > 0 ? data.subject_details.map((item, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-slate-700 text-sm">{item.name}</span>
                                        <span className="font-bold text-slate-900 text-sm">{item.score_percent}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div className="bg-blue-600 h-3 rounded-full transition-all duration-1000" style={{ width: `${item.score_percent}%` }}></div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-slate-400 py-4">Chưa có dữ liệu môn học.</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}