import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { Save, X, Plus, Trash2, Loader2, Users, ShieldAlert, Search, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ExamForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const apiPrefix = user?.role === 'admin' ? '/admin' : '/teacher';
    
    const isEdit = !!id;
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    
    const [classes, setClasses] = useState([]);
    const [proctors, setProctors] = useState([]); 
    const [subjects, setSubjects] = useState([]); 
    const [allTopics, setAllTopics] = useState([]);
    const [questionStats, setQuestionStats] = useState([]);

    const [showClassModal, setShowClassModal] = useState(false);
    const [classSearch, setClassSearch] = useState('');
    
    const [showProctorModal, setShowProctorModal] = useState(false);
    const [proctorSearch, setProctorSearch] = useState('');

    const [showPassword, setShowPassword] = useState(false);

    const { register, control, handleSubmit, watch, reset, setValue } = useForm({
        defaultValues: {
            title: '',
            subject_id: '', 
            class_ids: [], 
            proctor_ids: [], 
            duration: 60,
            passing_score: 5,
            shuffle_questions: true,
            shuffle_options: true,
            is_active: false,
            show_answers: false,
            password: '',
            start_time: '',
            end_time: '',
            matrices: [] 
        }
    });

    const { fields, append, remove, replace } = useFieldArray({ control, name: 'matrices' });
    
    const watchMatrices = watch('matrices') || [];
    const selectedSubjectId = watch('subject_id'); 
    const validClasses = classes.filter(cls => {
        if (!selectedSubjectId) 
            return false; 
        const courseSubjects = cls.cohort?.course?.subjects || [];
        return courseSubjects.some(sub => sub.id.toString() === selectedSubjectId.toString());
    });
    
    const watchClassIds = watch('class_ids') || [];
    const watchProctorIds = watch('proctor_ids') || [];

    const totalQuestions = watchMatrices.reduce((sum, current) => sum + (Number(current?.quantity) || 0), 0);

    const filteredTopics = allTopics.filter(
        topic => String(topic.subject_id || topic.subject?.id) === String(selectedSubjectId)
    );

    const filteredClasses = validClasses.filter(c => c.name.toLowerCase().includes(classSearch.toLowerCase()));
    const filteredProctors = proctors.filter(p => 
        (p.name && p.name.toLowerCase().includes(proctorSearch.toLowerCase())) || 
        (p.email && p.email.toLowerCase().includes(proctorSearch.toLowerCase()))
    );

    useEffect(() => {
        const initData = async () => {
            try {
                const [classRes, subjectRes, topicRes, statsRes, proctorRes] = await Promise.all([
                    api.get(`${apiPrefix}/classes`),
                    api.get(`${apiPrefix}/subjects`),
                    api.get(`${apiPrefix}/topics`),
                    api.get(`${apiPrefix}/questions/stats`).catch(() => ({ data: [] })), 
                    api.get(`${apiPrefix}/users?role=proctor&per_page=100`).catch(() => ({ data: [] }))
                ]);
                
                setClasses(classRes.data?.data || classRes.data || []);
                setSubjects(subjectRes.data?.data || subjectRes.data || []);
                setAllTopics(topicRes.data?.data || topicRes.data || []);
                setQuestionStats(statsRes.data?.data || statsRes.data || []);
                setProctors(proctorRes.data?.data || proctorRes.data || []);
                
                if (isEdit) {
                    const res = await api.get(`${apiPrefix}/exams/${id}`);
                    const e = res.data?.data || res.data;
                    
                    const formatDT = (dt) => dt ? new Date(dt).toISOString().slice(0, 16) : '';

                    const currentClassIds = e.classes?.map(c => c.id.toString()) || (e.class_id ? [e.class_id.toString()] : []);
                    const currentProctorIds = e.proctors?.map(p => p.id.toString()) || [];

                    reset({
                        title: e.title || '',
                        subject_id: (e.subject_id || e.subject?.id)?.toString() || '', 
                        class_ids: currentClassIds,
                        proctor_ids: currentProctorIds,
                        duration: e.duration || 60,
                        passing_score: e.passing_score || 5,
                        shuffle_questions: e.shuffle_questions,
                        shuffle_options: e.shuffle_options,
                        is_active: e.is_active,
                        show_answers: e.show_answers === 1 || e.show_answers === true,
                        password: e.password || '',
                        start_time: formatDT(e.start_time),
                        end_time: formatDT(e.end_time),
                    });

                    setTimeout(() => {
                        const formattedMatrices = e.matrices && e.matrices.length > 0 
                            ? e.matrices.map(m => ({ 
                                topic_id: (m.topic_id || m.pivot?.topic_id || m.id)?.toString() || '', 
                                difficulty: m.difficulty || m.pivot?.difficulty || '', 
                                quantity: m.quantity || m.pivot?.quantity || 1 
                            }))
                            : [{ topic_id: '', difficulty: '', quantity: 1 }];
                        
                        replace(formattedMatrices);
                        setFetching(false);
                    }, 200);
                } else {
                  
                    replace([{ topic_id: '', difficulty: '', quantity: 1 }]);
                    setFetching(false);
                }
            } catch (error) {
                toast.error('Lỗi khởi tạo dữ liệu kỳ thi');
                if (isEdit) navigate(`${apiPrefix}/exams`);
                setFetching(false);
            }
        };

        initData();
    }, [id, isEdit, apiPrefix, reset, replace, navigate]);

    const onSubmit = async (data) => {
        setLoading(true);

     
        if (!data.class_ids || data.class_ids.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 Lớp học!');
            setLoading(false);
            return;
        }

     
        const matrixSet = new Set();
        let hasDuplicate = false;
        let hasInvalidQuantity = false;

        for (const m of data.matrices) {
            if (!m.topic_id || !m.difficulty) continue;
            
           
            const key = `${m.topic_id}-${m.difficulty}`;
            if (matrixSet.has(key)) {
                hasDuplicate = true;
                break;
            }
            matrixSet.add(key);

           
            const stat = questionStats.find(s => String(s.topic_id) === String(m.topic_id) && s.difficulty === m.difficulty);
            const max = stat ? Number(stat.total) : 0;
            if (max === 0 || Number(m.quantity) > max) {
                hasInvalidQuantity = true;
            }
        }

        if (hasDuplicate) {
            toast.error('Lỗi: Có dòng ma trận bị TRÙNG LẶP (Cùng Chủ đề & Độ khó). Vui lòng xóa hoặc gộp lại!');
            setLoading(false);
            return;
        }

        if (hasInvalidQuantity) {
            toast.error('Lỗi: Số lượng câu hỏi yêu cầu lớn hơn số câu đang có trong ngân hàng!');
            setLoading(false);
            return;
        }

        
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                                    Lớp học làm bài <span className="text-red-500">*</span>
                                </label>
                                
                                <button 
                                    type="button" 
                                    onClick={() => setShowClassModal(true)}
                                    className="w-full flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition"
                                >
                                    <span className={watchClassIds.length > 0 ? "font-bold text-black" : "text-slate-500 font-medium"}>
                                        {watchClassIds.length > 0 ? `Đã chọn ${watchClassIds.length} lớp học` : 'Bấm để chọn lớp học...'}
                                    </span>
                                    <span className="bg-blue-800 text-white px-3 py-2 rounded-lg text-xm font-bold">Mở danh sách</span>
                                </button>
                                
                                {watchClassIds.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        {classes.filter(c => watchClassIds.includes(c.id.toString())).map(c => (
                                            <span key={c.id} className="text-xs font-bold bg-white border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg shadow-sm">
                                                {c.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                         
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                                     Phân công Giám thị
                                </label>

                                <button 
                                    type="button" 
                                    onClick={() => setShowProctorModal(true)}
                                    className="w-full flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition"
                                >
                                    <span className={watchProctorIds.length > 0 ? "font-bold text-black" : "text-slate-500 font-medium"}>
                                        {watchProctorIds.length > 0 ? `Đã phân công ${watchProctorIds.length} giám thị` : 'Bấm để chọn giám thị...'}
                                    </span>
                                    <span className="bg-blue-800 text-white px-3 py-2 rounded-lg text-xm font-bold">Mở danh sách</span>
                                </button>
                                
                                {watchProctorIds.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        {proctors.filter(p => watchProctorIds.includes(p.id.toString())).map(p => (
                                            <span key={p.id} className="text-xs font-bold bg-white border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg shadow-sm">
                                                {p.name || p.email}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Thời gian làm bài (Phút) <span className="text-red-500">*</span></label>
                                <input required type="number" min="1" {...register('duration')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Điểm đạt (Passing Score) <span className="text-red-500">*</span></label>
                                <input required type="number" step="0.5" min="0" max="10" {...register('passing_score')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Mật khẩu vào phòng</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        {...register('password')} 
                                        placeholder="Bỏ trống nếu muốn vào tự do" 
                                        className="w-full p-2.5 pr-12 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition p-1"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
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
                                <input type="checkbox" {...register('is_active')} className="w-5 h-5 text-blue-600 rounded border-slate-300" />
                                <span className="text-sm font-semibold text-slate-700">Kích hoạt mở phòng thi</span>
                            </label>
                            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200 flex-1 min-w-[200px]">
                                <input type="checkbox" {...register('show_answers')} className="w-5 h-5 text-blue-600 rounded border-slate-300" />
                                <span className="text-sm font-semibold text-slate-700">Cho phép học viên xem đáp án</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-end border-b pb-2 mb-4">
                            <h2 className="text-lg font-bold text-slate-800">3. Thiết lập ma trận đề thi</h2>
                            <div className="text-sm font-bold text-black  px-3 py-1 ">
                                Tổng số câu hỏi: {totalQuestions} câu
                            </div>
                        </div>

                        {!selectedSubjectId ? (
                            <div className="text-center p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-medium">
                                Vui lòng chọn "Môn học áp dụng" ở mục 1 trước để hệ thống tải danh sách Chủ đề tương ứng.
                            </div>
                        ) : (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                <div className="hidden md:grid grid-cols-12 gap-3 mb-2 px-2 text-sm font-bold text-slate-500">
                                    <div className="col-span-5">Chủ đề bài học (Lọc theo môn học)</div>
                                    <div className="col-span-3">Mức độ khó</div>
                                    <div className="col-span-3">Số lượng câu cần lấy</div>
                                    <div className="col-span-1 text-center">Xóa</div>
                                </div>

                                {fields.map((field, idx) => {
                                    const tId = watchMatrices[idx]?.topic_id;
                                    const diff = watchMatrices[idx]?.difficulty;
                                    const stat = questionStats.find(s => String(s.topic_id) === String(tId) && s.difficulty === diff);
                                    const maxQty = stat ? Number(stat.total) : 0; 

                                
                                    const isDuplicate = watchMatrices.some((m, i) => i !== idx && m.topic_id && m.difficulty && String(m.topic_id) === String(tId) && m.difficulty === diff);
                                    const hasZeroError = tId && diff && maxQty === 0;
                                    const rowClass = (isDuplicate || hasZeroError) ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200';

                                    return (
                                        <div key={field.id} className={`grid grid-cols-1 md:grid-cols-12 gap-3 items-center mb-3 p-3 rounded-xl border shadow-sm transition-all duration-150 ${rowClass}`}>
                                            <div className="col-span-5">
                                                <select required {...register(`matrices.${idx}.topic_id`)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm font-medium bg-slate-50/50">
                                                    <option value="">-- Chọn chủ đề bài học --</option>
                                                    {filteredTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                </select>
                                            </div>
                                            
                                            <div className="col-span-3">
                                                <select required {...register(`matrices.${idx}.difficulty`)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm font-semibold bg-slate-50/50">
                                                    <option value="" disabled>-- Chọn độ khó --</option>
                                                    {['easy', 'medium', 'hard'].map(level => {
                                                        const levelStat = questionStats.find(s => String(s.topic_id) === String(tId) && s.difficulty === level);
                                                        const levelMax = levelStat ? Number(levelStat.total) : 0;
                                                        const isUsedByOther = watchMatrices.some((m, i) => i !== idx && String(m.topic_id) === String(tId) && m.difficulty === level);

                                                        let label = level === 'easy' ? 'Mức độ Dễ' : level === 'medium' ? 'Mức độ TB' : 'Mức độ Khó';
                                                        
                                                       
                                                        if (tId) {
                                                            if (levelMax === 0) return <option key={level} value={level} disabled className="text-slate-400">{label} (0 câu)</option>;
                                                            if (isUsedByOther) return <option key={level} value={level} disabled className="text-slate-400">{label} - Đã chọn</option>;
                                                            return <option key={level} value={level}>{label} (Kho: {levelMax} câu)</option>;
                                                        }
                                                        
                                                        return <option key={level} value={level}>{label}</option>;
                                                    })}
                                                </select>
                                            </div>

                                            <div className="col-span-3">
                                                <input required type="number" min="1" max={maxQty > 0 ? maxQty : undefined} {...register(`matrices.${idx}.quantity`)} placeholder="Nhập số lượng" className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm text-center" />
                                              
                                                {tId && diff && maxQty === 0 && <p className="text-[10px] text-red-600 font-bold text-center mt-1">Chủ đề này đã hết câu hỏi!</p>}
                                                
                                                {isDuplicate && <p className="text-[10px] text-red-600 font-bold text-center mt-1">Dòng này bị trùng lặp!</p>}
                                            </div>

                                            <div className="col-span-1 flex justify-center">
                                                <button type="button" onClick={() => remove(idx)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition" title="Xóa dòng này">
                                                    <Trash2 className="w-5 h-5"/>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                <button type="button" onClick={() => append({ topic_id: '', difficulty: '', quantity: 1 })} className="mt-2 text-blue-600 font-bold hover:text-blue-800 transition flex items-center gap-1 text-sm bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm w-fit">
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

          
            {showClassModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
                        
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600" /> Chọn Lớp học ({watchClassIds.length})
                            </h3>
                            <button type="button" onClick={() => setShowClassModal(false)} className="text-slate-400 hover:text-slate-600 transition bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 border-b border-slate-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm tên lớp học..."
                                    value={classSearch}
                                    onChange={(e) => setClassSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto p-4 flex-1 space-y-2">
                            {filteredClasses.length > 0 ? (
                                filteredClasses.map(c => {
                                    const isChecked = watchClassIds.includes(c.id.toString());
                                    return (
                                        <label key={c.id} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition group select-none ${isChecked ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-blue-200'}`}>
                                            <input type="checkbox" value={c.id.toString()} {...register('class_ids')} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" />
                                            <span className={`text-sm font-bold transition ${isChecked ? 'text-blue-700' : 'text-slate-700 group-hover:text-blue-600'}`}>{c.name}</span>
                                        </label>
                                    );
                                })
                            ) : (
                                <div className="text-center py-10 text-slate-400 text-sm font-medium">Không tìm thấy lớp học nào phù hợp.</div>
                            )}
                        </div>
                        
                        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
                            <button type="button" onClick={() => setShowClassModal(false)} className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm">
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

          
            {showProctorModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
                        
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50 rounded-t-2xl">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-emerald-600" /> Phân công Giám thị ({watchProctorIds.length})
                            </h3>
                            <button type="button" onClick={() => setShowProctorModal(false)} className="text-slate-400 hover:text-slate-600 transition bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 border-b border-slate-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên hoặc email giám thị..."
                                    value={proctorSearch}
                                    onChange={(e) => setProctorSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto p-4 flex-1 space-y-2">
                            {filteredProctors.length > 0 ? (
                                filteredProctors.map(p => {
                                    const isChecked = watchProctorIds.includes(p.id.toString());
                                    return (
                                        <label key={p.id} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition group select-none ${isChecked ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-emerald-200'}`}>
                                            <input type="checkbox" value={p.id.toString()} {...register('proctor_ids')} className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer" />
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-bold transition ${isChecked ? 'text-emerald-700' : 'text-slate-700 group-hover:text-emerald-600'}`}>{p.name || p.email}</span>
                                                {p.email && <span className="text-xs text-slate-500">{p.email}</span>}
                                            </div>
                                        </label>
                                    );
                                })
                            ) : (
                                <div className="text-center py-10 text-slate-400 text-sm font-medium">Không tìm thấy giám thị nào phù hợp.</div>
                            )}
                        </div>
                        
                        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
                            <button type="button" onClick={() => setShowProctorModal(false)} className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition shadow-sm">
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}