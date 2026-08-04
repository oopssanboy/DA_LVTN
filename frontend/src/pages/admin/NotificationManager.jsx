import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { Bell, Plus, Trash2, Loader2, X, Send, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function NotificationManager({ basePath = '/admin' }) {
    const [notifications, setNotifications] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [classes, setClasses] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const { register, handleSubmit, watch, reset, formState: { isSubmitting } } = useForm({
        defaultValues: { target_role: basePath === '/admin' ? 'all' : 'class' }
    });
    const targetRole = watch('target_role');

    const fetchNotifications = useCallback(async (url = `${basePath}/notifications`, params = {}) => {
        setLoading(true);
        try {
            const res = await api.get(url, { params });
            setNotifications(res.data.data || res.data);
            setPagination({
                links: res.data.links || res.data.meta?.links,
                meta: res.data.meta || res.data
            });
        } catch (error) {
            toast.error('Lỗi tải danh sách thông báo');
        } finally {
            setLoading(false);
        }
    }, [basePath]);

    const fetchClasses = useCallback(async () => {
        try {
            const res = await api.get(`${basePath}/classes`);
            setClasses(res.data.data || res.data);
        } catch (error) {
            toast.error('Lỗi tải danh sách lớp học');
        }
    }, [basePath]);

    useEffect(() => {
        fetchNotifications();
        fetchClasses();
    }, [fetchNotifications, fetchClasses]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchNotifications(`${basePath}/notifications`, { search: searchQuery });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchNotifications, basePath]);

    const onSubmit = async (data) => {
        const loadingToast = toast.loading('Đang gửi thông báo...');
        try {
            await api.post(`${basePath}/notifications`, data);
            toast.success('Đã phát thông báo!', { id: loadingToast });
            setShowModal(false);
            reset();
            fetchNotifications(`${basePath}/notifications`, { search: searchQuery });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra', { id: loadingToast });
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Thu hồi thông báo?',
            text: "Thông báo này sẽ bị gỡ khỏi tài khoản của tất cả người nhận.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Thu hồi',
            cancelButtonText: 'Hủy'
        });
        if (result.isConfirmed) {
            try {
                await api.delete(`${basePath}/notifications/${id}`);
                toast.success('Đã thu hồi thành công');
                fetchNotifications(`${basePath}/notifications`, { search: searchQuery });
            } catch (error) {
                toast.error('Lỗi khi thu hồi');
            }
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý Thông báo</h1>
                    <p className="text-slate-500 mt-1">Phát và thu hồi thông báo chung trên toàn hệ thống.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-sm">
                    <Plus className="w-5 h-5" /> Soạn thông báo mới
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tiêu đề hoặc nội dung..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
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
                                    <th className="px-6 py-4">Tiêu đề / Nội dung</th>
                                    <th className="px-6 py-4 text-center w-40">Đối tượng</th>
                                    <th className="px-6 py-4 text-center w-40">Ngày gửi</th>
                                    <th className="px-6 py-4 text-right w-24">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {notifications.length > 0 ? notifications.map((noti) => (
                                    <tr key={noti.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800 text-base">{noti.title}</div>
                                            <div className="text-slate-500 mt-1 line-clamp-1">{noti.content}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium">
                                            {noti.target_role === 'all' && <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs">Hệ thống</span>}
                                            {noti.target_role === 'student' && <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-xs">Sinh viên</span>}
                                            {noti.target_role === 'teacher' && <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-xs">Giảng viên</span>}
                                            {noti.target_role === 'class' && <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md text-xs line-clamp-1">Lớp: {noti.target_class_id || ''}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-500">
                                            {new Date(noti.created_at).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleDelete(noti.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-8 text-slate-500">Chưa phát thông báo nào.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {pagination.links && pagination.links.length > 3 && (
                            <div className="p-4 border-t border-slate-100 flex flex-wrap justify-center gap-1">
                                {pagination.links.map((link, idx) => {
                                    let label = link.label;
                                    if (label.includes('Previous')) label = 'Trang trước';
                                    else if (label.includes('Next')) label = 'Trang sau';
                                    return (
                                        <button
                                            key={idx}
                                            disabled={!link.url}
                                            onClick={() => fetchNotifications(link.url)}
                                            className={`px-4 py-2 text-sm font-medium rounded-xl transition border
                                                ${link.active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}
                                                ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}
                                            `}
                                            dangerouslySetInnerHTML={{ __html: label }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                        {pagination.meta && (
                            <div className="px-6 py-3 text-sm text-slate-500 border-t border-slate-100">
                                Hiển thị {notifications.length} trên tổng số {pagination.meta.total || notifications.length} thông báo
                            </div>
                        )}
                    </>
                )}
            </div>

        
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Bell className="w-5 h-5 text-blue-600"/> Soạn thông báo mới
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5"/>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Tiêu đề</label>
                                <input type="text" {...register('title', { required: true })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500" placeholder="Tiêu đề..." />
                            </div>

                            {basePath === '/admin' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Đối tượng nhận</label>
                                        <select {...register('target_role')} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500">
                                            <option value="all">Toàn bộ hệ thống</option>
                                            <option value="student">Tất cả Sinh viên</option>
                                            <option value="teacher">Tất cả Giảng viên</option>
                                            <option value="class">Gửi theo lớp cụ thể</option>
                                        </select>
                                    </div>
                                    {targetRole === 'class' && (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Chọn lớp</label>
                                            <select {...register('target_class_id', { required: true })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500">
                                                <option value="">-- Chọn lớp học --</option>
                                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Chọn lớp học nhận thông báo</label>
                                    <input type="hidden" {...register('target_role')} value="class" />
                                    <select {...register('target_class_id', { required: true })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500">
                                        <option value="">-- Chọn lớp do bạn phụ trách --</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nội dung chi tiết</label>
                                <textarea {...register('content', { required: true })} rows="4" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 resize-none" placeholder="Nội dung..."></textarea>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">Hủy bỏ</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2">
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} Phát thông báo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}