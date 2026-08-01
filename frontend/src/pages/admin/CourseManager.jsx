import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { Search, Plus, Edit, Trash2, Loader2, X, GraduationCap, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function CourseList() {
    const [courses, setCourses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { register, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: { subject_ids: [] }
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [coursesRes, subjectsRes] = await Promise.all([
                api.get('/admin/courses'),
                api.get('/admin/subjects')
            ]);
            setCourses(coursesRes.data.data || coursesRes.data);
            setSubjects(subjectsRes.data.data || subjectsRes.data);
        } catch (error) {
            toast.error('Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (course = null) => {
        if (course) {
            setEditingId(course.id);
            reset({
                code: course.code,
                title: course.title,
                description: course.description || '',
                // Lấy mảng ID các môn học đang có trong Khóa
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
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra', { id: loadingToast });
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Xóa Chương trình đào tạo?',
            text: "Các Đợt tuyển sinh và Lớp học bên trong sẽ bị xóa theo!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/admin/courses/${id}`);
                toast.success('Đã xóa chương trình');
                fetchData();
            } catch (error) {
                toast.error('Lỗi khi xóa chương trình');
            }
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Chương trình Đào tạo</h1>
                    <p className="text-slate-500 mt-1">Thiết lập các Khóa học và cấu trúc môn học bên trong.</p>
                </div>
                <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-sm">
                    <Plus className="w-5 h-5" /> Thêm Chương trình
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
                ) : (
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 w-1/4">Chương trình</th>
                                <th className="px-6 py-4">Cấu trúc Môn học</th>
                                <th className="px-6 py-4 text-center">Đợt tuyển sinh</th>
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {courses.map((course) => (
                                <tr key={course.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800 text-base">{course.title}</div>
                                        <div className="text-blue-600 font-bold text-xs mt-1 uppercase tracking-wider">{course.code}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {course.subjects?.length > 0 ? course.subjects.map(sub => (
                                                <span key={sub.id} className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5">
                                                    <Layers className="w-3 h-3 text-blue-500" /> {sub.name}
                                                </span>
                                            )) : <span className="text-slate-400 italic">Chưa có môn học</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-emerald-600">
                                        {course.cohorts?.length || 0} Đợt
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => openModal(course)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-5 h-5" /></button>
                                        <button onClick={() => handleDelete(course.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Thêm/Sửa Khóa học */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-blue-600"/> 
                                {editingId ? 'Cập nhật Chương trình' : 'Thêm Chương trình mới'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Mã chương trình <span className="text-red-500">*</span></label>
                                    <input type="text" {...register('code', { required: true })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 uppercase font-bold" placeholder="VD: FS2024" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Tên chương trình <span className="text-red-500">*</span></label>
                                    <input type="text" {...register('title', { required: true })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium" placeholder="VD: Fullstack PHP" />
                                </div>
                            </div>
                            
                            {/* KHU VỰC GẮN MÔN HỌC */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 border-b pb-2">Chọn Môn học cho chương trình này</label>
                                <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
                                    {subjects.map(sub => (
                                        <label key={sub.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                            <input 
                                                type="checkbox" 
                                                value={sub.id} 
                                                {...register('subject_ids')}
                                                className="w-4 h-4 text-blue-600 rounded border-slate-300"
                                            />
                                            <div className="flex-1">
                                                <div className="font-bold text-slate-800 text-sm">{sub.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">{sub.code}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3 border-t border-slate-100">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">Hủy</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-md shadow-blue-600/20">Lưu cấu hình</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}