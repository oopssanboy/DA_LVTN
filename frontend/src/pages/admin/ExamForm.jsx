import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { Save, X, Plus, Trash2, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ExamForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const apiPrefix = user?.role === 'admin' ? '/admin' : '/teacher';
    
    const isEdit = !!id;
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]); 
    const [allTopics, setAllTopics] = useState([]);

    const { register, control, handleSubmit, watch, reset } = useForm({
        defaultValues: {
            title: '',
            subject_id: '', 
            class_id: '',
            duration: 60,
            passing_score: 5,
            shuffle_questions: true,
            shuffle_options: true,
            is_active: false,
            password: '',
            start_time: '',
            end_time: '',
            matrices: [{ topic_id: '', difficulty: 'easy', quantity: 1 }]
        }
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'matrices' });
    
  
    const watchMatrices = watch('matrices');
    const selectedSubjectId = watch('subject_id'); 
    

    const totalQuestions = watchMatrices.reduce((sum, current) => sum + (Number(current.quantity) || 0), 0);


    const filteredTopics = allTopics.filter(
        topic => String(topic.subject_id) === String(selectedSubjectId)
    );

    useEffect(() => {
        const initData = async () => {
            try {
         
                const [classRes, subjectRes, topicRes] = await Promise.all([
                    api.get(`${apiPrefix}/classes`),
                    api.get(`${apiPrefix}/subjects`),
                    api.get(`${apiPrefix}/topics`) 
                ]);
                
                setClasses(classRes.data.data || classRes.data);
                setSubjects(subjectRes.data.data || subjectRes.data);
                setAllTopics(topicRes.data.data || topicRes.data);
                
             
                if (isEdit) {
                    const res = await api.get(`${apiPrefix}/exams/${id}`);
                    const e = res.data.data || res.data;
                    
                    const formatDT = (dt) => dt ? new Date(dt).toISOString().slice(0, 16) : '';

                    reset({
                        title: e.title,
                        subject_id: e.subject_id || e.subject?.id || '', 
                        class_id: e.class_id,
                        duration: e.duration,
                        passing_score: e.passing_score,
                        shuffle_questions: e.shuffle_questions,
                        shuffle_options: e.shuffle_options,
                        is_active: e.is_active,
                        password: e.password || '',
                        start_time: formatDT(e.start_time),
                        end_time: formatDT(e.end_time),
                        
                        matrices: e.matrices && e.matrices.length > 0 
                            ? e.matrices.map(m => ({ 
                                topic_id: m.topic_id?.toString(), 
                                difficulty: m.difficulty, 
                                quantity: m.quantity 
                            }))
                            : [{ topic_id: '', difficulty: 'easy', quantity: 1 }]
                    });
                }
            } catch (error) {
                toast.error('Lỗi khởi tạo dữ liệu kỳ thi');
                if (isEdit) navigate(`${apiPrefix}/exams`);
            } finally {
                setFetching(false);
            }
        };

        initData();
    }, [id, isEdit, apiPrefix, reset, navigate]);

    const onSubmit = async (data) => {
        setLoading(true);
        const payload = { ...data, total_questions: totalQuestions };

  
        if (payload.start_time) payload.start_time = payload.start_time.replace('T', ' ');
        else payload.start_time = null;

        if (payload.end_time) payload.end_time = payload.end_time.replace('T', ' ');
        else payload.end_time = null;

        try {
            if (isEdit) {
                await api.put(`${apiPrefix}/exams/${id}`, payload);
                toast.success('Cập nhật kỳ thi thành công!');
            } else {
                await api.post(`${apiPrefix}/exams`, payload);
                toast.success('Tạo kỳ thi thành công!');
            }
            navigate(`${apiPrefix}/exams`);
        } catch (error) {
            const errs = error.response?.data?.errors;
            if (errs) {
                Object.values(errs).forEach(errArray => toast.error(errArray[0]));
            } else {
                toast.error(error.response?.data?.message || 'Lỗi khi lưu cấu hình kỳ thi');
            }
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

    return (
        <div className="max-w-5xl mx-auto pb-10 font-sans">
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'Sửa cấu hình Kỳ thi' : 'Tạo Kỳ thi mới'}</h1>
                <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center gap-2 text-slate-600 font-medium bg-white">
                    <X className="w-5 h-5" /> Hủy
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 md:p-8 space-y-6">
                    
                  
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">1. Thông tin chung</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Tên kỳ thi <span className="text-red-500">*</span></label>
                                <input required {...register('title')} placeholder="VD: Thi giữa kỳ Lập trình Web" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Môn học áp dụng <span className="text-red-500">*</span></label>
                                <select required {...register('subject_id')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium">
                                    <option value="">-- Chọn môn học --</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Lớp học làm bài <span className="text-red-500">*</span></label>
                                <select required {...register('class_id')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium">
                                    <option value="">-- Chọn lớp học --</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Thời gian làm bài (Phút) <span className="text-red-500">*</span></label>
                                <input required type="number" min="1" {...register('duration')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Điểm đạt (Passing Score) <span className="text-red-500">*</span></label>
                                <input required type="number" step="0.5" min="0" max="10" {...register('passing_score')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Mật khẩu vào phòng (Tùy chọn)</label>
                                <input {...register('password')} placeholder="Bỏ trống nếu muốn vào tự do" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">2. Cài đặt thời gian & Quy chế</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Thời gian bắt đầu cho phép vào</label>
                                <input type="datetime-local" {...register('start_time')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Thời gian đóng phòng thi</label>
                                <input type="datetime-local" {...register('end_time')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200 flex-1 min-w-[200px]">
                                <input type="checkbox" {...register('shuffle_questions')} className="w-5 h-5 text-blue-600 rounded border-slate-300" />
                                <span className="text-sm font-semibold text-slate-700">Xáo trộn thứ tự câu hỏi</span>
                            </label>
                            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200 flex-1 min-w-[200px]">
                                <input type="checkbox" {...register('shuffle_options')} className="w-5 h-5 text-blue-600 rounded border-slate-300" />
                                <span className="text-sm font-semibold text-slate-700">Xáo trộn đáp án câu hỏi</span>
                            </label>
                            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200 flex-1 min-w-[200px]">
                                <input type="checkbox" {...register('is_active')} className="w-5 h-5 text-emerald-600 rounded border-slate-300" />
                                <span className="text-sm font-semibold text-slate-700">Kích hoạt mở phòng thi luôn</span>
                            </label>
                        </div>
                    </div>

                 
                    <div>
                        <div className="flex justify-between items-end border-b pb-2 mb-4">
                            <h2 className="text-lg font-bold text-slate-800">3. Thiết lập ma trận đề thi</h2>
                            <div className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">
                                Tổng số câu hỏi: {totalQuestions} câu
                            </div>
                        </div>

                        {!selectedSubjectId ? (
                            <div className="text-center p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-medium">
                                ⚠️ Vui lòng chọn "Môn học áp dụng" ở mục 1 trước để hệ thống tải danh sách Chủ đề tương ứng.
                            </div>
                        ) : (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                <div className="hidden md:grid grid-cols-12 gap-3 mb-2 px-2 text-sm font-bold text-slate-500">
                                    <div className="col-span-5">Chủ đề bài học (Lọc theo môn học)</div>
                                    <div className="col-span-3">Mức độ khó</div>
                                    <div className="col-span-3">Số lượng câu cần lấy</div>
                                    <div className="col-span-1 text-center">Xóa</div>
                                </div>

                                {fields.map((field, idx) => (
                                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-150">
                                        <div className="col-span-5">
                                            <select required {...register(`matrices.${idx}.topic_id`)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm font-medium bg-slate-50/50">
                                                <option value="">-- Chọn chủ đề bài học --</option>
                                                {filteredTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-3">
                                            <select {...register(`matrices.${idx}.difficulty`)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm font-semibold bg-slate-50/50">
                                                <option value="easy">Mức độ Dễ</option>
                                                <option value="medium">Mức độ Trung bình</option>
                                                <option value="hard">Mức độ Khó</option>
                                            </select>
                                        </div>
                                        <div className="col-span-3">
                                            <input required type="number" min="1" {...register(`matrices.${idx}.quantity`)} placeholder="Nhập số câu" className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm text-center" />
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            {fields.length > 1 && (
                                                <button type="button" onClick={() => remove(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Xóa dòng này">
                                                    <Trash2 className="w-5 h-5"/>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <button type="button" onClick={() => append({ topic_id: '', difficulty: 'easy', quantity: 1 })} className="mt-2 text-blue-600 font-bold hover:text-blue-800 transition flex items-center gap-1 text-sm bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm w-fit">
                                    <Plus className="w-4 h-4"/> Thêm cấu hình ma trận
                                </button>
                            </div>
                        )}
                    </div>
                </div>

              
                <div className="bg-slate-50 p-5 flex justify-end gap-3 border-t border-slate-200">
                    <button type="button" onClick={() => navigate(`${apiPrefix}/exams`)} className="bg-white border border-slate-300 text-slate-700 px-6 py-2.5 rounded-xl hover:bg-slate-50 font-bold transition">
                        Quay lại
                    </button>
                    <button type="submit" disabled={loading} className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition flex items-center gap-2 disabled:opacity-70">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} {isEdit ? 'Cập nhật cấu hình' : 'Tạo đề & Lưu phòng thi'}
                    </button>
                </div>
            </form>
        </div>
    );
}