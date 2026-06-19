import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Lock, Unlock, Loader2, Shield } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function UserManager() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');


    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({
        id: null, email: '', password: '', role: 'student', name: '', code: '', department: ''
    });

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data.data || res.data);
        } catch (error) {
            toast.error('Lỗi tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const res = await api.patch(`/admin/users/${id}/status`);
            toast.success(res.data.message);
            setUsers(users.map(u => u.id === id ? { ...u, is_active: res.data.is_active } : u));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi cập nhật trạng thái');
        }
    };

    const openModal = (user = null) => {
        if (user) {
            setIsEdit(true);
            const profile = user[user.role] || {};
            setFormData({
                id: user.id,
                email: user.email,
                password: '', 
                role: user.role,
                name: profile.name || '',
                code: profile[`${user.role}_code`] || profile.student_code || profile.teacher_code || profile.proctor_code || '',
                department: profile.department || ''
            });
        } else {
            setIsEdit(false);
            setFormData({ id: null, email: '', password: '', role: 'student', name: '', code: '', department: '' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (isEdit) {
                await api.put(`/admin/users/${formData.id}`, formData);
                toast.success('Cập nhật thành công');
            } else {
                await api.post('/admin/users', formData);
                toast.success('Tạo tài khoản thành công');
            }
            setShowModal(false);
            fetchUsers();
        } catch (error) {
            const errs = error.response?.data?.errors;
            if (errs) Object.values(errs).forEach(e => toast.error(e[0]));
            else toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setProcessing(false);
        }
    };
    const filteredUsers = users.filter(user => {
        const profile = user[user.role];
        const code = profile?.[`${user.role}_code`] || profile?.student_code || profile?.teacher_code || profile?.proctor_code || '';
        const name = profile?.name || '';
        const email = user.email || '';
        const q = searchQuery.toLowerCase();

        return email.toLowerCase().includes(q) || name.toLowerCase().includes(q) || code.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý Người dùng</h1>
                    <p className="text-slate-500 mt-1">Phân quyền, cấp tài khoản và quản lý trạng thái truy cập.</p>
                </div>
                <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Thêm tài khoản
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm email, tên hoặc mã số..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
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
                                    <th className="px-6 py-4">Tài khoản</th>
                                    <th className="px-6 py-4">Hồ sơ (Profile)</th>
                                    <th className="px-6 py-4">Vai trò</th>
                                    <th className="px-6 py-4">Trạng thái</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map(user => {
                                    const profile = user[user.role];
                                    const code = profile?.[`${user.role}_code`] || profile?.student_code || profile?.teacher_code || profile?.proctor_code || 'N/A';

                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50/80">
                                            <td className="px-6 py-4 font-medium text-slate-800">{user.email}</td>
                                            <td className="px-6 py-4">
                                                {user.role === 'admin' ? <span className="text-slate-400 italic">Hệ thống</span> : (
                                                    <>
                                                        <div className="font-bold text-slate-800">{profile?.name || 'Chưa cập nhật'}</div>
                                                        <div className="text-xs text-slate-500">{code}</div>
                                                    </>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                                                    ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                        user.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                                                            user.role === 'proctor' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-emerald-100 text-emerald-700'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.is_active ? (
                                                    <span className="text-emerald-600 font-bold flex items-center gap-1"><Unlock className="w-4 h-4" /> Đang hoạt động</span>
                                                ) : (
                                                    <span className="text-red-600 font-bold flex items-center gap-1"><Lock className="w-4 h-4" /> Bị khóa</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleToggleStatus(user.id)} className={`p-2 rounded-lg transition ${user.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                                                        {user.is_active ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                                                    </button>
                                                    <button onClick={() => openModal(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

          
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-600" /> {isEdit ? 'Sửa thông tin tài khoản' : 'Tạo tài khoản mới'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 col-span-2 md:col-span-1">
                                    <label className="text-sm font-semibold text-slate-700">Email đăng nhập *</label>
                                    <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                                </div>
                                <div className="space-y-1 col-span-2 md:col-span-1">
                                    <label className="text-sm font-semibold text-slate-700">{isEdit ? 'Mật khẩu mới (Bỏ trống nếu giữ nguyên)' : 'Mật khẩu *'}</label>
                                    <input required={!isEdit} type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Vai trò hệ thống *</label>
                                <select required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium">
                                    <option value="student">Học viên (Student)</option>
                                    <option value="teacher">Giảng viên (Teacher)</option>
                                    <option value="proctor">Giám thị (Proctor)</option>
                                    <option value="admin">Quản trị viên (Admin)</option>
                                </select>
                            </div>

                 
                            {formData.role !== 'admin' && (
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4 mt-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông tin Hồ sơ (Profile)</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-slate-700">Họ và Tên *</label>
                                            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-slate-700">Mã số định danh *</label>
                                            <input required type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="VD: DH5220..." className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                                        </div>
                                        {formData.role === 'teacher' && (
                                            <div className="space-y-1 col-span-2">
                                                <label className="text-sm font-semibold text-slate-700">Khoa / Bộ môn</label>
                                                <input type="text" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition">Hủy</button>
                                <button type="submit" disabled={processing} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-70 flex items-center gap-2">
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