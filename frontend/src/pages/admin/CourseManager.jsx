import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { Search, Plus, Edit, Trash2, Loader2, X, Layers, BookOpen, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function CourseManager() {
    const [courses, setCourses] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [subjects, setSubjects] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { register, handleSubmit, reset, watch } = useForm({
        defaultValues: { subject_ids: [] }
    });

    const fetchCourses = useCallback(async (url = '/admin/courses', params = {}) => {
        setLoading(true);
        try {
            const res = await api.get(url, { params });
            setCourses(res.data.data || res.data);
            setPagination({
                links: res.data.links || res.data.meta?.links,
                meta: res.data.meta || res.data
            });
        } catch (error) {
            toast.error('Lỗi tải danh sách khóa học');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSubjects = useCallback(async () => {
        try {
            const res = await api.get('/admin/subjects');
            setSubjects(res.data.data || res.data);
        } catch (error) {
            toast.error('Lỗi tải danh sách môn học');
        }
    }, []);

    useEffect(() => {
        fetchCourses();
        fetchSubjects();
    }, [fetchCourses, fetchSubjects]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCourses('/admin/courses', { search: searchQuery });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchCourses]);

    const openModal = (course = null) => {
        if (course) {
            setEditingId(course.id);
            reset({
                code: course.code,
                title: course.title,
                description: course.description || '',
                subject_ids: course.subjects ? course.subjects.map(s => s.id.toString()) : []
            });
        } else {
            setEditingId(null);
            reset({ code: '', title: '', description: '', subject_ids: [] });
        }
        setShowModal(true);
    };

    const onSubmit = async (data) => {
        const loadingToast = toast.loading('Đang lưu dữ liệu...');
        try {
            if (editingId) {
                await api.put(`/admin/courses/${editingId}`, data);
                toast.success('Cập nhật thành công!', { id: loadingToast });
            } else {
                await api.post('/admin/courses', data);
                toast.success('Thêm mới thành công!', { id: loadingToast });
            }
            setShowModal(false);
            fetchCourses('/admin/courses', { search: searchQuery });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra', { id: loadingToast });
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Xóa khóa học?',
            text: "Các đợt tuyển sinh và lớp học liên quan sẽ bị ảnh hưởng. Không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        });
        if (result.isConfirmed) {
            try {
                await api.delete(`/admin/courses/${id}`);
                toast.success('Đã xóa khóa học');
                fetchCourses('/admin/courses', { search: searchQuery });
            } catch (error) {
                toast.error('Lỗi khi xóa khóa học');
            }
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý Khóa học</h1>
                    <p className="text-slate-500 mt-1">Quản lý các chương trình đào tạo và cấu trúc môn học.</p>
                </div>
                <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-sm">
                    <Plus className="w-5 h-5" /> Thêm Khóa học
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm theo mã hoặc tên khóa học..."
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
                                    <th className="px-6 py-4">Mã khóa học</th>
                                    <th className="px-6 py-4">Tên khóa học</th>
                                    <th className="px-6 py-4 text-center">Số môn học</th>
                                    <th className="px-6 py-4 text-center">Số đợt tuyển sinh</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {courses.map((course) => (
                                    <tr key={course.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 font-bold ">{course.code}</td>
                                        <td className="px-6 py-4 font-bold ">{course.title}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="b px-2.5 py-1 rounded-md text-xm font-bold">
                                                {course.subjects?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className=" px-2.5 py-1 rounded-md text-xm font-bold">
                                                {course.cohorts?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => openModal(course)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(course.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {courses.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-8 text-slate-500 font-medium">Không tìm thấy khóa học nào.</td>
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
                                            onClick={() => fetchCourses(link.url)}
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
                                Hiển thị {courses.length} trên tổng số {pagination.meta.total || courses.length} khóa học
                            </div>
                        )}
                    </>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                
                                {editingId ? 'Cập nhật Khóa học' : 'Thêm Khóa học mới'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                <X className="w-5 h-5"/>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
                            <div className="p-6 overflow-y-auto flex-1 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Mã khóa học <span className="text-red-500">*</span></label>
                                        <input type="text" {...register('code', { required: true })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium uppercase" placeholder="VD: WEB2026" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Tên khóa học <span className="text-red-500">*</span></label>
                                        <input type="text" {...register('title', { required: true })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium" placeholder="VD: Lập trình Web" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả</label>
                                    <textarea {...register('description')} rows="2" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 resize-none" placeholder="Mô tả khóa học..."></textarea>
                                </div>

                                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                                    <label className="block text-sm font-bold text-black mb-3 flex items-center gap-2">
                                        Chọn môn học thuộc khóa
                                    </label>
                                    <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
                                        {subjects.map(sub => (
                                            <label key={sub.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    value={sub.id}
                                                    {...register('subject_ids')}
                                                    className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-bold text-slate-700 text-sm">{sub.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase">{sub.code}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 flex gap-3 border-t border-slate-100 bg-white shrink-0">
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