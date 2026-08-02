import { useState, useEffect } from 'react';
import { BookOpen, FileText, CheckSquare, BarChart, Plus, Loader2, TrendingUp, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import api from '../../services/api';

const COLORS = ['#10b981', '#f43f5e']; 

export default function TeacherDashboard() {
    const [stats, setStats] = useState({ questions: 0, exams: 0, classes: 0, totalAttempts: 0 });
    const [chartData, setChartData] = useState({ revenueData: [], passRateData: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
            
                const [qRes, eRes, cRes, dashRes] = await Promise.all([
                    api.get('/teacher/questions'),
                    api.get('/teacher/exams'),
                    api.get('/teacher/classes'),
                    api.get('/teacher/dashboard-stats') 
                ]);
                
                const totalQuestions = qRes.data.meta?.total || qRes.data.total || 0;
                const totalExams = eRes.data.meta?.total || eRes.data.total || 0;
                const totalClasses = cRes.data?.data?.length || cRes.data?.length || 0;
                const dashData = dashRes.data.data;

                setStats({ 
                    questions: totalQuestions, 
                    exams: totalExams, 
                    classes: totalClasses,
                    totalAttempts: dashData.totalAttempts 
                });

                setChartData({
                    revenueData: dashData.revenueData,
                    passRateData: dashData.passRateData
                });

            } catch (error) {
                console.error("Lỗi tải thống kê", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const passRatePercentage = chartData.passRateData.length > 0 
        ? chartData.passRateData.find(d => d.name === 'Đậu')?.value || 0 
        : 0;

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
                <p className="text-slate-500 mt-1">Dữ liệu thống kê hiệu suất học vụ dựa trên các lớp học bạn quản lý.</p>
            </div>

           
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><BookOpen className="w-6 h-6" /></div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">{stats.classes}</h3>
                    <p className="text-slate-500 text-sm mt-1">Lớp đang phụ trách</p>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><FileText className="w-6 h-6" /></div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">{stats.questions}</h3>
                    <p className="text-slate-500 text-sm mt-1">Câu hỏi trong ngân hàng</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><CheckSquare className="w-6 h-6" /></div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">{stats.exams}</h3>
                    <p className="text-slate-500 text-sm mt-1">Kỳ thi đã tạo</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><FileCheck className="w-6 h-6" /></div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">{stats.totalAttempts}</h3>
                    <p className="text-slate-500 text-sm mt-1">Tổng lượt thi sinh viên</p>
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
         

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" /> Tăng trưởng lượt thi (6 tháng)
                        </h2>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData.revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} allowDecimals={false} />
                            <Tooltip 
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                                itemStyle={{color: '#0f172a', fontWeight: 'bold'}}
                            />
                            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

             
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2 ">
                        <BarChart className="w-5 h-5 text-emerald-600" /> Tỷ lệ Đậu / Rớt
                    </h2>
                    <div className="flex-1 min-h-[200px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                            data={chartData.passRateData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            >
                            {chartData.passRateData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                            />
                        </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-bold text-slate-800">{passRatePercentage}%</span>
                            <span className="text-sm text-slate-500 font-medium">Tỷ lệ đậu</span>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-center gap-6">
                        {chartData.passRateData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span className="text-sm font-medium text-slate-600">{entry.name} ({entry.value}%)</span>
                        </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}