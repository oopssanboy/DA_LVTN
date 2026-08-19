import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loader2, BookOpen, Calendar, Users, Eye, X, GraduationCap, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyCourses() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);

    useEffect(() => {
        fetchMyClasses();
    }, []);

    const fetchMyClasses = async () => {
        try {
            const res = await api.get('/student/my-classes');
            setClasses(res.data.data || []);
        } catch (error) {
            toast.error('Lỗi tải danh sách khóa học');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (cls) => {
        setSelectedClass(cls);
        setShowModal(true);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-blue-600"/> Khóa học của tôi
                    </h1>
                    <p className="text-slate-500 mt-1">Danh sách các lớp học và khóa học bạn đang tham gia.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                </div>
            ) : classes.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-500 mb-4">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">Chưa tham gia khóa học nào</h3>
                    <p className="text-slate-500 mt-1">Bạn hiện tại chưa được xếp vào lớp học nào. Vui lòng liên hệ Phòng đào tạo.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <div key={cls.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                            <div className="p-6 bg-gradient-to-br from-blue-50 to-white border-b border-slate-100 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-center">
                                        <Layers className="w-6 h-6" />
                                    </div>
                                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                                        Đang học
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2">{cls.name}</h3>
                                <p className="text-sm text-slate-500 font-medium line-clamp-2">
                                    {cls.cohort?.course?.title || 'Chương trình đào tạo chưa cập nhật'}
                                </p>
                            </div>
                            
                            <div className="px-6 py-4 bg-white border-b border-slate-100 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium">
                                        {cls.start_date ? cls.start_date : 'Chưa có lịch'} 
                                        {cls.end_date ? ` ➔ ${cls.end_date}` : ''}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <GraduationCap className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium">Đợt: {cls.cohort?.name || 'N/A'}</span>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-slate-50">
                                <button 
                                    onClick={() => handleViewDetails(cls)}
                                    className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700 font-bold py-2.5 rounded-xl transition"
                                >
                                    <Eye className="w-4 h-4" /> Xem thông tin chi tiết
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

          
            {showModal && selectedClass && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-blue-50/50 shrink-0">
                            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                                <BookOpen className="w-6 h-6 text-blue-600" /> Chi tiết lớp: {selectedClass.name}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 bg-white rounded-xl shadow-sm border border-slate-200 transition">
                                <X className="w-5 h-5"/>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 space-y-6">
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                <h4 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 text-slate-700">Thông tin Chương trình</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-slate-500 text-xs font-semibold">Tên Khóa học</span>
                                        <span className="font-bold text-slate-800">{selectedClass.cohort?.course?.title || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-slate-500 text-xs font-semibold">Đợt tuyển sinh</span>
                                        <span className="font-bold text-slate-800">{selectedClass.cohort?.name || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-slate-500 text-xs font-semibold">Ngày bắt đầu</span>
                                        <span className="font-bold text-slate-800">{selectedClass.start_date || 'Chưa cập nhật'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-slate-500 text-xs font-semibold">Ngày kết thúc</span>
                                        <span className="font-bold text-slate-800">{selectedClass.end_date || 'Chưa cập nhật'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                <h4 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 text-slate-700 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-emerald-500" /> Danh sách Giảng viên bộ môn
                                </h4>
                                <div className="overflow-hidden border border-slate-100 rounded-xl">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                                            <tr>
                                                <th className="px-4 py-3 w-12 text-center">STT</th>
                                                <th className="px-4 py-3">Môn học phụ trách</th>
                                                <th className="px-4 py-3">Giảng viên</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedClass.teachers && selectedClass.teachers.length > 0 ? (
                                                selectedClass.teachers.map((teacher, index) => (
                                                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3 text-center font-medium text-slate-500">{index + 1}</td>
                                                        <td className="px-4 py-3 font-bold text-emerald-600">{teacher.subject_name || 'Chưa cập nhật'}</td>
                                                        <td className="px-4 py-3 font-bold text-blue-700">{teacher.teacher?.name || teacher.name || teacher.email}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="3" className="px-4 py-8 text-center text-slate-500 italic">Chưa có phân công giảng dạy cho lớp này.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 border-t border-slate-100 bg-white flex justify-end shrink-0">
                            <button onClick={() => setShowModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold transition shadow-sm">
                                Đóng lại
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}