import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { History, Search, Loader2, Award, CheckCircle2, AlertCircle, XCircle, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExamHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/student/history');
            setHistory(res.data.data || res.data);
        } catch (error) {
            toast.error('Không thể tải lịch sử làm bài');
        } finally {
            setLoading(false);
        }
    };

    const filteredHistory = history.filter(attempt => {
        const title = attempt.exam?.title || '';
        const subjectName = typeof attempt.exam?.subject === 'object' ? attempt.exam?.subject?.name : (attempt.exam?.subject || '');
        const q = searchQuery.toLowerCase();
        return title.toLowerCase().includes(q) || subjectName.toLowerCase().includes(q);
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-10 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Lịch sử làm bài</h1>
                    <p className="text-slate-500 mt-1">Kết quả các bài thi bạn đã hoàn thành.</p>
                </div>
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Tìm tên môn học, kỳ thi..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-white shadow-sm" 
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
            ) : filteredHistory.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
                        <History className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">Chưa có dữ liệu</h3>
                    <p className="text-slate-500 mt-1">Bạn chưa hoàn thành bài thi nào hoặc không có kết quả phù hợp với tìm kiếm.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHistory.map(attempt => {
                        const exam = attempt.exam;
                        const subjectName = typeof exam?.subject === 'object' ? exam?.subject?.name : exam?.subject;
                        const isSuspended = attempt.status === 'suspended';
                        const isPassed = attempt.is_passed;

                        return (
                            <div key={attempt.id} className={`bg-white rounded-2xl p-6 border-2 shadow-sm transition flex flex-col h-full 
                                ${isSuspended ? 'border-red-100 hover:shadow-red-100' : isPassed ? 'border-emerald-100 hover:shadow-emerald-100' : 'border-slate-200 hover:shadow-md'}
                            `}>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider line-clamp-1 max-w-[70%]">
                                        {subjectName || 'Chưa cập nhật'}
                                    </span>
                                    {isSuspended ? (
                                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> Đình chỉ</span>
                                    ) : isPassed ? (
                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Đạt</span>
                                    ) : (
                                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Trượt</span>
                                    )}
                                </div>
                                
                                <h3 className="text-lg font-bold text-slate-800 mb-4 line-clamp-2">{exam?.title}</h3>
                                
                                <div className="flex-1 grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-slate-50 p-3 rounded-xl text-center">
                                        <p className="text-xs text-slate-500 font-medium mb-1">Điểm số</p>
                                        <p className={`text-2xl font-black ${isSuspended ? 'text-red-500' : isPassed ? 'text-emerald-600' : 'text-slate-800'}`}>
                                            {attempt.total_score}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl text-center">
                                        <p className="text-xs text-slate-500 font-medium mb-1">Vi phạm</p>
                                        <p className={`text-2xl font-black ${attempt.violation_count > 0 ? 'text-amber-500' : 'text-slate-800'}`}>
                                            {attempt.violation_count}
                                        </p>
                                    </div>
                                    <div className="col-span-2 bg-slate-50 p-2 rounded-xl text-xs text-slate-600 font-medium flex items-center justify-center gap-2">
                                        <CalendarClock className="w-4 h-4 text-slate-400" /> Nộp lúc: {formatDate(attempt.ended_at)}
                                    </div>
                                </div>

                                <button 
                                    onClick={() => navigate(`/student/exam-result/${attempt.id}`)}
                                    className="w-full py-3 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition flex justify-center items-center gap-2"
                                >
                                    <Award className="w-5 h-5" /> Xem chi tiết bài làm
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}