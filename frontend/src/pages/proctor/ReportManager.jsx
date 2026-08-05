import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FileWarning, Plus, CheckCircle, Clock, Users, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ReportManager() {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [activeExams, setActiveExams] = useState([]);
    
   
    const [showModal, setShowModal] = useState(false);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [summary, setSummary] = useState(null);
    const [content, setContent] = useState('');

    useEffect(() => {
        fetchReports();
        api.get('/proctor/active-exams').then(res => setActiveExams(res.data));
    }, []);

    const fetchReports = () => api.get('/proctor/reports').then(res => setReports(res.data));

    const handleSelectExam = async (examId) => {
        setSelectedExamId(examId);
        if(!examId) return setSummary(null);
        try {
            const res = await api.get(`/proctor/exams/${examId}/summary`);
            setSummary(res.data);
        } catch (e) { toast.error('Không thể lấy dữ liệu ca thi'); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/proctor/reports', { exam_id: selectedExamId, content });
            toast.success('Đã gửi báo cáo tổng kết ca thi!');
            setShowModal(false);
            fetchReports();
        } catch (error) { toast.error('Lỗi gửi báo cáo'); }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div><h1 className="text-2xl font-bold text-slate-800">Biên bản Ca thi</h1><p className="text-slate-500">Danh sách báo cáo các ca thi đã giám sát.</p></div>
                <button onClick={() => setShowModal(true)} className="bg-teal-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-teal-700 font-bold">
                    <Plus className="w-5 h-5"/> Lập báo cáo tổng kết
                </button>
            </div>

            <div className="grid gap-4">
                {reports.map(r => (
                    <div key={r.id} className="bg-white p-5 rounded-xl border border-slate-200 flex justify-between items-center hover:shadow-md transition">
                        <div>
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileWarning className="w-5 h-5 text-amber-500"/> {r.title}</h3>
                            <p className="text-sm text-slate-500 mt-2">Nội dung đánh giá: {r.content}</p>
                        </div>
                        <div>
                            {r.status === 'processed' ? <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Đã duyệt</span> : <span className=" px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-4 h-4"/> Chờ duyệt</span>}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-50 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                        
                        <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
                            <div><h2 className="text-2xl font-bold text-slate-800">Lập báo cáo tổng kết ca thi</h2><p className="text-sm text-slate-500 mt-1">Hoàn thiện báo cáo cho ca thi vừa kết thúc.</p></div>
                            <select className="border-2 border-slate-500 rounded-xl p-2 font-bold  outline-none" value={selectedExamId} onChange={e => handleSelectExam(e.target.value)}>
                                <option value="">-- Chọn ca thi cần báo cáo --</option>
                                {activeExams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                            </select>
                        </div>

                        {summary ? (
                            <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">Thông tin chung</h3>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div><p className="text-xs text-slate-500 mb-1">Kỳ thi</p><p className="font-bold text-slate-800">{summary.exam.title}</p></div>
                                        <div><p className="text-xs text-slate-500 mb-1">Lớp học</p><p className="font-bold text-slate-800">{summary.exam.classes.map(c => c.name).join(', ')}</p></div>
                                        <div><p className="text-xs text-slate-500 mb-1">Giám thị</p><p className="font-bold text-slate-800">{user.name}</p></div>
                                        <div><p className="text-xs text-slate-500 mb-1">Thời gian</p><p className="font-bold text-slate-800">{summary.exam.duration} Phút</p></div>
                                        <div><p className="text-xs text-slate-500 mb-1">Sĩ số / Tham gia</p><p className="font-bold  flex items-center gap-1"><Users className="w-4 h-4"/> {summary.participated} / {summary.total_students}</p></div>
                                    </div>
                                </div>

                              
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">Tình hình chung</h3>
                                    <textarea required rows="3" value={content} onChange={e => setContent(e.target.value)} placeholder="Nhập đánh giá tổng quan về ca thi (không khí, tính nghiêm túc, các vấn đề chung)..." className="w-full border border-slate-200 rounded-xl p-4 outline-none focus:border-teal-500 bg-slate-50"></textarea>
                                </div>

                         
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-slate-800">Vi phạm trong ca thi</h3>
                                        <span className=" px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Số lượng vi phạm: {summary.violations.length}</span>
                                    </div>
                                    <div className="space-y-3">
                                        {summary.violations.map((v, i) => (
                                            <div key={i} className="border border-slate-100 rounded-xl p-4 flex gap-4 bg-slate-50 items-start">
                                                <div className="w-10 h-10  text-rose-600 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5"/></div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between"><h4 className="font-bold text-slate-800">{v.student_name} ({v.student_code})</h4><span className="text-xs font-bold text-slate-400">{v.time}</span></div>
                                                    <p className="text-sm font-bold  mt-1">{v.type}</p>
                                                    <p className="text-sm text-slate-600 mt-1">{v.detail}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {summary.violations.length === 0 && <p className="text-slate-500 text-center py-4">Ca thi diễn ra an toàn, không có vi phạm.</p>}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-400 p-10"><p>Vui lòng chọn 1 ca thi ở góc trên bên phải để bắt đầu lập báo cáo.</p></div>
                        )}

                        <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
                            <button onClick={() => setShowModal(false)} className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50">Đóng</button>
                            <button onClick={handleSubmit} disabled={!summary || !content} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-800 ">Lưu Báo Cáo</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}