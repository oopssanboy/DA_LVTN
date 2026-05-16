import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Schema validation động theo type, tạm thời dùng schema cơ bản
const schema = yup.object({
  subject: yup.string().required('Môn học bắt buộc'),
  topic: yup.string().required('Chủ đề bắt buộc'),
  content: yup.string().required('Nội dung bắt buộc'),
  type: yup.string().oneOf(['single', 'multiple', 'fill_blank']).required(),
  difficulty: yup.string().oneOf(['easy', 'medium', 'hard']).required(),
  correct_answer: yup.string().required('Đáp án đúng bắt buộc'),
  score: yup.number().min(0.1).max(10).default(1),
  explanation: yup.string(),
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

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
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

  useEffect(() => {
    if (isEdit) {
      api.get(`/questions/${id}`).then(res => {
        const q = res.data.data;
        setValue('subject', q.subject);
        setValue('topic', q.topic);
        setValue('content', q.content);
        setValue('type', q.type);
        setValue('difficulty', q.difficulty);
        setValue('correct_answer', q.correct_answer);
        setValue('score', q.score);
        setValue('explanation', q.explanation);
        if (q.choices && q.choices.length) {
          setValue('choices', q.choices.map(c => ({ key: c.key, text: c.text })));
        }
      });
    }
  }, [id, setValue, isEdit]);

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await api.put(`/questions/${id}`, data);
        toast.success('Cập nhật thành công');
      } else {
        await api.post('/questions', data);
        toast.success('Thêm câu hỏi thành công');
      }
      navigate('/admin/questions');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Sửa câu hỏi' : 'Thêm câu hỏi'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">Môn học</label>
            <input {...register('subject')} className="w-full border rounded p-2" />
            <p className="text-red-500 text-sm">{errors.subject?.message}</p>
          </div>
          <div>
            <label className="block font-medium">Chủ đề</label>
            <input {...register('topic')} className="w-full border rounded p-2" />
            <p className="text-red-500 text-sm">{errors.topic?.message}</p>
          </div>
        </div>

        <div>
          <label className="block font-medium">Nội dung câu hỏi (có thể HTML)</label>
          <textarea {...register('content')} rows={4} className="w-full border rounded p-2" />
          <p className="text-red-500 text-sm">{errors.content?.message}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-medium">Loại câu hỏi</label>
            <select {...register('type')} className="w-full border rounded p-2">
              <option value="single">Trắc nghiệm 1 đáp án</option>
              <option value="multiple">Trắc nghiệm nhiều đáp án</option>
              <option value="fill_blank">Điền khuyết</option>
            </select>
          </div>
          <div>
            <label className="block font-medium">Độ khó</label>
            <select {...register('difficulty')} className="w-full border rounded p-2">
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
          <div>
            <label className="block font-medium">Điểm số</label>
            <input type="number" step="0.5" {...register('score')} className="w-full border rounded p-2" />
          </div>
        </div>

        {(questionType === 'single' || questionType === 'multiple') && (
          <div>
            <label className="block font-medium">Các lựa chọn (A, B, C, D)</label>
            {fields.map((field, idx) => (
              <div key={field.id} className="flex gap-2 mb-2 items-center">
                <input
                  readOnly
                  value={field.key}
                  className="w-16 border rounded p-2 bg-gray-100"
                />
                <input
                  {...register(`choices.${idx}.text`)}
                  placeholder="Nội dung lựa chọn"
                  className="flex-1 border rounded p-2"
                />
                {fields.length > 2 && (
                  <button type="button" onClick={() => remove(idx)} className="text-red-500">Xoá</button>
                )}
              </div>
            ))}
            {fields.length < 4 && (
              <button type="button" onClick={() => append({ key: String.fromCharCode(65+fields.length), text: '' })} className="text-primary">+ Thêm lựa chọn</button>
            )}
            <p className="text-red-500 text-sm">{errors.choices?.message}</p>
          </div>
        )}

        <div>
          <label className="block font-medium">
            {questionType === 'fill_blank' ? 'Đáp án đúng (có thể nhập nhiều đáp án cách nhau | )' : 'Đáp án đúng'}
          </label>
          <input {...register('correct_answer')} className="w-full border rounded p-2" />
          <p className="text-red-500 text-sm">{errors.correct_answer?.message}</p>
          {questionType === 'multiple' && (
            <p className="text-xs text-gray-500">Ví dụ: A,C (chọn A và C)</p>
          )}
          {questionType === 'fill_blank' && (
            <p className="text-xs text-gray-500">Ví dụ: push|đẩy (học viên nhập "push" hoặc "đẩy" đều đúng)</p>
          )}
        </div>

        <div>
          <label className="block font-medium">Giải thích (hiển thị sau khi chấm)</label>
          <textarea {...register('explanation')} rows={2} className="w-full border rounded p-2" />
        </div>

        <div className="flex gap-2">
          <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg">Lưu</button>
          <button type="button" onClick={() => navigate('/admin/questions')} className="bg-gray-300 px-6 py-2 rounded-lg">Hủy</button>
        </div>
      </form>
    </div>
  );
}