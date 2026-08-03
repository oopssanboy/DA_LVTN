import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FileText, AlertCircle, UploadCloud, Send, CheckCircle2, Clock, MoreHorizontal, FileIcon, Loader2, X, XCircle } from 'lucide-react';

export default function ComplaintManager() {
    const [complaints, setComplaints] = useState([]);
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);
    

    const [formData, setFormData] = useState({ exam_id: '', type: 'grade_review', content: '' });
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    const [selectedComplaint, setSelectedComplaint] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [compRes, histRes] = await Promise.all([
                api.get('/student/complaints'),
                api.get('/student/history')
            ]);
            setComplaints(compRes.data);
          
            const historyData = histRes.data.data || histRes.data || [];
            const uniqueExamsMap = new Map();
        
            historyData.forEach(item => {
                if (item.exam && !uniqueExamsMap.has(item.exam.id)) {
                    uniqueExamsMap.set(item.exam.id, item.exam);
                }
            });
            
            setExams(Array.from(uniqueExamsMap.values()));
        } catch (error) {
            toast.error('Lỗi tải dữ liệu');
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.size > 20 * 1024 * 1024) {
            toast.error('File không được vượt quá 20MB');
            return;
        }
        setFile(selectedFile);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const loadingToast = toast.loading('Đang gửi yêu cầu...');

        try {
            const data = new FormData();
            data.append('exam_id', formData.exam_id);
            data.append('type', formData.type);
            data.append('content', formData.content);
            if (file) data.append('evidence', file);

            await api.post('/student/complaints', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            toast.success('Gửi yêu cầu thành công', { id: loadingToast });
            setFormData({ exam_id: '', type: 'grade_review', content: '' });
            setFile(null);
            if(fileInputRef.current) fileInputRef.current.value = '';
            fetchData();
        } catch (error) { 
            toast.error('Lỗi khi gửi yêu cầu', { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    const latestComplaint = complaints.length > 0 ? complaints[0] : null;

    return (
        <div className="max-w-6xl mx-auto space-y-6 font-sans pb-10">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Khiếu nại & Phúc khảo</h1>
                <p className="text-slate-500 mt-2">Gửi yêu cầu xem xét lại điểm số hoặc báo cáo sự cố kỹ thuật trong quá trình làm bài thi.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
              
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800">Tạo yêu cầu mới</h2>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Kỳ thi liên quan <span className="text-red-500">*</span></label>
                                <select 
                                    required value={formData.exam_id} onChange={e => setFormData({...formData, exam_id: e.target.value})}
                                    className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 bg-slate-50 hover:bg-slate-100/50 transition cursor-pointer"
                                >
                                    <option value="">Chọn kỳ thi bạn muốn khiếu nại...</option>
                                    {exams.length > 0 ? exams.map(e => (
                                        <option key={e.id} value={e.id}>{e.title}</option>
                                    )) : (
                                        <option value="" disabled>Bạn chưa có lịch sử làm bài nào.</option>
                                    )}
                                </select>
                            </div>

            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Loại khiếu nại <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition ${formData.type === 'grade_review' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                                        <input type="radio" name="type" value="grade_review" className="hidden" checked={formData.type === 'grade_review'} onChange={() => setFormData({...formData, type: 'grade_review'})} />
                                        <FileText className={`w-5 h-5 ${formData.type === 'grade_review' ? 'text-blue-600' : 'text-slate-400'}`} />
                                        <span className={`font-semibold text-sm ${formData.type === 'grade_review' ? 'text-blue-700' : 'text-slate-600'}`}>Phúc khảo điểm số</span>
                                    </label>
                                    
                                    <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition ${formData.type === 'technical_issue' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                                        <input type="radio" name="type" value="technical_issue" className="hidden" checked={formData.type === 'technical_issue'} onChange={() => setFormData({...formData, type: 'technical_issue'})} />
                                        <AlertCircle className={`w-5 h-5 ${formData.type === 'technical_issue' ? 'text-blue-600' : 'text-slate-400'}`} />
                                        <span className={`font-semibold text-sm ${formData.type === 'technical_issue' ? 'text-blue-700' : 'text-slate-600'}`}>Sự cố kỹ thuật</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nội dung chi tiết <span className="text-red-500">*</span></label>
                                <textarea 
                                    required rows="4" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}
                                    placeholder="Mô tả rõ ràng vấn đề bạn gặp phải hoặc lý do bạn muốn xem xét lại điểm số..." 
                                    className="w-full border border-slate-200 rounded-xl p-4 outline-none focus:border-blue-500 resize-none bg-slate-50"
                                ></textarea>
                            </div>

                   
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Minh chứng đính kèm (Tùy chọn)</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition cursor-pointer relative" onClick={() => fileInputRef.current.click()}>
                                    <input type="file" ref={fileInputRef} className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
                                    {file ? (
                                        <div className="flex flex-col items-center">
                                            <FileIcon className="w-10 h-10 text-blue-500 mb-2" />
                                            <span className="font-semibold text-blue-700">{file.name}</span>
                                            <span className="text-xs text-slate-500 mt-1">Nhấn để đổi file khác</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                                            <p className="text-slate-600 font-medium">Kéo thả file vào đây hoặc <span className="text-blue-600">Chọn file</span></p>
                                            <p className="text-xs text-slate-400 mt-1">Hỗ trợ JPG, PNG, PDF (Tối đa 20MB)</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-70">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Send className="w-4 h-4"/> GỬI YÊU CẦU</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

        
                <div className="space-y-6">
                    
            
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-6">Trạng thái xử lý gần đây</h2>
                        {latestComplaint ? (
                            <div className="relative pl-6 space-y-8 border-l-2 border-slate-100 ml-2">
                        
                                <div className="relative">
                                    <span className="absolute -left-[35px] top-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-white">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    </span>
                                    <h3 className="font-bold text-slate-800">Đã tiếp nhận</h3>
                                    <p className="text-xs font-semibold text-slate-500 mt-1">{new Date(latestComplaint.created_at).toLocaleString('vi-VN')}</p>
                                    <p className="text-sm text-slate-600 mt-2">Yêu cầu {latestComplaint.type === 'grade_review' ? 'phúc khảo điểm' : 'báo cáo sự cố'} môn <span className="font-semibold">{latestComplaint.exam?.title}</span> đã được hệ thống ghi nhận.</p>
                                </div>

                               
                                <div className="relative">
                                    <span className={`absolute -left-[35px] top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white ${latestComplaint.status !== 'pending' ? 'bg-blue-100' : 'bg-slate-100'}`}>
                                        {latestComplaint.status !== 'pending' ? <CheckCircle2 className="w-4 h-4 text-blue-600" /> : <MoreHorizontal className="w-4 h-4 text-slate-400" />}
                                    </span>
                                    <h3 className={`font-bold ${latestComplaint.status !== 'pending' ? 'text-slate-800' : 'text-slate-400'}`}>Đang xử lý</h3>
                                    {latestComplaint.status !== 'pending' && <p className="text-sm text-slate-600 mt-1">Giảng viên đang xem xét.</p>}
                                </div>

                            
                                <div className="relative">
                                    <span className={`absolute -left-[35px] top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white ${latestComplaint.status === 'resolved' ? 'bg-emerald-100' : latestComplaint.status === 'rejected' ? 'bg-rose-100' : 'bg-slate-100'}`}>
                                        {latestComplaint.status === 'resolved' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : latestComplaint.status === 'rejected' ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <div className="w-2 h-2 rounded-full bg-slate-300"></div>}
                                    </span>
                                    <h3 className={`font-bold ${latestComplaint.status === 'resolved' ? 'text-emerald-700' : latestComplaint.status === 'rejected' ? 'text-rose-700' : 'text-slate-400'}`}>Phản hồi</h3>
                                    {latestComplaint.response && (
                                        <div className="mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm text-slate-700">
                                            {latestComplaint.response}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm text-center py-4">Chưa có yêu cầu nào.</p>
                        )}
                    </div>

               
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Lịch sử khiếu nại</h2>
                        <div className="space-y-3">
                            {complaints.length > 0 ? complaints.map(c => (
                                <div key={c.id} onClick={() => setSelectedComplaint(c)} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50 hover:border-blue-200 transition cursor-pointer group">
                                    <div className="flex justify-between items-center mb-2">
                                        {c.status === 'resolved' ? <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-bold">Đã giải quyết</span> 
                                        : c.status === 'rejected' ? <span className="bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full text-xs font-bold">Từ chối</span>
                                        : <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-bold">Đang chờ</span>}
                                        <span className="text-xs font-bold text-slate-400 group-hover:text-blue-500 transition">{new Date(c.created_at).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800">{c.type === 'grade_review' ? 'Phúc khảo điểm số' : 'Sự cố kỹ thuật'}</p>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">Môn: {c.exam?.title}</p>
                                </div>
                            )) : (
                                <p className="text-slate-500 text-sm text-center py-4">Chưa có lịch sử.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

       
            {selectedComplaint && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h2 className="text-lg font-bold text-slate-800">Chi tiết khiếu nại</h2>
                            <button onClick={() => setSelectedComplaint(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Môn thi</span>
                                <p className="font-bold text-slate-800 mt-1">{selectedComplaint.exam?.title}</p>
                            </div>
                            
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Loại yêu cầu</span>
                                <p className="font-medium text-slate-800 mt-1">{selectedComplaint.type === 'grade_review' ? 'Phúc khảo điểm số' : 'Sự cố kỹ thuật'}</p>
                            </div>

                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Nội dung bạn đã gửi</span>
                                <div className="mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed">
                                    {selectedComplaint.content}
                                    {selectedComplaint.evidence_url && (
                                        <div className="mt-3 pt-3 border-t border-slate-200">
                                            <a href={selectedComplaint.evidence_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                                                <FileIcon className="w-4 h-4" /> Xem minh chứng đính kèm
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Phản hồi từ Giảng viên</span>
                                <div className={`mt-2 p-4 rounded-xl border text-sm leading-relaxed ${selectedComplaint.response ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-slate-50 border-slate-100 text-slate-500 italic'}`}>
                                    {selectedComplaint.response ? selectedComplaint.response : 'Giảng viên đang xem xét và chưa có phản hồi.'}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Trạng thái: </span>
                                {selectedComplaint.status === 'resolved' ? <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Đã giải quyết</span> 
                                : selectedComplaint.status === 'rejected' ? <span className="text-rose-600 font-bold flex items-center gap-1"><XCircle className="w-4 h-4"/> Bị từ chối</span>
                                : <span className="text-amber-600 font-bold flex items-center gap-1"><Clock className="w-4 h-4"/> Đang chờ xử lý</span>}
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 text-right shrink-0">
                            <button onClick={() => setSelectedComplaint(null)} className="px-5 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}