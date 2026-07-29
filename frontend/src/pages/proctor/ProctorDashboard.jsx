import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Search, Loader2, Eye, Clock, Users, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function ProctorDashboard() {
    const { user } = useAuth();
    const [activeExams, setActiveExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const basePath = user?.role === 'admin' ? '/admin' : '/proctor';

    useEffect(() => {
        fetchActiveExams();
    }, []);

    const fetchActiveExams = async () => {
        try {
            const res = await api.get('/proctor/active-exams');
            setActiveExams(res.data.data || res.data);
        } catch (error) {
            toast.error('Không thể tải danh sách kỳ thi đang diễn ra');
        } finally {
            setLoading(false);
        }
    };

    const filteredExams = activeExams.filter(exam => {
        const title = exam.title || '';
        const subjectName = typeof exam.subject === 'object' ? exam.subject?.name : (exam.subject || '');
        const q = searchQuery.toLowerCase();
        return title.toLowerCase().includes(q) || subjectName.toLowerCase().includes(q);
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-10 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                         Hệ thống Giám sát Thi
                    </h1>
                    <p className="text-slate-500 mt-1">Danh sách các kỳ thi đang diễn ra. Chọn một phòng để bắt đầu gác thi.</p>
                </div>
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Tìm tên môn học, kỳ thi..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-white shadow-sm" 
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /></div>
            ) : filteredExams.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
                        
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">Không có kỳ thi nào đang mở</h3>
                    <p className="text-slate-500 mt-1">Hiện tại không có phòng thi nào đang hoạt động trên hệ thống.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExams.map(exam => {
                        const safeSubjectName = typeof exam.subject === 'object' ? exam.subject?.name : (exam.subject || 'Chưa cập nhật');

                        return (
                            <div key={exam.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col h-full group">
                                <div className="flex justify-between items-start mb-6">
                                    <span className=" text-black px-3 py-1 rounded-lg text-xm font-bold uppercase tracking-wider line-clamp-1 max-w-[70%]">
                                        {safeSubjectName}
                                    </span>
                                    <span className="flex items-center gap-1 text-emerald-600 font-bold text-xm bg-emerald-100 px-2 py-1  animate-pulse">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Đang mở
                                    </span>
                                </div>
                                
                                <h3 className="text-lg font-bold text-slate-800 mb-4 line-clamp-2">{exam.title}</h3>
                                
                                <div className="space-y-2 mb-6 flex-1 text-sm text-slate-600">
                                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                                        <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-400"/> Lớp áp dụng:</span>
                                        <span className="font-bold text-slate-700">{exam.class?.name || 'Tất cả'}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400"/> Thời gian thi:</span>
                                        <span className="font-bold text-slate-700">{exam.duration} phút</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => navigate(`${basePath}/monitor/${exam.id}`)}
                                    className="w-full py-3 rounded-xl font-bold transition flex justify-center items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 shadow-md"
                                >
                                    <Eye className="w-5 h-5" /> Vào phòng Giám sát
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}