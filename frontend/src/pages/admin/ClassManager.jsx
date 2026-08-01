import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { Search, Plus, Edit, Trash2, Loader2, X, Users, Briefcase, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function ClassList() {
    const [classes, setClasses] = useState([]);
    const [cohorts, setCohorts] = useState([]);
    const [teachers, setTeachers] = useState([]); 
    const [students, setStudents] = useState([]); // Chứa danh sách sinh viên
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // State cho Modal Lớp học (Thêm/Sửa Lớp & Giảng viên)
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { register, handleSubmit, reset } = useForm({
        defaultValues: { teacher_ids: [] }
    });

    // State cho Modal Ghi danh Sinh viên
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [selectedClassForEnroll, setSelectedClassForEnroll] = useState(null);
    const { register: registerEnroll, handleSubmit: handleEnrollSubmit, reset: resetEnroll } = useForm({
        defaultValues: { student_ids: [] }
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Lấy toàn bộ dữ liệu cần thiết (Lớp, Đợt, Giảng viên, Sinh viên)
            const [classesRes, cohortsRes, teachersRes, studentsRes] = await Promise.all([
                api.get('/admin/classes'),
                api.get('/admin/cohorts'),
                api.get('/admin/users?role=teacher&is_active=1'),
                api.get('/admin/users?role=student&is_active=1')
            ]);
            
            setClasses(classesRes.data.data || classesRes.data);
            setCohorts(cohortsRes.data.data || cohortsRes.data);
            setTeachers(teachersRes.data.data || teachersRes.data);
            setStudents(studentsRes.data.data || studentsRes.data);
        } catch (error) {
            toast.error('Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    // --- LOGIC MODAL LỚP HỌC (THÊM/SỬA) ---
    const openModal = (cls = null) => {
        if (cls) {
            setEditingId(cls.id);
            reset({
                cohort_id: cls.cohort_id,
                name: cls.name,
                start_date: cls.start_date || '',
                end_date: cls.end_date || '',
                teacher_ids: cls.teachers ? cls.teachers.map(t => t.id.toString()) : []
            });
        } else {
            setEditingId(null);
            reset({ cohort_id: '', name: '', start_date: '', end_date: '', teacher_ids: [] });
        }
        setShowModal(true);
    };

    const onSubmit = async (data) => {
        const loadingToast = toast.loading('Đang lưu dữ liệu...');
        try {
            if (editingId) {
                await api.put(`/admin/classes/${editingId}`, data);
                toast.success('Cập nhật thành công!', { id: loadingToast });
            } else {
                await api.post('/admin/classes', data);
                toast.success('Thêm mới thành công!', { id: loadingToast });
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra', { id: loadingToast });
        }
    };

    // --- LOGIC MODAL GHI DANH SINH VIÊN ---
    const openEnrollModal = (cls) => {
        setSelectedClassForEnroll(cls);
        // Lấy danh sách ID học viên đã có trong lớp để tick sẵn
        const enrolledIds = cls.enrollments?.map(e => e.student_id.toString()) || [];
        resetEnroll({ student_ids: enrolledIds });
        setShowEnrollModal(true);
    };

    const onEnrollSubmit = async (data) => {
        const loadingToast = toast.loading('Đang đồng bộ danh sách...');
        try {
            await api.post(`/admin/classes/${selectedClassForEnroll.id}/enroll`, data);
            toast.success('Ghi danh thành công!', { id: loadingToast });
            setShowEnrollModal(false);
            fetchData(); // Load lại để cập nhật sĩ số
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra', { id: loadingToast });
        }
    };

    // --- LOGIC XÓA LỚP ---
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Xóa Lớp học?',
            text: "Danh sách học viên và kỳ thi trong lớp sẽ bị ảnh hưởng. Không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/admin/classes/${id}`);
                toast.success('Đã xóa lớp học');
                fetchData();
            } catch (error) {
                toast.error('Lỗi khi xóa lớp học');
            }
        }
    };

    const filteredClasses = classes.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.cohort?.course?.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Lớp học & Phân công</h1>
                    <p className="text-slate-500 mt-1">Quản lý lớp học, sĩ số và phân công Giảng viên phụ trách.</p>
                </div>
                <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-sm">
                    <Plus className="w-5 h-5" /> Thêm Lớp học
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" placeholder="Tìm tên lớp, khóa học..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium bg-white" 
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
                ) : (
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Lớp học</th>
                                <th className="px-6 py-4">Phân công Giảng viên</th>
                                <th className="px-6 py-4 text-center">Sĩ số</th>
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredClasses.map((cls) => (
                                <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800 text-base">{cls.name}</div>
                                        <div className="text-slate-500 font-medium text-xs mt-1">
                                            {cls.cohort?.name} <span className="text-blue-600 font-bold">({cls.cohort?.course?.code})</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {cls.teachers?.length > 0 ? cls.teachers.map(t => (
                                                <span key={t.id} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold border border-blue-100 flex items-center gap-1">
                                                    <Briefcase className="w-3 h-3" /> {t.student?.name || t.teacher?.name || t.name || t.email}
                                                </span>
                                            )) : <span className="text-slate-400 italic text-xs">Chưa phân công</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-bold text-emerald-600 text-base">{cls.enrollments_count || 0}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEnrollModal(cls)} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100" title="Ghi danh học viên">
                                                <UserCheck className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => openModal(cls)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa thông tin lớp">
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(cls.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa lớp học">
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

            {/* MODAL 1: THÊM / SỬA LỚP HỌC */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600"/> 
                                {editingId ? 'Cập nhật Lớp học' : 'Thêm Lớp học mới'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Thuộc Đợt tuyển sinh <span className="text-red-500">*</span></label>
                                    <select {...register('cohort_id', { required: true })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium">
                                        <option value="">-- Chọn Đợt tuyển sinh --</option>
                                        {cohorts.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.course?.title})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Tên Lớp học <span className="text-red-500">*</span></label>
                                    <input type="text" {...register('name', { required: true })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium" placeholder="VD: FS2401" />
                                </div>
                            </div>

                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <label className="block text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" /> Phân công Giảng viên phụ trách
                                </label>
                                <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-1">
                                    {teachers.map(t => (
                                        <label key={t.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 transition-colors">
                                            <input 
                                                type="checkbox" 
                                                value={t.id} 
                                                {...register('teacher_ids')}
                                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                            />
                                            <div className="font-bold text-slate-700 text-sm">
                                                {t.teacher?.name || t.name || t.email}
                                            </div>
                                        </label>
                                    ))}
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

            {/* MODAL 2: GHI DANH SINH VIÊN */}
            {showEnrollModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
                            <div>
                                <h3 className="font-bold text-lg text-emerald-800 flex items-center gap-2">
                                    <UserCheck className="w-5 h-5"/> Ghi danh Sinh viên
                                </h3>
                                <p className="text-xs font-medium text-emerald-600 mt-1">Lớp: {selectedClassForEnroll?.name}</p>
                            </div>
                            <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <form onSubmit={handleEnrollSubmit(onEnrollSubmit)} className="p-6 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <label className="block text-sm font-bold text-slate-700 mb-3">Chọn danh sách sinh viên tham gia lớp này:</label>
                                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                                    {students.map(s => (
                                        <label key={s.id} className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-emerald-300 transition-colors">
                                            <input 
                                                type="checkbox" 
                                                value={s.id} 
                                                {...registerEnroll('student_ids')}
                                                className="w-4 h-4 mt-0.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                            />
                                            <div>
                                                <div className="font-bold text-slate-700 text-sm">
                                                    {s.student?.name || s.name || s.email}
                                                </div>
                                                <div className="text-xs font-medium text-slate-400 mt-0.5">
                                                    MSSV: {s.student?.student_code || 'N/A'}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                    {students.length === 0 && (
                                        <div className="col-span-2 text-center text-slate-500 py-4 text-sm font-medium">Không có sinh viên nào trong hệ thống.</div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3 border-t border-slate-100">
                                <button type="button" onClick={() => setShowEnrollModal(false)} className="flex-1 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">Hủy</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20">Xác nhận Ghi danh</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}