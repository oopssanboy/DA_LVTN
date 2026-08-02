import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { Search, Plus, Edit, Trash2, Loader2, X, Users, Briefcase, UserCheck, Eye, UserCircle, Calendar, Layers, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function ClassList() {
    const [classes, setClasses] = useState([]);
    const [cohorts, setCohorts] = useState([]);
    const [teachers, setTeachers] = useState([]); 
    const [students, setStudents] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // State cho Modal Lớp học (Thêm/Sửa)
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTeacher, setSearchTeacher] = useState(''); // 🔥 Search Giảng viên
    const { register, handleSubmit, reset } = useForm({
        defaultValues: { teacher_ids: [] }
    });

    // State cho Modal Ghi danh
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [selectedClassForEnroll, setSelectedClassForEnroll] = useState(null);
    const [searchStudent, setSearchStudent] = useState(''); // 🔥 Search Sinh viên
    const [selectedStudentIds, setSelectedStudentIds] = useState([]); // Chứa ID sinh viên được tick
    const [enrollLoading, setEnrollLoading] = useState(false); // Hiệu ứng loading lúc lấy danh sách

    // State cho Modal Xem chi tiết
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedClassDetails, setSelectedClassDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [classesRes, cohortsRes, teachersRes, studentsRes] = await Promise.all([
                api.get('/admin/classes'),
                api.get('/admin/cohorts'),
                api.get('/admin/users?role=teacher&is_active=1&per_page=100'),
                api.get('/admin/users?role=student&is_active=1&per_page=500') // Nới rộng limit để hiển thị nhiều SV
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

    // --- LOGIC XEM CHI TIẾT ---
    const handleViewDetails = async (id) => {
        setShowDetailsModal(true);
        setLoadingDetails(true);
        try {
            const res = await api.get(`/admin/classes/${id}`);
            setSelectedClassDetails(res.data.data || res.data);
        } catch (error) {
            toast.error('Lỗi tải thông tin chi tiết lớp học');
            setShowDetailsModal(false);
        } finally {
            setLoadingDetails(false);
        }
    };

    // --- LOGIC THÊM / SỬA LỚP HỌC ---
    const openModal = (cls = null) => {
        setSearchTeacher(''); // Reset search
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

    // --- LOGIC GHI DANH ---
    const openEnrollModal = async (cls) => {
        setSelectedClassForEnroll(cls);
        setShowEnrollModal(true);
        setEnrollLoading(true);
        setSearchStudent(''); // Reset search
        
        try {
            // 🔥 Gọi API để lấy danh sách học viên THỰC TẾ đang có trong lớp này
            const res = await api.get(`/admin/classes/${cls.id}`);
            const classDetails = res.data.data || res.data;
            
            const enrolledIds = classDetails.enrollments?.map(e => e.student_id) || [];
            setSelectedStudentIds(enrolledIds);
        } catch (error) {
            toast.error('Lỗi lấy dữ liệu sĩ số cũ');
            setShowEnrollModal(false);
        } finally {
            setEnrollLoading(false);
        }
    };

    const toggleStudent = (studentId) => {
        if (selectedStudentIds.includes(studentId)) {
            setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
        } else {
            setSelectedStudentIds([...selectedStudentIds, studentId]);
        }
    };

    const onEnrollSubmit = async () => {
        const loadingToast = toast.loading('Đang đồng bộ danh sách...');
        setEnrollLoading(true);
        try {
            await api.post(`/admin/classes/${selectedClassForEnroll.id}/enroll`, {
                student_ids: selectedStudentIds
            });
            toast.success('Ghi danh thành công!', { id: loadingToast });
            setShowEnrollModal(false);
            fetchData(); 
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra', { id: loadingToast });
        } finally {
            setEnrollLoading(false);
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

    // --- LỌC DỮ LIỆU TÌM KIẾM ---
    const filteredClasses = classes.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.cohort?.course?.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredTeachers = teachers.filter(t => {
        const term = searchTeacher.toLowerCase();
        return (t.teacher?.name || t.name || '').toLowerCase().includes(term) ||
               (t.teacher?.teacher_code || '').toLowerCase().includes(term) ||
               (t.email || '').toLowerCase().includes(term);
    });

    const filteredStudents = students.filter(s => {
        const term = searchStudent.toLowerCase();
        return (s.student?.name || s.name || '').toLowerCase().includes(term) ||
               (s.student?.student_code || '').toLowerCase().includes(term) ||
               (s.email || '').toLowerCase().includes(term);
    });

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
                                            {cls.cohort?.name} {cls.cohort?.course?.code && <span className="text-blue-600 font-bold">({cls.cohort?.course?.code})</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {cls.teachers?.length > 0 ? cls.teachers.map(t => (
                                                <span key={t.id} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold border border-blue-100 flex items-center gap-1">
                                                     {t.teacher?.name || t.name || t.email}
                                                </span>
                                            )) : <span className="text-slate-400 italic text-xs">Chưa phân công</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-bold  text-base">{cls.enrollments_count || 0}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEnrollModal(cls)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100" title="Ghi danh học viên">
                                                <UserCheck className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleViewDetails(cls.id)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100" title="Xem chi tiết">
                                                <Eye className="w-5 h-5" />
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
                            {filteredClasses.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-slate-500 font-medium">Không tìm thấy lớp học nào.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

           
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600"/> 
                                {editingId ? 'Cập nhật Lớp học' : 'Thêm Lớp học mới'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
                            <div className="p-6 overflow-y-auto space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Thuộc Đợt tuyển sinh <span className="text-red-500">*</span></label>
                                        <select {...register('cohort_id', { required: true })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium bg-white">
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

                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col h-72">
                                    <label className="block text-sm font-bold text-black mb-3 flex items-center gap-2">
                                         Phân công Giảng viên phụ trách
                                    </label>
                                    <div className="relative mb-3">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input 
                                            type="text" 
                                            placeholder="Tìm kiếm giảng viên..." 
                                            value={searchTeacher}
                                            onChange={(e) => setSearchTeacher(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500 text-sm bg-white" 
                                        />
                                    </div>
                                    <div className="grid  grid-rows-2 gap-3 overflow-y-auto pr-1 flex-1">
                                        {filteredTeachers.map(t => (
                                            <label key={t.id} className="flex items-start gap-3 p-3 bg-white border      rounded-xl cursor-pointer hover:border-blue-300 transition-colors">
                                                <input 
                                                    type="checkbox" 
                                                    value={t.id} 
                                                    {...register('teacher_ids')}
                                                    className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-bold text-slate-700 text-sm leading-tight">
                                                        {t.teacher?.name || t.name || t.email}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1 font-medium">
                                                        Mã GV: {t.teacher?.teacher_code || 'N/A'}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                        {filteredTeachers.length === 0 && (
                                            <div className="col-span-2 text-center text-slate-500 py-4 text-sm font-medium">Không tìm thấy giảng viên.</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 flex gap-3 border-t border-slate-100 bg-white mt-auto">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">Hủy</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-md shadow-blue-600/20">Lưu dữ liệu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

           
            {showEnrollModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center ">
                            <div>
                                <h3 className="font-bold text-lg  flex items-center gap-2">
                                    <UserCheck className="w-5 h-5"/> Ghi danh Sinh viên
                                </h3>
                                <p className="text-xm font-medium  mt-1">Lớp: {selectedClassForEnroll?.name}</p>
                            </div>
                            <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input 
                                    type="text" 
                                    placeholder="Tìm theo Mã SV, Tên hoặc Email..." 
                                    value={searchStudent}
                                    onChange={(e) => setSearchStudent(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-white shadow-sm text-sm font-medium" 
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
                            {enrollLoading ? (
                                <div className="p-10 flex justify-center flex-col items-center gap-3">
                                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                    <span className="text-sm font-medium text-slate-500">Đang tải danh sách...</span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredStudents.length === 0 ? (
                                        <div className="text-center text-slate-500 py-10 font-medium text-sm">Không tìm thấy sinh viên nào.</div>
                                    ) : (
                                        filteredStudents.map(student => {
                                            const isSelected = selectedStudentIds.includes(student.id);
                                            return (
                                                <label 
                                                    key={student.id} 
                                                    className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition border
                                                        ${isSelected ? '' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-emerald-200'}`}
                                                >
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isSelected}
                                                        onChange={() => toggleStudent(student.id)}
                                                        className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300 cursor-pointer" 
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-bold text-slate-800 text-sm">
                                                            {student.student?.name || student.name || 'Chưa cập nhật tên'} 
                                                            <span className="text-slate-500 font-medium text-xs ml-2">
                                                                (MSSV: {student.student?.student_code || 'Chưa có'})
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-0.5">{student.email}</div>
                                                    </div>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-between items-center mt-auto">
                            <div className="text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                Đã chọn: <strong className="text-emerald-600 text-lg mx-1">{selectedStudentIds.length}</strong> Sinh viên
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowEnrollModal(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition">Hủy</button>
                                <button 
                                    onClick={onEnrollSubmit} 
                                    disabled={enrollLoading} 
                                    className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20 disabled:opacity-70 flex items-center gap-2"
                                >
                                    {enrollLoading && <Loader2 className="w-4 h-4 animate-spin"/>} Xác nhận Ghi danh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            
            {showDetailsModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
                            <div>
                                <h3 className="font-bold text-xl  flex items-center gap-2">
                                    Lớp: {selectedClassDetails?.name || 'Đang tải...'}
                                </h3>
                            </div>
                            <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-lg shadow-sm border border-slate-200"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            {loadingDetails ? (
                                <div className="py-20 flex justify-center flex-col items-center gap-3">
                                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                                    <span className="text-slate-500 font-medium">Đang tải dữ liệu lớp học...</span>
                                </div>
                            ) : selectedClassDetails ? (
                                <div className="space-y-6">
                                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                        <h4 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Thông tin Khóa học & Tuyển sinh</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-slate-500 text-xs font-semibold">Chương trình đào tạo</span>
                                                <span className="font-bold text-slate-800">
                                                    {selectedClassDetails.cohort?.course?.title} 
                                                    {selectedClassDetails.cohort?.course?.code && (
                                                        <span className="text-blue-600"> ({selectedClassDetails.cohort?.course?.code})</span>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-slate-500 text-xs font-semibold">Đợt tuyển sinh</span>
                                                <span className="font-bold text-slate-800">{selectedClassDetails.cohort?.name}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-slate-500 text-xs font-semibold">Thời gian học</span>
                                                <span className="font-bold text-slate-800">
                                                    {selectedClassDetails.start_date ? selectedClassDetails.start_date : 'Chưa cập nhật'} 
                                                    {selectedClassDetails.end_date ? ` đến ${selectedClassDetails.end_date}` : ''}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-slate-500 text-xs font-semibold">Tổng sĩ số hiện tại</span>
                                                <span className="font-bold  text-lg">{selectedClassDetails.enrollments?.length || 0} học viên</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                                            <UserCircle className="w-5 h-5 text-slate-400" /> Danh sách sinh viên
                                        </h4>
                                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-4 py-3 w-16 text-center">STT</th>
                                                        <th className="px-4 py-3">Mã số sinh viên</th>
                                                        <th className="px-4 py-3">Họ và tên</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {selectedClassDetails.enrollments && selectedClassDetails.enrollments.length > 0 ? (
                                                        selectedClassDetails.enrollments.map((enrollment, index) => (
                                                            <tr key={index} className="hover:bg-slate-50 transition-colors">
                                                                <td className="px-4 py-3 text-center font-medium text-slate-700">{index + 1}</td>
                                                                <td className="px-4 py-3 font-bold text-slate-700">{enrollment.student?.student_code || 'N/A'}</td>
                                                                <td className="px-4 py-3 font-bold text-slate-700">{enrollment.student?.name || 'Chưa cập nhật'}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="3" className="px-4 py-8 text-center text-slate-500 font-medium bg-slate-50/50">
                                                                Chưa có sinh viên nào được ghi danh vào lớp này.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-10 text-center text-red-500 font-medium">Không tải được dữ liệu.</div>
                            )}
                        </div>
                        
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button onClick={() => setShowDetailsModal(false)} className="bg-white border border-slate-300 text-slate-700 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition shadow-sm">
                                Đóng lại
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}