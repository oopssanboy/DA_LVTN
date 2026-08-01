import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Loader2, Upload, Download, Filter, ArrowLeft, FolderOpen, BookOpen } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';

export default function QuestionList() {
    const { user } = useAuth();
    const apiPrefix = user?.role === 'admin' ? '/admin' : '/teacher';

 
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);

    const [questions, setQuestions] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    
    useEffect(() => {
        fetchSubjects();
    }, []);

   
    useEffect(() => {
        if (selectedSubject) {
            fetchQuestions(`${apiPrefix}/questions`, selectedSubject.id);
        }
    }, [selectedSubject]);

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const res = await api.get(`${apiPrefix}/subjects`);
            setSubjects(res.data.data || res.data);
        } catch (error) {
            toast.error('Lỗi tải danh sách Môn học');
        } finally {
            setLoading(false);
        }
    };

    const fetchQuestions = async (url = `${apiPrefix}/questions`, subjectId = null) => {
        setLoading(true);
        try {
           
            const res = await api.get(url, {
                params: subjectId ? { subject_id: subjectId } : {}
            });
            setQuestions(res.data.data || res.data);
            setPagination({
                links: res.data.meta?.links || res.data.links,
                meta: res.data.meta || res.data
            });
        } catch (error) {
            toast.error('Lỗi tải danh sách câu hỏi');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Bạn chắc chắn muốn xóa?',
            text: "Không thể hoàn tác hành động này!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`${apiPrefix}/questions/${id}`);
                toast.success('Xóa câu hỏi thành công');
                fetchQuestions(`${apiPrefix}/questions`, selectedSubject?.id);
          
                fetchSubjects();
            } catch (error) {
                
                toast.error(error.response?.data?.message || 'Lỗi khi xóa câu hỏi');
            }
        }
    };

   
    if (!selectedSubject) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Ngân hàng Câu hỏi</h1>
                        <p className="text-slate-500 mt-1">Chọn một môn học để xem và quản lý câu hỏi bên trong.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link to={`${apiPrefix}/questions/create`} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-sm">
                            <Plus className="w-5 h-5" /> Thêm câu hỏi mới
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
                ) : subjects.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
                            <FolderOpen className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Chưa có môn học nào</h3>
                        <p className="text-slate-500 mt-1">Vui lòng tạo môn học trước khi quản lý ngân hàng câu hỏi.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {subjects.map(subject => (
                            <div 
                                key={subject.id} 
                                onClick={() => setSelectedSubject(subject)}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 flex flex-col items-center text-center group"
                            >
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <FolderOpen className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                                    {subject.name}
                                </h3>
                                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
                                    {subject.code}
                                </span>
                                <div className="mt-4 pt-4 border-t border-slate-100 w-full flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Tổng số câu:</span>
                                    <span className="font-black text-blue-600 text-lg">{subject.questions_count || 0}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

   
    const filteredQuestions = questions.filter(q => {
        const content = q.content || '';
        const topicName = q.topic?.name || '';
        const qStr = searchQuery.toLowerCase();
        return content.toLowerCase().includes(qStr) || topicName.toLowerCase().includes(qStr);
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans animate-in fade-in slide-in-from-right-4 duration-300">
          
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <button 
                        onClick={() => setSelectedSubject(null)} 
                        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-2 transition"
                    >
                        <ArrowLeft className="w-4 h-4" /> Quay lại thư mục
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-blue-600"/> Ngân hàng: {selectedSubject.name}
                    </h1>
                    <p className="text-slate-500 mt-1">Quản lý và biên soạn câu hỏi trắc nghiệm, điền khuyết.</p>
                </div>
                
                <div className="flex gap-3">
                    <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-sm">
                        <Upload className="w-4 h-4" /> Import
                    </button>
                    <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-sm">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <Link to={`${apiPrefix}/questions/create`} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-sm">
                        <Plus className="w-5 h-5" /> Thêm mới
                    </Link>
                </div>
            </div>

        
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50/50">
                    <div className="relative flex-1 max-w-2xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm nội dung hoặc chủ đề..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium text-slate-700"
                        />
                    </div>
                    <button className="px-4 py-2.5 border border-slate-200 bg-white rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition flex items-center gap-2 shadow-sm">
                        <Filter className="w-4 h-4" /> Lọc
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
                    ) : questions.length === 0 ? (
                        <div className="p-20 text-center text-slate-500">Môn học này chưa có câu hỏi nào.</div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Chủ đề</th>
                                    <th className="px-6 py-4 w-1/3">Nội dung tóm tắt</th>
                                    <th className="px-6 py-4 text-center">Loại</th>
                                    <th className="px-6 py-4 text-center">Độ khó</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredQuestions.map((q) => {
                                   
                                    const tmp = document.createElement('div');
                                    tmp.innerHTML = q.content;
                                    const textContent = tmp.textContent || tmp.innerText || '';

                                    return (
                                        <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-700">{q.topic?.name || 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                <div className="line-clamp-2 text-slate-800 font-medium" title={textContent}>
                                                    {textContent}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-md text-xs font-bold ${
                                                    q.type === 'fill_blank' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {q.type === 'fill_blank' ? 'Điền khuyết' : 'Trắc nghiệm'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-md text-[10px] font-black tracking-wider uppercase ${
                                                    q.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                                                    q.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {q.difficulty}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                
                                                {q.can_edit === false ? (
                                                    <span className="text-xs text-slate-400 font-bold px-2 py-1 bg-slate-100 rounded">Dùng chung</span>
                                                ) : (
                                                    <div className="flex justify-end gap-2">
                                                        <Link to={`${apiPrefix}/questions/${q.id}/edit`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                            <Edit className="w-5 h-5" />
                                                        </Link>
                                                        <button onClick={() => handleDelete(q.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                
                {pagination.links && pagination.links.length > 3 && (
                    <div className="p-4 border-t border-slate-100 flex flex-wrap justify-center gap-1">
                        {pagination.links.map((link, idx) => (
                            <button
                                key={idx}
                                disabled={!link.url}
                                onClick={() => fetchQuestions(link.url, selectedSubject.id)}
                                className={`px-4 py-2 text-sm font-medium rounded-xl transition border
                                    ${link.active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}
                                    ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}