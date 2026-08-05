import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Search, BarChart2, Download, FileSpreadsheet, FileText, Users, Target, Award, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import toast from 'react-hot-toast';

export default function ExamStatistics() {
    const { user } = useAuth();
    const [exams, setExams] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState('');
    
   
    const [loadingExams, setLoadingExams] = useState(true);
    const [loadingStats, setLoadingStats] = useState(false);
    
    const [overview, setOverview] = useState(null);
    const [scoreDist, setScoreDist] = useState([]);
    const [questionStats, setQuestionStats] = useState([]);

   
    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await api.get('/teacher/exams?per_page=100');
                setExams(res.data.data || res.data);
            } catch (error) {
                toast.error('Lỗi tải danh sách kỳ thi');
            } finally {
                setLoadingExams(false);
            }
        };
        fetchExams();
    }, []);

   
    useEffect(() => {
        if (!selectedExamId) return;

        const fetchStatistics = async () => {
            setLoadingStats(true);
            try {
                const [overviewRes, distRes, qStatsRes] = await Promise.all([
                    api.get(`/teacher/statistics/${selectedExamId}/overview`),
                    api.get(`/teacher/statistics/${selectedExamId}/score-distribution`),
                    api.get(`/teacher/statistics/${selectedExamId}/questions`)
                ]);

                setOverview(overviewRes.data);
                
               
                const distData = Object.keys(distRes.data).map(key => ({
                    range: key,
                    count: distRes.data[key]
                }));
                setScoreDist(distData);
                
                setQuestionStats(qStatsRes.data);
            } catch (error) {
                toast.error('Lỗi tải dữ liệu thống kê chi tiết');
            } finally {
                setLoadingStats(false);
            }
        };

        fetchStatistics();
    }, [selectedExamId]);

   
    const handleExport = async (type) => {
        if (!selectedExamId) return;
        const loadingToast = toast.loading(`Đang tạo file ${type.toUpperCase()}...`);
        
        try {
            const endpoint = `/teacher/statistics/${selectedExamId}/export-${type}`;
            const response = await api.get(endpoint, { responseType: 'blob' });
            
           
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            const selectedExamName = exams.find(e => e.id.toString() === selectedExamId)?.title || 'Bao_cao';
            const fileName = `${selectedExamName.replace(/\s+/g, '_')}_ThongKe.${type === 'excel' ? 'xlsx' : 'pdf'}`;
            
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success('Đã tải xuống thành công!', { id: loadingToast });
        } catch (error) {
            toast.error(`Lỗi tải file ${type.toUpperCase()}`, { id: loadingToast });
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Thống kê & Báo cáo</h1>
                    <p className="text-slate-500 mt-1">Phân tích phổ điểm và chất lượng đề thi của từng lớp.</p>
                </div>
                
                {selectedExamId && (
                    <div className="flex gap-3">
                        <button onClick={() => handleExport('excel')} className="flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-400 hover:text-white px-4 py-2 rounded-xl font-bold border border-emerald-200 transition">
                            <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
                        </button>
                        <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 bg-amber-600 text-white hover:bg-amber-400 hover:text-white px-4 py-2 rounded-xl font-bold border border-rose-200 transition">
                            <FileText className="w-4 h-4" /> Xuất PDF
                        </button>
                    </div>
                )}
            </div>

       
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-2">Chọn Kỳ thi để xem báo cáo:</label>
                <div className="relative max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    {loadingExams ? (
                        <div className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2 text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin"/> Đang tải danh sách kỳ thi...
                        </div>
                    ) : (
                        <select 
                            value={selectedExamId} 
                            onChange={(e) => setSelectedExamId(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium bg-white appearance-none cursor-pointer"
                        >
                            <option value="" disabled>-- Hãy chọn một kỳ thi --</option>
                            {exams
                                .filter(exam => {
                                    const isOwner = user?.role === 'admin' || String(exam.teacher_id) === String(user?.id);
                                    return isOwner;
                                })
                                .map(exam => (
                                    <option key={exam.id} value={exam.id}>
                                        {exam.title} - Môn: {exam.subject?.name}
                                    </option>
                                ))
                            }
                        </select>
                    )}
                </div>
            </div>

            {!selectedExamId && !loadingExams && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <BarChart2 className="w-10 h-10 text-blue-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa chọn kỳ thi</h3>
                    <p className="text-slate-500 max-w-md">Vui lòng chọn một kỳ thi ở menu phía trên để hệ thống bắt đầu trích xuất và vẽ biểu đồ phân tích.</p>
                </div>
            )}

            {loadingStats && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-20 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-slate-600 font-medium">Đang tổng hợp dữ liệu học vụ...</p>
                </div>
            )}

            {selectedExamId && !loadingStats && overview && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
              
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-6 h-6" /></div>
                            <div>
                                <div className="text-sm font-medium text-slate-500">Tổng sinh viên nộp bài</div>
                                <div className="text-2xl font-bold text-slate-800">{overview.total_students}</div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Target className="w-6 h-6" /></div>
                            <div>
                                <div className="text-sm font-medium text-slate-500">Tỷ lệ Đạt</div>
                                <div className="text-2xl font-bold text-slate-800">{overview.pass_rate}%</div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><BarChart2 className="w-6 h-6" /></div>
                            <div>
                                <div className="text-sm font-medium text-slate-500">Điểm Trung bình</div>
                                <div className="text-2xl font-bold text-slate-800">{overview.avg_score}</div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Award className="w-6 h-6" /></div>
                            <div>
                                <div className="text-sm font-medium text-slate-500">Điểm Max / Min</div>
                                <div className="text-2xl font-bold text-slate-800">{overview.max_score} <span className="text-lg text-slate-400 font-medium">/ {overview.min_score}</span></div>
                            </div>
                        </div>
                    </div>

                   
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-blue-600" /> Phân bố phổ điểm (Score Distribution)
                        </h2>
                        <div className="h-80 w-full">
                            {overview.total_students === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">Chưa có sinh viên nào nộp bài để vẽ biểu đồ.</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={scoreDist} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="range" tick={{fill: '#64748b', fontSize: 12}} dy={10} axisLine={false} tickLine={false} />
                                        <YAxis allowDecimals={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} axisLine={false} tickLine={false} />
                                        <RechartsTooltip 
                                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                                            cursor={{fill: '#f1f5f9'}}
                                        />
                                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Số lượng sinh viên" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                  
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                Phân tích chất lượng câu hỏi
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                                    <tr>
                                        <th className="px-6 py-4 w-12 text-center">STT</th>
                                        <th className="px-6 py-4 w-1/2">Nội dung tóm tắt</th>
                                        <th className="px-6 py-4 text-center">Tỷ lệ đúng</th>
                                        <th className="px-6 py-4 text-center">Đúng / Sai</th>
                                        <th className="px-6 py-4 text-center">Bỏ trống</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {questionStats.length > 0 ? (
                                        questionStats.map((q, index) => {
                                            const doc = new DOMParser().parseFromString(q.content, 'text/html');
                                            let textContent = doc.body.textContent || "";
                                            if (textContent.length > 60) textContent = textContent.substring(0, 60) + '...';

                                            return (
                                                <tr key={q.question_id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-6 py-4 text-center font-bold text-slate-400">{index + 1}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-800">{textContent}</div>
                                                        <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Loại: {q.type}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center gap-2 justify-center">
                                                            <div className="w-16 bg-slate-200 rounded-full h-2">
                                                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${q.correct_rate}%` }}></div>
                                                            </div>
                                                            <span className="font-bold text-slate-700 w-10 text-right">{q.correct_rate}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-emerald-600 font-bold">{q.correct_count}</span>
                                                        <span className="mx-1 text-slate-300">/</span>
                                                        <span className="text-rose-500 font-bold">{q.wrong_count}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-slate-400">
                                                        {q.not_answered}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-8 text-slate-500 font-medium">Chưa có dữ liệu thống kê câu hỏi cho kỳ thi này.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}