import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Search, Loader2, Eye, ArrowLeft, Send, ShieldAlert, AlertTriangle, MessageSquare, Users, FileIcon, X, Info, CheckCircle2 } from 'lucide-react';

export default function PostExamManager() {
    const [data, setData] = useState({ reports: [], complaints: [] });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('reports');

    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [complaintDetails, setComplaintDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [action, setAction] = useState('none');
    const [newScore, setNewScore] = useState('');
    const [reason, setReason] = useState('');

    const [selectedReport, setSelectedReport] = useState(null);
    const [reportDetails, setReportDetails] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [reportAction, setReportAction] = useState('reviewing');
    const [reportResolution, setReportResolution] = useState('');

    const [selectedViolator, setSelectedViolator] = useState(null);
    const [violatorAction, setViolatorAction] = useState('warn');
    const [violatorNewScore, setViolatorNewScore] = useState('');
    const [violatorReason, setViolatorReason] = useState('');

    useEffect(() => { 
        fetchData(); 
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/teacher/post-exams');
            setData(res.data);
        } catch (error) {
            toast.error('Lỗi khi tải dữ liệu hậu kiểm');
        } finally {
            setLoading(false);
        }
    };

    
    const handleOpenComplaint = async (complaint) => {
        setSelectedComplaint(complaint); 
        setComplaintDetails(null);
        setAction('none'); setNewScore(''); setReason('');
        setLoadingDetails(true);
        try {
            const res = await api.get(`/teacher/complaints/${complaint.id}/details`);
            setComplaintDetails(res.data);
            
          
            if (complaint.status === 'pending') {
                const updatedComplaint = { ...complaint, status: 'processing' };
                setSelectedComplaint(updatedComplaint);
                setData(prev => ({
                    ...prev,
                    complaints: prev.complaints.map(c => c.id === complaint.id ? updatedComplaint : c)
                }));
            }
        } catch (e) { 
            toast.error('Lỗi lấy chi tiết bài thi'); 
        } finally { 
            setLoadingDetails(false); 
        }
    };

    const submitComplaintResolution = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading('Đang xử lý & Gửi email...');
        try {
            await api.patch(`/teacher/complaints/${selectedComplaint.id}/resolve`, { 
                action, new_score: newScore, reason 
            });
            toast.success('Xử lý thành công!', { id: loadingToast });
            setSelectedComplaint(null);
            fetchData();
        } catch (error) { 
            toast.error(error.response?.data?.message || 'Lỗi xử lý', { id: loadingToast }); 
        }
    };

   
    const handleOpenReport = async (report) => {
        setSelectedReport(report); 
        setReportDetails(null); 
        setSelectedViolator(null);
        
        setReportAction(['completed', 'closed'].includes(report.status) ? report.status : 'reviewing');
        setReportResolution(report.resolution || '');
        
        setLoadingReport(true);
        try {
            const res = await api.get(`/teacher/reports/${report.id}/details`);
            setReportDetails(res.data);
        } catch (e) { 
            toast.error('Lỗi lấy chi tiết báo cáo'); 
        } finally { 
            setLoadingReport(false); 
        }
    };

    const submitReportResolution = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading('Đang lưu quyết định chung...');
        try {
            await api.patch(`/teacher/reports/${selectedReport.id}/resolve`, { 
                status: reportAction, 
                resolution: reportResolution 
            });
            toast.success('Đã cập nhật biên bản chung!', { id: loadingToast });
            setSelectedReport(null);
            fetchData();
        } catch (error) { 
            toast.error(error.response?.data?.message || 'Lỗi xử lý', { id: loadingToast }); 
        }
    };

    const submitViolatorResolution = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading('Đang gửi đề xuất kỷ luật...');
        try {
            await api.post(`/teacher/attempts/${selectedViolator.attempt_id}/resolve-violation`, { 
                action: violatorAction, 
                penalty_points: violatorNewScore, 
                reason: violatorReason,
                report_id: selectedReport.id 
            });
            toast.success('Đã gửi đề xuất thành công!', { id: loadingToast });
            setSelectedViolator(null);
            handleOpenReport(selectedReport); 
        } catch (error) { 
            toast.error(error.response?.data?.message || 'Lỗi xử lý cá nhân', { id: loadingToast }); 
        }
    };

    
    const getStatusBadge = (status) => {
        switch (status) {
            case 'draft': return <span className="px-3 py-1  rounded-lg text-xs font-bold">Nháp</span>;
            case 'submitted': return <span className="px-3 py-1  rounded-lg text-xs font-bold">Mới nộp</span>;
            case 'reviewing': return <span className="px-3 py-1  rounded-lg text-xs font-bold">Đang xem xét</span>;
            case 'processing': return <span className="px-3 py-1  rounded-lg text-xs font-bold">Đang xử lý</span>;
            case 'completed': 
            case 'processed': return <span className="px-3 py-1  rounded-lg text-xs font-bold">Đã xử lý</span>;
            case 'closed': return <span className="px-3 py-1  rounded-lg text-xs font-bold">Đã đóng</span>;
            case 'pending': return <span className="px-3 py-1  rounded-lg text-xs font-bold">Chờ xử lý</span>;
            case 'resolved': return <span className="px-3 py-1  rounded-lg text-xs font-bold">Đã giải quyết</span>;
            case 'rejected': return <span className="px-3 py-1  rounded-lg text-xs font-bold">Từ chối</span>;
            default: return <span className="px-3 py-1  rounded-lg text-xs font-bold">{status}</span>;
        }
    };

    const filteredReports = data.reports.filter(r => 
        (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.exam?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredComplaints = data.complaints.filter(c => 
        (c.student_user?.student?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.exam?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Xử lý Hậu kiểm</h1>
                <p className="text-slate-500 mt-1">Nơi Giảng viên xử lý khiếu nại và xem báo cáo tổng kết ca thi.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-100">
                    <button 
                        onClick={() => setActiveTab('reports')} 
                        className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'reports' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Biên bản Ca thi ({data.reports.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('complaints')} 
                        className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'complaints' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Khiếu nại của học viên ({data.complaints.length})
                    </button>
                </div>

                <div className="p-4 border-b border-slate-100 bg-white">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" placeholder={activeTab === 'reports' ? "Tìm theo tên biên bản, môn thi..." : "Tìm tên sinh viên, môn thi..."} 
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none font-medium ${activeTab === 'reports' ? 'focus:border-blue-500' : 'focus:border-orange-500'}`} 
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>
                ) : (
                    <div className="overflow-x-auto">
                        {activeTab === 'reports' && (
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Tên Biên bản</th>
                                        <th className="px-6 py-4">Ca thi</th>
                                        <th className="px-6 py-4">Giám thị</th>
                                        <th className="px-6 py-4 text-center">Trạng thái</th>
                                        <th className="px-6 py-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredReports.map((report) => (
                                        <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-800">{report.title}</td>
                                            <td className="px-6 py-4">{report.exam?.title || 'N/A'}</td>
                                            <td className="px-6 py-4 font-medium">{report.proctor?.email || 'N/A'}</td>
                                            <td className="px-6 py-4 text-center">{getStatusBadge(report.status)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleOpenReport(report)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold text-xs transition">
                                                    <Eye className="w-4 h-4 inline mr-1" /> Mở chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredReports.length === 0 && <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-500">Chưa có biên bản nào.</td></tr>}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'complaints' && (
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Sinh viên</th>
                                        <th className="px-6 py-4">Môn thi</th>
                                        <th className="px-6 py-4">Loại khiếu nại</th>
                                        <th className="px-6 py-4 text-center">Trạng thái</th>
                                        <th className="px-6 py-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredComplaints.map((comp) => (
                                        <tr key={comp.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{comp.student_user?.student?.name}</div>
                                                <div className="text-xs text-slate-500">{comp.student_user?.student?.student_code}</div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-700">{comp.exam?.title || 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                {comp.type === 'grade_review' ? <span className=" font-bold">Phúc khảo điểm</span> : <span className="font-bold">Lỗi kỹ thuật</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">{getStatusBadge(comp.status)}</td>
                                            <td className="px-6 py-4 text-right">
                                                {['pending', 'processing'].includes(comp.status) ? (
                                                    <button onClick={() => handleOpenComplaint(comp)} className="px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg font-bold text-xs transition">
                                                        <MessageSquare className="w-4 h-4 inline mr-1" /> Giải quyết
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleOpenComplaint(comp)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold text-xs transition">
                                                        <Eye className="w-4 h-4 inline mr-1" /> Mở chi tiết
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredComplaints.length === 0 && <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-500">Chưa có khiếu nại nào.</td></tr>}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

           
            {selectedReport && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-6xl h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b flex justify-between items-center bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-slate-800">{selectedReport.title}</h2>
                                {getStatusBadge(selectedReport.status)}
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="flex-1 flex overflow-hidden">
                            <div className="flex-1 border-r border-slate-200 bg-slate-50/50 flex flex-col overflow-hidden relative">
                                {selectedViolator ? (
                                    <div className="flex flex-col h-full absolute inset-0 bg-white z-10 animate-in slide-in-from-right-8 duration-300">
                                        <div className="p-5 border-b border-slate-100 shrink-0 flex items-center gap-3">
                                            <button onClick={() => setSelectedViolator(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition"><ArrowLeft className="w-4 h-4 text-slate-700" /></button>
                                            <h3 className="font-bold text-lg text-slate-800">Chi tiết vi phạm cá nhân</h3>
                                        </div>
                                        <div className="flex-1 p-6 overflow-y-auto">
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-slate-800 text-lg">{selectedViolator.student_name}</p>
                                                    <p className="text-sm text-slate-500 mt-1">{selectedViolator.student_code}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm mb-1">Trạng thái: <span className="font-bold">{selectedViolator.status === 'submitted' ? 'Đã nộp' : (selectedViolator.status === 'suspended' ? 'Đình chỉ' : 'Đang thi')}</span></p>
                                                    <p className="text-sm">Điểm số: <span className="font-bold text-xl">{selectedViolator.current_score}</span></p>
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-sm text-slate-700 mb-4">Lịch sử ghi nhận ({selectedViolator.violation_count} lần):</h4>
                                            <div className="space-y-3">
                                                {selectedViolator.logs?.map((log, lIdx) => (
                                                    <div key={lIdx} className="border-2 border-slate-200 p-4 rounded-xl flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-full text-rose-600 flex items-center justify-center shrink-0"><AlertTriangle className="w-4 h-4"/></div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-bold text-sm">{log.type}</span>
                                                                <span className="text-xs font-bold">{log.time}</span>
                                                            </div>
                                                            <p className="text-sm text-slate-600">{log.detail}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-full absolute inset-0">
                                        <div className="p-6 pb-4 shrink-0 border-b border-slate-200 bg-white">
                                            <h3 className="font-bold text-slate-800 text-lg mb-2">Đánh giá của giám thị</h3>
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <p className="text-sm">"{selectedReport.content || 'Không có nội dung mô tả từ giám thị.'}"</p>
                                                <div className="mt-3 flex gap-4 text-sm font-medium">
                                                    <span className="flex items-center gap-1"><Users className="w-4 h-4"/> Tham gia: {reportDetails?.participated_count || 0} Học viên</span>
                                                    <span className="flex items-center gap-1 text-rose-600"><AlertTriangle className="w-4 h-4"/> Vi phạm: {reportDetails?.violators?.length || 0} Học viên</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto bg-white max-h-[calc(95vh-240px)] custom-scrollbar">
                                            {loadingReport ? (
                                                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>
                                            ) : reportDetails?.violators?.length > 0 ? (
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                                        <tr className="text-xs uppercase border-b border-slate-200">
                                                            <th className="px-6 py-4 font-bold">Sinh viên</th>
                                                            <th className="px-6 py-4 font-bold text-center">Trạng thái</th>
                                                            <th className="px-6 py-4 font-bold text-center">Số lần vi phạm</th>
                                                            <th className="px-6 py-4 font-bold text-center">Tình trạng xử lý</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {reportDetails.violators.map((v, i) => (
                                                            <tr key={i} onClick={() => { 
                                                                setSelectedViolator(v); 
                                                                setViolatorAction('warn'); 
                                                                setViolatorNewScore(''); 
                                                                setViolatorReason(''); 
                                                            }} className="hover:bg-blue-100 cursor-pointer transition group">
                                                                <td className="px-6 py-4">
                                                                    <p className="font-bold text-slate-800 text-sm transition">{v.student_name}</p>
                                                                    <p className="text-xs text-slate-500">{v.student_code}</p>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${v.status === 'submitted' ? '' : (v.status === 'suspended' ? '' : '')}`}>
                                                                        {v.status === 'submitted' ? 'Đã nộp' : (v.status === 'suspended' ? 'Đình chỉ' : 'Đang thi')}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <span className="px-3 py-1 rounded-lg text-xs font-bold">{v.violation_count}</span>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    {v.handled_action ? (
                                                                        <span className=" font-bold px-3 py-1 rounded-md text-[11px] flex justify-center items-center gap-1 w-max mx-auto">
                                                                            Đã đề xuất
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-amber-600 font-bold text-xs">Cần xử lý</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="flex justify-center items-center h-full text-slate-400 italic text-sm p-10">Không có sinh viên vi phạm.</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="w-full lg:w-[400px] bg-white shrink-0 shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)] z-10 flex flex-col">
                                {selectedViolator ? (
                                    <div className="p-6 flex flex-col h-full bg-white">
                                        <h3 className="font-bold text-lg mb-6 text-slate-800">Quyết định xử lý cá nhân</h3>
                                        
                                      
                                        {selectedViolator.handled_action ? (
                                            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                                                <div className="bg-slate-200 p-4 rounded-xl border border-slate-100">
                                                    <p className=" text-sm font-bold flex items-center gap-2 mb-2">
                                                        <CheckCircle2 className="w-5 h-5"/> Đã gửi đề xuất kỷ luật
                                                    </p>
                                                    <p className="text-xs text-slate-600 mt-2">Hành động: <strong className="uppercase">{selectedViolator.handled_action.action}</strong></p>
                                                    <p className="text-xs text-slate-600 mt-1">Lý do: {selectedViolator.handled_action.reason}</p>
                                                    <p className="text-xs text-slate-600 mt-1">Trạng thái: <strong className="uppercase ">{selectedViolator.handled_action.status}</strong></p>
                                                </div>
                                            </div>
                                        ) : (
                                            <form onSubmit={submitViolatorResolution} className="space-y-5 flex-1 overflow-y-auto pr-1">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">Hành động áp dụng</label>
                                                    <select value={violatorAction} onChange={e => setViolatorAction(e.target.value)} className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none bg-slate-50 font-bold text-sm">
                                                        <option value="warn">Cảnh cáo (Không trừ điểm)</option>
                                                        <option value="deduct_points">Trừ điểm bài thi</option>
                                                        <option value="cancel_exam">Hủy bài thi (0 điểm)</option>
                                                        <option value="request_expulsion">Tạo Yêu cầu Đuổi học</option>
                                                    </select>
                                                </div>
                                                {violatorAction === 'deduct_points' && (
                                                    <div className="animate-in fade-in slide-in-from-top-2">
                                                        <label className="block text-sm font-bold mb-2">Số điểm cần trừ</label>
                                                        <input type="number" step="0.5" required min="0.5" max="10" value={violatorNewScore} onChange={e => setViolatorNewScore(e.target.value)} className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none font-bold text-lg" placeholder=""/>
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">Lý do trình lên Quản trị viên</label>
                                                    <textarea required rows="6" value={violatorReason} onChange={e => setViolatorReason(e.target.value)} className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none bg-slate-50 text-sm resize-none" placeholder="Viết chi tiết lý do đề xuất kỷ luật..."></textarea>
                                                </div>
                                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                    <p className="text-xs font-medium ">Đề xuất sẽ được gửi đến Ban quản trị để chờ duyệt. Chưa trừ điểm ngay lập tức.</p>
                                                </div>
                                                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-md mt-auto">
                                                    Gửi Đề xuất Lên BQT
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-6 flex flex-col h-full bg-white">
                                        <h3 className="font-bold text-lg mb-6 text-slate-800">Cập nhật Biên bản</h3>
                                        <form onSubmit={submitReportResolution} className="space-y-5 flex-1 overflow-y-auto pr-1">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Trạng thái xử lý</label>
                                                <select 
                                                    value={reportAction} 
                                                    onChange={e => setReportAction(e.target.value)} 
                                                    disabled={['completed', 'closed'].includes(selectedReport.status)}
                                                    className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 bg-slate-50 font-bold text-sm text-slate-700 disabled:opacity-70 disabled:cursor-not-allowed"
                                                >
                                                    <option value="reviewing">Đang xem xét</option>
                                                    <option value="completed">Đã xử lý xong</option>
                                                    <option value="closed" disabled>Đã đóng</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Phản hồi</label>
                                                <textarea 
                                                    rows="6" 
                                                    value={reportResolution} 
                                                    onChange={e => setReportResolution(e.target.value)} 
                                                    disabled={['completed', 'closed'].includes(selectedReport.status)}
                                                    className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 bg-slate-50 text-sm resize-none disabled:opacity-70 disabled:cursor-not-allowed" 
                                                    placeholder="Ghi chú xác nhận đã đọc/xử lý..."
                                                ></textarea>
                                            </div>
                                            <button 
                                                type="submit" 
                                                disabled={['completed', 'closed'].includes(selectedReport.status)} 
                                                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed mt-auto"
                                            >
                                                Lưu Trạng Thái
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        
            {selectedComplaint && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-6xl h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b flex justify-between items-center bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-slate-800">Xử lý khiếu nại: {selectedComplaint.student_user?.student?.name}</h2>
                                {/* {getStatusBadge(selectedComplaint.status)} */}
                            </div>
                            <button onClick={() => { setSelectedComplaint(null); fetchData(); }} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="flex-1 flex overflow-hidden">
                            <div className="flex-1 p-6 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
                                <h3 className="font-bold text-lg mb-4 text-slate-800 shrink-0">Nội dung khiếu nại</h3>
                                
                                {complaintDetails?.report_context && (
                                    <div className="bg-slate-50 p-4 mb-3 shrink-0 border border-slate-200 rounded-xl relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-slate-400"></div>
                                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Info className="w-3 h-3"/> Ghi chú từ Giám thị:</h4>
                                        <p className="text-sm text-slate-700 font-medium">"{complaintDetails.report_context.content || 'Không có mô tả vi phạm nào trong ca thi.'}"</p>
                                    </div>
                                )}

                                <div className="bg-slate-100 p-4 mb-6 shrink-0  rounded-xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full "></div>
                                    <p className="text-sm text-slate-700 font-medium italic">"{selectedComplaint.content}"</p>
                                    {selectedComplaint.evidence_url && (
                                        <a href={selectedComplaint.evidence_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm font-bold flex items-center gap-1 mt-3 pt-3 border-t border-orange-200/50">
                                            <FileIcon className="w-4 h-4"/> Xem minh chứng đính kèm
                                        </a>
                                    )}
                                </div>

                                <h3 className="font-bold text-lg mb-4 text-slate-800 shrink-0">Chi tiết bài làm</h3>
                                {loadingDetails ? (
                                    <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>
                                ) : complaintDetails?.attempt ? (
                                    <div className="flex flex-col flex-1 overflow-hidden">
                                        <div className="flex justify-between p-4 rounded-xl font-bold mb-4 shrink-0 shadow-inner bg-slate-50 border border-slate-200">
                                            <span>Điểm hiện tại: {complaintDetails.attempt.total_score}</span>
                                            <span>Vi phạm: {complaintDetails.attempt.violation_count} lần</span>
                                        </div>

                                        <div className="flex-1 overflow-y-auto pr-3 space-y-4 custom-scrollbar">
                                            {complaintDetails.answers?.map((ans, i) => (
                                                <div key={i} className={`p-5 rounded-xl border bg-white shadow-sm ${ans.is_correct ? 'border-emerald-600' : 'border-rose-600'}`}>
                                                    <div className="font-bold text-sm text-slate-800 mb-4 flex items-start gap-2">
                                                        <span className="shrink-0 text-slate-500">Câu {i+1}:</span>
                                                        <span dangerouslySetInnerHTML={{__html: ans.question?.content}}></span>
                                                    </div>

                                                    {ans.question?.type !== 'fill_blank' && ans.question?.choices && (
                                                        <div className="space-y-2 mb-4">
                                                            {ans.question.choices.map(choice => {
                                                                const isStudentChoice = String(choice.id) === String(ans.choice_id);
                                                                const isCorrectChoice = choice.is_correct == 1 || choice.is_correct === true;
                                                                
                                                                let choiceClass = "p-3 rounded-xl border text-sm flex items-center justify-between transition-colors ";
                                                                if (isStudentChoice) {
                                                                    choiceClass += isCorrectChoice ? "bg-emerald-100 border-emerald-200 text-emerald-900 font-bold" : "bg-slate-50 border-rose-400 text-slate-800 font-bold";
                                                                } else {
                                                                    choiceClass += "bg-white border-slate-300 text-slate-600";
                                                                }

                                                                return (
                                                                    <div key={choice.id} className={choiceClass}>
                                                                        <span className="flex-1">{choice.choice_key}. {choice.choice_text}</span>
                                                                        <div className="shrink-0 flex items-center gap-2">
                                                                            {isStudentChoice && <span className="text-[10px] px-2 py-1 rounded bg-white border border-slate-200 shadow-sm font-bold">Đã chọn</span>}
                                                                            {isCorrectChoice && !isStudentChoice && <span className="text-[10px] px-2 py-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold">Đáp án đúng</span>}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {ans.question?.type === 'fill_blank' && (
                                                        <div className="space-y-2 mt-3">
                                                            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                                                                <span className="text-xs text-slate-500 block mb-1">Học viên nhập:</span>
                                                                <strong className={`text-base ${ans.is_correct ? 'text-emerald-600' : 'text-rose-600'}`}>{ans.answer_text || '(Bỏ trống)'}</strong>
                                                            </div>
                                                            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50">
                                                                <span className="text-xs text-emerald-600 block mb-1">Hệ thống chấp nhận:</span>
                                                                <strong className="text-sm text-emerald-700">{ans.question.fill_blank_answers?.map(a => a.accepted_text).join(' HOẶC ')}</strong>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-rose-500 text-center py-10 bg-white rounded-xl border border-rose-100">Không tìm thấy dữ liệu bài thi.</p>
                                )}
                            </div>

                            <div className="w-full lg:w-[400px] bg-white shrink-0 shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)] z-10 flex flex-col p-6">
                                <h3 className="font-bold text-lg mb-6 text-slate-800">Quyết định xử lý</h3>
                                
                                {['resolved', 'rejected'].includes(selectedComplaint.status) ? (
                                    <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                            <p className="text-slate-800 text-sm font-bold flex items-center gap-2 mb-2">
                                                <CheckCircle2 className="w-5 h-5 "/> Đã giải quyết xong
                                            </p>
                                            <p className="text-sm text-slate-700 mt-2 italic">"{selectedComplaint.response}"</p>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={submitComplaintResolution} className="space-y-5 flex-1 overflow-y-auto pr-1">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Hành động</label>
                                            <select value={action} onChange={e => setAction(e.target.value)} className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none bg-slate-50 font-bold text-sm text-slate-700">
                                                <option value="none">Chỉ gửi email giải thích (Giữ nguyên điểm)</option>
                                                <option value="adjust_score">Cập nhật lại điểm số mới</option>
                                            </select>
                                        </div>

                                        {action === 'adjust_score' && (
                                            <div className="animate-in fade-in slide-in-from-top-2">
                                                <label className="block text-sm font-bold mb-2">Nhập điểm mới</label>
                                                <input type="number" step="0.1" required min="0" max="10" value={newScore} onChange={e => setNewScore(e.target.value)} className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none font-bold text-lg" placeholder=""/>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Phản hồi và Giải thích</label>
                                            <textarea required rows="6" value={reason} onChange={e => setReason(e.target.value)} className="w-full border-2 border-slate-200 p-4 rounded-xl outline-none focus:border-blue-500 bg-slate-50 text-sm text-slate-700 resize-none" placeholder="Viết phản hồi chi tiết tại đây..."></textarea>
                                        </div>

                                        <div className="p-4 rounded-xl mb-4">
                                            <p className="text-xs font-medium">Hệ thống sẽ tự động gửi 1 Email phản hồi đến địa chỉ của <strong className="font-bold">{selectedComplaint.student_user?.student?.name}</strong>.</p>
                                        </div>

                                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md mt-auto">
                                            <Send className="w-4 h-4"/> Lưu & Gửi Email Phản Hồi
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}