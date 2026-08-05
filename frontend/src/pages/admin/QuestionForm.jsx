import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const schema = yup.object({
  subject_id: yup.string().required('Môn học bắt buộc'),
  topic_id: yup.string().required('Chủ đề bắt buộc'),
  content: yup.string().required('Nội dung bắt buộc'),
  type: yup.string().oneOf(['single', 'multiple', 'fill_blank']).required(),
  difficulty: yup.string().oneOf(['easy', 'medium', 'hard']).required(),
  correct_answer: yup.string().required('Đáp án đúng bắt buộc'),
  score: yup.number().min(0.1).max(10).default(1),
  explanation: yup.string().nullable(),
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

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      type: 'single',
      difficulty: 'medium',
      score: 1,
      choices: [{ key: 'A', text: '' }, { key: 'B', text: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'choices' });
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
          
          let correctAnsStr = '';
          if (q.type === 'fill_blank') {
            correctAnsStr = q.fill_blank_answers?.map(a => a.accepted_text).join(' | ') || '';
          } else {
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
            choices: q.choices && q.choices.length
              ? q.choices.map((c, i) => ({ 
                  key: String.fromCharCode(65 + i), 
                  text: c.choice_text || c.text 
                }))
              : [{ key: 'A', text: '' }, { key: 'B', text: '' }],
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


  const onSubmit = async (data) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-200 font-sans pb-10">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">{isEdit ? 'Sửa câu hỏi' : 'Thêm câu hỏi'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1 text-slate-700">Môn học</label>
            
            <select 
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
            <select {...register('topic_id')} className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 focus:outline-none focus:ring focus:ring-indigo-200 transition">
              <option value="">-- Chọn chủ đề --</option>
              {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <p className="text-red-500 text-sm mt-1">{errors.topic_id?.message}</p>
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1 text-slate-700">Nội dung câu hỏi (có thể nhập HTML)</label>
          <textarea {...register('content')} rows={4} className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 focus:outline-none focus:ring focus:ring-indigo-200 transition resize-none" placeholder="Nhập nội dung câu hỏi..." />
          <p className="text-red-500 text-sm mt-1">{errors.content?.message}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium mb-1 text-slate-700">Loại câu hỏi</label>
            <select {...register('type')} className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 focus:outline-none focus:ring focus:ring-indigo-200 transition">
              <option value="single">Trắc nghiệm 1 đáp án</option>
              <option value="multiple">Trắc nghiệm nhiều đáp án</option>
              <option value="fill_blank">Điền khuyết</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1 text-slate-700">Độ khó</label>
            <select {...register('difficulty')} className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 focus:outline-none focus:ring focus:ring-indigo-200 transition">
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
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
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
                    {...register(`choices.${idx}.text`)}
                    placeholder={`Nhập nội dung cho đáp án ${currentLetter}`}
                    className="flex-1 border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:ring focus:ring-indigo-200 transition"
                  />
                  {fields.length > 2 && (
                    <button type="button" onClick={() => remove(idx)} className="text-red-500 hover:text-red-700 font-medium px-2 transition">Xoá</button>
                  )}
                </div>
              );
            })}
            {fields.length < 6 && (
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

        <div className="bg-indigo-50/70 p-5 rounded-xl border border-indigo-100">
          <label className="block font-bold mb-4 text-indigo-900">
            {questionType === 'fill_blank' ? 'Thiết lập phương án đúng' : 'Chọn đáp án đúng'}
          </label>
          
          {questionType === 'single' && (
            <div className="flex flex-wrap gap-6">
              {fields.map((field, idx) => {
                const letter = String.fromCharCode(65 + idx);
                return (
                  <label key={field.id} className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-indigo-200 shadow-sm hover:border-indigo-400 transition">
                    <input 
                      type="radio" 
                      value={letter} 
                      {...register('correct_answer')} 
                      className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
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
                  <label key={field.id} className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-indigo-200 shadow-sm hover:border-indigo-400 transition">
                    <input 
                      type="checkbox" 
                      value={letter}
                      checked={watch('correct_answer')?.split(',').includes(letter) || false}
                      onChange={(e) => {
                        let currentAnswers = watch('correct_answer') ? watch('correct_answer').split(',') : [];
                        if (e.target.checked) currentAnswers.push(letter);
                        else currentAnswers = currentAnswers.filter(ans => ans !== letter);
                        setValue('correct_answer', currentAnswers.sort().join(','));
                      }}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="font-bold text-slate-700">{letter}</span>
                  </label>
                );
              })}
            </div>
          )}

          {questionType === 'fill_blank' && (
            <>
              <input {...register('correct_answer')} placeholder="Nhập các phương án đúng cách nhau bởi dấu | (VD: push|đẩy)" className="w-full border border-slate-200 bg-white rounded-lg p-3 focus:outline-none focus:ring focus:ring-indigo-200 transition font-medium" />
              <p className="text-sm text-indigo-600 mt-2 font-medium">Lưu ý: Học viên nhập 1 trong các từ cách nhau bởi dấu "|" đều được tính điểm.</p>
            </>
          )}
          
          <p className="text-red-500 text-sm mt-2">{errors.correct_answer?.message}</p>
        </div>

        <div>
          <label className="block font-medium mb-1 text-slate-700">Giải thích</label>
          <textarea {...register('explanation')} rows={2} className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 focus:outline-none focus:ring focus:ring-indigo-200 transition resize-none" placeholder="Giải thích vì sao lại chọn đáp án này..." />
        </div>

        <div className="flex gap-3 pt-6 border-t border-slate-100">
          <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-70">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEdit ? 'Cập nhật Câu hỏi' : 'Lưu Câu hỏi')}
          </button>
          <button type="button" onClick={() => navigate(`${apiPrefix}/questions`)} className="bg-slate-100 text-slate-700 px-8 py-3 rounded-xl hover:bg-slate-200 font-bold transition">
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}