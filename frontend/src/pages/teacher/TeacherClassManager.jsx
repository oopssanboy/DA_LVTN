import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Loader2, Eye, X, Users, GraduationCap, Layers, Calendar, UserCircle, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeacherClassManager() {
    const [classesList, setClassesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
   
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedClassDetails, setSelectedClassDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

   
    const [showEnrollModal, setShowEnrollModal] = useState(false); 
    const [selectedClass, setSelectedClass] = useState(null); 
    const [allStudents, setAllStudents] = useState([]); 
    const [selectedStudentIds, setSelectedStudentIds] = useState([]); 
    const [searchStudent, setSearchStudent] = useState(''); 
    const [enrollLoading, setEnrollLoading] = useState(false); 

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const res = await api.get('/teacher/classes');
            setClassesList(res.data.data || res.data);
        } catch (error) {
            toast.error('Lỗi tải danh sách lớp học');
        } finally {
            setLoading(false);
        }
    };

 
    const handleViewDetails = async (id) => {
        setShowDetailsModal(true);
        setLoadingDetails(true);
        try {
            const res = await api.get(`/teacher/classes/${id}`);
            setSelectedClassDetails(res.data.data || res.data);
        } catch (error) {
            toast.error('Lỗi tải thông tin chi tiết lớp học');
            setShowDetailsModal(false);
        } finally {
            setLoadingDetails(false);
        }
    };

  
    const openEnrollModal = async (cls) => { 
        setSelectedClass(cls); 
        setShowEnrollModal(true); 
        setEnrollLoading(true); 
        
        try { 
    
            const studentRes = await api.get('/teacher/users?role=student&is_active=1&per_page=100'); 
            const studentsData = studentRes.data.data || studentRes.data; 
            setAllStudents(studentsData); 

     
            const classDetailRes = await api.get(`/teacher/classes/${cls.id}`); 
            const currentEnrollments = classDetailRes.data.enrollments || classDetailRes.data.data?.enrollments || []; 
            
            const enrolledIds = currentEnrollments.map(e => e.student_id); 
            setSelectedStudentIds(enrolledIds); 

        } catch (error) { 
            toast.error('Lỗi tải danh sách sinh viên'); 
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

    const handleSaveEnrollments = async () => { 
        setEnrollLoading(true); 
        try { 
            await api.post(`/teacher/classes/${selectedClass.id}/enroll`, { 
                student_ids: selectedStudentIds 
            }); 
            toast.success('Đồng bộ danh sách Sinh viên thành công!'); 
            setShowEnrollModal(false); 
            fetchClasses(); 
        } catch (error) { 
            toast.error(error.response?.data?.message || 'Lỗi khi đồng bộ danh sách'); 
        } finally { 
            setEnrollLoading(false); 
        } 
    }; 

    const filteredClasses = classesList.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.cohort?.course?.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredStudents = allStudents.filter(s => { 
        const name = s.student?.name?.toLowerCase() || ''; 
        const code = s.student?.student_code?.toLowerCase() || ''; 
        const email = s.email?.toLowerCase() || ''; 
        const q = searchStudent.toLowerCase(); 
        return name.includes(q) || code.includes(q) || email.includes(q); 
    }); 

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Lớp học của tôi</h1>
                    <p className="text-slate-500 mt-1">Danh sách các lớp học bạn được phân công giảng dạy và quản lý học viên.</p>
                </div>
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
                                <th className="px-6 py-4">Tên Lớp học</th>
                                <th className="px-6 py-4">Thuộc Chương trình / Đợt</th>
                                <th className="px-6 py-4 text-center">Sĩ số</th>
                                <th className="px-6 py-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredClasses.length > 0 ? filteredClasses.map((cls) => (
                                <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800 text-base">{cls.name}</div>
                                        {cls.start_date && (
                                            <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                                                {cls.start_date} {cls.end_date ? ` đến ${cls.end_date}` : ''}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-slate-500 font-medium text-xs flex items-center gap-1">
                                                 Khóa: {cls.cohort?.course?.title || 'N/A'} ({cls.cohort?.course?.code})
                                            </span>
                                            <span className="text-slate-500 font-medium text-xs flex items-center gap-1">
                                                {cls.cohort?.name || 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-bold  text-base px-3 py-1 rounded-lg ">
                                            {cls.enrollments_count || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button 
                                                onClick={() => openEnrollModal(cls)} 
                                                className="px-3 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 font-bold rounded-xl transition-colors inline-flex items-center gap-2 border border-emerald-100 shadow-sm"
                                                title="Ghi danh học viên"
                                            >
                                                <UserCheck className="w-4 h-4" /> Gán SV
                                            </button>
                                            <button 
                                                onClick={() => handleViewDetails(cls.id)} 
                                                className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-bold rounded-xl transition-colors inline-flex items-center gap-2 border border-blue-100 shadow-sm"
                                                title="Xem thông tin chi tiết lớp học"
                                            >
                                                <Eye className="w-4 h-4" /> Chi tiết
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-slate-500 font-medium">Không tìm thấy lớp học nào.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

    
            {showEnrollModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
                            <div>
                                <h3 className="text-lg font-bold  flex items-center gap-2">
                                    Gán danh sách Sinh viên
                                </h3>
                                <p className="text-xm font-medium  mt-1">Lớp: {selectedClass?.name}</p>
                            </div>
                            <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-lg transition shadow-sm border border-slate-200">
                                <X className="w-5 h-5" />
                            </button>
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
                                <div className="p-10 flex justify-center flex-col items-center gap-2">
                                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                                    <span className="text-sm font-medium text-slate-500">Đang tải danh sách...</span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredStudents.length === 0 ? (
                                        <div className="text-center text-slate-500 py-10 font-medium text-sm">Không tìm thấy sinh viên nào trong hệ thống.</div>
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

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                            <div className="text-sm font-medium text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                Đã chọn: <strong className="text-lg mx-1">{selectedStudentIds.length}</strong> Sinh viên
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowEnrollModal(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition">Hủy</button>
                                <button 
                                    onClick={handleSaveEnrollments} 
                                    disabled={enrollLoading} 
                                    className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-70 flex items-center gap-2 shadow-sm"
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