import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Loader2, Bookmark } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function TopicManager() {
    const [topics, setTopics] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({ id: null, subject_id: '', name: '' });

    useEffect(() => { 
        fetchData(); 
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
          
            const [topicsRes, subjectsRes] = await Promise.all([
                api.get('/admin/topics'),
                api.get('/admin/subjects')
            ]);
            setTopics(topicsRes.data.data || topicsRes.data);
            setSubjects(subjectsRes.data.data || subjectsRes.data);
        } catch (error) {
            toast.error('Lỗi tải dữ liệu Chủ đề / Môn học');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Xóa chủ đề này?',
            text: "Cảnh báo: Các câu hỏi thuộc chủ đề này có thể bị mất hoặc bị lỗi dữ liệu!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Vâng, Xóa'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/admin/topics/${id}`);
                toast.success('Xóa chủ đề thành công');
                fetchData();
            } catch (error) {
                toast.error('Lỗi khi xóa chủ đề');
            }
        }
    };

    const openModal = (topic = null) => {
        if (topic) {
            setIsEdit(true);
            setFormData({ id: topic.id, subject_id: topic.subject_id, name: topic.name });
        } else {
            setIsEdit(false);
            setFormData({ id: null, subject_id: '', name: '' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (isEdit) {
                await api.put(`/admin/topics/${formData.id}`, formData);
                toast.success('Cập nhật chủ đề thành công');
            } else {
                await api.post('/admin/topics', formData);
                toast.success('Thêm chủ đề thành công');
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            const errs = error.response?.data?.errors;
            if (errs) {
                Object.values(errs).forEach(err => toast.error(err[0]));
            } else {
                toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
            }
        } finally {
            setProcessing(false);
        }
    };

    
    const filteredTopics = topics.filter(t => {
        const name = t.name || '';
        const subjectName = t.subject?.name || '';
        const q = searchQuery.toLowerCase();
        return name.toLowerCase().includes(q) || subjectName.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý Chủ đề</h1>
                    <p className="text-slate-500 mt-1">Danh mục các chủ đề bài học dùng để phân loại và làm ma trận câu hỏi.</p>
                </div>
                <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Thêm Chủ đề
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Tìm tên chủ đề hoặc môn học..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-white" 
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
                    ) : filteredTopics.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">Chưa có chủ đề nào hoặc không tìm thấy kết quả.</div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Tên Chủ đề</th>
                                    <th className="px-6 py-4">Thuộc Môn học</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTopics.map(topic => (
                                    <tr key={topic.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800 text-base">{topic.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-medium text-xs">
                                                {topic.subject?.name || 'Chưa cập nhật'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openModal(topic)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Sửa">
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDelete(topic.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Xóa">
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Bookmark className="w-5 h-5 text-blue-600" /> {isEdit ? 'Sửa Chủ đề' : 'Thêm Chủ đề mới'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Môn học chứa chủ đề <span className="text-red-500">*</span></label>
                                <select required value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-slate-50">
                                    <option value="">-- Chọn Môn học --</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Tên Chủ đề <span className="text-red-500">*</span></label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Route cơ bản..." className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-slate-50" />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition">Hủy</button>
                                <button type="submit" disabled={processing} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-70 flex items-center gap-2 shadow-sm shadow-blue-600/20">
                                    {processing && <Loader2 className="w-4 h-4 animate-spin"/>} Lưu dữ liệu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}