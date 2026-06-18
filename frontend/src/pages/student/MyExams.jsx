import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { BookOpen, Clock, CheckCircle2, ChevronRight, Search, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function MyExams() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const res = await api.get('/student/exams/available');
            setExams(res.data.data || res.data);
        } catch (error) {
            toast.error('Không thể tải danh sách kỳ thi');
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
            text: `Bạn có chắc chắn muốn bắt đầu kỳ thi "${exam.title}"? Thời gian làm bài sẽ được tính ngay lập tức.`,
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

    const filteredExams = exams.filter(exam => {
        const title = exam.title || '';
        const subjectName = typeof exam.subject === 'object' ? exam.subject?.name : (exam.subject || '');
        const q = searchQuery.toLowerCase();
        return title.toLowerCase().includes(q) || subjectName.toLowerCase().includes(q);
    });

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-10 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Kỳ thi của tôi</h1>
                    <p className="text-slate-500 mt-1">Danh sách các kỳ thi đang mở dành cho bạn.</p>
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
            ) : filteredExams.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-400 mb-4">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">Chưa có kỳ thi nào</h3>
                    <p className="text-slate-500 mt-1">Hiện tại không có bài thi nào được mở cho lớp của bạn.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExams.map(exam => {
                        const attempt = exam.attempt;
                        const isSubmitted = attempt?.status === 'submitted' || attempt?.status === 'suspended';
                        const inProgress = attempt?.status === 'in_progress';
                        const subjectName = typeof exam.subject === 'object' ? exam.subject?.name : exam.subject;

                        return (
                            <div key={exam.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col h-full group">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider line-clamp-1 max-w-[70%]">
                                        {subjectName || 'Môn học'}
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
                </div>
            )}
        </div>
    );
}