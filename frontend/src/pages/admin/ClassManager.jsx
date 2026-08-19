import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { Search, Plus, Edit, Trash2, Loader2, X, Users, UserCheck, Eye, PlusCircle, BookOpen, UserCircle, BookOpenCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function ClassManager() {
    const [classes, setClasses] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
  
    const [cohorts, setCohorts] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [allTeachers, setAllTeachers] = useState([]);
    
    
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { register, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: { teacher_assignments: [] }
    });
    
    const teacherAssignments = watch('teacher_assignments') || [];
    const selectedCohortId = watch('cohort_id');

    const availableSubjects = cohorts.find(c => c.id == selectedCohortId)?.course?.subjects || [];

   
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [selectedClassForEnroll, setSelectedClassForEnroll] = useState(null);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [students, setStudents] = useState([]);
    const [studentPagination, setStudentPagination] = useState({});
    const [loadingStudents, setLoadingStudents] = useState(false);
    const studentListRef = useRef(null);


    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedClassDetails, setSelectedClassDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

  
    const [activeRowIndex, setActiveRowIndex] = useState(null);
    
    
    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [teacherSearch, setTeacherSearch] = useState('');
    const [pagedTeachers, setPagedTeachers] = useState([]);
    const [teacherPagination, setTeacherPagination] = useState({});
    const [loadingPagedTeachers, setLoadingPagedTeachers] = useState(false);

   
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [subjectSearch, setSubjectSearch] = useState('');

    const DEBOUNCE_DELAY = 100;

    const fetchClasses = useCallback(async (url = '/admin/classes', params = {}) => {
        setLoading(true);
        try {
            const res = await api.get(url, { params });
             
            setClasses(res.data.data || res.data);
            setPagination({
                links: res.data.links || res.data.meta?.links,
                meta: res.data.meta || res.data
            });
        } catch (error) {
            toast.error('Lỗi tải danh sách lớp học');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStudents = useCallback(async (url = '/admin/users', params = {}) => {
        setLoadingStudents(true);
        try {
            const res = await api.get(url, { 
                params: { role: 'student', is_active: 1, per_page: 10, ...params } 
            });
            setStudents(res.data.data || res.data);
            setStudentPagination({
                links: res.data.links || res.data.meta?.links,
                meta: res.data.meta || res.data
            });
        } catch (error) {
            toast.error('Lỗi tải danh sách học viên');
        } finally {
            setLoadingStudents(false);
        }
    }, []);

    const fetchPagedTeachers = useCallback(async (url = '/admin/users', params = {}) => {
        setLoadingPagedTeachers(true);
        try {
            const res = await api.get(url, { 
                params: { role: 'teacher', is_active: 1, per_page: 10, ...params } 
            });
            setPagedTeachers(res.data.data || res.data);
            setTeacherPagination({
                links: res.data.links || res.data.meta?.links,
                meta: res.data.meta || res.data
            });
        } catch (error) {
            toast.error('Lỗi tải danh sách giảng viên');
        } finally {
            setLoadingPagedTeachers(false);
        }
    }, []);

    useEffect(() => {
        const fetchSupportData = async () => {
            try {
                const [cohortsRes, subjectsRes, teachersRes] = await Promise.all([
                    api.get('/admin/cohorts?per_page=100'),
                    api.get('/admin/subjects?per_page=100'),
                    api.get('/admin/users?role=teacher&is_active=1&per_page=100')
                ]);
                setCohorts(cohortsRes.data.data || cohortsRes.data);
                setSubjects(subjectsRes.data.data || subjectsRes.data);
                setAllTeachers(teachersRes.data.data || teachersRes.data);
            } catch (error) {
                toast.error('Lỗi tải dữ liệu hỗ trợ');
            }
        };
        fetchSupportData();
        fetchClasses();
    }, [fetchClasses]);

   
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchClasses('/admin/classes', { search: searchQuery });
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchClasses]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (showEnrollModal) fetchStudents('/admin/users', { search: studentSearch });
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(timer);
    }, [studentSearch, showEnrollModal, fetchStudents]);

    
    useEffect(() => {
        const timer = setTimeout(() => {
            if (showTeacherModal) fetchPagedTeachers('/admin/users', { search: teacherSearch });
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(timer);
    }, [teacherSearch, showTeacherModal, fetchPagedTeachers]);



    const openModal = (cls = null) => {
        if (cls) {
            setEditingId(cls.id);
            reset({
                cohort_id: cls.cohort_id,
                name: cls.name,
                start_date: cls.start_date || '',
                end_date: cls.end_date || '',
                teacher_assignments: cls.teachers ? cls.teachers.map(t => {
              
                    const subjectName = subjects.find(s => s.id == t.pivot?.subject_id)?.name || 'Chưa cập nhật';
                    return {
                        teacher_id: t.id.toString(),
                        teacher_name: t.teacher?.name || t.name || t.email,
                        subject_id: t.pivot?.subject_id?.toString() || '',
                        subject_name: subjectName
                    };
                }) : []
            });
        } else {
            setEditingId(null);
            reset({ cohort_id: '', name: '', start_date: '', end_date: '', teacher_assignments: [] });
        }
        setShowModal(true);
    };

  
    useEffect(() => {
        if (showModal && !editingId) {
            setValue('teacher_assignments', []);
        }
    }, [selectedCohortId]);

    const addAssignmentRow = () => {
        setValue('teacher_assignments', [...teacherAssignments, { teacher_id: '', teacher_name: '', subject_id: '', subject_name: '' }]);
    };

    const removeAssignmentRow = (index) => {
        setValue('teacher_assignments', teacherAssignments.filter((_, i) => i !== index));
    };

    const openTeacherSelector = (index) => {
        setActiveRowIndex(index);
        setTeacherSearch('');
        setShowTeacherModal(true);
        fetchPagedTeachers('/admin/users', { search: '' });
    };

    const openSubjectSelector = (index) => {
        if (!selectedCohortId) {
            toast.error('Vui lòng chọn Đợt tuyển sinh trước khi chọn môn học!');
            return;
        }
        setActiveRowIndex(index);
        setSubjectSearch('');
        setShowSubjectModal(true);
    };

    const handleSelectTeacher = (teacher) => {
        const newArr = [...teacherAssignments];
        newArr[activeRowIndex] = {
            ...newArr[activeRowIndex],
            teacher_id: teacher.id.toString(),
            teacher_name: teacher.teacher?.name || teacher.name || teacher.email
        };
        setValue('teacher_assignments', newArr);
        setShowTeacherModal(false);
    };

    const handleSelectSubject = (subject) => {
        const newArr = [...teacherAssignments];
        newArr[activeRowIndex] = {
            ...newArr[activeRowIndex],
            subject_id: subject.id.toString(),
            subject_name: subject.name
        };
        setValue('teacher_assignments', newArr);
        setShowSubjectModal(false);
    };

    const filteredSubjects = availableSubjects.filter(s => 
        s.name.toLowerCase().includes(subjectSearch.toLowerCase()) || 
        s.code.toLowerCase().includes(subjectSearch.toLowerCase())
    );

    const onSubmit = async (data) => {
        const invalidAssignment = data.teacher_assignments.find(a => !a.teacher_id || !a.subject_id);
        if (invalidAssignment) {
            return toast.error("Vui lòng chọn đầy đủ Giảng viên và Môn học cho mọi dòng phân công!");
        }

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
            fetchClasses('/admin/classes', { search: searchQuery });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra', { id: loadingToast });
        }
    };

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
                fetchClasses('/admin/classes', { search: searchQuery });
            } catch (error) {
                toast.error('Lỗi khi xóa lớp học');
            }
        }
    };

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

    const openEnrollModal = async (cls) => {
        setSelectedClassForEnroll(cls);
        setShowEnrollModal(true);
        setStudentSearch('');
        setSelectedStudentIds([]);

        await fetchStudents('/admin/users', { search: '' });

        try {
            const res = await api.get(`/admin/classes/${cls.id}`);
            const classDetails = res.data.data || res.data;
            const enrolledIds = classDetails.enrollments?.map(e => Number(e.student_id)) || [];
            setSelectedStudentIds(enrolledIds);
        } catch (error) {
            toast.error('Lỗi lấy dữ liệu sĩ số cũ');
        }
    };

    const toggleStudent = (studentId) => {
        const id = Number(studentId);
        if (selectedStudentIds.includes(id)) {
            setSelectedStudentIds(selectedStudentIds.filter(item => item !== id));
        } else {
            setSelectedStudentIds([...selectedStudentIds, id]);
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
            fetchClasses('/admin/classes', { search: searchQuery });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra', { id: loadingToast });
        } finally {
            setEnrollLoading(false);
        }
    };

    const renderTeacherAssignments = (teachersList) => {
        if (!teachersList || teachersList.length === 0) return <span className="text-slate-400 italic text-xs">Chưa phân công</span>;
        
        return (
            <div className="flex flex-col gap-1.5">
                {teachersList.map((t, idx) => {
                    const subjectName = subjects.find(s => s.id == t.pivot?.subject_id)?.name || 'Chưa cập nhật';
                    return (
                        <span key={idx} className="px-2.5 py-1 rounded-md text-xs font-bold border border-blue-100 flex items-center gap-1 w-fit bg-blue-50/50 text-slate-700">
                            <span className="text-emerald-600">{subjectName}</span>
                            <span className="text-slate-400 font-normal mx-0.5">do</span>
                            <span className="text-blue-700">{t.teacher?.name || t.name || t.email}</span>
                        </span>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Lớp học và Phân công</h1>
                    <p className="text-slate-500 mt-1">Quản lý lớp học, sĩ số và phân công Giảng viên theo môn học.</p>
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
                            type="text" 
                            placeholder="Tìm tên lớp, khóa học, giảng viên..." 
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
                                    <th className="px-6 py-4">Lớp học</th>
                                    <th className="px-6 py-4 w-[40%]">Thời gian học</th>
                                    <th className="px-6 py-4 text-center">Sĩ số</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {classes.map((cls) => (
                                    <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 align-top">
                                            <div className="font-bold text-slate-800 text-base">{cls.name}</div>
                                            <div className="text-slate-500 font-medium text-xs mt-1">
                                                {cls.cohort?.name} {cls.cohort?.course?.code && <span className="text-blue-600 font-bold">({cls.cohort?.course?.code})</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-center">
                                            {cls.start_date ? cls.start_date : 'Chưa cập nhật'} 
                                            {cls.end_date ? ` đến ${cls.end_date}` : ''}
                                        </td>
                                        <td className="px-6 py-4 text-center align-top">
                                            <span className="font-bold text-base">{cls.enrollments_count || 0}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right align-top">
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
                                {classes.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center py-8 text-slate-500 font-medium">Không tìm thấy lớp học nào.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                    
                        {pagination.links && pagination.links.length > 3 && (
                            <div className="p-4 border-t border-slate-100 flex flex-wrap justify-center gap-1">
                                {pagination.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() => fetchClasses(link.url)}
                                        className={`px-4 py-2 text-sm font-medium rounded-xl transition border
                                            ${link.active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}
                                            ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                        {pagination.meta && (
                            <div className="px-6 py-3 text-sm text-slate-500 border-t border-slate-100 bg-slate-50">
                                Hiển thị {classes.length} trên tổng số {pagination.meta.total || classes.length} lớp học
                            </div>
                        )}
                    </>
                )}
            </div>

          
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600"/> 
                                {editingId ? 'Cập nhật Lớp học' : 'Thêm Lớp học mới'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
                            <div className="p-6 overflow-y-auto flex-1 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Thuộc Đợt tuyển sinh <span className="text-red-500">*</span></label>
                                        <select {...register('cohort_id', { required: true })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium bg-white">
                                            <option value="">-- Chọn Đợt tuyển sinh --</option>
                                            {cohorts.map(c => (
                                                <option key={c.id} value={c.id}>{c.name} ({c.course?.title})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Tên Lớp học <span className="text-red-500">*</span></label>
                                        <input type="text" {...register('name', { required: true })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium" placeholder="VD: D22CQCN01-N" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Ngày bắt đầu</label>
                                        <input type="date" {...register('start_date')} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Ngày kết thúc</label>
                                        <input type="date" {...register('end_date')} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium" />
                                    </div>
                                </div>

                       
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-blue-600"/> Phân công Giảng dạy
                                        </label>
                                        <button 
                                            type="button" 
                                            onClick={addAssignmentRow}
                                            className="flex items-center gap-1 text-sm bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition font-bold"
                                        >
                                            <PlusCircle size={16}/> Thêm phân công
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {teacherAssignments.length === 0 ? (
                                            <div className="text-center text-slate-500 py-6 bg-white rounded-xl border border-dashed border-slate-300 text-sm font-medium">
                                                Chưa có dữ liệu phân công giảng dạy.
                                            </div>
                                        ) : (
                                            teacherAssignments.map((assignment, index) => (
                                                <div key={index} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm transition hover:border-blue-300">
                                                    <div className="flex-1">
                                                        <button 
                                                            type="button"
                                                            onClick={() => openSubjectSelector(index)}
                                                            className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm font-medium transition
                                                                ${assignment.subject_id ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                                        >
                                                            <span className="truncate">{assignment.subject_name || '-- Chọn Môn học --'}</span>
                                                            <BookOpenCheck size={16} className={assignment.subject_id ? "text-emerald-500" : "text-slate-400"} />
                                                        </button>
                                                    </div>
                                                    <div className="text-slate-400 font-medium text-xs">do</div>
                                                    <div className="flex-1">
                                                        <button 
                                                            type="button"
                                                            onClick={() => openTeacherSelector(index)}
                                                            className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm font-medium transition
                                                                ${assignment.teacher_id ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                                        >
                                                            <span className="truncate">{assignment.teacher_name || '-- Chọn Giảng viên --'}</span>
                                                            <UserCircle size={16} className={assignment.teacher_id ? "text-blue-500" : "text-slate-400"} />
                                                        </button>
                                                    </div>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeAssignmentRow(index)}
                                                        className="text-red-500 p-2 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition shrink-0"
                                                    >
                                                        <Trash2 size={18}/>
                                                    </button>
                                                </div>
                                            ))
                                        )}
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

        
            {showTeacherModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                        <div className="px-5 py-3 border-b flex justify-between items-center bg-blue-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <UserCircle className="w-5 h-5 text-blue-600"/> Chọn Giảng viên
                            </h3>
                            <button onClick={() => setShowTeacherModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="p-4 border-b bg-white">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên hoặc mã GV..."
                                    value={teacherSearch}
                                    onChange={(e) => setTeacherSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-slate-50 text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                            {loadingPagedTeachers ? (
                                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                            ) : pagedTeachers.length > 0 ? (
                                <div className="space-y-2">
                                    {pagedTeachers.map(t => (
                                        <div key={t.id} onClick={() => handleSelectTeacher(t)} className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition flex justify-between items-center group">
                                            <div>
                                                <div className="font-bold text-slate-700 text-sm group-hover:text-blue-700">{t.teacher?.name || t.name || t.email}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">Mã GV: {t.teacher?.teacher_code || 'N/A'}</div>
                                            </div>
                                            <PlusCircle className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 py-10 text-sm font-medium">Không tìm thấy giảng viên.</div>
                            )}
                        </div>
                     
                        {teacherPagination.links && teacherPagination.links.length > 3 && (
                            <div className="px-4 py-3 border-t bg-white flex justify-center gap-1 flex-wrap">
                                {teacherPagination.links.map((link, idx) => (
                                    <button
                                        key={idx} onClick={() => fetchPagedTeachers(link.url, { search: teacherSearch })} disabled={!link.url}
                                        className={`px-3 py-1 text-xs font-medium rounded-lg border transition ${link.active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50'} ${!link.url ? 'opacity-50' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

        
            {showSubjectModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                        <div className="px-5 py-3 border-b flex justify-between items-center bg-emerald-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <BookOpenCheck className="w-5 h-5 text-emerald-600"/> Chọn Môn học
                            </h3>
                            <button onClick={() => setShowSubjectModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="p-4 border-b bg-white">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên môn hoặc mã môn..."
                                    value={subjectSearch}
                                    onChange={(e) => setSubjectSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-slate-50 text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                            {filteredSubjects.length > 0 ? (
                                <div className="space-y-2">
                                    {filteredSubjects.map(s => (
                                        <div key={s.id} onClick={() => handleSelectSubject(s)} className="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer transition flex justify-between items-center group">
                                            <div>
                                                <div className="font-bold text-slate-700 text-sm group-hover:text-emerald-700">{s.name}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">Mã môn: <span className="font-semibold">{s.code}</span></div>
                                            </div>
                                            <PlusCircle className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 py-10 text-sm font-medium">Không có môn học nào hợp lệ trong đợt này.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

           
            {showEnrollModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50 shrink-0">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    <UserCheck className="w-5 h-5 text-emerald-600"/> Ghi danh Sinh viên
                                </h3>
                                <p className="text-sm font-medium text-slate-600 mt-1">Lớp: {selectedClassForEnroll?.name}</p>
                            </div>
                            <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-lg shadow-sm border border-slate-200"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input 
                                    type="text" 
                                    placeholder="Tìm theo Mã SV, Tên hoặc Email..." 
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-white shadow-sm text-sm font-medium" 
                                />
                            </div>
                        </div>

                        <div ref={studentListRef} className="flex-1 overflow-y-auto p-4 bg-slate-50/30 min-h-0">
                            {loadingStudents ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                                </div>
                            ) : students.length > 0 ? (
                                <div className="space-y-2">
                                    {students.map(student => {
                                        const isSelected = selectedStudentIds.includes(Number(student.id));
                                        return (
                                            <label 
                                                key={student.id} 
                                                className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition border
                                                    ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-emerald-200'}`}
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
                                    })}
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 py-10 font-medium text-sm">Không tìm thấy sinh viên nào.</div>
                            )}
                        </div>

                        {studentPagination.links && studentPagination.links.length > 3 && (
                            <div className="px-4 py-2 border-t border-slate-100 bg-white flex justify-center gap-1 shrink-0">
                                {studentPagination.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        disabled={!link.url}
                                        onClick={() => fetchStudents(link.url, { search: studentSearch })}
                                        className={`px-3 py-1 text-xs font-medium rounded-lg transition border
                                            ${link.active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}
                                            ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
                            <div className="text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                Đã chọn: <strong className="text-emerald-600 text-lg mx-1">{selectedStudentIds.length}</strong> Sinh viên
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowEnrollModal(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition">Hủy</button>
                                <button 
                                    type="button"
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
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50 shrink-0">
                            <div>
                                <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
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
                                                <span className="font-bold text-lg">{selectedClassDetails.enrollments?.length || 0} học viên</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                                            <Users className="w-5 h-5 text-slate-400" /> Phân công Giảng dạy
                                        </h4>
                                        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-4 py-3 w-16 text-center">STT</th>
                                                        <th className="px-4 py-3">Môn phụ trách</th>
                                                        <th className="px-4 py-3">Họ và tên</th>
                                                        
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {selectedClassDetails.teachers && selectedClassDetails.teachers.length > 0 ? (
                                                        selectedClassDetails.teachers.map((teacher, index) => {
                                                            const subjectName = subjects.find(s => s.id == teacher.pivot.subject_id)?.name || 'N/A';
                                                            return (
                                                                <tr key={index} className="hover:bg-slate-50 transition-colors">
                                                                    <td className="px-4 py-3 text-center font-medium text-slate-700">{index + 1}</td>
                                                                    <td className="px-4 py-3 font-bold text-blue-600">{subjectName}</td>
                                                                    <td className="px-4 py-3 font-bold text-slate-700">{teacher.teacher?.name || teacher.name || teacher.email}</td>
                                                                    
                                                                </tr>
                                                            );
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="3" className="px-4 py-8 text-center text-slate-500 font-medium bg-slate-50/50">
                                                                Chưa có giảng viên nào được phân công.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                   
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                                            <UserCheck className="w-5 h-5 text-slate-400" /> Danh sách học viên
                                        </h4>
                                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-4 py-3 w-16 text-center">STT</th>
                                                        <th className="px-4 py-3">Mã số học viên</th>
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
                        
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
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