import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Loader2, BookOpen } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function SubjectManager() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({ id: null, code: '', name: '' });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => { fetchSubjects(); }, []);

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/subjects');
            setSubjects(res.data.data || res.data);
        } catch (error) {
            toast.error('Lỗi tải danh sách môn học');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Xóa môn học?',
            text: "Các lớp học và câu hỏi liên quan có thể bị ảnh hưởng!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Xóa môn học'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/admin/subjects/${id}`);
                toast.success('Xóa thành công');
                fetchSubjects();
            } catch (error) {
                toast.error('Lỗi khi xóa môn học');
            }
        }
    };

    const openModal = (subject = null) => {
        if (subject) {
            setIsEdit(true);
            setFormData({ id: subject.id, code: subject.code, name: subject.name });
        } else {
            setIsEdit(false);
            setFormData({ id: null, code: '', name: '' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (isEdit) {
                await api.put(`/admin/subjects/${formData.id}`, formData);
                toast.success('Cập nhật môn học thành công');
            } else {
                await api.post('/admin/subjects', formData);
                toast.success('Thêm môn học thành công');
            }
            setShowModal(false);
            fetchSubjects();
        } catch (error) {
            const errs = error.response?.data?.errors;
            if (errs) Object.values(errs).forEach(e => toast.error(e[0]));
            else toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setProcessing(false);
        }
    };
    const filteredSubjects = subjects.filter(subject => {
        const name = subject.name || '';
        const code = subject.code || '';
        const q = searchQuery.toLowerCase();
        return name.toLowerCase().includes(q) || code.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý Môn học</h1>
                    <p className="text-slate-500 mt-1">Quản lý danh mục các môn học trong hệ thống đào tạo.</p>
                </div>
                <button onClick={() => openModal()} className="bg-blue-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Thêm Môn học
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm mã hoặc tên môn..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Mã môn</th>
                                    <th className="px-6 py-4">Tên môn học</th>
                                    <th className="px-6 py-4">Thống kê dữ liệu</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredSubjects.map(subject => (
                                    <tr key={subject.id} className="hover:bg-slate-50/80">
                                        <td className="px-6 py-4 font-bold text-slate-800">{subject.code}</td>
                                        <td className="px-6 py-4 font-medium text-slate-800">{subject.name}</td>
                                        <td className="px-6 py-4 text-xs">
                                            <div className="flex gap-3">
                                                <span className="bg-blue-50 text-blue-700 px-2 py-1 font-bold">{subject.courses_count || 0} Khóa học</span>
                                                <span className="bg-purple-50 text-purple-700 px-2 py-1  font-bold">{subject.topics_count || 0} Chủ đề</span>
                                                <span className="bg-amber-50 text-amber-700 px-2 py-1  font-bold">{subject.questions_count || 0} Câu hỏi</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openModal(subject)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDelete(subject.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
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

         
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-emerald-600" /> {isEdit ? 'Sửa môn học' : 'Thêm môn học mới'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Mã môn học *</label>
                                <input required type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="VD: IT301" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 uppercase" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Tên môn học *</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="VD: Lập trình Web PHP" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition">Hủy</button>
                                <button type="submit" disabled={processing} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-70 flex items-center gap-2">
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