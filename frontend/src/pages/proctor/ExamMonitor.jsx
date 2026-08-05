import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, CheckCircle2, User, AlertTriangle, Send, Info, X, Clock, Calendar } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useAuth } from '../../context/AuthContext';

window.Pusher = Pusher;

export default function ExamMonitor() {
    const { user } = useAuth();
    const { examId } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
   
    const [selectedAttempt, setSelectedAttempt] = useState(null);
    
    const echoRef = useRef(null);
    const basePath = user?.role === 'admin' ? '/admin' : '/proctor';

    useEffect(() => {
        fetchMonitorData();
        setupEcho();
        
        return () => {
            if (echoRef.current) {
                echoRef.current.leave(`exam.${examId}`);
            }
        };
    }, [examId]);

    const fetchMonitorData = async () => {
        try {
            const res = await api.get(`/proctor/exams/${examId}/attempts`);
            setExam(res.data.exam || { id: examId, title: 'Phòng Giám sát' });
            setAttempts(res.data.attempts || res.data || []);
        } catch (error) {
            toast.error('Lỗi lấy dữ liệu giám sát');
            navigate(`${basePath}/dashboard`);
        } finally {
            setLoading(false);
        }
    };

    const setupEcho = () => {
        if (!echoRef.current) {
            try {
                const appKey = import.meta.env.VITE_PUSHER_APP_KEY;
                const cluster = import.meta.env.VITE_PUSHER_APP_CLUSTER;
                
                if (!appKey) {
                    console.warn("Thiếu cấu hình Pusher.");
                    return;
                }

                echoRef.current = new Echo({
                    broadcaster: 'pusher',
                    key: appKey,
                    cluster: cluster,
                    forceTLS: true 
                });

                echoRef.current.channel(`exam.${examId}`)
                    .listen('.violation.updated', (e) => {
                        setAttempts(prev => {
                            const exists = prev.find(a => a.id === e.attemptId);
                 
                            if ((!exists && e.type === 'joined') || e.type === 'violation') {
                                fetchMonitorData();
                            }

                            return prev.map(att => {
                                if (att.id === e.attemptId) {
                                    if (e.type === 'violation') {
                                        toast(`⚠️ Cảnh báo: ${att.student_name || 'Học viên'} vừa vi phạm!`, { icon: '🚨' });
                                        return { ...att, violation_count: att.violation_count + 1 };
                                    } 
                                    else if (e.type === 'submitted' || e.type === 'suspended') {
                                        return { ...att, status: e.type };
                                    } 
                                    else if (e.type === 'joined') {
                                        return { ...att, status: 'in_progress' };
                                    }
                                }
                                return att;
                            });
                        });
                    });
            } catch (err) {
                console.error("Lỗi kết nối Socket:", err);
            }
        }
    };

    const handleWarn = async (attempt) => {
        const { value: message } = await Swal.fire({
            title: 'Gửi Cảnh cáo',
            text: `Nhập nội dung cảnh cáo cho sinh viên ${attempt.student_name || 'này'}:`,
            input: 'text',
            inputPlaceholder: 'VD: Yêu cầu bật camera / Không được rời màn hình',
            showCancelButton: true,
            confirmButtonText: 'Gửi',
            cancelButtonText: 'Hủy'
        });

        if (message) {
            try {
                await api.post(`/proctor/attempts/${attempt.id}/warn`, { message });
                toast.success('Đã gửi tin nhắn cảnh cáo!');
            } catch (error) {
                toast.error('Lỗi khi gửi cảnh cáo');
            }
        }
    };

    const handleForceSubmit = async (attempt) => {
        const result = await Swal.fire({
            title: 'ĐÌNH CHỈ THI?',
            text: "Học viên sẽ bị buộc nộp bài ngay lập tức và không thể thi tiếp. Hành động này không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#cbd5e1',
            confirmButtonText: 'Vâng, Thu bài ngay!'
        });

        if (result.isConfirmed) {
            try {
                await api.post(`/proctor/attempts/${attempt.id}/force-submit`);
                toast.success('Đã đình chỉ thành công!');
                setAttempts(prev => prev.map(a => a.id === attempt.id ? { ...a, status: 'suspended' } : a));
            } catch (error) {
                toast.error('Lỗi khi thu bài');
            }
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'Chưa cập nhật';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /></div>;

    const total = attempts.length;
    const inProgress = attempts.filter(a => a.status === 'in_progress').length;
    const submitted = attempts.filter(a => a.status === 'submitted' || a.status === 'suspended').length;
    const violators = attempts.filter(a => a.violation_count > 0).length;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-10 font-sans mt-2">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition font-medium">
                <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                <h1 className="text-2xl font-bold text-slate-800 mb-6">Màn hình Giám sát: {exam?.title}</h1>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-100 p-4 rounded-xl text-center border border-slate-100">
                        <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Tổng tham gia</p>
                        <p className="text-3xl font-black text-slate-800">{total}</p>
                    </div>
                    <div className="bg-slate-100 p-4 rounded-xl text-center border border-blue-100">
                        <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Đang làm bài</p>
                        <p className="text-3xl font-black text-slate-800">{inProgress}</p>
                    </div>
                    <div className="bg-slate-100 p-4 rounded-xl text-center border border-emerald-100">
                        <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Đã nộp bài</p>
                        <p className="text-3xl font-black text-slate-800">{submitted}</p>
                    </div>
                    <div className="bg-slate-100 p-4 rounded-xl text-center border border-red-100">
                        <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Vi phạm</p>
                        <p className="text-3xl font-black text-slate-800">{violators}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    {attempts.length === 0 ? (
                        <div className="p-16 text-center text-slate-500">
                            <User className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                            Chưa có sinh viên nào vào phòng thi này.
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Sinh viên</th>
                                    <th className="px-6 py-4">Trạng thái</th>
                                    <th className="px-6 py-4 text-center">Số lần vi phạm</th>
                                    <th className="px-6 py-4 text-center">Điểm số</th>
                                    <th className="px-6 py-4 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {attempts.map(att => {
                                    const studentName = att.student_name || att.student?.user?.name || att.student?.name || 'Sinh viên vô danh';
                                    const studentCode = att.student_code || att.student?.student_code || `ID: ${att.student_id}`;

                                    return (
                                        <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{studentName}</div>
                                                <div className="text-xs text-slate-500">{studentCode}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {att.status === 'in_progress' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold "><Loader2 className="w-3 h-3 animate-spin"/> Đang thi</span>}
                                                {att.status === 'submitted' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold "> Đã nộp</span>}
                                                {att.status === 'suspended' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold "> Đình chỉ</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-md font-black text-sm ${att.violation_count > 0 ? ' animate-pulse' : ''}`}>
                                                    {att.violation_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-800 text-base">
                                                {att.status !== 'in_progress' ? att.total_score : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                   
                                                    <button 
                                                        onClick={() => setSelectedAttempt(att)} 
                                                        title="Xem thông tin & Lịch sử vi phạm"
                                                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                                    >
                                                        <Info className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        disabled={att.status !== 'in_progress'}
                                                        onClick={() => handleWarn(att)} 
                                                        title="Gửi tin nhắn cảnh cáo"
                                                        className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <Send className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        disabled={att.status !== 'in_progress'}
                                                        onClick={() => handleForceSubmit(att)} 
                                                        title="Buộc thu bài (Đình chỉ)"
                                                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <AlertTriangle className="w-4 h-4" />
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

          
            {selectedAttempt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Info className="w-5 h-5 text-blue-600" /> Chi tiết Học viên
                            </h3>
                            <button onClick={() => setSelectedAttempt(null)} className="text-slate-400 hover:text-slate-600 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
                       
                            <div className="flex flex-col md:flex-row gap-6 bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Họ và Tên</div>
                                        <div className="font-bold text-slate-800 text-lg">
                                            {selectedAttempt.student_name || selectedAttempt.student?.name || 'Sinh viên'}
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                            <Clock className="w-4 h-4 text-slate-400" /> 
                                            <span><strong>Bắt đầu:</strong> {formatDateTime(selectedAttempt.started_at)}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                            <Calendar className="w-4 h-4 text-slate-400" /> 
                                            <span><strong>Kết thúc:</strong> {selectedAttempt.ended_at ? formatDateTime(selectedAttempt.ended_at) : 'Chưa kết thúc'}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="shrink-0 flex flex-col justify-center items-center bg-white p-4 rounded-xl border border-blue-100 shadow-sm min-w-[120px]">
                                    <div className="text-xs font-bold text-slate-500 uppercase">Điểm số</div>
                                    <div className="text-3xl font-black  mt-1">
                                        {selectedAttempt.status !== 'in_progress' ? selectedAttempt.total_score : '-'}
                                    </div>
                                    <div className="mt-2 text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 uppercase">
                                        {selectedAttempt.status === 'in_progress' ? 'Đang thi' : selectedAttempt.status === 'suspended' ? 'Đình chỉ' : 'Đã nộp'}
                                    </div>
                                </div>
                            </div>

                     
                            <div>
                                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-3 border-b pb-2">
                                     Lịch sử vi phạm ({selectedAttempt.violation_logs?.length || 0})
                                </h4>
                                
                                {(!selectedAttempt.violation_logs || selectedAttempt.violation_logs.length === 0) ? (
                                    <div className="bg-slate-50 p-6 rounded-xl text-center text-slate-500 border border-slate-200 border-dashed">
                                        Chưa có vi phạm nào.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedAttempt.violation_logs.map((log, index) => (
                                            <div key={log.id} className="bg-white border border-red-100 p-4 rounded-xl flex items-start gap-4 shadow-sm">
                                                <div className="shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-bold text-slate-800">{log.type}</span>
                                                        <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">
                                                            {formatDateTime(log.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mt-1">{log.detail}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}