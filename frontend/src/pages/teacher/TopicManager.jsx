import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { Search, Plus, Edit, Trash2, Loader2, Bookmark, BookOpen, ArrowLeft, Layers, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function TopicManager() {
    // State cho danh sách môn học (không phân trang, lấy tất cả)
    const [subjects, setSubjects] = useState([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [subjectSearch, setSubjectSearch] = useState('');

    // State cho môn học được chọn
    const [selectedSubject, setSelectedSubject] = useState(null);

    // State cho danh sách chủ đề (có phân trang)
    const [topics, setTopics] = useState([]);
    const [topicPagination, setTopicPagination] = useState({});
    const [loadingTopics, setLoadingTopics] = useState(false);
    const [topicSearch, setTopicSearch] = useState('');

    // Modal thêm/sửa chủ đề
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { register, handleSubmit, reset } = useForm({
        defaultValues: { subject_id: '', name: '' }
    });

    // Lấy danh sách môn học (tất cả, không phân trang)
    const fetchSubjects = useCallback(async () => {
        setLoadingSubjects(true);
        try {
            const res = await api.get('/teacher/subjects');
            setSubjects(res.data.data || res.data);
        } catch (error) {
            toast.error('Lỗi tải danh sách môn học');
        } finally {
            setLoadingSubjects(false);
        }
    }, []);

    // Lấy danh sách chủ đề (có phân trang và tìm kiếm theo subject_id)
    const fetchTopics = useCallback(async (url = '/teacher/topics', params = {}) => {
        setLoadingTopics(true);
        try {
            const res = await api.get(url, { params });
            setTopics(res.data.data || res.data);
            setTopicPagination({
                links: res.data.links || res.data.meta?.links,
                meta: res.data.meta || res.data
            });
        } catch (error) {
            toast.error('Lỗi tải danh sách chủ đề');
        } finally {
            setLoadingTopics(false);
        }
    }, []);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    // Khi chọn môn học, tải chủ đề
    useEffect(() => {
        if (selectedSubject) {
            fetchTopics('/teacher/topics', {
                subject_id: selectedSubject.id,
                search: topicSearch
            });
        }
    }, [selectedSubject, topicSearch, fetchTopics]);

    // Lọc môn học (client-side vì danh sách ít)
    const filteredSubjects = subjects.filter(sub =>
        sub.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
        sub.code.toLowerCase().includes(subjectSearch.toLowerCase())
    );

    // Mở modal thêm/sửa chủ đề
    const openModal = (topic = null) => {
        if (topic) {
            setEditingId(topic.id);
            reset({
                subject_id: topic.subject_id,
                name: topic.name
            });
        } else {
            setEditingId(null);
            reset({
                subject_id: selectedSubject ? selectedSubject.id : '',
                name: ''
            });
        }
        setShowModal(true);
    };

    const onSubmit = async (data) => {
        const loadingToast = toast.loading('Đang lưu dữ liệu...');
        try {
            if (editingId) {
                await api.put(`/teacher/topics/${editingId}`, data);
                toast.success('Cập nhật thành công!', { id: loadingToast });
            } else {
                await api.post('/teacher/topics', data);
                toast.success('Thêm mới thành công!', { id: loadingToast });
            }
            setShowModal(false);
            // Refresh lại danh sách chủ đề
            fetchTopics('/teacher/topics', {
                subject_id: selectedSubject.id,
                search: topicSearch
            });
            // Refresh lại danh sách môn học để cập nhật số lượng chủ đề
            fetchSubjects();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra', { id: loadingToast });
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Xóa chủ đề này?',
            text: "Các câu hỏi thuộc chủ đề này có thể bị lỗi dữ liệu!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        });
        if (result.isConfirmed) {
            try {
                await api.delete(`/teacher/topics/${id}`);
                toast.success('Xóa chủ đề thành công');
                fetchTopics('/teacher/topics', {
                    subject_id: selectedSubject.id,
                    search: topicSearch
                });
                fetchSubjects();
            } catch (error) {
                toast.error('Lỗi khi xóa chủ đề');
            }
        }
    };

    // Nếu chưa chọn môn học -> hiển thị danh sách môn học
    if (!selectedSubject) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Bookmark className="w-6 h-6 text-blue-600" /> Quản lý Chủ đề
                        </h1>
                        <p className="text-slate-500 mt-1">Chọn một môn học bên dưới để quản lý các chủ đề bài học bên trong.</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm môn học..."
                            value={subjectSearch}
                            onChange={(e) => setSubjectSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition shadow-sm bg-white"
                        />
                    </div>
                </div>

                {loadingSubjects ? (
                    <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
                ) : filteredSubjects.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500 shadow-sm">
                        Không tìm thấy môn học nào phù hợp.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredSubjects.map(subject => {
                            const topicCount = subject.topics_count || 0;
                            return (
                                <div
                                    key={subject.id}
                                    onClick={() => {
                                        setSelectedSubject(subject);
                                        setTopicSearch('');
                                    }}
                                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-blue-300 transition-all cursor-pointer group flex flex-col h-full"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
                                        {subject.name}
                                    </h3>
                                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Tổng chủ đề</span>
                                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-sm font-bold group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                                            {topicCount}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // Đã chọn môn học -> hiển thị danh sách chủ đề
    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans animate-in slide-in-from-right-8 duration-300">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                    <button
                        onClick={() => {
                            setSelectedSubject(null);
                            setTopicSearch('');
                        }}
                        className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 font-bold text-sm transition mb-4 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:bg-blue-50 w-max"
                    >
                        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách môn
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Layers className="w-7 h-7 text-emerald-600" />
                        Chủ đề: {selectedSubject.name}
                    </h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        Tổng cộng: <span className="font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-md">{topics.length}</span> chủ đề
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-64 hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Tìm chủ đề..."
                            value={topicSearch}
                            onChange={(e) => setTopicSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 text-sm shadow-sm bg-white"
                        />
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-sm whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" /> Thêm Chủ đề mới
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    {loadingTopics ? (
                        <div className="p-10 flex justify-center"><Loader2 className="w-10 h-10 text-emerald-600 animate-spin" /></div>
                    ) : topics.length === 0 ? (
                        <div className="p-10 text-center flex flex-col items-center">
                            <Layers className="w-12 h-12 text-slate-200 mb-3" />
                            <p className="text-slate-500 font-medium">Môn học này chưa có chủ đề nào.</p>
                            <button onClick={() => openModal()} className="mt-4 text-emerald-600 font-bold hover:underline">Thêm chủ đề đầu tiên</button>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200 tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Tên Chủ đề</th>
                                    <th className="px-6 py-4">Môn học</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {topics.map(topic => (
                                    <tr key={topic.id} className="hover:bg-emerald-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-slate-800 text-base">{topic.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg font-medium text-xs">
                                                {topic.subject?.name || '---'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => openModal(topic)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="Sửa">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(topic.id)} className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition" title="Xóa">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {topicPagination.links && topicPagination.links.length > 3 && (
                    <div className="p-4 border-t border-slate-100 flex flex-wrap justify-center gap-1">
                        {topicPagination.links.map((link, idx) => {
                            let label = link.label;
                            if (label.includes('Previous')) label = 'Trang trước';
                            else if (label.includes('Next')) label = 'Trang sau';
                            return (
                                <button
                                    key={idx}
                                    disabled={!link.url}
                                    onClick={() => fetchTopics(link.url)}
                                    className={`px-4 py-2 text-sm font-medium rounded-xl transition border
                                        ${link.active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}
                                        ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                    dangerouslySetInnerHTML={{ __html: label }}
                                />
                            );
                        })}
                    </div>
                )}
                {topicPagination.meta && (
                    <div className="px-6 py-3 text-sm text-slate-500 border-t border-slate-100">
                        Hiển thị {topics.length} trên tổng số {topicPagination.meta.total || topics.length} chủ đề
                    </div>
                )}
            </div>

            {/* Modal thêm/sửa chủ đề */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Bookmark className="w-5 h-5 text-emerald-600" /> {editingId ? 'Sửa Chủ đề' : 'Thêm Chủ đề mới'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Môn học chứa chủ đề <span className="text-rose-500">*</span></label>
                                <select
                                    required
                                    {...register('subject_id')}
                                    className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white font-medium text-slate-700"
                                >
                                    <option value="" disabled>-- Chọn Môn học --</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tên Chủ đề <span className="text-rose-500">*</span></label>
                                <input
                                    required
                                    type="text"
                                    {...register('name')}
                                    placeholder="VD: Cấu trúc điều kiện IF ELSE..."
                                    className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-slate-50 transition"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-5 py-3 text-slate-600 font-bold bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition">
                                    Hủy bỏ
                                </button>
                                <button type="submit" className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20">
                                    Lưu dữ liệu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}