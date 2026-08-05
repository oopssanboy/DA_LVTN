import { useState, useEffect } from 'react';
import { Search, Loader2, UserCheck, CheckCircle2, XCircle, Eye, X, FileEdit } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function ComplaintApprovalManager() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [adminNote, setAdminNote] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/complaint-approvals');
            setRequests(res.data.data || res.data);
        } catch (error) {
            toast.error('Lỗi tải danh sách yêu cầu');
        } finally {
            setLoading(false);
        }
    };

    const openResolveModal = (item) => {
        setSelectedItem(item);
        setAdminNote(item.admin_note || '');
        setShowModal(true);
    };

    const handleResolve = async (action) => {
        if (!selectedItem) return;

        if (!adminNote.trim()) {
            toast.error('Vui lòng nhập ghi chú phản hồi cho Giảng viên và Sinh viên!');
            return;
        }

        const confirmText = action === 'approve' 
            ? `Xác nhận phê duyệt? Hệ thống sẽ sửa điểm của sinh viên thành ${selectedItem.proposed_score}.` 
            : 'Xác nhận từ chối đề xuất này? Điểm của sinh viên sẽ được giữ nguyên.';

        const result = await Swal.fire({
            title: 'Xác nhận Quyết định',
            text: confirmText,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: action === 'approve' ? '#10b981' : '#ef4444',
            cancelButtonText: 'Hủy bỏ',
            confirmButtonText: action === 'approve' ? 'Phê duyệt' : 'Từ chối'
        });

        if (result.isConfirmed) {
            setProcessing(true);
            const toastId = toast.loading('Đang xử lý...');
            try {
                await api.patch(`/admin/complaint-approvals/${selectedItem.id}/resolve`, { 
                    action, 
                    admin_note: adminNote 
                });
                
                toast.success('Xử lý đề xuất thành công!', { id: toastId });
                setShowModal(false);
                fetchRequests();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Có lỗi xảy ra', { id: toastId });
            } finally {
                setProcessing(false);
            }
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'pending_approval') return <span className=" font-bold flex items-center gap-1"> Chờ duyệt</span>;
        if (status === 'resolved') return <span className=" font-bold flex items-center gap-1"> Đã phê duyệt</span>;
        if (status === 'rejected') return <span className=" font-bold flex items-center gap-1"> Bị từ chối</span>;
        return <span>{status}</span>;
    };

    const filteredItems = requests.filter(i => 
        (i.student_user?.student?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.student_user?.student?.student_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.exam?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <UserCheck className="w-6 h-6 text-blue-600" /> Duyệt Đề xuất Sửa điểm
                </h1>
                <p className="text-slate-500 mt-1">Kiểm duyệt các yêu cầu thay đổi điểm thi cuối kỳ từ Giảng viên.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" placeholder="Tìm theo tên SV, MSSV, môn thi..." 
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium bg-white" 
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs border-b border-slate-200 tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Sinh viên</th>
                                    <th className="px-6 py-4">Môn thi</th>
                                    <th className="px-6 py-4">Giảng viên đề xuất</th>
                                    <th className="px-6 py-4 text-center">Điểm đề xuất</th>
                                    <th className="px-6 py-4">Trạng thái</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredItems.length > 0 ? (
                                    filteredItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800 text-base">{item.student_user?.student?.name}</div>
                                                <div className="text-xs text-slate-500">{item.student_user?.student?.student_code}</div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-700">{item.exam?.title}</td>
                                            <td className="px-6 py-4 text-sm font-medium">{item.exam?.teacher?.email}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="font-black text-lg  px-3 py-1 rounded-lg">
                                                    {item.proposed_score}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs">{getStatusBadge(item.status)}</td>
                                            <td className="px-6 py-4 text-right">
                                                {item.status === 'pending_approval' ? (
                                                    <button 
                                                        onClick={() => openResolveModal(item)}
                                                        className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg font-bold text-xs transition shadow-sm"
                                                    >
                                                        Xem & Duyệt
                                                    </button>
                                                ) : (
                                                    <button onClick={() => openResolveModal(item)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-100 rounded-lg">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="6" className="px-6 py-10 text-center text-slate-500">Không có hồ sơ nào.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        
            {showModal && selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <FileEdit className="w-5 h-5 text-blue-600" />
                                {selectedItem.status === 'pending_approval' ? 'Duyệt Đề xuất Sửa điểm' : 'Chi tiết Phê duyệt'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            
              
                            <div className="flex justify-between items-start p-4 border rounded-xl bg-slate-50 border-slate-200">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg">{selectedItem.student_user?.student?.name} ({selectedItem.student_user?.student?.student_code})</h4>
                                    <div className="text-sm text-slate-600 mt-2 grid grid-cols-1 gap-1">
                                        <p>Bài thi: <strong>{selectedItem.exam?.title}</strong></p>
                                        <p>Giảng viên yêu cầu: <strong>{selectedItem.exam?.teacher?.email}</strong></p>
                                    </div>
                                </div>
                                <div className="text-right bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Điểm mới đề xuất</p>
                                    <p className="text-3xl font-black flex justify-center mt-1">{selectedItem.proposed_score}</p>
                                </div>
                            </div>

                      
                            <div>
                                <h4 className="font-bold text-sm text-slate-700 mb-2 uppercase tracking-wide">Lý do của Giảng viên:</h4>
                                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-slate-700 text-sm leading-relaxed font-medium italic">
                                    "{selectedItem.response}"
                                </div>
                            </div>

                   
                            {selectedItem.status === 'pending_approval' ? (
                                <div className="border-t border-slate-100 pt-6 space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            Ghi chú của Ban Quản Trị <span className="text-rose-500">*</span>
                                        </label>
                                        <textarea 
                                            rows="3" value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                                            placeholder="Nhập lý do phê duyệt hoặc từ chối để thông báo lại cho Giảng viên..."
                                            className="w-full border-2 border-slate-200 p-4 rounded-xl outline-none focus:border-blue-500 text-sm resize-none"
                                        ></textarea>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            onClick={() => handleResolve('reject')} disabled={processing}
                                            className="flex-1 py-3 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                                        >
                                            Từ chối Đề xuất
                                        </button>
                                        <button 
                                            onClick={() => handleResolve('approve')} disabled={processing}
                                            className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:bg-emerald-600 transition"
                                        >
                                            {processing ? <Loader2 className="w-5 h-5 animate-spin"/> : ''} 
                                            Phê duyệt Sửa điểm
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-t border-slate-100 pt-6">
                                    <h4 className="font-bold text-sm text-slate-700 mb-2 uppercase tracking-wide">Kết quả phê duyệt:</h4>
                                    <div className={`p-4 border rounded-xl ${selectedItem.status === 'resolved' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                        <p className="font-bold text-slate-800 mb-2 flex items-center gap-2">Trạng thái: {getStatusBadge(selectedItem.status)}</p>
                                        <p className="text-sm text-slate-700"><span className="text-slate-500 font-medium">Ghi chú của Admin:</span> {selectedItem.admin_note}</p>
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