import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { UserX, ShieldAlert, CheckCircle, XCircle, Search, Loader2, X, Send } from 'lucide-react';

export default function ExpulsionManager() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedReq, setSelectedReq] = useState(null);
    const [action, setAction] = useState('approve');
    const [adminNote, setAdminNote] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/expulsions');
         
            const reqData = res.data.data || res.data || [];
            
     
            setRequests(Array.isArray(reqData) ? reqData : []);
        } catch (error) {
            toast.error('Lỗi tải danh sách yêu cầu kỷ luật');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (req) => {
        setSelectedReq(req);
        setAction('approve');
        setAdminNote('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!window.confirm(action === 'approve' ? 'CẢNH BÁO: Hành động này sẽ VÔ HIỆU HÓA tài khoản của học viên. Bạn chắc chắn?' : 'Bạn muốn từ chối yêu cầu này?')) return;
        
        setProcessing(true);
        const loadingToast = toast.loading('Đang xử lý...');
        try {
            await api.put(`/admin/expulsions/${selectedReq.id}/resolve`, { action, admin_note: adminNote });
            toast.success('Xử lý thành công!', { id: loadingToast });
            setSelectedReq(null);
            fetchData();
        } catch (error) {
            toast.error('Lỗi khi xử lý!', { id: loadingToast });
        } finally {
            setProcessing(false);
        }
    };

    const filteredRequests = requests.filter(r => 
        (r.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (r.student_code || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <UserX className="w-7 h-7 text-rose-600" /> Xét duyệt Kỷ luật / Đuổi học
                    </h1>
                    <p className="text-slate-500 mt-1">Nơi Admin phê duyệt các yêu cầu buộc thôi học từ Giảng viên.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" placeholder="Tìm tên hoặc mã Sinh viên..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-rose-500 bg-white" 
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-rose-600 animate-spin" /></div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200 tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Sinh viên bị tố cáo</th>
                                    <th className="px-6 py-4">Giảng viên yêu cầu</th>
                                    <th className="px-6 py-4">Kỳ thi vi phạm</th>
                                    <th className="px-6 py-4 text-center">Trạng thái</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRequests.map(req => (
                                    <tr key={req.id} className="hover:bg-rose-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800 text-base">{req.student_name}</p>
                                            <p className="text-xs text-slate-500">{req.student_code}</p>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700">{req.teacher_name}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{req.exam_title}</td>
                                        <td className="px-6 py-4 text-center">
                                            {req.status === 'pending' && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg font-bold text-xs">Chờ duyệt</span>}
                                            {req.status === 'approved' && <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-lg font-bold text-xs">Đã Đuổi học</span>}
                                            {req.status === 'rejected' && <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg font-bold text-xs">Từ chối</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleOpenModal(req)} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-900 transition">
                                                Xem & Xử lý
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredRequests.length === 0 && <tr><td colSpan="5" className="text-center p-8 text-slate-400">Không có hồ sơ nào.</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

      
            {selectedReq && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-rose-600" /> Xét duyệt hồ sơ kỷ luật</h3>
                            <button onClick={() => setSelectedReq(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            <div className="flex gap-4 p-4 bg-rose-50 border border-rose-100 rounded-xl">
                                <div className="w-12 h-12 rounded-full bg-rose-200 flex items-center justify-center shrink-0">
                                    <UserX className="w-6 h-6 text-rose-700"/>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">{selectedReq.student_name} ({selectedReq.student_code})</h4>
                                    <p className="text-sm text-slate-600 mt-1">Giảng viên đề xuất: <strong>{selectedReq.teacher_name}</strong></p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-sm text-slate-700 mb-2 uppercase tracking-wide">Lý do từ Giảng viên:</h4>
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm leading-relaxed">
                                    {selectedReq.reason}
                                </div>
                            </div>

                            {selectedReq.status === 'pending' ? (
                                <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-6 space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Quyết định của Ban quản trị</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <label className={`flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition ${action === 'approve' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                                                <input type="radio" name="action" value="approve" className="hidden" checked={action === 'approve'} onChange={() => setAction('approve')} />
                                                <CheckCircle className="w-5 h-5" /> <span className="font-bold">Đồng ý Đuổi học</span>
                                            </label>
                                            <label className={`flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition ${action === 'reject' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                                                <input type="radio" name="action" value="reject" className="hidden" checked={action === 'reject'} onChange={() => setAction('reject')} />
                                                <XCircle className="w-5 h-5" /> <span className="font-bold">Từ chối yêu cầu</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Ghi chú (Gửi lại cho Giảng viên) <span className="text-rose-500">*</span></label>
                                        <textarea required rows="4" value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Nhập lý do phê duyệt/từ chối..." className="w-full border-2 border-slate-200 p-4 rounded-xl outline-none focus:border-rose-500 text-sm resize-none"></textarea>
                                    </div>

                                    <button type="submit" disabled={processing} className={`w-full text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-md ${action === 'approve' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                        {processing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-4 h-4" />} Xác nhận Quyết định
                                    </button>
                                </form>
                            ) : (
                                <div className="border-t border-slate-100 pt-6">
                                    <h4 className="font-bold text-sm text-slate-700 mb-2 uppercase tracking-wide">Quyết định đã đưa ra:</h4>
                                    <div className={`p-4 border rounded-xl flex gap-3 ${selectedReq.status === 'approved' ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-800 mb-1">Trạng thái: {selectedReq.status === 'approved' ? <span className="text-rose-600">Đã Phê duyệt đuổi học</span> : <span className="text-slate-600">Bị Từ chối</span>}</p>
                                            <p className="text-sm text-slate-600">Ghi chú: {selectedReq.admin_note}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}