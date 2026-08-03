import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ShieldAlert, MessageSquareWarning, Check, Loader2, Eye, X, Send, AlertTriangle, Users, FileIcon, ArrowLeft } from 'lucide-react';

export default function PostExamManager() {
    const [data, setData] = useState({ reports: [], complaints: [] });
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
    const [reportAction, setReportAction] = useState('warn');
    const [reportResolution, setReportResolution] = useState('');
    const [reportPenaltyPoints, setReportPenaltyPoints] = useState('');


    const [selectedViolator, setSelectedViolator] = useState(null);
    const [violatorAction, setViolatorAction] = useState('cancel_exam');
    const [violatorNewScore, setViolatorNewScore] = useState('');
    const [violatorReason, setViolatorReason] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        const res = await api.get('/teacher/post-exams');
        setData(res.data);
    };

   
    const handleOpenComplaint = async (complaint) => {
        setSelectedComplaint(complaint); setComplaintDetails(null);
        setAction('none'); setNewScore(''); setReason('');
        setLoadingDetails(true);
        try {
            const res = await api.get(`/teacher/complaints/${complaint.id}/details`);
            setComplaintDetails(res.data);
        } catch (e) { toast.error('Lỗi lấy chi tiết bài thi'); }
        finally { setLoadingDetails(false); }
    };

    const submitComplaintResolution = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading('Đang xử lý & Gửi email...');
        try {
            await api.put(`/teacher/complaints/${selectedComplaint.id}/resolve`, { action, new_score: newScore, reason });
            toast.success('Xử lý thành công!', { id: loadingToast });
            setSelectedComplaint(null);
            fetchData();
        } catch (error) { toast.error('Lỗi xử lý', { id: loadingToast }); }
    };

   
    const handleOpenReport = async (report) => {
        setSelectedReport(report); setReportDetails(null); setSelectedViolator(null);
        setReportAction('warn'); setReportResolution(''); setReportPenaltyPoints('');
        setLoadingReport(true);
        try {
            const res = await api.get(`/teacher/reports/${report.id}/details`);
            setReportDetails(res.data);
        } catch (e) { toast.error('Lỗi lấy chi tiết báo cáo'); }
        finally { setLoadingReport(false); }
    };

    const submitReportResolution = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading('Đang lưu quyết định chung...');
        try {
            await api.put(`/teacher/reports/${selectedReport.id}/resolve`, { action: reportAction, resolution: reportResolution, penalty_points: reportPenaltyPoints });
            toast.success('Đã xử lý biên bản chung!', { id: loadingToast });
            setSelectedReport(null);
            fetchData();
        } catch (error) { toast.error('Lỗi xử lý', { id: loadingToast }); }
    };

    const submitViolatorResolution = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading('Đang xử lý & Gửi email học viên...');
        try {
            await api.put(`/teacher/attempts/${selectedViolator.attempt_id}/resolve-violation`, { action: violatorAction, new_score: violatorNewScore, reason: violatorReason });
            toast.success('Đã xử lý vi phạm cá nhân!', { id: loadingToast });
            setSelectedViolator(null);
            handleOpenReport(selectedReport);
        } catch (error) { toast.error('Lỗi xử lý cá nhân', { id: loadingToast }); }
    };

    return (
        <div className="space-y-6 font-sans pb-10">
            <div><h1 className="text-2xl font-bold text-slate-800">Xử lý Hậu kiểm (Post-Exam)</h1><p className="text-slate-500 mt-1">Nơi Giảng viên phân xử khiếu nại và xem báo cáo tổng kết ca thi.</p></div>

            <div className="flex gap-4 border-b border-slate-200">
                <button onClick={() => setActiveTab('reports')} className={`pb-3 px-4 font-bold border-b-2 transition ${activeTab === 'reports' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Báo cáo Ca thi (Giám thị)</button>
                <button onClick={() => setActiveTab('complaints')} className={`pb-3 px-4 font-bold border-b-2 transition ${activeTab === 'complaints' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Khiếu nại Học viên</button>
            </div>

            {activeTab === 'reports' && (
                <div className="grid gap-4">
                    {data.reports.map(r => (
                        <div key={r.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex justify-between items-start hover:shadow-md transition">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.status === 'processed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{r.status === 'processed' ? 'Đã duyệt' : 'Chờ duyệt'}</span>
                                    <span className="text-sm font-bold text-slate-400">{new Date(r.created_at).toLocaleString('vi-VN')}</span>
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-rose-500"/> Báo cáo: {r.exam?.title || r.title}</h3>
                                <p className="text-sm mt-2 text-slate-600">Giám thị báo cáo: <strong className="text-slate-800">{r.proctor?.name}</strong></p>
                                <div className="mt-3 bg-rose-50 border border-rose-100 p-4 rounded-xl text-sm text-rose-900 font-medium">
                                    {r.content ? r.content : 'Không có nội dung mô tả từ giám thị.'}
                                </div>
                            </div>
                            <div className="ml-6 flex flex-col gap-2">
                                <button onClick={() => handleOpenReport(r)} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"><Eye className="w-4 h-4"/> Mở chi tiết & Xử lý</button>
                            </div>
                        </div>
                    ))}
                    {data.reports.length === 0 && <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-500">Chưa có báo cáo nào từ giám thị.</div>}
                </div>
            )}

            {activeTab === 'complaints' && (
                <div className="grid gap-4">
                    {data.complaints.map(c => (
                        <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex justify-between items-start hover:shadow-md transition">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${c.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{c.status === 'resolved' ? 'Đã giải quyết' : 'Đang chờ xử lý'}</span>
                                    <span className="text-sm font-bold text-slate-400">{new Date(c.created_at).toLocaleString('vi-VN')}</span>
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><MessageSquareWarning className="w-5 h-5 text-blue-500"/> Kỳ thi: {c.exam?.title}</h3>
                                <p className="text-sm mt-2 text-slate-600">Học viên: <strong className="text-slate-800">{c.student_user?.student?.name}</strong></p>
                            </div>
                            <div className="ml-6 flex flex-col gap-2">
                                <button onClick={() => handleOpenComplaint(c)} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"><Eye className="w-4 h-4"/> Mở chi tiết & Xử lý</button>
                            </div>
                        </div>
                    ))}
                    {data.complaints.length === 0 && <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-500">Chưa có khiếu nại nào cần xử lý.</div>}
                </div>
            )}

   
            {selectedReport && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-6xl h-[95vh] flex flex-col shadow-2xl overflow-hidden">
                        

                        <div className="p-5 border-b flex justify-between items-center bg-white shrink-0">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">Xử lý báo cáo: {selectedReport.title}</h2>
                            <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="flex-1 flex overflow-hidden">
           
                            <div className="flex-1 border-r border-slate-200 bg-slate-50/50 flex flex-col overflow-hidden relative">
                
                                {selectedViolator ? (
                                    <div className="flex flex-col h-full absolute inset-0 bg-white z-10 animate-in slide-in-from-right-full duration-300">
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
                                                    <p className="text-sm text-slate-500 mb-1">Trạng thái: <span className="font-bold text-emerald-600">{selectedViolator.status === 'submitted' ? 'Đã nộp' : (selectedViolator.status === 'suspended' ? 'Đình chỉ' : 'Đang thi')}</span></p>
                                                    <p className="text-sm text-slate-500">Điểm số: <span className="font-bold text-slate-800 text-xl">{selectedViolator.current_score}</span></p>
                                                </div>
                                            </div>

                                            <h4 className="font-bold text-sm text-slate-700 mb-4">Lịch sử ghi nhận ({selectedViolator.violation_count} lần):</h4>
                                            <div className="space-y-3">
                                                {selectedViolator.logs.map((log, lIdx) => (
                                                    <div key={lIdx} className="border border-rose-100 bg-rose-50 p-4 rounded-xl flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0"><AlertTriangle className="w-4 h-4"/></div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-bold text-sm text-rose-700">{log.type}</span>
                                                                <span className="text-xs font-bold text-slate-400">{log.time}</span>
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
                                                <p className="text-slate-700 text-sm">"{selectedReport.content}"</p>
                                                <div className="mt-3 flex gap-4 text-sm text-slate-500 font-medium">
                                                    <span className="flex items-center gap-1"><Users className="w-4 h-4"/> Tham gia: {reportDetails?.participated_count || 0} HS</span>
                                                    <span className="flex items-center gap-1 text-rose-600"><AlertTriangle className="w-4 h-4"/> Vi phạm: {reportDetails?.violators.length || 0} HS</span>
                                                </div>
                                            </div>
                                        </div>

                    
                                        <div className="flex-1 overflow-y-auto bg-white max-h-[calc(95vh-240px)] custom-scrollbar">
                                            {loadingReport ? (
                                                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>
                                            ) : reportDetails?.violators.length > 0 ? (
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                                        <tr className="text-xs text-slate-500 uppercase border-b border-slate-200">
                                                            <th className="px-6 py-4 font-bold">Sinh viên</th>
                                                            <th className="px-6 py-4 font-bold text-center">Trạng thái</th>
                                                            <th className="px-6 py-4 font-bold text-center">Số lần vi phạm</th>
                                                            <th className="px-6 py-4 font-bold text-center">Điểm số</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {reportDetails.violators.map((v, i) => (
                                                            <tr key={i} onClick={() => { setSelectedViolator(v); setViolatorAction('cancel_exam'); setViolatorNewScore(''); setViolatorReason(''); }} className="hover:bg-blue-50/50 cursor-pointer transition group">
                                                                <td className="px-6 py-4">
                                                                    <p className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition">{v.student_name}</p>
                                                                    <p className="text-xs text-slate-500">{v.student_code}</p>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${v.status === 'submitted' ? 'bg-emerald-100 text-emerald-700' : (v.status === 'suspended' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700')}`}>
                                                                        {v.status === 'submitted' ? 'Đã nộp' : (v.status === 'suspended' ? 'Đình chỉ' : 'Đang thi')}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-lg text-xs font-bold">{v.violation_count}</span>
                                                                </td>
                                                                <td className="px-6 py-4 text-center font-bold text-slate-800 text-base">
                                                                    {v.current_score}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="flex justify-center items-center h-full text-slate-400 italic text-sm p-10">Ca thi an toàn. Không có sinh viên vi phạm.</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                          
                            <div className="w-full lg:w-[400px] bg-white shrink-0 shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)] z-10 flex flex-col">
                                {selectedViolator ? (
                                    <div className="p-6 flex flex-col h-full bg-white">
                                        <h3 className="font-bold text-lg mb-6 text-slate-800">Quyết định xử lý cá nhân</h3>
                                        <form onSubmit={submitViolatorResolution} className="space-y-5 flex-1 overflow-y-auto pr-1">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Hành động áp dụng</label>
                                                <select value={violatorAction} onChange={e => setViolatorAction(e.target.value)} className="w-full border-2 border-rose-200 p-3 rounded-xl outline-none focus:border-rose-500 bg-slate-50 font-bold text-sm text-slate-700">
                                                    <option value="cancel_exam">Hủy bài thi của SV này (0 điểm)</option>
                                                    <option value="adjust_score">Điều chỉnh lại điểm thi</option>
                                                    <option value="request_expulsion">Tạo Yêu cầu Đuổi học (Gửi Admin)</option>
                                                </select>
                                            </div>

                                            {violatorAction === 'adjust_score' && (
                                                <div className="animate-in fade-in slide-in-from-top-2">
                                                    <label className="block text-sm font-bold text-rose-700 mb-2">Nhập điểm mới</label>
                                                    <input type="number" step="0.1" required min="0" max="10" value={violatorNewScore} onChange={e => setViolatorNewScore(e.target.value)} className="w-full border-2 border-rose-200 focus:border-rose-500 p-3 rounded-xl outline-none font-bold text-lg text-rose-700" placeholder="VD: 0"/>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Phản hồi & Giải thích (Gửi Email SV)</label>
                                                <textarea required rows="6" value={violatorReason} onChange={e => setViolatorReason(e.target.value)} className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-rose-500 bg-slate-50 text-sm resize-none" placeholder="Viết chi tiết lý do xử phạt..."></textarea>
                                            </div>

                                            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                                                <p className="text-xs text-rose-800 font-medium">Hệ thống sẽ gửi thông báo quyết định đến <strong className="font-bold">{selectedViolator.student_name}</strong>.</p>
                                            </div>

                                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-md">
                                                Lưu & Gửi Email Phản Hồi
                                            </button>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="p-6 flex flex-col h-full bg-white">
                                        <h3 className="font-bold text-lg mb-6 text-slate-800">Quyết định xử lý chung</h3>
                                        <form onSubmit={submitReportResolution} className="space-y-5 flex-1 overflow-y-auto pr-1">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Hành động hệ thống</label>
                                                <select value={reportAction} onChange={e => setReportAction(e.target.value)} className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 bg-slate-50 font-bold text-sm text-slate-700">
                                                    <option value="warn">Xác nhận báo cáo (Giữ nguyên KQ)</option>
                                                    <option value="deduct_points">Trừ điểm toàn bộ Học viên có vi phạm</option>
                                                    <option value="cancel_exam">Hủy toàn bộ ca thi (Cho thi lại)</option>
                                                </select>
                                            </div>

                                            {reportAction === 'deduct_points' && (
                                                <div className="animate-in fade-in slide-in-from-top-2">
                                                    <label className="block text-sm font-bold text-amber-600 mb-2">Số điểm trừ cho mỗi SV vi phạm</label>
                                                    <input type="number" step="0.5" required min="0" max="10" value={reportPenaltyPoints} onChange={e => setReportPenaltyPoints(e.target.value)} className="w-full border-2 border-amber-200 focus:border-amber-500 p-3 rounded-xl outline-none font-bold text-lg text-amber-700" placeholder="VD: 2.5"/>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Phản hồi cho Giám thị</label>
                                                <textarea required rows="6" value={reportResolution} onChange={e => setReportResolution(e.target.value)} className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 bg-slate-50 text-sm resize-none" placeholder="Ghi chú xác nhận đã xử lý..."></textarea>
                                            </div>

                                            <button type="submit" disabled={selectedReport.status === 'processed'} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-md disabled:opacity-50 mt-auto">
                                                Lưu & Phản hồi
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
                    <div className="bg-white rounded-2xl w-full max-w-6xl h-[95vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-5 border-b flex justify-between items-center bg-white shrink-0">
                            <h2 className="text-xl font-bold text-slate-800">Xử lý khiếu nại: {selectedComplaint.student_user?.student?.name}</h2>
                            <button onClick={() => setSelectedComplaint(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="flex-1 flex overflow-hidden">
                        
                            <div className="flex-1 p-6 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
                                <h3 className="font-bold text-lg mb-4 text-slate-800 shrink-0">Nội dung khiếu nại</h3>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 shrink-0 shadow-sm">
                                    <p className="text-sm text-slate-700">{selectedComplaint.content}</p>
                                    {selectedComplaint.evidence_url && <a href={selectedComplaint.evidence_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm font-bold flex items-center gap-1 mt-3 pt-3 border-t border-slate-100"><FileIcon className="w-4 h-4"/> Xem minh chứng đính kèm</a>}
                                </div>

                                <h3 className="font-bold text-lg mb-4 text-slate-800 shrink-0">Chi tiết bài làm</h3>
                                {loadingDetails ? (
                                    <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>
                                ) : complaintDetails?.attempt ? (
                                    <div className="flex flex-col flex-1 overflow-hidden">
                                        <div className="flex justify-between bg-blue-50 text-blue-900 p-4 rounded-xl font-bold mb-4 shrink-0 shadow-inner">
                                            <span>Điểm hiện tại: {complaintDetails.attempt.total_score}</span>
                                            <span>Vi phạm: {complaintDetails.attempt.violation_count} lần</span>
                                        </div>

                                    
                                        <div className="flex-1 overflow-y-auto pr-3 space-y-4 custom-scrollbar">
                                            {complaintDetails.answers.map((ans, i) => (
                                                <div key={i} className={`p-5 rounded-xl border bg-white shadow-sm ${ans.is_correct ? 'border-emerald-200' : 'border-rose-200'}`}>
                                                    <div className="font-bold text-sm text-slate-800 mb-4 flex items-start gap-2">
                                                        <span className="shrink-0 text-slate-500">Câu {i+1}:</span>
                                                        <span dangerouslySetInnerHTML={{__html: ans.question?.content}}></span>
                                                    </div>

                                                    {ans.question?.type !== 'fill_blank' && ans.question?.choices && (
                                                        <div className="space-y-2 mb-4">
                                                            {ans.question.choices.map(choice => {
                                                                const isStudentChoice = choice.id === ans.choice_id;
                                                                const isCorrectChoice = choice.is_correct === 1;
                                                                
                                                                let choiceClass = "p-3 rounded-xl border text-sm flex items-center justify-between transition-colors ";
                                                                if (isStudentChoice) {
                                                                    choiceClass += isCorrectChoice ? "bg-emerald-50 border-emerald-200 text-emerald-900 font-bold" : "bg-slate-50 border-slate-200 text-slate-800 font-bold";
                                                                } else {
                                                                    choiceClass += "bg-white border-slate-100 text-slate-600";
                                                                }

                                                                return (
                                                                    <div key={choice.id} className={choiceClass}>
                                                                        <span className="flex-1">{choice.choice_key}. {choice.choice_text}</span>
                                                                        <div className="shrink-0 flex items-center gap-2">
                                                                            {isStudentChoice && <span className="text-[10px] px-2 py-1 rounded bg-white border border-slate-200 shadow-sm font-bold">👋 Đã chọn</span>}
                                                                            {isCorrectChoice && !isStudentChoice && <span className="text-[10px] px-2 py-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold">✓ Đáp án đúng</span>}
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

                                                    <div className="text-right mt-3 border-t border-slate-100 pt-3">
                                                        <span className="text-xs font-bold text-slate-500">ĐIỂM: <span className={ans.is_correct ? "text-emerald-600" : "text-rose-600"}>{ans.score_earned} / {ans.question?.score || 0}</span></span>
                                                    </div>
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
                                <form onSubmit={submitComplaintResolution} className="space-y-5 flex-1 overflow-y-auto pr-1">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Hành động hệ thống</label>
                                        <select value={action} onChange={e => setAction(e.target.value)} className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 bg-slate-50 font-bold text-sm text-slate-700">
                                            <option value="none">Chỉ gửi email giải thích (Giữ nguyên điểm)</option>
                                            <option value="adjust_score">Cập nhật lại điểm số mới</option>
                                            <option value="cancel_exam">Hủy toàn bộ bài thi (0 điểm)</option>
                                        </select>
                                    </div>

                                    {action === 'adjust_score' && (
                                        <div className="animate-in fade-in slide-in-from-top-2">
                                            <label className="block text-sm font-bold text-blue-700 mb-2">Nhập điểm mới</label>
                                            <input type="number" step="0.1" required min="0" max="10" value={newScore} onChange={e => setNewScore(e.target.value)} className="w-full border-2 border-blue-200 focus:border-blue-500 p-3 rounded-xl outline-none font-bold text-lg text-blue-700" placeholder="VD: 8.5"/>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Phản hồi & Giải thích (Gửi Email SV)</label>
                                        <textarea required rows="6" value={reason} onChange={e => setReason(e.target.value)} className="w-full border-2 border-slate-200 p-4 rounded-xl outline-none focus:border-blue-500 bg-slate-50 text-sm text-slate-700 resize-none" placeholder="Viết phản hồi chi tiết tại đây..."></textarea>
                                    </div>

                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                                        <p className="text-xs text-blue-800 font-medium">Hệ thống sẽ tự động gửi 1 Email phản hồi đến địa chỉ của <strong className="font-bold">{selectedComplaint.student_user?.student?.name}</strong>.</p>
                                    </div>

                                    <button type="submit" disabled={selectedComplaint.status === 'resolved'} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-md mt-auto">
                                        <Send className="w-4 h-4"/> Lưu & Gửi Email Phản Hồi
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}