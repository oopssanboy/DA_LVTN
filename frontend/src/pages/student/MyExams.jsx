import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { BookOpen, Clock, CheckCircle2, ChevronRight, Search, Loader2, AlertCircle, Info, X, PlayCircle, Calendar, ShieldAlert, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function MyExams() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
  
    const [pagination, setPagination] = useState({});
    const [selectedExam, setSelectedExam] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async (url = '/student/exams/available') => {
        setLoading(true);
        try {
            const res = await api.get(url);
            setExams(res.data.data || res.data);
            setPagination(res.data.meta || res.data);
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
        
        setSelectedExam(null);

        const { isConfirmed, value: password } = await Swal.fire({
            title: 'Bắt đầu làm bài?',
            text: `Bạn chuẩn bị làm kỳ thi "${exam.title}". Lưu ý: Thời gian sẽ bắt đầu đếm ngược ngay lập tức!`,
            icon: 'question',
            input: exam.password ? 'password' : null,
            inputPlaceholder: 'Nhập mật khẩu phòng thi...',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#cbd5e1',
            confirmButtonText: 'Bắt đầu thi ngay',
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
        } else {
            setSelectedExam(exam); 
        }
    };

    const filteredExams = exams.filter(exam => {
        const title = exam.title || '';
        const subjectName = typeof exam.subject === 'object' ? exam.subject?.name : (exam.subject || '');
        const q = searchQuery.toLowerCase();
        return title.toLowerCase().includes(q) || subjectName.toLowerCase().includes(q);
    });

    const formatDateTime = (dateString) => {
        if (!dateString) return 'Không giới hạn';
        const date = new Date(dateString.replace(' ', 'T'));
        return date.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const isUpcomingExam = (startTime) => {
        if (!startTime) return false;
        return new Date(startTime.replace(' ', 'T')).getTime() > new Date().getTime();
    };

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
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredExams.map(exam => {
                            const attempt = exam.attempt;
                            const isSubmitted = attempt?.status === 'submitted' || attempt?.status === 'suspended';
                            const inProgress = attempt?.status === 'in_progress';
                            const subjectName = typeof exam.subject === 'object' ? exam.subject?.name : exam.subject;
                            const isUpcoming = isUpcomingExam(exam.start_time);

                            return (
                                <div key={exam.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col h-full group">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider line-clamp-1 max-w-[70%]">
                                            {subjectName || 'Môn học'}
                                        </span>
                                        {isSubmitted ? ( <span className="flex items-center gap-1 text-emerald-600 font-bold text-xm  px-2 py-1" > Đã nộp bài
                                        <CheckCircle2 className="text-emerald-500 w-4 h-4" title="Đã nộp bài" />
                                        </span>
                                    ) : inProgress ? ( <span className="flex items-center gap-1 text-amber-500 font-bold text-xm  px-2 py-1" >Đang thi dở
                                        <AlertCircle className="text-amber-500 w-4 h-4 animate-pulse" title="Đang thi dở" />
                                        </span>
                                    ) : isUpcoming ? (
                                        <span className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">Sắp tới
                                            <Calendar className="w-3 h-3" /> 
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-emerald-600 font-bold text-xm  px-2 py-1  animate-pulse">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Đang mở
                                        </span>
                                    )}
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
                                        onClick={() => setSelectedExam(exam)}
                                        className={`w-full py-3 rounded-xl font-bold transition flex justify-center items-center gap-2 ${
                                            isSubmitted ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                                            : inProgress ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                        }`}
                                    >
                                        <Info className="w-5 h-5" /> 
                                        {isSubmitted ? 'Xem chi tiết kết quả' : 'Xem thông tin kỳ thi'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                
                    {pagination.links && pagination.links.length > 3 && (
                        <div className="flex flex-wrap justify-center gap-1.5 pt-4">
                            {pagination.links.map((link, idx) => (
                                <button
                                    key={idx}
                                    disabled={!link.url}
                                    onClick={() => fetchExams(link.url)}
                                    className={`px-4 py-2 text-sm font-bold rounded-xl transition border shadow-sm
                                        ${link.active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200 hover:border-slate-300'}
                                        ${!link.url ? 'opacity-40 cursor-not-allowed bg-slate-50' : ''}
                                    `}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

           
            {selectedExam && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-100 bg-blue-50/50 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 pr-4">{selectedExam.title}</h3>
                                <p className="text-sm font-medium text-blue-600 mt-1">{typeof selectedExam.subject === 'object' ? selectedExam.subject?.name : selectedExam.subject}</p>
                            </div>
                            <button onClick={() => setSelectedExam(null)} className="text-slate-400 hover:text-slate-600 bg-white border border-slate-200 p-1.5 rounded-lg shadow-sm shrink-0">
                                <X className="w-5 h-5"/>
                            </button>
                        </div>

                        <div className="p-6 space-y-4 flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-4 h-4"/> Thời gian làm bài</div>
                                    <div className="text-2xl font-black text-slate-800">{selectedExam.duration} <span className="text-base font-bold text-slate-500">phút</span></div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider flex items-center gap-1.5"><BookOpen className="w-4 h-4"/> Tổng số câu hỏi</div>
                                    <div className="text-2xl font-black text-slate-800">{selectedExam.total_questions} <span className="text-base font-bold text-slate-500">câu</span></div>
                                </div>
                            </div>

                            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3">
                                <div className="flex justify-between items-center text-sm border-b border-blue-100 pb-2">
                                    <span className="text-slate-600 font-medium">Mở phòng thi lúc:</span>
                                    <span className="font-bold text-slate-800">{formatDateTime(selectedExam.start_time)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-blue-100 pb-2">
                                    <span className="text-slate-600 font-medium">Đóng phòng thi lúc:</span>
                                    <span className="font-bold text-slate-800">{formatDateTime(selectedExam.end_time)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600 font-medium">Điểm tối thiểu để Đạt:</span>
                                    <span className="font-black text-emerald-600">{selectedExam.passing_score} / 10</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                                <ShieldAlert className="w-5 h-5 shrink-0" />
                                <div>Kỳ thi áp dụng hệ thống giám sát. Vui lòng không chuyển Tab, không chia đôi màn hình trong suốt quá trình làm bài. Vi phạm 3 lần sẽ bị tự động thu bài.</div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-100 bg-white">
                            {(() => {
                                const attempt = selectedExam.attempt;
                                const isSubmitted = attempt?.status === 'submitted' || attempt?.status === 'suspended';
                                const inProgress = attempt?.status === 'in_progress';
                                const isUpcoming = isUpcomingExam(selectedExam.start_time);

                                if (isSubmitted) {
                                    return (
                                        <button onClick={() => navigate(`/student/exam-result/${attempt.id}`)} className="w-full bg-slate-100 text-slate-700 px-6 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition flex items-center justify-center gap-2">
                                            <CheckCircle2 className="w-5 h-5" /> Xem chi tiết kết quả
                                        </button>
                                    );
                                }
                                if (inProgress) {
                                    return (
                                        <button onClick={() => handleEnterExam(selectedExam)} className="w-full bg-amber-500 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2">
                                            <PlayCircle className="w-5 h-5" /> Tiếp tục làm bài
                                        </button>
                                    );
                                }
                                if (isUpcoming) {
                                    return (
                                        <button disabled className="w-full bg-slate-100 text-slate-400 px-6 py-3.5 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2">
                                            <CalendarClock className="w-5 h-5" /> Chưa đến giờ thi
                                        </button>
                                    );
                                }
                                return (
                                    <button onClick={() => handleEnterExam(selectedExam)} className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2">
                                        <PlayCircle className="w-5 h-5" /> Bắt đầu làm bài
                                    </button>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}