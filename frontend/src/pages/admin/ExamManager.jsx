import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, PlayCircle, Loader2, FileCheck, Lock, Unlock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function ExamManager() {
    const { user } = useAuth();
    const apiPrefix = user?.role === 'admin' ? '/admin' : '/teacher';

    const [exams, setExams] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [processingId, setProcessingId] = useState(null);

    const fetchExams = useCallback(async (url = `${apiPrefix}/exams`, params = {}) => {
        setLoading(true);
        try {
            const res = await api.get(url, { params });
            setExams(res.data.data || res.data);
            setPagination({
                links: res.data.links || res.data.meta?.links,
                meta: res.data.meta || res.data
            });
        } catch (error) {
            toast.error('Lỗi tải danh sách kỳ thi');
        } finally {
            setLoading(false);
        }
    }, [apiPrefix]);

    useEffect(() => {
        fetchExams();
    }, [fetchExams]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchExams(`${apiPrefix}/exams`, { search: searchQuery });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchExams, apiPrefix]);

    const handleGenerate = async (id) => {
        setProcessingId(id);
        try {
            await api.post(`${apiPrefix}/exams/${id}/generate`);
            toast.success('Đã sinh đề thi thành công!');
            fetchExams(`${apiPrefix}/exams`, { search: searchQuery });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi trộn đề. Hãy kiểm tra lại ngân hàng câu hỏi!');
        } finally {
            setProcessingId(null);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const res = await api.patch(`${apiPrefix}/exams/${id}/status`);
            toast.success(res.data.message);
            setExams(exams.map(ex => ex.id === id ? { ...ex, is_active: res.data.is_active } : ex));
        } catch (error) {
            toast.error('Lỗi khi cập nhật trạng thái');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Xóa kỳ thi?',
            text: "Dữ liệu kỳ thi và điểm sinh viên liên quan sẽ bị xóa!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Xóa'
        });
        if (result.isConfirmed) {
            try {
                await api.delete(`${apiPrefix}/exams/${id}`);
                toast.success('Xóa kỳ thi thành công');
                fetchExams(`${apiPrefix}/exams`, { search: searchQuery });
            } catch (error) {
                toast.error('Lỗi khi xóa kỳ thi');
            }
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý Kỳ thi</h1>
                    <p className="text-slate-500 mt-1">Cấu hình thời gian, thông số và sinh ma trận đề thi.</p>
                </div>
                <Link to={`${apiPrefix}/exams/create`} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-sm">
                    <Plus className="w-5 h-5" /> Tạo kỳ thi mới
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm tên kỳ thi hoặc môn học..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
                    ) : exams.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">Chưa có kỳ thi nào.</div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Tên kỳ thi</th>
                                    <th className="px-6 py-4">Lớp / Môn</th>
                                    <th className="px-6 py-4">Cấu hình</th>
                                    <th className="px-6 py-4">Trạng thái đề</th>
                                    <th className="px-6 py-4">Trạng thái</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {exams.map((exam) => {
                                    const isGenerated = Number(exam.questions_count) === Number(exam.total_questions) && Number(exam.total_questions) > 0;
                                    const isActive = exam.is_active === 1 || exam.is_active === '1' || exam.is_active === true;
                                    const subjectName = typeof exam.subject === 'object' ? exam.subject?.name : exam.subject;

                                    return (
                                        <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-800">{exam.title}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-700 max-w-[200px] truncate" title={exam.classes?.map(c => c.name).join(', ')}>
                                                    {exam.classes && exam.classes.length > 0
                                                        ? exam.classes.map(c => c.name).join(', ')
                                                        : 'Chưa gán lớp'}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">{subjectName || 'Chưa cập nhật'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-blue-600">{exam.duration} phút</div>
                                                <div className="text-xs font-bold mt-1">{exam.total_questions} câu | {exam.passing_score} điểm đậu</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isGenerated ? (
                                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 w-max rounded-full">
                                                        Đã có đề
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold flex items-center gap-1 w-max rounded-full">
                                                        Chưa có đề
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => handleToggleStatus(exam.id)} className={`px-3 py-1 text-xs font-bold flex items-center gap-1 w-max transition rounded-full ${isActive ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-slate-200 text-red-600 hover:bg-slate-300'}`}>
                                                    {isActive ? <><Unlock className="w-3 h-3" /> Đang Mở</> : <><Lock className="w-3 h-3" /> Đang Khóa</>}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleGenerate(exam.id)} disabled={processingId === exam.id} title="Bốc random câu hỏi theo ma trận" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50">
                                                        {processingId === exam.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
                                                    </button>

                                                    {exam.in_progress_count > 0 ? (
                                                        <div className="relative group flex items-center justify-center">
                                                            <button disabled className="p-2 text-slate-800 opacity-40 cursor-not-allowed transition">
                                                                <Edit className="w-5 h-5" />
                                                            </button>
                                                            <span className="absolute bottom-full right-1/2 translate-x-1/2 mb-1 hidden group-hover:block w-max bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg z-10 pointer-events-none">
                                                                Đang có học viên thi không thể thao tác lúc này
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <Link to={`${apiPrefix}/exams/${exam.id}/edit`} title="Sửa kỳ thi" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                            <Edit className="w-5 h-5" />
                                                        </Link>
                                                    )}

                                                    {exam.in_progress_count > 0 ? (
                                                        <div className="relative group flex items-center justify-center">
                                                            <button disabled className="p-2 text-slate-800 opacity-40 cursor-not-allowed transition">
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                            <span className="absolute bottom-full right-1/2 translate-x-1/2 mb-1 hidden group-hover:block w-max bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg z-10 pointer-events-none">
                                                                Đang có học viên thi không thể thao tác lúc này
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => handleDelete(exam.id)} title="Xóa kỳ thi" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
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
                        {pagination.links.map((link, idx) => {
                            let label = link.label;
                            if (label.includes('Previous')) label = 'Trang trước';
                            else if (label.includes('Next')) label = 'Trang sau';
                            return (
                                <button
                                    key={idx}
                                    disabled={!link.url}
                                    onClick={() => fetchExams(link.url)}
                                    className={`px-4 py-2 text-sm font-medium rounded-xl transition border
                                        ${link.active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}
                                        ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                    dangerouslySetInnerHTML={{ __html: label }}
                                />
                            );
                        })}
                    </div>
                )}
                {pagination.meta && (
                    <div className="px-6 py-3 text-sm text-slate-500 border-t border-slate-100">
                        Hiển thị {exams.length} trên tổng số {pagination.meta.total || exams.length} kỳ thi
                    </div>
                )}
            </div>
        </div>
    );
}