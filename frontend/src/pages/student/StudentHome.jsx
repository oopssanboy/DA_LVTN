import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { BookOpen, Clock, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentHome() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const res = await api.get('/student/exams/available');
            setExams(res.data);
        } catch (error) {
            toast.error('Không thể tải danh sách kỳ thi');
        } finally {
            setLoading(false);
        }
    };

    const handleEnterExam = (examId, attempt) => {
        if (attempt && attempt.status === 'submitted') {
            navigate(`/student/exam-result/${attempt.id}`);
        } else if (attempt && attempt.status === 'in_progress') {
            navigate(`/student/exam/${attempt.id}`);
        } else {
            // Hiển thị modal nhập mật khẩu (nếu có) trước khi gọi API start
            if(window.confirm('Bạn đã sẵn sàng bắt đầu làm bài? Thời gian sẽ được tính ngay lập tức.')){
                startExam(examId);
            }
        }
    };

    const startExam = async (examId) => {
        try {
            const res = await api.post(`/student/exams/${examId}/start`);
            navigate(`/student/exam/${res.data.attempt_id}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể vào phòng thi');
        }
    };

    if (loading) return <div className="text-center py-10 text-slate-500">Đang tải dữ liệu...</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Kỳ thi của tôi</h1>
                <p className="text-slate-500 mt-1">Danh sách các môn thi bạn được phép tham gia.</p>
            </div>

            {exams.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 text-center">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">Chưa có kỳ thi nào</h3>
                    <p className="text-slate-500 text-sm mt-2">Hiện tại không có lịch thi nào được mở cho lớp của bạn.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.map(exam => {
                        const isSubmitted = exam.attempt?.status === 'submitted';
                        const inProgress = exam.attempt?.status === 'in_progress';
                        
                        return (
                            <div key={exam.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    {isSubmitted ? (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3"/> Đã nộp
                                        </span>
                                    ) : inProgress ? (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3"/> Đang làm
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 flex items-center gap-1">
                                            <Clock className="w-3 h-3"/> Mới
                                        </span>
                                    )}
                                </div>
                                
                                <h3 className="font-bold text-lg text-slate-900 mb-1 line-clamp-2">{exam.title}</h3>
                                <p className="text-slate-500 text-sm mb-4">{exam.subject?.name} - {exam.subject?.code}</p>
                                
                                <div className="mt-auto pt-4 border-t border-slate-100 space-y-2 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Thời gian:</span>
                                        <span className="font-semibold text-slate-900">{exam.duration} phút</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Số câu:</span>
                                        <span className="font-semibold text-slate-900">{exam.total_questions} câu</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleEnterExam(exam.id, exam.attempt)}
                                    className={`w-full py-2.5 rounded-xl font-medium transition flex justify-center items-center gap-2 ${
                                        isSubmitted 
                                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    {isSubmitted ? 'Xem điểm' : inProgress ? 'Tiếp tục làm bài' : 'Vào phòng thi'}
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}