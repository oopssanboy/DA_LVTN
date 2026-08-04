import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { Search, Plus, Edit, Trash2, Loader2, X, Calendar, GraduationCap, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function CohortManager() {
    const [cohorts, setCohorts] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [courses, setCourses] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { register, handleSubmit, reset } = useForm({
        defaultValues: { course_id: '', name: '', start_date: '', end_date: '' }
    });

    const fetchCohorts = useCallback(async (url = '/admin/cohorts', params = {}) => {
        setLoading(true);
        try {
            const res = await api.get(url, { params });
            setCohorts(res.data.data || res.data);
            setPagination({
                links: res.data.links || res.data.meta?.links,
                meta: res.data.meta || res.data
            });
        } catch (error) {
            toast.error('Lỗi tải danh sách đợt tuyển sinh');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCourses = useCallback(async () => {
        try {
            const res = await api.get('/admin/courses');
            setCourses(res.data.data || res.data);
        } catch (error) {
            toast.error('Lỗi tải danh sách khóa học');
        }
    }, []);

    useEffect(() => {
        fetchCohorts();
        fetchCourses();
    }, [fetchCohorts, fetchCourses]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCohorts('/admin/cohorts', { search: searchQuery });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchCohorts]);

    const openModal = (cohort = null) => {
        if (cohort) {
            setEditingId(cohort.id);
            reset({
                course_id: cohort.course_id,
                name: cohort.name,
                start_date: cohort.start_date || '',
                end_date: cohort.end_date || ''
            });
        } else {
            setEditingId(null);
            reset({ course_id: '', name: '', start_date: '', end_date: '' });
        }
        setShowModal(true);
    };

    const onSubmit = async (data) => {
        const loadingToast = toast.loading('Đang lưu dữ liệu...');
        try {
            if (editingId) {
                await api.put(`/admin/cohorts/${editingId}`, data);
                toast.success('Cập nhật thành công!', { id: loadingToast });
            } else {
                await api.post('/admin/cohorts', data);
                toast.success('Thêm mới thành công!', { id: loadingToast });
            }
            setShowModal(false);
            fetchCohorts('/admin/cohorts', { search: searchQuery });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra', { id: loadingToast });
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Xóa đợt tuyển sinh?',
            text: "Các lớp học bên trong sẽ bị ảnh hưởng. Không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        });
        if (result.isConfirmed) {
            try {
                await api.delete(`/admin/cohorts/${id}`);
                toast.success('Đã xóa đợt tuyển sinh');
                fetchCohorts('/admin/cohorts', { search: searchQuery });
            } catch (error) {
                toast.error('Lỗi khi xóa đợt tuyển sinh');
            }
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý Đợt tuyển sinh</h1>
                    <p className="text-slate-500 mt-1">Quản lý các đợt mở lớp thuộc từng khóa học.</p>
                </div>
                <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-sm">
                    <Plus className="w-5 h-5" /> Thêm Đợt tuyển sinh
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên đợt hoặc khóa học..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium bg-white"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
                ) : (
                    <>
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Tên đợt</th>
                                    <th className="px-6 py-4">Khóa học</th>
                                    <th className="px-6 py-4 text-center">Thời gian</th>
                                    <th className="px-6 py-4 text-center">Số lớp</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {cohorts.map((cohort) => (
                                    <tr key={cohort.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800">{cohort.name}</td>
                                        <td className="px-6 py-4 font-medium text-slate-600">
                                            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold">
                                                {cohort.course?.title || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-slate-600">
                                            {cohort.start_date ? `${cohort.start_date} - ${cohort.end_date || 'Nay'}` : 'Chưa thiết lập'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold">
                                                {cohort.classes_count || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => openModal(cohort)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(cohort.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {cohorts.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-8 text-slate-500 font-medium">Không tìm thấy đợt tuyển sinh nào.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

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
                                            onClick={() => fetchCohorts(link.url)}
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
                                Hiển thị {cohorts.length} trên tổng số {pagination.meta.total || cohorts.length} đợt tuyển sinh
                            </div>
                        )}
                    </>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600"/>
                                {editingId ? 'Cập nhật Đợt tuyển sinh' : 'Thêm Đợt tuyển sinh mới'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                <X className="w-5 h-5"/>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Thuộc Khóa học <span className="text-red-500">*</span></label>
                                <select {...register('course_id', { required: true })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium bg-white">
                                    <option value="">-- Chọn Khóa học --</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Tên đợt tuyển sinh <span className="text-red-500">*</span></label>
                                <input type="text" {...register('name', { required: true })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium" placeholder="VD: Đợt tuyển sinh 2026 - Đợt 1" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Ngày bắt đầu</label>
                                    <input type="date" {...register('start_date')} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Ngày kết thúc</label>
                                    <input type="date" {...register('end_date')} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium" />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3 border-t border-slate-100">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">Hủy</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-md shadow-blue-600/20">Lưu dữ liệu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}