import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Loader2, Bookmark, BookOpen, ArrowLeft, Layers, X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function TopicManager() {

    const [topics, setTopics] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState(null);
    

    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({ id: null, subject_id: '', name: '' });

    useEffect(() => { 
        fetchData(); 
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
       
            const [topicsRes, subjectsRes] = await Promise.all([
                api.get('/teacher/topics'),
                api.get('/teacher/subjects')
            ]);
            

            const topicsData = topicsRes.data.data || topicsRes.data || [];
            const subjectsData = subjectsRes.data.data || subjectsRes.data || [];
            
            setTopics(topicsData);
            setSubjects(subjectsData);
        } catch (error) {
            toast.error('Lỗi tải dữ liệu Chủ đề / Môn học');
        } finally {
            setLoading(false);
        }
    };

    const getTopicCountForSubject = (subjectId) => {
        return topics.filter(t => t.subject_id === subjectId).length;
    };

 
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Xóa chủ đề này?',
            text: "Cảnh báo: Các câu hỏi thuộc chủ đề này có thể bị lỗi dữ liệu!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Vâng, Xóa'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/teacher/topics/${id}`);
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
     
            setFormData({ id: null, subject_id: selectedSubject ? selectedSubject.id : '', name: '' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (isEdit) {
                await api.put(`/teacher/topics/${formData.id}`, formData);
                toast.success('Cập nhật chủ đề thành công');
            } else {
                await api.post('/teacher/topics', formData);
                toast.success('Thêm chủ đề thành công');
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setProcessing(false);
        }
    };


    const filteredSubjects = subjects.filter(s => 
        (s.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredTopicsOfSubject = selectedSubject 
        ? topics.filter(t => 
            t.subject_id === selectedSubject.id && 
            (t.name || '').toLowerCase().includes(searchQuery.toLowerCase())
          )
        : [];

    if (loading && subjects.length === 0) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
            
      
            {!selectedSubject && (
                <div className="animate-in fade-in duration-300">
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
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition shadow-sm bg-white" 
                            />
                        </div>
                    </div>

                    {filteredSubjects.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500 shadow-sm">
                            Không tìm thấy môn học nào phù hợp.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredSubjects.map(subject => {
                                const count = getTopicCountForSubject(subject.id);
                                return (
                                    <div 
                                        key={subject.id} 
                                        onClick={() => { setSelectedSubject(subject); setSearchQuery(''); }}
                                        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-blue-300 transition-all cursor-pointer group flex flex-col h-full"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">{subject.name}</h3>
                                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Tổng chủ đề</span>
                                            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-sm font-bold group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                                                {count}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}


            {selectedSubject && (
                <div className="animate-in slide-in-from-right-8 duration-300">
                    
                
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                        <div>
                            <button 
                                onClick={() => { setSelectedSubject(null); setSearchQuery(''); }}
                                className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 font-bold text-sm transition mb-4 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:bg-blue-50 w-max"
                            >
                                <ArrowLeft className="w-4 h-4" /> Quay lại danh sách môn
                            </button>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Layers className="w-7 h-7 text-emerald-600" />
                                Chủ đề: {selectedSubject.name}
                            </h1>
                            <p className="text-slate-500 mt-1 flex items-center gap-2">
                                Tổng cộng: <span className="font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-md">{getTopicCountForSubject(selectedSubject.id)}</span> chủ đề
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative w-64 hidden md:block">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input 
                                    type="text" 
                                    placeholder="Tìm chủ đề..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
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
                            {filteredTopicsOfSubject.length === 0 ? (
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
                                        {filteredTopicsOfSubject.map(topic => (
                                            <tr key={topic.id} className="hover:bg-emerald-50/50 transition-colors group">
                                                <td className="px-6 py-4 font-bold text-slate-800 text-base">{topic.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg font-medium text-xs">
                                                        {topic.subject?.name || '---'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-1  ">
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
                    </div>
                </div>
            )}

            {/* =========================================================
                MODAL THÊM / SỬA (Dùng chung cho cả 2 màn hình)
               ========================================================= */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Bookmark className="w-5 h-5 text-emerald-600" /> {isEdit ? 'Sửa Chủ đề' : 'Thêm Chủ đề mới'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Môn học chứa chủ đề <span className="text-rose-500">*</span></label>
                                <select 
                                    required 
                                    value={formData.subject_id} 
                                    onChange={e => setFormData({...formData, subject_id: e.target.value})} 
                                    className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white font-medium text-slate-700"
                                >
                                    <option value="" disabled>-- Chọn Môn học --</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tên Chủ đề <span className="text-rose-500">*</span></label>
                                <input 
                                    required 
                                    type="text" 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                    placeholder="VD: Cấu trúc điều kiện IF ELSE..." 
                                    className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-slate-50 transition" 
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-5 py-3 text-slate-600 font-bold bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition">
                                    Hủy bỏ
                                </button>
                                <button type="submit" disabled={processing} className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20">
                                    {processing ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Lưu dữ liệu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}