import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ChevronLeft, Award, BookOpen } from 'lucide-react';
import api from '../../services/api';

export default function ExamResult() {
    const { attemptId } = useParams();
    const [resultData, setResultData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResult();
    }, [attemptId]);

    const fetchResult = async () => {
        try {
            const res = await api.get(`/student/attempts/${attemptId}/result`);
            setResultData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Đang phân tích kết quả...</div>;
    if (!resultData) return <div className="p-10 text-center text-red-500">Không tìm thấy dữ liệu bài thi.</div>;

    const { attempt, details } = resultData;
    const isPassed = attempt.is_passed;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header / Score Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
                <div className={`h-3 w-full ${isPassed ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <div className="p-8 md:p-12 text-center">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${isPassed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        <Award className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Kết quả bài thi</h2>
                    <p className="text-slate-500 mb-6">{attempt.exam.title}</p>
                    
                    <div className="flex items-end justify-center gap-2 mb-4">
                        <span className={`text-6xl font-black tracking-tighter ${isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
                            {attempt.total_score}
                        </span>
                        <span className="text-xl text-slate-400 font-bold mb-2">/ 10</span>
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm border bg-slate-50">
                        Trạng thái: 
                        <span className={isPassed ? 'text-emerald-600' : 'text-red-600'}>
                            {isPassed ? 'ĐẠT YÊU CẦU' : 'KHÔNG ĐẠT'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 pl-2">
                    <BookOpen className="w-5 h-5 text-blue-600" /> Chi tiết bài làm
                </h3>
                
                {details.map((d, index) => {
                    const q = d.question;
                    const isCorrect = d.is_correct === 1 || d.is_correct === '1' || d.is_correct === true;
                    
                    return (
                        <div key={d.id} className={`bg-white rounded-2xl border-2 p-6 transition ${isCorrect ? 'border-emerald-100' : 'border-red-100'}`}>
                            <div className="flex justify-between items-start gap-4 mb-4">
                                <div className="flex gap-3">
                                    <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                        {index + 1}
                                    </span>
                                    <div className="prose prose-sm max-w-none text-slate-800 pt-1" dangerouslySetInnerHTML={{ __html: q.content }} />
                                </div>
                                {isCorrect ? <CheckCircle2 className="text-emerald-500 shrink-0" /> : <XCircle className="text-red-500 shrink-0" />}
                            </div>

                            <div className="pl-10 space-y-2 text-sm">
                                {q.type === 'fill_blank' ? (
                                    <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                                        <p><span className="text-slate-500">Câu trả lời của bạn: </span> <strong className={isCorrect ? 'text-emerald-600' : 'text-red-600'}>{d.answer_text || '(Bỏ trống)'}</strong></p>
                                        <p><span className="text-slate-500">Đáp án chấp nhận: </span> <strong className="text-blue-600">{q.fill_blank_answers.map(a => a.accepted_text).join(' | ')}</strong></p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {q.choices.map(c => {
                                            const isSelected = d.choice_id == c.id;
                                            const isRightChoice = c.is_correct;
                                            let bgClass = "bg-slate-50 border-slate-100 text-slate-600";
                                            
                                            if (isRightChoice) bgClass = "bg-emerald-50 border-emerald-200 text-emerald-700 font-medium";
                                            else if (isSelected && !isRightChoice) bgClass = "bg-red-50 border-red-200 text-red-700";

                                            return (
                                                <div key={c.id} className={`p-3 rounded-xl border flex items-center gap-3 ${bgClass}`}>
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-current' : 'border-slate-300'}`}>
                                                        {isSelected && <div className="w-2 h-2 rounded-full bg-current" />}
                                                    </div>
                                                    {c.choice_text}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            
                          
                            {q.explanation && (
                                <div className="mt-4 pl-10">
                                    <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm">
                                        <strong>Giải thích: </strong> {q.explanation}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="text-center pt-6">
                <Link to="/student/dashboard" className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition">
                    <ChevronLeft className="w-5 h-5" /> Trở về Trang chủ
                </Link>
            </div>
        </div>
    );
}