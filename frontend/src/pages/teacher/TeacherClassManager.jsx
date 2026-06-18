import { useState, useEffect } from 'react';
import { Search, Loader2, Users, Calendar, CheckSquare, X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function TeacherClassManager() {
    const [classesList, setClassesList] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // States cho chức năng Gán Học Viên
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

    // Mở Modal Gán Học Viên
    const openEnrollModal = async (cls) => {
        setSelectedClass(cls);
        setShowEnrollModal(true);
        setEnrollLoading(true);
        
        try {
            // 1. Tải danh sách tất cả Sinh viên trong hệ thống
            const studentRes = await api.get('/teacher/students?role=student&is_active=1');
            const studentsData = studentRes.data.data || studentRes.data;
            setAllStudents(studentsData);

            // 2. Tải chi tiết Lớp học để biết ai đã được gán vào từ trước
            const classDetailRes = await api.get(`/teacher/classes/${cls.id}`);
            const currentEnrollments = classDetailRes.data.enrollments || [];
            
            // Trích xuất mảng ID sinh viên đã có trong lớp
            const enrolledIds = currentEnrollments.map(e => e.student_id);
            setSelectedStudentIds(enrolledIds);

        } catch (error) {
            toast.error('Lỗi tải danh sách sinh viên');
            setShowEnrollModal(false);
        } finally {
            setEnrollLoading(false);
        }
    };

    // Xử lý Check/Uncheck Sinh viên
    const toggleStudent = (studentId) => {
        if (selectedStudentIds.includes(studentId)) {
            setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
        } else {
            setSelectedStudentIds([...selectedStudentIds, studentId]);
        }
    };

    // Lưu danh sách ghi danh
    const handleSaveEnrollments = async () => {
        setEnrollLoading(true);
        try {
            await api.post(`/teacher/classes/${selectedClass.id}/enroll`, {
                student_ids: selectedStudentIds
            });
            toast.success('Đồng bộ danh sách Sinh viên thành công!');
            setShowEnrollModal(false);
            fetchClasses(); // Load lại để cập nhật sĩ số
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi đồng bộ danh sách');
        } finally {
            setEnrollLoading(false);
        }
    };

    // Lọc sinh viên theo ô tìm kiếm trong Modal
    const filteredStudents = allStudents.filter(s => {
        const name = s.student?.name?.toLowerCase() || '';
        const code = s.student?.student_code?.toLowerCase() || '';
        const email = s.email?.toLowerCase() || '';
        const q = searchStudent.toLowerCase();
        return name.includes(q) || code.includes(q) || email.includes(q);
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Lớp học phụ trách</h1>
                <p className="text-slate-500 mt-1">Quản lý sĩ số và danh sách sinh viên tham gia lớp học.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
                    ) : classesList.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">Bạn chưa được phân công lớp học nào.</div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Tên Lớp học</th>
                                    <th className="px-6 py-4">Môn / Khóa học</th>
                                    <th className="px-6 py-4">Thời gian</th>
                                    <th className="px-6 py-4 text-center">Sĩ số</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {classesList.map(cls => (
                                    <tr key={cls.id} className="hover:bg-slate-50/80">
                                        <td className="px-6 py-4 font-bold text-slate-800 text-base">{cls.name}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800">{cls.course?.subject?.name}</div>
                                            <div className="text-xs text-slate-500 mt-1">{cls.course?.title}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {cls.start_date || cls.end_date ? (
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    <span>{cls.start_date ? cls.start_date.substring(0, 10) : '?'}</span>
                                                    <span>→</span>
                                                    <span>{cls.end_date ? cls.end_date.substring(0, 10) : '?'}</span>
                                                </div>
                                            ) : <span className="text-slate-400 italic">Chưa xác định</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold">
                                                <Users className="w-4 h-4" /> {cls.enrollments_count || 0} SV
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => openEnrollModal(cls)} 
                                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition shadow-sm"
                                            >
                                                <CheckSquare className="w-4 h-4" /> Gán học viên
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* MODAL GÁN HỌC VIÊN */}
            {showEnrollModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Cập nhật danh sách Sinh viên</h3>
                                <p className="text-xs text-slate-500">Lớp: {selectedClass?.name}</p>
                            </div>
                            <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-red-500 transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-4 border-b border-slate-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input 
                                    type="text" 
                                    placeholder="Tìm theo Mã SV, Tên hoặc Email..." 
                                    value={searchStudent}
                                    onChange={(e) => setSearchStudent(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-slate-50" 
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            {enrollLoading ? (
                                <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
                            ) : (
                                <div className="space-y-1 p-2">
                                    {filteredStudents.length === 0 ? (
                                        <div className="text-center text-slate-500 py-10">Không tìm thấy sinh viên nào.</div>
                                    ) : (
                                        filteredStudents.map(student => {
                                            const isSelected = selectedStudentIds.includes(student.id);
                                            return (
                                                <label 
                                                    key={student.id} 
                                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition border
                                                        ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:bg-slate-50'}`}
                                                >
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isSelected}
                                                        onChange={() => toggleStudent(student.id)}
                                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" 
                                                    />
                                                    <div>
                                                        <div className="font-bold text-slate-800">
                                                            {student.student?.name || 'N/A'} <span className="text-slate-400 font-normal text-xs ml-2">({student.student?.student_code || 'Chưa có mã'})</span>
                                                        </div>
                                                        <div className="text-xs text-slate-500">{student.email}</div>
                                                    </div>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                            <div className="text-sm font-medium text-slate-600">
                                Đã chọn: <strong className="text-blue-600 text-lg">{selectedStudentIds.length}</strong> SV
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowEnrollModal(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition">Hủy</button>
                                <button 
                                    onClick={handleSaveEnrollments} 
                                    disabled={enrollLoading} 
                                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-70 flex items-center gap-2"
                                >
                                    {enrollLoading && <Loader2 className="w-4 h-4 animate-spin"/>} Lưu danh sách
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}