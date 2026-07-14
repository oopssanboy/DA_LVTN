import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Filter, Loader2, Upload, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function QuestionList() {
    const { user } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const apiPrefix = user?.role === 'admin' ? '/admin' : '/teacher';

    const fetchQuestions = async (url = `${apiPrefix}/questions`) => {
        setLoading(true);
        try {
            const res = await api.get(url);
            setQuestions(res.data.data);
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

    useEffect(() => {
        fetchQuestions();
    }, []);

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Xóa câu hỏi?',
            text: "Dữ liệu này sẽ không thể khôi phục!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#cbd5e1',
            confirmButtonText: 'Vâng, Xóa!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`${apiPrefix}/questions/${id}`);
                toast.success('Xóa thành công');
                fetchQuestions();
            } catch (error) {
                toast.error('Lỗi khi xóa câu hỏi');
            }
        }

    };
    const fileInputRef = useRef(null);

    const handleExport = async () => {
        try {
            const res = await api.get(`${apiPrefix}/questions/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Danh_Sach_Cau_Hoi.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Lỗi khi tải file Excel');
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const loadingToast = toast.loading('Đang xử lý import...');
        try {
            await api.post(`${apiPrefix}/questions/import`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Import thành công!', { id: loadingToast });
            fetchQuestions();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Import thất bại. Kiểm tra lại format file.', { id: loadingToast });
        }
        e.target.value = '';
    };
    const filteredQuestions = questions.filter(q => {
        const content = q.content || '';
        const subjectName = q.subject?.name || '';
        const query = searchQuery.toLowerCase();
        return content.toLowerCase().includes(query) || subjectName.toLowerCase().includes(query);
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Ngân hàng Câu hỏi</h1>
                    <p className="text-slate-500 mt-1">Quản lý và biên soạn câu hỏi trắc nghiệm, điền khuyết.</p>
                </div>
                <div className="flex gap-2">

                    <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx,.xls,.csv" className="hidden" />

                    <button onClick={() => fileInputRef.current.click()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-sm">
                        <Upload className="w-5 h-5" /> Import
                    </button>

                    <button onClick={handleExport} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-sm">
                        <Download className="w-5 h-5" /> Export
                    </button>

                    <Link to={`${apiPrefix}/questions/create`} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-sm">
                        <Plus className="w-5 h-5" /> Thêm mới
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm nội dung hoặc môn học..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <button className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition flex items-center gap-2 font-medium">
                        <Filter className="w-5 h-5" /> Lọc
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
                    ) : questions.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">Chưa có dữ liệu câu hỏi.</div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Môn học</th>
                                    <th className="px-6 py-4">Nội dung tóm tắt</th>
                                    <th className="px-6 py-4">Loại</th>
                                    <th className="px-6 py-4">Độ khó</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredQuestions.map((q) => (
                                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-800">{q.subject?.name || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <div className="line-clamp-2 max-w-md" dangerouslySetInnerHTML={{ __html: q.content }} />
                                        </td>
                                        <td className="px-6 py-4">
                                            {q.type === 'fill_blank' ? (
                                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">Điền khuyết</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Trắc nghiệm</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                                                ${q.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                                                    q.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}
                                            >
                                                {q.difficulty}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link to={`${apiPrefix}/questions/${q.id}/edit`} title="Sửa câu hỏi" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                    <Edit className="w-5 h-5" />
                                                </Link>
                                                <button onClick={() => handleDelete(q.id)} title="Xóa câu hỏi" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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
                                onClick={() => fetchQuestions(link.url)}
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