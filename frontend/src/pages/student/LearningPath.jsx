import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Target, Loader2, AlertTriangle, ChevronRight, CheckCircle2, Lock, ChevronDown, Circle, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LearningPath() {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [data, setData] = useState({ current_course: '', overall_progress: 0, subject_scores: [], weaknesses: [], tree: [] });
    const [loading, setLoading] = useState(true);
    const [expandedSubjects, setExpandedSubjects] = useState({});

    // Lấy list khóa học dropdown
    useEffect(() => {
        api.get('/student/enrolled-courses')
           .then(res => setCourses(res.data))
           .catch(() => toast.error('Không thể lấy danh sách khóa học'));
    }, []);

    // Lấy data lộ trình
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const url = selectedCourse ? `/student/learning-path?course_id=${selectedCourse}` : '/student/learning-path';
            const res = await api.get(url);
            setData(res.data);
        } catch (error) {
            toast.error('Lỗi tải dữ liệu lộ trình');
        } finally {
            setLoading(false);
        }
    }, [selectedCourse]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const toggleSubject = (subjectId) => {
        setExpandedSubjects(prev => ({ ...prev, [subjectId]: !prev[subjectId] }));
    };

    const getBarColor = (score) => {
        if (score >= 7.0) return '#10b981'; 
        if (score >= 5.0) return '#f59e0b'; 
        return '#ef4444'; 
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 font-sans pb-10">
            
            {/* TOP BAR: TỔNG QUAN & DROPDOWN */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between md:items-center gap-6">
                <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">Khóa học hiện tại</p>
                    <h2 className="text-xl font-bold text-blue-700">{data.current_course}</h2>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
                    <div className="w-full sm:w-64 relative">
                        <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <select 
                            value={selectedCourse} 
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700 appearance-none cursor-pointer"
                        >
                            <option value="">-- Tất cả Khóa học --</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    </div>

                    <div className="w-full sm:w-48">
                        <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                            <span>Tiến độ tổng thể</span>
                            <span>{data.overall_progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3">
                            <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${data.overall_progress}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600"/></div>
            ) : (
                <>
                    {/* BIỂU ĐỒ & ĐIỂM YẾU */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2 flex flex-col">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                                <Target className="w-5 h-5 text-indigo-500" /> Mức độ hoàn thành theo môn học
                            </h2>
                            <div className="flex-1 min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.subject_scores} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                                        <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="score" name="Điểm TB" radius={[6, 6, 0, 0]} barSize={50}>
                                            {data.subject_scores.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-6 flex justify-center gap-6 border-t border-slate-100 pt-4">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-xs font-bold text-slate-600">Khá/Giỏi (≥ 7.0)</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-xs font-bold text-slate-600">Trung bình (5.0 - 6.9)</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div><span className="text-xs font-bold text-slate-600">Yếu (dưới 5.0)</span></div>
                            </div>
                        </div>

                        <div className="bg-rose-50/50 rounded-2xl shadow-sm border border-rose-100 p-6 flex flex-col">
                            <h2 className="text-lg font-bold text-rose-900 flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5 text-rose-500" /> Phân tích Điểm yếu
                            </h2>
                            <div className="space-y-4 overflow-y-auto pr-1 flex-1 max-h-[350px]">
                                {data.weaknesses.length > 0 ? data.weaknesses.map((weak, idx) => (
                                    <div key={idx} className="bg-white border border-rose-100 rounded-xl p-4 shadow-sm hover:shadow-md transition">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{weak.subject}</span>
                                            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">Tỉ lệ đúng: {weak.correct_rate}%</span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-sm mb-2">{weak.topic}</h3>
                                        <p className="text-xs text-slate-600 mb-3 flex items-start gap-1">
                                            <span className="text-amber-500 text-base leading-none">💡</span> {weak.suggestion}
                                        </p>
                                        <button className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition flex justify-center items-center gap-1 border border-rose-200">
                                            Thi ôn tập ngay <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 opacity-50" />
                                        <p className="text-emerald-700 font-bold text-sm">Tuyệt vời!</p>
                                        <p className="text-emerald-600 text-xs">Hiện tại bạn không có điểm yếu nào đáng kể.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CHI TIẾT CÂY MÔN HỌC */}
                    <h2 className="text-xl font-bold text-slate-800 mt-10 mb-4 px-2 border-b border-slate-200 pb-3">Chi tiết Cây Lộ trình</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                        {data.tree.map((course) => (
                            <div key={course.id} className="relative border-l-2 border-slate-100 ml-3 md:ml-6 space-y-8">
                                {course.subjects.map((subject) => {
                                    const isPassed = subject.is_passed;
                                    const isExpanded = expandedSubjects[subject.id];

                                    return (
                                        <div key={subject.id} className="relative pl-8 md:pl-10">
                                            <span className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full flex items-center justify-center bg-white border-2 ${isPassed ? 'border-emerald-500' : 'border-slate-300'}`}>
                                                {isPassed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Lock className="w-3 h-3 text-slate-400" />}
                                            </span>
                                            <div 
                                                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition border ${isPassed ? 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                                                onClick={() => toggleSubject(subject.id)}
                                            >
                                                <div>
                                                    <h3 className={`font-bold ${isPassed ? 'text-emerald-900' : 'text-slate-700'}`}>
                                                        {subject.code} - {subject.name}
                                                    </h3>
                                                    <p className={`text-xs mt-1 font-medium ${isPassed ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                        {isPassed ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                                                    </p>
                                                </div>
                                                <button className="p-2 text-slate-400">
                                                    {isExpanded ? <ChevronDown className="w-5 h-5"/> : <ChevronRight className="w-5 h-5"/>}
                                                </button>
                                            </div>

                                            {isExpanded && (
                                                <div className="mt-3 ml-4 border-l-2 border-slate-100 pl-6 space-y-3 animate-in slide-in-from-top-2">
                                                    {subject.topics.length > 0 ? (
                                                        subject.topics.map(topic => (
                                                            <div key={topic.id} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                                                <Circle className={`w-2 h-2 fill-current ${isPassed ? 'text-emerald-400' : 'text-slate-300'}`} />
                                                                {topic.name}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-xs text-slate-400 italic">Chưa có dữ liệu chủ đề.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                        {data.tree.length === 0 && <p className="text-center text-slate-500 py-10">Chưa có dữ liệu lộ trình.</p>}
                    </div>
                </>
            )}
        </div>
    );
}