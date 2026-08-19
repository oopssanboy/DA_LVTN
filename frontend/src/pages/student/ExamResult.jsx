import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ChevronLeft, Award, BookOpen, ShieldAlert, AlertCircle, Terminal, Code2, Loader2, Clock } from 'lucide-react';
import api from '../../services/api';

export default function ExamResult() {
    const { attemptId } = useParams();
    const [resultData, setResultData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let timer;
        const fetchResult = async () => {
            try {
                const res = await api.get(`/student/attempts/${attemptId}/result`);
                setResultData(res.data);
                setLoading(false);
                
                if (res.data.attempt?.status === 'wait') {
                    timer = setTimeout(fetchResult, 3000);
                }
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };

        fetchResult();

        return () => {
            if (timer) clearTimeout(timer); 
        };
    }, [attemptId]);

    if (loading) return <div className="p-10 text-center text-slate-500">Đang phân tích kết quả...</div>;
    if (!resultData) return <div className="p-10 text-center text-red-500">Không tìm thấy dữ liệu bài thi.</div>;

    const { attempt, details } = resultData;

    if (attempt?.status === 'wait') {
        return (
            <div className="max-w-2xl mx-auto mt-20 p-10 bg-white rounded-3xl shadow-sm border border-slate-200 text-center space-y-6">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Clock className="w-10 h-10 animate-spin" />
                </div>
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">Bài thi đang được chấm tự động</h2>
                    <p className="text-slate-500 mt-2">Hệ thống đang biên dịch code qua máy chấm và tổng hợp kết quả. Vui lòng đợi trong giây lát...</p>
                </div>
                <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-sm font-bold text-slate-600">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Tự động cập nhật kết quả sau giây lát...
                </div>
            </div>
        );
    }

    const isPassed = attempt.is_passed;
    const isShowAnswers = [1, '1', true, 'true'].includes(attempt.exam.show_answers);

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 font-sans mt-4">
         
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
                <div className={`h-3 w-full ${isPassed ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <div className="p-8 md:p-12 text-center">
                   
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Kết quả bài thi</h2>
                    <p className="text-slate-500 mb-6">{attempt.exam.title}</p>
                    
                    <div className="flex items-end justify-center gap-2 mb-4">
                        <span className={`text-6xl font-black tracking-tighter ${isPassed ? 'text-slate-900' : 'text-slate-900'}`}>
                            {attempt.total_score}
                        </span>
                        <span className="text-xl font-bold mb-2 text-slate-400">/ 10</span>
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm border bg-slate-50 text-slate-700">
                        Trạng thái: 
                        <span className={isPassed ? 'text-emerald-600' : 'text-red-600'}>
                            {isPassed ? 'ĐẠT YÊU CẦU' : 'KHÔNG ĐẠT'}
                        </span>
                    </div>
                </div>
            </div>

            {isShowAnswers ? (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 pl-2">
                         Chi tiết bài làm
                    </h3>
                    
                    {details.map((d, index) => {
                        const q = d.question;
                        const isCorrect = d.is_correct === 1 || d.is_correct === '1' || d.is_correct === true;
                        const isPartial = !isCorrect && Number(d.score_earned) > 0;
                        
                        let borderColor = 'border-red-100';
                        if (isCorrect) borderColor = 'border-emerald-100';
                        else if (isPartial) borderColor = 'border-amber-200';

                        return (
                            <div key={d.id} className={`bg-white rounded-2xl border-2 p-6 transition ${borderColor}`}>
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <div className="flex gap-3">
                                        <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white ${isCorrect ? 'bg-emerald-500' : isPartial ? 'bg-amber-500' : 'bg-red-500'}`}>
                                            {index + 1}
                                        </span>
                                        <div className="prose prose-sm max-w-none text-slate-800 pt-1 font-medium" dangerouslySetInnerHTML={{ __html: q.content }} />
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end">
                                        {isCorrect ? <CheckCircle2 className="text-emerald-500" /> : isPartial ? <AlertCircle className="text-amber-500" /> : <XCircle className="text-red-500" />}
                                        <span className={`text-xs font-bold mt-1 ${isCorrect ? 'text-emerald-600' : isPartial ? 'text-amber-600' : 'text-red-600'}`}>
                                            {Number(d.score_earned).toFixed(2)} đ
                                        </span>
                                    </div>
                                </div>

                                <div className="pl-10 space-y-2 text-sm">
                                    {q.type === 'fill_blank' ? (
                                        <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                                            <p><span className="text-slate-500">Câu trả lời của bạn: </span> <strong className={isCorrect ? 'text-emerald-600' : 'text-red-600'}>{d.answer_text || '(Bỏ trống)'}</strong></p>
                                            <p><span className="text-slate-500">Đáp án chấp nhận: </span> <strong className="text-blue-600">{q.fill_blank_answers?.map(a => a.accepted_text).join(' | ') || 'N/A'}</strong></p>
                                        </div>
                                    ) : q.type === 'coding' ? (
                                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-5">
                                            <div className="flex flex-wrap gap-3 text-sm font-medium">
                                                <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
                                                    <Code2 className="w-4 h-4 text-indigo-500" /> Ngôn ngữ: <span className="text-indigo-700 uppercase font-bold">{d.language || 'N/A'}</span>
                                                </div>
                                                <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
                                                    <Terminal className="w-4 h-4 text-slate-500" /> Trạng thái: 
                                                    <span className={`font-bold ${isCorrect ? 'text-emerald-600' : isPartial ? 'text-amber-600' : 'text-rose-600'}`}>
                                                        {d.judge_status || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                                                    Thời gian: <span className="text-slate-700">{d.execution_time ? `${d.execution_time}s` : 'N/A'}</span>
                                                </div>
                                                <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                                                    Bộ nhớ: <span className="text-slate-700">{d.memory_usage ? `${d.memory_usage}KB` : 'N/A'}</span>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-sm font-bold text-slate-700 mb-2">Mã nguồn của bạn:</p>
                                                <div className="bg-[#1e1e1e] rounded-xl p-4 overflow-x-auto border border-slate-700 shadow-inner">
                                                    <pre className="text-sm font-mono text-slate-300 leading-relaxed">
                                                        {d.answer_text || 'Không có mã nguồn được nộp.'}
                                                    </pre>
                                                </div>
                                            </div>

                                            {d.test_case_results && Array.isArray(d.test_case_results) && d.test_case_results.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700 mb-2">Chi tiết biên dịch Test Cases:</p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {d.test_case_results.map((tc, idx) => {
                                                            const isTcPassed = tc.status === 'Accepted';
                                                            return (
                                                                <div key={idx} className="bg-white border border-slate-200 p-3 rounded-lg text-sm flex justify-between items-center shadow-sm">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-slate-700">
                                                                            {tc.is_hidden ? `Test case ẩn ${idx + 1}` : `Test case công khai ${idx + 1}`}
                                                                        </span>
                                                                        {isTcPassed && (
                                                                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">{tc.time}s • {tc.memory}KB</span>
                                                                        )}
                                                                    </div>
                                                                    <span className={`font-bold px-2.5 py-1 rounded-md text-xs tracking-wide ${isTcPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                                        {tc.status}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {q.choices.map(c => {
                                                const isSelected = d.choice_id != null && Number(d.choice_id) === Number(c.id);
                                                const isRightChoice = Number(c.is_correct) === 1;
                                                let bgClass = "bg-slate-50 border-slate-100 text-slate-600";
                                                
                                                if (isRightChoice) bgClass = "bg-emerald-50 border-emerald-200 text-emerald-700 font-medium";
                                                else if (isSelected && !isRightChoice) bgClass = "bg-red-50 border-red-200 text-red-700";

                                                return (
                                                    <div key={c.id} className={`p-3 rounded-xl border flex items-center gap-3 ${bgClass}`}>
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-current' : 'border-slate-300'}`}>
                                                            {isSelected && <div className="w-2 h-2 rounded-full bg-current" />}
                                                        </div>
                                                        <span className="font-medium">{c.choice_key}. {c.choice_text}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                
                                {q.explanation && (
                                    <div className="mt-4 pl-10">
                                        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100">
                                            <strong>Giải thích: </strong> <span dangerouslySetInnerHTML={{ __html: q.explanation }}></span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-amber-50 rounded-2xl p-8 border border-amber-200 text-center flex flex-col items-center">
                    <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
                    <h3 className="text-lg font-bold text-amber-800">Không hỗ trợ xem lại đáp án</h3>
                    <p className="text-amber-700 mt-1 max-w-md">
                        Kỳ thi này được thiết lập chế độ bảo mật nội dung. Bạn chỉ có thể xem điểm số tổng quan chứ không được xem lại chi tiết bài làm.
                    </p>
                </div>
            )}

            <div className="text-center pt-6">
                <Link to="/student/dashboard" className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-slate-800 transition shadow-md">
                    <ChevronLeft className="w-5 h-5" /> Trở về Màn hình chính
                </Link>
            </div>
        </div>
    );
}