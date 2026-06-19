import { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Target, TrendingUp, BrainCircuit, Download, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function StudentRadar() {
    const [radarData, setRadarData] = useState([]);
    const [barData, setBarData] = useState([]);
    const [strengths, setStrengths] = useState([]);
    const [weaknesses, setWeaknesses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAndProcessData();
    }, []);

    const fetchAndProcessData = async () => {
        try {
    
            const res = await api.get('/student/history');
            const data = res.data.data || res.data;
            
            if (data && data.length > 0) {
                processData(data);
            }
        } catch (error) {
            toast.error('Không thể tải dữ liệu năng lực');
        } finally {
            setLoading(false);
        }
    };

    const processData = (data) => {
      
        const subjectMap = {};
        data.forEach(attempt => {
            if (attempt.status !== 'submitted' && attempt.status !== 'suspended') return;
            
            const subjectName = typeof attempt.exam?.subject === 'object' 
                ? attempt.exam?.subject?.name 
                : (attempt.exam?.subject || 'Khác');

            if (!subjectMap[subjectName]) {
                subjectMap[subjectName] = { total: 0, count: 0 };
            }
            subjectMap[subjectName].total += parseFloat(attempt.total_score || 0);
            subjectMap[subjectName].count += 1;
        });

     
        const radar = Object.keys(subjectMap).map(key => ({
            subject: key,
            score: Math.round((subjectMap[key].total / subjectMap[key].count) * 10),
            fullMark: 100
        }));

        setRadarData(radar);

   
        if (radar.length > 0) {
            const sorted = [...radar].sort((a, b) => b.score - a.score);
            setStrengths(sorted.slice(0, 2).map(i => i.subject));
            setWeaknesses(sorted.slice(-2).reverse().map(i => i.subject));
        }

       
        const monthsMap = {};
        const monthNames = [];
        
       
        for(let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthStr = `Tháng ${d.getMonth() + 1}`;
            monthsMap[monthStr] = { total: 0, count: 0 };
            monthNames.push(monthStr);
        }

       
        data.forEach(attempt => {
            if (!attempt.ended_at) return;
            const d = new Date(attempt.ended_at);
            const monthStr = `Tháng ${d.getMonth() + 1}`;
            
            if (monthsMap[monthStr] !== undefined) {
                monthsMap[monthStr].total += parseFloat(attempt.total_score || 0);
                monthsMap[monthStr].count += 1;
            }
        });

       
        const bar = monthNames.map(m => ({
            month: m,
            score: monthsMap[m].count > 0 ? parseFloat((monthsMap[m].total / monthsMap[m].count).toFixed(1)) : 0
        }));

        setBarData(bar);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-10 font-sans">
          
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Báo cáo Năng lực Học viên</h1>
                    <p className="text-slate-500 mt-1">Đánh giá toàn diện các kỹ năng lập trình của bạn dựa trên dữ liệu thi thực tế.</p>
                </div>
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-md shadow-blue-600/20"
                >
                    <Download className="w-5 h-5" /> Xuất báo cáo PDF
                </button>
            </div>

            {radarData.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
                    <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">Chưa đủ dữ liệu phân tích</h3>
                    <p className="text-slate-500 mt-1">Bạn cần hoàn thành ít nhất một bài thi để hệ thống có thể vẽ biểu đồ năng lực.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                                <Target className="w-5 h-5 text-blue-500" /> Biểu đồ Radar Năng lực
                            </h3>
                            <div className="flex-1 w-full min-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                        <Radar name="Năng lực" dataKey="score" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.3} />
                                        <Tooltip formatter={(value) => [`${value}%`, 'Độ thông thạo']} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 bg-slate-50 p-4 rounded-xl text-sm text-slate-700 border border-slate-100">
                                <span className="font-bold">Phân tích: </span> 
                                Kỹ năng <span className="font-bold text-emerald-600">{strengths.join(' và ')}</span> của bạn rất tốt. 
                                {weaknesses.length > 0 && strengths[0] !== weaknesses[0] && (
                                    <> Cần tập trung cải thiện thêm <span className="font-bold text-red-500">{weaknesses.join(' và ')}</span> để phát triển toàn diện.</>
                                )}
                            </div>
                        </div>

                
                        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                                <TrendingUp className="w-5 h-5 text-emerald-500" /> Tiến độ Điểm trung bình (6 tháng qua)
                            </h3>
                            <div className="w-full h-[350px] mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                                        <PolarGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} dy={10} />
                                        <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13 }} />
                                        <Tooltip 
                                            cursor={{ fill: '#f8fafc' }}
                                            formatter={(value) => [`${value} Điểm`, 'Điểm trung bình']}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="score" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

              
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-8">
                            <BrainCircuit className="w-5 h-5 text-purple-500" /> Chi tiết theo môn học
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            {radarData.map((item, index) => (
                                <div key={index}>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="font-bold text-slate-700">{item.subject}</span>
                                        <span className="font-black text-slate-900">{item.score}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                                        <div 
                                            className={`h-2.5 rounded-full ${item.score >= 80 ? 'bg-emerald-500' : item.score >= 50 ? 'bg-blue-500' : 'bg-red-500'}`} 
                                            style={{ width: `${item.score}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}