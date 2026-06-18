import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Loader2, GraduationCap } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function CourseManager() {
    const [courses, setCourses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({
        id: null, subject_id: '', teacher_id: '', title: '', description: ''
    });

    useEffect(() => {
        fetchCourses();
        fetchDependencies();
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/courses');
            setCourses(res.data.data || res.data);
        } catch (error) {
            toast.error('Lỗi tải danh sách khóa học');
        } finally {
            setLoading(false);
        }
    };

    const fetchDependencies = async () => {
        try {
            const [subRes, teachRes] = await Promise.all([
                api.get('/admin/subjects'),
                api.get('/admin/users?role=teacher')
            ]);
            setSubjects(subRes.data.data || subRes.data);
            setTeachers(teachRes.data.data || teachRes.data);
        } catch (error) {
            toast.error('Lỗi tải danh mục Môn học / Giảng viên');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Xóa khóa học?',
            text: "Các lớp học thuộc khóa này sẽ bị ảnh hưởng!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Xóa khóa học'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/admin/courses/${id}`);
                toast.success('Xóa thành công');
                fetchCourses();
            } catch (error) {
                toast.error('Lỗi khi xóa khóa học');
            }
        }
    };

    const openModal = (course = null) => {
        if (course) {
            setIsEdit(true);
            setFormData({
                id: course.id,
                subject_id: course.subject_id,
                teacher_id: course.teacher_id || '',
                title: course.title,
                description: course.description || ''
            });
        } else {
            setIsEdit(false);
            setFormData({ id: null, subject_id: '', teacher_id: '', title: '', description: '' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (isEdit) {
                await api.put(`/admin/courses/${formData.id}`, formData);
                toast.success('Cập nhật khóa học thành công');
            } else {
                await api.post('/admin/courses', formData);
                toast.success('Thêm khóa học thành công');
            }
            setShowModal(false);
            fetchCourses();
        } catch (error) {
            const errs = error.response?.data?.errors;
            if (errs) Object.values(errs).forEach(e => toast.error(e[0]));
            else toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setProcessing(false);
        }
    };
    const filteredCourses = courses.filter(course => {
        const title = course.title || '';
        const subjectName = course.subject?.name || '';
        const q = searchQuery.toLowerCase();
        return title.toLowerCase().includes(q) || subjectName.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý Khóa học</h1>
                    <p className="text-slate-500 mt-1">Quản lý các khóa học và phân công giảng viên phụ trách.</p>
                </div>
                <button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Thêm Khóa học
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm tên khóa học hoặc môn học..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
                    ) : courses.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">Chưa có khóa học nào.</div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Tên khóa học</th>
                                    <th className="px-6 py-4">Môn học</th>
                                    <th className="px-6 py-4">Giảng viên phụ trách</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredCourses.map(course => (
                                    <tr key={course.id} className="hover:bg-slate-50/80">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{course.title}</div>
                                            {course.description && <div className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-xs">{course.description}</div>}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-indigo-600 bg-indigo-50/30">{course.subject?.name || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            {course.teacher ? (
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-700">{course.teacher.name}</span>
                                                    <span className="text-xs text-slate-500">{course.teacher.user?.email}</span>
                                                </div>
                                            ) : <span className="text-slate-400 italic">Chưa phân công</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openModal(course)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDelete(course.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
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
                                <GraduationCap className="w-5 h-5 text-indigo-600" /> {isEdit ? 'Sửa Khóa học' : 'Thêm Khóa học mới'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Tên khóa học *</label>
                                <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="VD: Khóa K22 Lập trình Web" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Môn học *</label>
                                <select required value={formData.subject_id} onChange={e => setFormData({ ...formData, subject_id: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500">
                                    <option value="">-- Chọn Môn học --</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Giảng viên phụ trách</label>
                                <select value={formData.teacher_id} onChange={e => setFormData({ ...formData, teacher_id: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500">
                                    <option value="">-- Bỏ trống nếu chưa có --</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.teacher?.name || t.name} ({t.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Mô tả thêm</label>
                                <textarea rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 resize-none"></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition">Hủy</button>
                                <button type="submit" disabled={processing} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-70 flex items-center gap-2">
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