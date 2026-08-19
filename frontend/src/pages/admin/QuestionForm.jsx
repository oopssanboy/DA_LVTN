import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Lock, Plus, Trash2, Code2, Cpu, Clock, EyeOff, Eye } from 'lucide-react';
import Swal from 'sweetalert2';

const schema = yup.object({
  subject_id: yup.string().required('Môn học bắt buộc'),
  topic_id: yup.string().required('Chủ đề bắt buộc'),
  content: yup.string().required('Nội dung bắt buộc'),
  type: yup.string().oneOf(['single', 'multiple', 'fill_blank', 'coding']).required(),
  difficulty: yup.string().oneOf(['easy', 'medium', 'hard']).required(),
  correct_answer: yup.string().when('type', {
      is: 'coding',
      then: (schema) => schema.nullable().notRequired(),
      otherwise: (schema) => schema.required('Đáp án đúng bắt buộc')
  }),
  score: yup.number().min(0.1).max(10).default(1),
  explanation: yup.string().nullable(),
  allowed_languages: yup.array().when('type', {
    is: 'coding',
    then: (schema) => schema.min(1, 'Vui lòng chọn ít nhất 1 ngôn ngữ'),
    otherwise: (schema) => schema.nullable()
  }),
  time_limit: yup.number().when('type', {
      is: 'coding',
      then: (schema) => schema.required('Bắt buộc nhập').min(100),
      otherwise: (schema) => schema.nullable()
  }),
  memory_limit: yup.number().when('type', {
      is: 'coding',
      then: (schema) => schema.required('Bắt buộc nhập').min(1024),
      otherwise: (schema) => schema.nullable()
  }),
  choices: yup.array().when('type', {
    is: (type) => type === 'single' || type === 'multiple',
    then: (schema) => schema.of(
      yup.object({
        key: yup.string().required(),
        text: yup.string().required('Nội dung lựa chọn bắt buộc'),
      })
    ).min(2).required('Cần ít nhất 2 lựa chọn'),
    otherwise: (schema) => schema.nullable(),
  }),
  test_cases: yup.array().when('type', {
    is: 'coding',
    then: (schema) => schema.of(
      yup.object({
        expected_output: yup.string().required('Kết quả mong muốn bắt buộc'),
      })
    ).min(1, 'Cần ít nhất 1 test case'),
    otherwise: (schema) => schema.nullable(),
  }),
});

export default function QuestionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { user } = useAuth();
  const apiPrefix = user?.role === 'admin' ? '/admin' : '/teacher';

  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isLocked, setIsLocked] = useState(false); 

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      type: 'single',
      difficulty: 'medium',
      score: 1,
      choices: [{ key: 'A', text: '' }, { key: 'B', text: '' }],
      time_limit: 2000,
      memory_limit: 128000,
      test_cases: [{ input_data: '', expected_output: '', is_hidden: false }]
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'choices' });
  const { fields: testCaseFields, append: appendTestCase, remove: removeTestCase } = useFieldArray({ control, name: 'test_cases' });
  
  const questionType = watch('type');

  const fetchTopics = useCallback(async (subjectId) => {
    if (!subjectId) {
      setTopics([]);
      return;
    }
    try {
      const res = await api.get(`${apiPrefix}/topics`, { 
        params: { subject_id: subjectId, per_page: 100 } 
      });
      setTopics(res.data.data || res.data);
    } catch (e) {
      toast.error('Lỗi tải danh sách chủ đề');
    }
  }, [apiPrefix]);

  useEffect(() => {
    const initData = async () => {
      try {
        const subRes = await api.get(`${apiPrefix}/subjects`, { params: { per_page: 100 } });
        setSubjects(subRes.data.data || subRes.data);

        if (isEdit) {
          const qRes = await api.get(`${apiPrefix}/questions/${id}`);
          const q = qRes.data.data || qRes.data;
          
          const currentSubjectId = q.subject?.id?.toString() || q.subject_id?.toString() || '';
          
          if (currentSubjectId) {
            await fetchTopics(currentSubjectId);
          }
          
          if (q.exam_questions_count > 0 || (q.exam_questions && q.exam_questions.length > 0)) {
            setIsLocked(true);
          }
          
          let correctAnsStr = '';
          if (q.type === 'fill_blank') {
            correctAnsStr = q.fill_blank_answers?.map(a => a.accepted_text).join(' | ') || '';
          } else if (q.type !== 'coding') {
            const correctChoices = q.choices?.map((c, i) => (c.is_correct == 1 || c.is_correct === true) ? String.fromCharCode(65 + i) : null).filter(Boolean) || [];
            correctAnsStr = correctChoices.join(',');
          }

          reset({
            subject_id: currentSubjectId,
            topic_id: q.topic?.id?.toString() || q.topic_id?.toString() || '',
            content: q.content || '',
            type: q.type || 'single',
            difficulty: q.difficulty || 'medium',
            score: q.score || 1,
            explanation: q.explanation || '',
            correct_answer: correctAnsStr,
            time_limit: q.time_limit || 2000,
            memory_limit: q.memory_limit || 128000,
            allowed_languages: Array.isArray(q.allowed_languages) && q.allowed_languages.length > 0 
                ? q.allowed_languages 
                : (typeof q.allowed_languages === 'string' ? [q.allowed_languages] : ['cpp', 'python', 'java', 'php']),
            choices: q.choices && q.choices.length
              ? q.choices.map((c, i) => ({ 
                  key: String.fromCharCode(65 + i), 
                  text: c.choice_text || c.text 
                }))
              : [{ key: 'A', text: '' }, { key: 'B', text: '' }],
            test_cases: q.test_cases && q.test_cases.length > 0
              ? q.test_cases.map(tc => ({
                  input_data: tc.input_data || '',
                  expected_output: tc.expected_output || '',
                  is_hidden: tc.is_hidden == 1 || tc.is_hidden === true
              }))
              : [{ input_data: '', expected_output: '', is_hidden: false }]
          });
        }
      } catch (error) {
        toast.error("Không thể khởi tạo dữ liệu câu hỏi");
      } finally {
        setFetching(false);
      }
    };

    initData();
  }, [id, isEdit, reset, apiPrefix, fetchTopics]);

  const checkAndSubmit = async (data) => {
    setLoading(true);
    try {
        const checkRes = await api.post(`${apiPrefix}/questions/check-similarity`, {
            subject_id: data.subject_id,
            content: data.content,
            exclude_id: isEdit ? id : null
        });

        const { status, message, similarity_percent, similar_content, owner } = checkRes.data;

        if (status === 'exact_match') {
            setLoading(false);
            return Swal.fire('Lỗi trùng lặp!', message, 'error');
        }

        if (status === 'similar_match') {
            setLoading(false);
            const confirm = await Swal.fire({
                title: `Phát hiện câu hỏi tương tự (${similarity_percent}%)`,
                html: `Hệ thống tìm thấy một câu hỏi gần giống của <b>${owner}</b>:<br><br>
                       <i style="color:gray">"${similar_content}"</i><br><br>
                       Bạn có chắc chắn vẫn muốn lưu câu hỏi này không?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Vẫn Lưu',
                cancelButtonText: 'Hủy bỏ'
            });

            if (!confirm.isConfirmed) return;
            setLoading(true); 
        }

        await onSubmitData(data);
    } catch (error) {
        toast.error("Lỗi khi kiểm tra nội dung câu hỏi.");
        setLoading(false);
    }
  };

  const onSubmitData = async (data) => {
    try {
      const payload = {
        subject_id: data.subject_id,
        topic_id: data.topic_id,
        content: data.content,
        type: data.type,
        difficulty: data.difficulty,
        score: data.score,
        explanation: data.explanation,
      };

      if (data.type === 'fill_blank') {
        payload.fill_blank_answers = data.correct_answer.split('|').map(s => s.trim()).filter(Boolean);
      } else if (data.type === 'coding') {
        payload.time_limit = data.time_limit;
        payload.memory_limit = data.memory_limit;
        payload.test_cases = data.test_cases;
        payload.allowed_languages = data.allowed_languages;
      } else {
        const correctKeys = data.correct_answer.split(',');
        payload.choices = data.choices.map(c => ({
          choice_text: c.text,
          is_correct: correctKeys.includes(c.key)
        }));
      }

      if (isEdit) {
        await api.put(`${apiPrefix}/questions/${id}`, payload);
        toast.success('Cập nhật thành công');
      } else {
        await api.post(`${apiPrefix}/questions`, payload);
        toast.success('Thêm câu hỏi thành công');
      }
      navigate(`${apiPrefix}/questions`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu');
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-200 font-sans pb-10">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">{isEdit ? 'Sửa câu hỏi' : 'Thêm câu hỏi'}</h1>
      
      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex gap-3 mb-6">
            <Lock className="w-6 h-6 shrink-0 mt-0.5"/>
            <div>
                <p className="font-bold">Câu hỏi đã bị khóa</p>
                <p className="text-sm mt-1">Câu hỏi này đã được sử dụng trong các kỳ thi. Để bảo vệ dữ liệu lịch sử thi của học viên, bạn không thể chỉnh sửa nội dung. Vui lòng tạo câu hỏi mới nếu cần.</p>
            </div>
        </div>
      )}

      <form onSubmit={handleSubmit(checkAndSubmit)} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1 text-slate-700">Môn học</label>
            <select 
              disabled={isLocked}
              {...register('subject_id', {
                onChange: (e) => {
                  fetchTopics(e.target.value);
                  setValue('topic_id', ''); 
                }
              })} 
              className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 focus:outline-none focus:ring focus:ring-indigo-200 transition"
            >
              <option value="">-- Chọn môn học --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <p className="text-red-500 text-sm mt-1">{errors.subject_id?.message}</p>
          </div>
          <div>
            <label className="block font-medium mb-1 text-slate-700">Chủ đề</label>
            <select disabled={isLocked} {...register('topic_id')} className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 focus:outline-none focus:ring focus:ring-indigo-200 transition">
              <option value="">-- Chọn chủ đề --</option>
              {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <p className="text-red-500 text-sm mt-1">{errors.topic_id?.message}</p>
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1 text-slate-700">Nội dung câu hỏi</label>
          <textarea disabled={isLocked} {...register('content')} rows={4} className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 focus:outline-none focus:ring focus:ring-indigo-200 transition resize-none" placeholder="Nhập nội dung câu hỏi (hỗ trợ code nếu cần)..." />
          <p className="text-red-500 text-sm mt-1">{errors.content?.message}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium mb-1 text-slate-700">Loại câu hỏi</label>
            <select disabled={isLocked} {...register('type')} className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 focus:outline-none focus:ring focus:ring-indigo-200 transition font-bold text-indigo-700">
              <option value="single">Trắc nghiệm 1 đáp án</option>
              <option value="multiple">Trắc nghiệm nhiều đáp án</option>
              <option value="fill_blank">Điền khuyết</option>
              <option value="coding">Code (Lập trình)</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1 text-slate-700">Độ khó</label>
            <select disabled={isLocked} {...register('difficulty')} className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 focus:outline-none focus:ring focus:ring-indigo-200 transition">
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1 text-slate-700"></label>
            <input type="hidden" step="0.1" {...register('score')} className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 focus:outline-none focus:ring focus:ring-indigo-200 transition" />
          </div>
        </div>

        {(questionType === 'single' || questionType === 'multiple') && (
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 animate-in fade-in">
            <label className="block font-bold mb-4 text-slate-800">Các lựa chọn</label>
            {fields.map((field, idx) => {
              const currentLetter = String.fromCharCode(65 + idx);
              setValue(`choices.${idx}.key`, currentLetter); 

              return (
                <div key={field.id} className="flex gap-3 mb-3 items-center">
                  <span className="w-10 h-10 flex shrink-0 items-center justify-center bg-indigo-100 text-indigo-700 font-bold rounded-lg shadow-sm">
                    {currentLetter}
                  </span>
                  <input
                    disabled={isLocked}
                    {...register(`choices.${idx}.text`)}
                    placeholder={`Nhập nội dung cho đáp án ${currentLetter}`}
                    className="flex-1 border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:ring focus:ring-indigo-200 transition"
                  />
                  {fields.length > 2 && !isLocked && (
                    <button type="button" onClick={() => remove(idx)} className="text-red-500 hover:text-red-700 font-medium px-2 transition">Xoá</button>
                  )}
                </div>
              );
            })}
            {fields.length < 6 && !isLocked && (
              <button 
                type="button" 
                onClick={() => append({ key: String.fromCharCode(65 + fields.length), text: '' })} 
                className="text-indigo-600 font-bold hover:text-indigo-800 transition mt-2 inline-block"
              >
                + Thêm lựa chọn
              </button>
            )}
            <p className="text-red-500 text-sm mt-1">{errors.choices?.message}</p>
          </div>
        )}

        {questionType !== 'coding' && (
            <div className="bg-indigo-50/70 p-5 rounded-xl border border-indigo-100 animate-in fade-in">
            <label className="block font-bold mb-4 text-indigo-900">
                {questionType === 'fill_blank' ? 'Thiết lập phương án đúng' : 'Chọn đáp án đúng'}
            </label>
            
            {questionType === 'single' && (
                <div className="flex flex-wrap gap-6">
                {fields.map((field, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    return (
                    <label key={field.id} className={`flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-indigo-200 shadow-sm transition ${isLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-400'}`}>
                        <input 
                        disabled={isLocked}
                        type="radio" 
                        value={letter} 
                        {...register('correct_answer')} 
                        className={`w-5 h-5 text-indigo-600 focus:ring-indigo-500 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        />
                        <span className="font-bold text-slate-700">{letter}</span>
                    </label>
                    );
                })}
                </div>
            )}

            {questionType === 'multiple' && (
                <div className="flex flex-wrap gap-6">
                {fields.map((field, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    return (
                    <label key={field.id} className={`flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-indigo-200 shadow-sm transition ${isLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-400'}`}>
                        <input 
                        disabled={isLocked}
                        type="checkbox" 
                        value={letter}
                        checked={watch('correct_answer')?.split(',').includes(letter) || false}
                        onChange={(e) => {
                            if(isLocked) return;
                            let currentAnswers = watch('correct_answer') ? watch('correct_answer').split(',') : [];
                            if (e.target.checked) currentAnswers.push(letter);
                            else currentAnswers = currentAnswers.filter(ans => ans !== letter);
                            setValue('correct_answer', currentAnswers.sort().join(','));
                        }}
                        className={`w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        />
                        <span className="font-bold text-slate-700">{letter}</span>
                    </label>
                    );
                })}
                </div>
            )}

            {questionType === 'fill_blank' && (
                <>
                <input disabled={isLocked} {...register('correct_answer')} placeholder="Nhập các phương án đúng cách nhau bởi dấu | (VD: push|đẩy)" className="w-full border border-slate-200 bg-white rounded-lg p-3 focus:outline-none focus:ring focus:ring-indigo-200 transition font-medium" />
                <p className="text-sm text-indigo-600 mt-2 font-medium">Lưu ý: Học viên nhập 1 trong các từ cách nhau bởi dấu "|" đều được tính điểm.</p>
                </>
            )}
            
            <p className="text-red-500 text-sm mt-2">{errors.correct_answer?.message}</p>
            </div>
        )}

        {questionType === 'coding' && (
            <div className="mt-6 border-t border-slate-200 pt-6 animate-in fade-in slide-in-from-top-2">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                    Cấu hình Chấm Code Tự động
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                           Giới hạn thời gian
                        </label>
                        <div className="relative">
                            <input 
                                disabled={isLocked}
                                type="number" 
                                {...register('time_limit')} 
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-500 font-medium disabled:opacity-70 disabled:bg-slate-100" 
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">ms</span>
                        </div>
                        <p className="text-red-500 text-sm mt-1">{errors.time_limit?.message}</p>
                        <p className="text-xs text-slate-500">Mặc định: 2000ms (2 giây)</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                            Giới hạn bộ nhớ
                        </label>
                        <div className="relative">
                            <input 
                                disabled={isLocked}
                                type="number" 
                                {...register('memory_limit')} 
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-500 font-medium disabled:opacity-70 disabled:bg-slate-100" 
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">KB</span>
                        </div>
                        <p className="text-red-500 text-sm mt-1">{errors.memory_limit?.message}</p>
                        <p className="text-xs text-slate-500">Mặc định: 128000KB (128 MB)</p>
                    </div>
                    <div className="mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-3">
                          Ngôn ngữ lập trình được phép sử dụng
                        </label>
                        <div className="flex flex-wrap gap-4">
                            {[
                                { id: 'cpp', label: 'C++ (GCC)' },
                                { id: 'python', label: 'Python 3' },
                                { id: 'java', label: 'Java' },
                                { id: 'php', label: 'PHP' }
                            ].map(lang => (
                                <label key={lang.id} className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition shadow-sm">
                                    <input 
                                        disabled={isLocked}
                                        type="checkbox" 
                                        value={lang.id}
                                        {...register('allowed_languages')}
                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 disabled:cursor-not-allowed" 
                                    />
                                    <span className="text-sm font-bold text-slate-700">{lang.label}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-red-500 text-xs mt-2">{errors.allowed_languages?.message}</p>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-end mb-4">
                        <h4 className="font-bold text-slate-700">Danh sách Test Cases ({testCaseFields.length})</h4>
                        {!isLocked && (
                            <button 
                                type="button" 
                                onClick={() => appendTestCase({ input_data: '', expected_output: '', is_hidden: false })}
                                className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold transition border border-indigo-200 shadow-sm"
                            >
                                <Plus className="w-4 h-4" /> Thêm Test Case
                            </button>
                        )}
                    </div>

                    {testCaseFields.length === 0 ? (
                        <div className="text-center p-8 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-sm font-medium">
                            Bạn chưa thêm Test Case nào. Học viên sẽ không có dữ liệu để hệ thống chấm điểm!
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {testCaseFields.map((field, index) => (
                                <div key={field.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                                    
                                    {!isLocked && (
                                        <button 
                                            type="button" 
                                            onClick={() => removeTestCase(index)}
                                            className="absolute top-3 right-3 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                            title="Xóa Test Case này"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}

                                    <div className="flex items-center gap-3 mb-4 pr-10">
                                        <span className="bg-slate-800 text-white w-7 h-7 flex items-center justify-center rounded-lg font-bold text-sm shadow-sm">
                                            {index + 1}
                                        </span>
                                        <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 transition ${isLocked ? 'bg-slate-100 opacity-70 cursor-not-allowed' : 'bg-slate-50 cursor-pointer hover:border-slate-300'}`}>
                                            <input 
                                                disabled={isLocked}
                                                type="checkbox" 
                                                {...register(`test_cases.${index}.is_hidden`)}
                                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 disabled:cursor-not-allowed" 
                                            />
                                            {watch(`test_cases.${index}.is_hidden`) ? (
                                                <span className="text-sm font-bold text-rose-600 flex items-center gap-1.5"><EyeOff className="w-4 h-4"/> Test Case Ẩn (Bảo mật)</span>
                                            ) : (
                                                <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5"><Eye className="w-4 h-4"/> Test Case Công khai</span>
                                            )}
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-slate-700">Input (Dữ liệu đầu vào - stdin)</label>
                                            <textarea 
                                                disabled={isLocked}
                                                {...register(`test_cases.${index}.input_data`)}
                                                placeholder="Ví dụ: 5 7"
                                                rows={3}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono text-sm resize-none disabled:bg-slate-100 disabled:opacity-70"
                                            ></textarea>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-slate-700">Expected Output (Kết quả mong muốn) <span className="text-red-500">*</span></label>
                                            <textarea 
                                                disabled={isLocked}
                                                {...register(`test_cases.${index}.expected_output`)}
                                                placeholder="Ví dụ: 12"
                                                rows={3}
                                                className="w-full p-3 bg-indigo-50/30 border border-indigo-200 rounded-xl outline-none focus:border-indigo-500 font-mono text-sm resize-none disabled:bg-slate-100 disabled:opacity-70"
                                            ></textarea>
                                            <p className="text-red-500 text-xs mt-1">{errors.test_cases?.[index]?.expected_output?.message}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="text-red-500 text-sm mt-2">{errors.test_cases?.message}</p>
                </div>
            </div>
        )}

        <div>
          <label className="block font-medium mb-1 text-slate-700">Giải thích</label>
          <textarea disabled={isLocked} {...register('explanation')} rows={2} className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 focus:outline-none focus:ring focus:ring-indigo-200 transition resize-none" placeholder="Giải thích vì sao lại chọn đáp án này..." />
        </div>

        <div className="flex gap-3 pt-6 border-t border-slate-100">
          <button type="button" onClick={() => navigate(`${apiPrefix}/questions`)} className="bg-slate-100 text-slate-700 px-8 py-3 rounded-xl hover:bg-slate-200 font-bold transition">
            Hủy
          </button>
          {!isLocked && (
            <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-70">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEdit ? 'Cập nhật Câu hỏi' : 'Lưu Câu hỏi')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}