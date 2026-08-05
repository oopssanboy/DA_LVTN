import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, BookOpen, Clock, PlayCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function PracticeExams() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPracticeExams();
    }, []);

    const fetchPracticeExams = async () => {
        try {
            const res = await api.get('/student/exams/available?is_practice=true');
            setExams(res.data.data || res.data);
        } catch (error) {
            toast.error('Lỗi tải danh sách ôn tập');
        } finally {
            setLoading(false);
        }
    };

    const startExam = async (examId) => {
        try {
            const res = await api.post(`/student/exams/${examId}/start`);
            navigate(`/student/exam/${res.data.attempt_id}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể vào phòng ôn tập');
        }
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans animate-in fade-in duration-300">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                     Phòng Ôn Tập
                </h1>
                <p className="text-slate-500 mt-1">Luyện tập thả ga, không giới hạn số lần, không tính điểm vi phạm.</p>
            </div>

            {exams.length === 0 ? (
                <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center shadow-sm">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-fuchsia-50 text-fuchsia-300 mb-4">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">Chưa có bài ôn tập nào</h3>
                    <p className="text-slate-500 mt-1">Giảng viên chưa mở bài ôn tập nào cho lớp của bạn.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.map(exam => {
                        const hasAttempted = exam.attempt && exam.attempt.status === 'submitted';
                        
                        return (
                            <div key={exam.id} className="bg-white p-6 rounded-2xl shadow-sm border border-fuchsia-100 hover:shadow-lg transition-all duration-300 flex flex-col group">
                                <div className="mb-4">
                                    <span className=" text-xm font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 inline-block">
                                        Luyện tập
                                    </span>
                                    <h3 className="text-lg font-bold text-slate-800 line-clamp-2 ">
                                        {exam.title}
                                    </h3>
                                    <p className="text-sm font-medium text-slate-500 mt-1">{exam.subject?.name}</p>
                                </div>

                                <div className="flex flex-col gap-2 mb-6 mt-auto">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Clock className="w-4 h-4 text-slate-400" /> {exam.duration} Phút
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <BookOpen className="w-4 h-4 text-slate-400" /> {exam.total_questions} Câu hỏi
                                    </div>
                                </div>

                                <button 
                                    onClick={() => startExam(exam.id)}
                                    className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                                        hasAttempted 
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100' 
                                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20'
                                    }`}
                                >
                                    {hasAttempted ? <><RefreshCw className="w-4 h-4" /> Làm lại bài này</> : <><PlayCircle className="w-4 h-4" /> Bắt đầu ôn tập</>}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}