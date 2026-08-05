import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Search, Loader2, ShieldAlert, CheckCircle, XCircle, Eye, UserX, Send, X } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Swal from 'sweetalert2';

export default function DisciplineManager() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [adminNote, setAdminNote] = useState('');
    const [penaltyPoints, setPenaltyPoints] = useState(0);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Gọi song song 2 API: Kỷ luật học vụ và Đuổi học
            const [violationRes, expulsionRes] = await Promise.all([
                api.get('/admin/violation-actions').catch(() => ({ data: { data: [] } })),
                api.get('/admin/expulsions').catch(() => ({ data: { data: [] } }))
            ]);

            // Chuẩn hóa dữ liệu Vi phạm học vụ
            const violations = (violationRes.data.data || []).map(v => ({
                ...v,
                _type: 'violation' // Gắn cờ để phân biệt khi submit
            }));

            // Chuẩn hóa dữ liệu Đuổi học để key khớp với bảng chung
            const expulsions = (expulsionRes.data.data || []).map(e => ({
                ...e,
                _type: 'expulsion',
                action_type: 'request_expulsion', // Đồng bộ tên action
                created_at: e.created_at || new Date().toISOString()
            }));

            // Gộp và sắp xếp mới nhất lên đầu
            const combined = [...violations, ...expulsions].sort((a, b) => {
                // Định dạng thời gian từ chuỗi dd/mm/yyyy hh:mm:ss hoặc ISO ISO-8601
                const dateA = a.created_at.includes('/') ? new Date(a.created_at.split('/').reverse().join('-')) : new Date(a.created_at);
                const dateB = b.created_at.includes('/') ? new Date(b.created_at.split('/').reverse().join('-')) : new Date(b.created_at);
                return dateB - dateA;
            });

            setItems(combined);
        } catch (error) {
            toast.error('Lỗi khi tải danh sách kỷ luật');
        } finally {
            setLoading(false);
        }
    };

    const openResolveModal = (item) => {
        setSelectedItem(item);
        setAdminNote('');
        setPenaltyPoints(0);
        setShowModal(true);
    };

    const handleResolve = async (statusDecision) => {
        if (!selectedItem) return;

        // Bắt lỗi nếu trừ điểm mà quên nhập số
        if (statusDecision === 'approved' && selectedItem.action_type === 'deduct_points' && penaltyPoints <= 0) {
            toast.error('Vui lòng nhập số điểm muốn trừ hợp lệ!');
            return;
        }

        // Bắt lỗi nếu quên nhập ghi chú khi đuổi học
        if (selectedItem._type === 'expulsion' && !adminNote.trim()) {
            toast.error('Bắt buộc phải nhập ghi chú khi xử lý Đuổi học!');
            return;
        }

        let confirmText = statusDecision === 'approved' ? 'Phê duyệt quyết định này?' : 'Từ chối đề xuất này?';
        if (selectedItem.action_type === 'request_expulsion' && statusDecision === 'approved') {
            confirmText = 'CẢNH BÁO: Hành động này sẽ VÔ HIỆU HÓA tài khoản của học viên. Chắc chắn phê duyệt?';
        }

        const result = await Swal.fire({
            title: 'Xác nhận Quyết định',
            text: confirmText,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: statusDecision === 'approved' ? '#e11d48' : '#3b82f6',
            cancelButtonText: 'Hủy bỏ',
            confirmButtonText: 'Xác nhận'
        });

        if (result.isConfirmed) {
            setProcessing(true);
            const toastId = toast.loading('Đang xử lý...');
            try {
                // Rẽ nhánh API tùy thuộc vào loại dữ liệu
                if (selectedItem._type === 'violation') {
                    await api.patch(`/admin/violation-actions/${selectedItem.id}/resolve`, {
                        status: statusDecision, // 'approved' hoặc 'rejected'
                        admin_note: adminNote,
                        penalty_points: penaltyPoints
                    });
                } else {
                    await api.put(`/admin/expulsions/${selectedItem.id}/resolve`, {
                        action: statusDecision === 'approved' ? 'approve' : 'reject',
                        admin_note: adminNote
                    });
                }

                toast.success('Xử lý thành công!', { id: toastId });
                setShowModal(false);
                fetchData(); 
            } catch (error) {
                toast.error(error.response?.data?.message || 'Có lỗi xảy ra', { id: toastId });
            } finally {
                setProcessing(false);
            }
        }
    };

    const getActionBadge = (type) => {
        switch (type) {
            case 'warn': return <span className=" px-3 py-1 rounded-lg font-bold text-[11px]">CẢNH CÁO</span>;
            case 'deduct_points': return <span className=" px-3 py-1 rounded-lg font-bold text-[11px]">TRỪ ĐIỂM</span>;
            case 'cancel_exam': return <span className=" px-3 py-1 rounded-lg font-bold text-[11px]">HỦY BÀI THI</span>;
            case 'request_expulsion': return <span className=" px-3 py-1 rounded-lg font-bold text-[11px]">ĐUỔI HỌC</span>;
            default: return <span className=" px-3 py-1 rounded-lg font-bold text-[11px]">{type}</span>;
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'pending') return <span className="text-amber-600 font-bold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Chờ duyệt</span>;
        if (status === 'approved') return <span className="text-rose-600 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Đã phê duyệt</span>;
        if (status === 'rejected') return <span className="text-slate-500 font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> Bị từ chối</span>;
        return <span>{status}</span>;
    };

    const filteredItems = items.filter(i => 
        (i.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.student_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.exam_title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    Xét duyệt Kỷ luật
                </h1>
                <p className="text-slate-500 mt-1">Xử lý tập trung các đề xuất trừ điểm, hủy bài và buộc thôi học từ Giảng viên.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" placeholder="Tìm theo tên SV, MSSV, môn thi..." 
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-rose-500 font-medium bg-white" 
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 text-rose-500 animate-spin" /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs border-b border-slate-200 tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Sinh viên</th>
                                    <th className="px-6 py-4">Môn thi</th>
                                    <th className="px-6 py-4">Hình thức / Lý do</th>
                                    <th className="px-6 py-4">Người đề xuất</th>
                                    <th className="px-6 py-4">Trạng thái</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredItems.length > 0 ? (
                                    filteredItems.map((item) => (
                                        <tr key={`${item._type}-${item.id}`} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800 text-base">{item.student_name}</div>
                                                <div className="text-xs text-slate-500">{item.student_code}</div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-700 text-xs">{item.exam_title}</td>
                                            <td className="px-6 py-4">
                                                <div className="mb-2">{getActionBadge(item.action_type)}</div>
                                                <div className="text-xs text-slate-500 line-clamp-2 max-w-[250px]" title={item.reason}>
                                                    {item.reason}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium">{item.teacher_name}</td>
                                            <td className="px-6 py-4 text-xs">{getStatusBadge(item.status)}</td>
                                            <td className="px-6 py-4 text-right">
                                                {item.status === 'pending' ? (
                                                    <button 
                                                        onClick={() => openResolveModal(item)}
                                                        className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg font-bold text-xs transition"
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
                                {selectedItem.action_type === 'request_expulsion' ? '' : ''}
                                {selectedItem.status === 'pending' ? 'Xét duyệt Hồ sơ' : 'Chi tiết Quyết định'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            <div className={`flex gap-4 p-4 border rounded-xl ${selectedItem.action_type === 'request_expulsion' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200'}`}>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg">{selectedItem.student_name} ({selectedItem.student_code})</h4>
                                    <div className="text-sm text-slate-600 mt-1 grid grid-cols-1 gap-1">
                                        <p>Bài thi: <strong>{selectedItem.exam_title}</strong></p>
                                        <p>Giảng viên yêu cầu: <strong>{selectedItem.teacher_name}</strong></p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-2 uppercase tracking-wide">
                                    Đề xuất: {getActionBadge(selectedItem.action_type)}
                                </h4>
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm leading-relaxed font-medium italic">
                                    "{selectedItem.reason}"
                                </div>
                            </div>

                            {selectedItem.status === 'pending' ? (
                                <div className="border-t border-slate-100 pt-6 space-y-5">
                                    
                              
                                    {selectedItem.action_type === 'deduct_points' && (
                                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                            <label className="block text-sm font-bold text-orange-800 mb-2">Số điểm chốt trừ <span className="text-rose-500">*</span></label>
                                            <input 
                                                type="number" step="0.5" min="0" max="10"
                                                value={penaltyPoints} onChange={(e) => setPenaltyPoints(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-lg border border-orange-200 focus:border-orange-500 outline-none"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            Ghi chú của Ban Quản Trị {selectedItem.action_type === 'request_expulsion' && <span className="text-rose-500">*</span>}
                                        </label>
                                        <textarea 
                                            rows="3" value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                                            placeholder="Ghi chú này sẽ được gửi cho Giảng viên và Sinh viên qua hệ thống Thông báo..."
                                            className="w-full border-2 border-slate-200 p-4 rounded-xl outline-none focus:border-blue-500 text-sm resize-none"
                                        ></textarea>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            onClick={() => handleResolve('rejected')} disabled={processing}
                                            className="flex-1 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                                        >
                                            <XCircle className="w-5 h-5"/> Từ chối yêu cầu
                                        </button>
                                        <button 
                                            onClick={() => handleResolve('approved')} disabled={processing}
                                            className={`flex-1 py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition ${selectedItem.action_type === 'request_expulsion' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                        >
                                            {processing ? <Loader2 className="w-5 h-5 animate-spin"/> : <CheckCircle className="w-5 h-5" />} 
                                            Phê duyệt Quyết định
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-t border-slate-100 pt-6">
                                    <h4 className="font-bold text-sm text-slate-700 mb-2 uppercase tracking-wide">Kết quả phê duyệt:</h4>
                                    <div className={`p-4 border rounded-xl ${selectedItem.status === 'approved' ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                                        <p className="font-bold text-slate-800 mb-1 flex items-center gap-2">Trạng thái: {getStatusBadge(selectedItem.status)}</p>
                                        <p className="text-sm text-slate-700 mt-2"><span className="text-slate-500">Ghi chú của Admin:</span> {selectedItem.admin_note || 'Không có'}</p>
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