import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { BookOpen, Clock, CheckCircle2, ChevronRight, Search, Loader2, AlertCircle, History, Award, XCircle, CalendarClock } from 'lucide-react';

import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function StudentHome() {
    const [activeTab, setActiveTab] = useState('available'); 
    const [exams, setExams] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (activeTab === 'available') fetchAvailableExams();
        else fetchHistory();
    }, [activeTab]);

    const fetchAvailableExams = async () => {
        setLoading(true);
        try {
            const res = await api.get('/student/exams/available');
            setExams(res.data.data || res.data);
        } catch (error) {
            toast.error('Không thể tải danh sách kỳ thi');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get('/student/history');
            setHistory(res.data.data || res.data);
        } catch (error) {
            toast.error('Không thể tải lịch sử làm bài');
        } finally {
            setLoading(false);
        }
    };

    const handleEnterExam = async (exam) => {
        const attempt = exam.attempt;

        if (attempt?.status === 'submitted' || attempt?.status === 'suspended') {
            navigate(`/student/exam-result/${attempt.id}`);
            return;
        } 
        
        if (attempt?.status === 'in_progress') {
            navigate(`/student/exam/${attempt.id}`);
            return;
        } 
        
        const { isConfirmed, value: password } = await Swal.fire({
            title: 'Bắt đầu làm bài?',
            text: `Bạn có chắc chắn muốn bắt đầu kỳ thi "${exam.title}"? Thời gian sẽ được tính ngay.`,
            icon: 'question',
            input: exam.password ? 'password' : null,
            inputPlaceholder: 'Nhập mật khẩu phòng thi...',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#cbd5e1',
            confirmButtonText: 'Bắt đầu thi',
            cancelButtonText: 'Hủy',
            inputValidator: (value) => {
                if (exam.password && !value) return 'Vui lòng nhập mật khẩu phòng thi!';
            }
        });

        if (isConfirmed) {
            const loadingToast = toast.loading('Đang khởi tạo phòng thi...');
            try {
                const payload = exam.password ? { password } : {};
                const res = await api.post(`/student/exams/${exam.id}/start`, payload);
                toast.success('Khởi tạo thành công!', { id: loadingToast });
                navigate(`/student/exam/${res.data.attempt_id}`);
            } catch (error) {
                toast.error(error.response?.data?.message || 'Lỗi khởi tạo bài thi', { id: loadingToast });
            }
        }
    };

    const displayData = activeTab === 'available' ? exams : history;
    const filteredData = displayData.filter(item => {
        const title = item.title || item.exam?.title || '';
        const subjectName = typeof item.subject === 'object' ? item.subject?.name : (item.subject || item.exam?.subject?.name || '');
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

            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-extrabold mb-2">Không gian Học tập</h1>
                    <p className="text-blue-100 text-lg max-w-xl">Kiểm tra các kỳ thi đang mở và theo dõi kết quả, lịch sử làm bài của bạn tại đây.</p>
                </div>
                <BookOpen className="absolute -right-6 -bottom-6 w-48 h-48 text-white opacity-10" />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex w-full md:w-auto p-1 bg-slate-100 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('available')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                            activeTab === 'available' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <BookOpen className="w-4 h-4" /> Kỳ thi của tôi
                    </button>
                    
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                            activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <History className="w-4 h-4" /> Lịch sử làm bài
                    </button>
                </div>
                
                <div className="relative w-full md:w-80 px-1 md:px-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm môn học, kỳ thi..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-white" 
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
            ) : filteredData.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
                        {activeTab === 'available' ? <BookOpen className="w-8 h-8" /> : <History className="w-8 h-8" />}
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">Không có dữ liệu</h3>
                    <p className="text-slate-500 mt-1">
                        {activeTab === 'available' ? 'Hiện tại không có kỳ thi nào đang mở cho bạn.' : 'Bạn chưa hoàn thành bài thi nào.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 
                    {activeTab === 'available' && filteredData.map(exam => {
                        const attempt = exam.attempt;
                        const isSubmitted = attempt?.status === 'submitted' || attempt?.status === 'suspended';
                        const inProgress = attempt?.status === 'in_progress';
                        const subjectName = typeof exam.subject === 'object' ? exam.subject?.name : exam.subject;

                        return (
                            <div key={exam.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col h-full group">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider line-clamp-1 max-w-[70%]">
                                        {subjectName || 'Chưa cập nhật'}
                                    </span>
                                    {isSubmitted && <CheckCircle2 className="text-emerald-500 w-6 h-6" title="Đã nộp bài" />}
                                    {inProgress && <AlertCircle className="text-amber-500 w-6 h-6 animate-pulse" title="Đang thi dở" />}
                                </div>
                                
                                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition line-clamp-2">
                                    {exam.title}
                                </h3>
                                
                                <div className="space-y-2 mb-6 flex-1 text-sm text-slate-600">
                                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400"/> Thời gian:</span>
                                        <span className="font-bold text-slate-700">{exam.duration} phút</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                                        <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-slate-400"/> Số câu hỏi:</span>
                                        <span className="font-bold text-slate-700">{exam.total_questions} câu</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleEnterExam(exam)}
                                    className={`w-full py-3 rounded-xl font-bold transition flex justify-center items-center gap-2 ${
                                        isSubmitted 
                                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                                            : inProgress 
                                            ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/20' 
                                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20'
                                    }`}
                                >
                                    {isSubmitted ? 'Xem kết quả' : inProgress ? 'Tiếp tục làm bài' : 'Vào phòng thi'}
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        );
                    })}

               
                    {activeTab === 'history' && filteredData.map(attempt => {
                        const exam = attempt.exam;
                        const subjectName = typeof exam.subject === 'object' ? exam.subject?.name : exam.subject;
                        const isSuspended = attempt.status === 'suspended';
                        const isPassed = attempt.is_passed;

                        return (
                            <div key={attempt.id} className={`bg-white rounded-2xl p-6 border-2 shadow-sm transition flex flex-col h-full 
                                ${isSuspended ? 'border-red-100 hover:shadow-red-100' : isPassed ? 'border-emerald-100 hover:shadow-emerald-100' : 'border-slate-200'}
                            `}>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider line-clamp-1 max-w-[70%]">
                                        {subjectName}
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