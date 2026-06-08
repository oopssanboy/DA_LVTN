import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, PlayCircle, Loader2, FileCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function ExamManager() {
    const { user } = useAuth();
    const [exams, setExams] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [generatingId, setGeneratingId] = useState(null);

    const apiPrefix = user?.role === 'admin' ? '/admin' : '/teacher';

    const fetchExams = async (url = `${apiPrefix}/exams`) => {
        setLoading(true);
        try {
            const res = await api.get(url);
            setExams(res.data.data);
            setPagination({
                links: res.data.meta?.links || res.data.links,
                meta: res.data.meta || res.data
            });
        } catch (error) {
            toast.error('Lỗi tải danh sách kỳ thi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExams();
    }, []);

    // API Trộn đề theo ma trận
    const handleGenerate = async (id) => {
        setGeneratingId(id);
        try {
            await api.post(`${apiPrefix}/exams/${id}/generate`);
            toast.success('Đã sinh đề thi thành công!');
            fetchExams(); // Cập nhật lại số lượng câu hỏi hiện tại
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi trộn đề. Hãy kiểm tra lại ngân hàng câu hỏi!');
        } finally {
            setGeneratingId(null);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Xóa kỳ thi?',
            text: "Dữ liệu kỳ thi và điểm sinh viên liên quan có thể bị xóa!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#cbd5e1',
            confirmButtonText: 'Xóa kỳ thi'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`${apiPrefix}/exams/${id}`);
                toast.success('Xóa kỳ thi thành công');
                fetchExams();
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
                    <p className="text-slate-500 mt-1">Cấu hình thời gian, thông số và ma trận đề thi.</p>
                </div>
                <Link to={`${apiPrefix}/exams/create`} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-sm">
                    <Plus className="w-5 h-5" /> Tạo kỳ thi mới
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input type="text" placeholder="Tìm tên kỳ thi..." className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
                    ) : exams.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">Chưa có kỳ thi nào được tạo.</div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Tên kỳ thi</th>
                                    <th className="px-6 py-4">Lớp / Môn</th>
                                    <th className="px-6 py-4">Thời gian thi</th>
                                    <th className="px-6 py-4">Trạng thái cấu hình</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {exams.map((exam) => {
                                    const isGenerated = exam.questions_count === exam.total_questions;
                                    return (
                                        <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-800">{exam.title}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-700">{exam.class_name || 'N/A'}</div>
                                                <div className="text-xs text-slate-500 mt-1">{exam.subject}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-blue-600">{exam.duration} phút</div>
                                                <div className="text-xs text-slate-500 mt-1">{exam.total_questions} câu</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isGenerated ? (
                                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1 w-max">
                                                        <FileCheck className="w-3 h-3"/> Đã có đề
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1 w-max">
                                                        <Loader2 className="w-3 h-3"/> Chưa có đề
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleGenerate(exam.id)} 
                                                        disabled={generatingId === exam.id}
                                                        title="Bốc random câu hỏi theo ma trận"
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
                                                    >
                                                        {generatingId === exam.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
                                                    </button>
                                                    <Link to={`${apiPrefix}/exams/${exam.id}/edit`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                        <Edit className="w-5 h-5" />
                                                    </Link>
                                                    <button onClick={() => handleDelete(exam.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {pagination.links && pagination.links.length > 3 && (
                    <div className="p-4 border-t border-slate-100 flex flex-wrap justify-center gap-1">
                        {pagination.links.map((link, idx) => (
                            <button
                                key={idx}
                                disabled={!link.url}
                                onClick={() => fetchExams(link.url)}
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