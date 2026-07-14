import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Target, AlertTriangle, TrendingUp, ChevronRight, PlayCircle, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function LearningPath() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchLearningPath = async () => {
            try {
              
                const res = await api.get('/student/learning-path');
                setData(res.data.data || res.data);
            } catch (error) {
                console.warn('API chưa sẵn sàng, đang sử dụng dữ liệu giả lập (Mock Data)');
                
                setData({
                    course_name: 'Khóa 2022 (D22)',
                    overall_progress: 68,
                    subjects_progress: [
                        { name: 'Lập trình Web PHP', score: 8.5, max: 10, fill: '#10b981' },
                        { name: 'Lập trình Di động', score: 4.0, max: 10, fill: '#ef4444' }, 
                        { name: 'Cơ sở dữ liệu', score: 6.5, max: 10, fill: '#f59e0b' }       
                    ],
                    weaknesses: [
                        {
                            subject: 'Lập trình Di động',
                            topic: 'Stateful & Stateless Widget',
                            score_rate: 30,
                            recommendation: 'Ôn tập lại vòng đời của Widget và cách quản lý State cơ bản.',
                            action_link: '/student/practice?topic_id=105' 
                        },
                        {
                            subject: 'Cơ sở dữ liệu',
                            topic: 'Stored Procedure & Trigger',
                            score_rate: 45,
                            recommendation: 'Làm thêm bài tập về Trigger và cách kiểm soát Transaction.',
                            action_link: '/student/practice?topic_id=107'
                        }
                    ]
                });
            } finally {
                setLoading(false);
            }
        };

        fetchLearningPath();
    }, []);

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;
    if (!data) return <div className="p-10 text-center text-slate-500">Không có dữ liệu lộ trình học tập.</div>;

    
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-sm">
                    <p className="font-bold mb-1">{payload[0].payload.name}</p>
                    <p className="text-slate-300">Điểm trung bình: <span className="text-white font-bold">{payload[0].value}/10</span></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="max-w-6xl mx-auto pb-10 font-sans space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                    <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Lộ trình học tập</h1>
                    <p className="text-slate-500 text-sm">Theo dõi tiến độ và cải thiện điểm yếu của bạn</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
                <div className="lg:col-span-2 space-y-6">
                  
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-500 mb-1">Khóa học hiện tại</p>
                            <h2 className="text-xl font-bold text-blue-700">{data.course_name}</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-500 mb-1">Tiến độ tổng thể</p>
                            <div className="flex items-center gap-3">
                                <div className="w-32 h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${data.overall_progress}%` }}></div>
                                </div>
                                <span className="font-bold text-lg text-slate-800">{data.overall_progress}%</span>
                            </div>
                        </div>
                    </div>

                  
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <Target className="w-5 h-5 text-indigo-600" />
                            <h3 className="font-bold text-slate-800 text-lg">Mức độ hoàn thành theo môn học</h3>
                        </div>
                        
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.subjects_progress} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={60}>
                                        {data.subjects_progress.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-sm text-slate-600"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Khá/Giỏi (≥ 7.0)</div>
                            <div className="flex items-center gap-2 text-sm text-slate-600"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Trung bình (5.0 - 6.9)</div>
                            <div className="flex items-center gap-2 text-sm text-slate-600"><span className="w-3 h-3 rounded-full bg-red-500"></span> Yếu (dưới 5.0)</div>
                        </div>
                    </div>
                </div>

              
                <div className="space-y-6">
                    <div className="bg-gradient-to-b from-rose-50 to-white p-6 rounded-2xl border border-rose-100 shadow-sm h-full">
                        <div className="flex items-center gap-2 mb-6">
                            <AlertTriangle className="w-5 h-5 text-rose-600" />
                            <h3 className="font-bold text-slate-800 text-lg">Phân tích Điểm yếu</h3>
                        </div>

                        {data.weaknesses.length === 0 ? (
                            <div className="text-center p-6 bg-white rounded-xl border border-emerald-100 text-emerald-600">
                                <p className="font-bold">Tuyệt vời!</p>
                                <p className="text-sm">Bạn đang theo kịp bài ở tất cả các chủ đề.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {data.weaknesses.map((item, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                                        
                                        <div className="flex justify-between items-start mb-2 pl-2">
                                            <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                                                {item.subject}
                                            </span>
                                            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                                                Tỉ lệ đúng: {item.score_rate}%
                                            </span>
                                        </div>
                                        
                                        <h4 className="font-bold text-slate-800 mb-2 pl-2 text-sm">{item.topic}</h4>
                                        <p className="text-xs text-slate-500 mb-4 pl-2 leading-relaxed">
                                            💡 {item.recommendation}
                                        </p>

                                        <Link to={item.action_link} className="flex items-center justify-between w-full p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-sm font-bold transition">
                                            <span className="flex items-center gap-2"><PlayCircle className="w-4 h-4"/> Thi ôn tập ngay</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}