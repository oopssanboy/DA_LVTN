import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Loader2, Users, Calendar } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function ClassManager() {
    const [classesList, setClassesList] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({
        id: null, course_id: '', name: '', start_date: '', end_date: ''
    });

    useEffect(() => {
        fetchClasses();
        fetchCourses();
    }, []);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/classes');
            setClassesList(res.data.data || res.data);
        } catch (error) {
            toast.error('Lỗi tải danh sách lớp học');
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await api.get('/admin/courses');
            setCourses(res.data.data || res.data);
        } catch (error) {
            toast.error('Lỗi tải danh mục Khóa học');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Xóa lớp học?',
            text: "Danh sách sinh viên trong lớp và dữ liệu thi sẽ bị ảnh hưởng!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Xóa lớp học'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/admin/classes/${id}`);
                toast.success('Xóa thành công');
                fetchClasses();
            } catch (error) {
                toast.error('Lỗi khi xóa lớp học');
            }
        }
    };

    const openModal = (cls = null) => {
        if (cls) {
            setIsEdit(true);
            setFormData({
                id: cls.id,
                course_id: cls.course_id,
                name: cls.name,
                // Cắt lấy YYYY-MM-DD từ chuỗi datetime của backend
                start_date: cls.start_date ? cls.start_date.substring(0, 10) : '',
                end_date: cls.end_date ? cls.end_date.substring(0, 10) : ''
            });
        } else {
            setIsEdit(false);
            setFormData({ id: null, course_id: '', name: '', start_date: '', end_date: '' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (isEdit) {
                await api.put(`/admin/classes/${formData.id}`, formData);
                toast.success('Cập nhật lớp học thành công');
            } else {
                await api.post('/admin/classes', formData);
                toast.success('Thêm lớp học thành công');
            }
            setShowModal(false);
            fetchClasses();
        } catch (error) {
            const errs = error.response?.data?.errors;
            if (errs) Object.values(errs).forEach(e => toast.error(e[0]));
            else toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setProcessing(false);
        }
    };
    const filteredClasses = classesList.filter(cls => {
        const name = cls.name || '';
        const courseTitle = cls.course?.title || '';
        const q = searchQuery.toLowerCase();
        return name.toLowerCase().includes(q) || courseTitle.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý Lớp học</h1>
                    <p className="text-slate-500 mt-1">Danh sách lớp thuộc khóa học, theo dõi sĩ số và thời gian đào tạo.</p>
                </div>
                <button onClick={() => openModal()} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Thêm Lớp học
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm tên lớp học hoặc khóa học..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>
                    ) : classesList.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">Chưa có lớp học nào.</div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Tên Lớp học</th>
                                    <th className="px-6 py-4">Thuộc Khóa học</th>
                                    <th className="px-6 py-4">Thời gian học</th>
                                    <th className="px-6 py-4 text-center">Sĩ số</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredClasses.map(cls => (
                                    <tr key={cls.id} className="hover:bg-slate-50/80">
                                        <td className="px-6 py-4 font-bold text-slate-800 text-base">{cls.name}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium  bg-teal-50/50 px-2 py-1 rounded inline-block">
                                                {cls.course?.title || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {cls.start_date || cls.end_date ? (
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    <span>{cls.start_date ? cls.start_date.substring(0, 10) : '?'}</span>
                                                    <span>-</span>
                                                    <span>{cls.end_date ? cls.end_date.substring(0, 10) : '?'}</span>
                                                </div>
                                            ) : <span className="text-slate-400 italic">Chưa xác định</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
                                                <Users className="w-4 h-4" /> {cls.enrollments_count || 0}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {/* Nút này chuẩn bị cho tính năng "Ghi danh sinh viên" ở tương lai */}
                                                <button title="Ghi danh sinh viên" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                                                    <Users className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => openModal(cls)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDelete(cls.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
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
            </div>

            {/* MODAL THÊM / SỬA */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-teal-600" /> {isEdit ? 'Sửa Lớp học' : 'Thêm Lớp học mới'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Tên lớp học *</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="VD: D22_TH01" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Thuộc Khóa học *</label>
                                <select required value={formData.course_id} onChange={e => setFormData({ ...formData, course_id: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500">
                                    <option value="">-- Chọn Khóa học --</option>
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-700">Ngày bắt đầu</label>
                                    <input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-700">Ngày kết thúc</label>
                                    <input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500" />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition">Hủy</button>
                                <button type="submit" disabled={processing} className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-teal-700 transition disabled:opacity-70 flex items-center gap-2">
                                    {processing && <Loader2 className="w-4 h-4 animate-spin" />} Lưu dữ liệu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}