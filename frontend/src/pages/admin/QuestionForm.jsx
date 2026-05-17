import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../../services/api';
import toast from 'react-hot-toast';

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

  // Thêm 'reset' vào hook useForm
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

  useEffect(() => {
    if (isEdit) {
      api.get(`/questions/${id}`).then(res => {
        const q = res.data.data;
        
        // Sử dụng reset() để nạp toàn bộ dữ liệu đồng bộ
        reset({
          subject: q.subject,
          topic: q.topic,
          content: q.content,
          type: q.type,
          difficulty: q.difficulty,
          correct_answer: q.correct_answer || '', 
          score: q.score || 1,
          explanation: q.explanation || '',
          choices: q.choices && q.choices.length
            ? q.choices.map(c => ({ 
                key: c.choice_key || c.key, 
                text: c.choice_text || c.text 
              }))
            : [{ key: 'A', text: '' }, { key: 'B', text: '' }],
        });
      }).catch(err => {
        console.error("Lỗi tải chi tiết câu hỏi:", err);
        toast.error("Không thể tải thông tin câu hỏi");
      });
    }
  }, [id, isEdit, reset]);

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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Môn học</label>
            <input {...register('subject')} className="w-full border rounded-lg p-2 focus:outline-none focus:ring focus:ring-indigo-200" />
            <p className="text-red-500 text-sm mt-1">{errors.subject?.message}</p>
          </div>
          <div>
            <label className="block font-medium mb-1">Chủ đề</label>
            <input {...register('topic')} className="w-full border rounded-lg p-2 focus:outline-none focus:ring focus:ring-indigo-200" />
            <p className="text-red-500 text-sm mt-1">{errors.topic?.message}</p>
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Nội dung câu hỏi (có thể HTML)</label>
          <textarea {...register('content')} rows={4} className="w-full border rounded-lg p-2 focus:outline-none focus:ring focus:ring-indigo-200" />
          <p className="text-red-500 text-sm mt-1">{errors.content?.message}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-medium mb-1">Loại câu hỏi</label>
            <select {...register('type')} className="w-full border rounded-lg p-2 focus:outline-none focus:ring focus:ring-indigo-200 bg-white">
              <option value="single">Trắc nghiệm 1 đáp án</option>
              <option value="multiple">Trắc nghiệm nhiều đáp án</option>
              <option value="fill_blank">Điền khuyết</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Độ khó</label>
            <select {...register('difficulty')} className="w-full border rounded-lg p-2 focus:outline-none focus:ring focus:ring-indigo-200 bg-white">
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Điểm số</label>
            <input type="number" step="0.5" {...register('score')} className="w-full border rounded-lg p-2 focus:outline-none focus:ring focus:ring-indigo-200" />
          </div>
        </div>

        {/* PHẦN LỰA CHỌN */}
        {(questionType === 'single' || questionType === 'multiple') && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <label className="block font-medium mb-3">Các lựa chọn</label>
            {fields.map((field, idx) => {
              const currentLetter = String.fromCharCode(65 + idx);
              // Đồng bộ key A, B, C, D động vào data
              setValue(`choices.${idx}.key`, currentLetter);

              return (
                <div key={field.id} className="flex gap-3 mb-3 items-center">
                  <span className="w-10 h-10 flex items-center justify-center bg-indigo-100 text-indigo-700 font-bold rounded-lg shadow-sm">
                    {currentLetter}
                  </span>
                  <input
                    {...register(`choices.${idx}.text`)}
                    placeholder={`Nhập nội dung cho đáp án ${currentLetter}`}
                    className="flex-1 border rounded-lg p-2 focus:outline-none focus:ring focus:ring-indigo-200"
                  />
                  {fields.length > 2 && (
                    <button type="button" onClick={() => remove(idx)} className="text-red-500 hover:text-red-700 font-medium px-2">Xoá</button>
                  )}
                </div>
              );
            })}
            {fields.length < 4 && (
              <button 
                type="button" 
                onClick={() => append({ key: String.fromCharCode(65 + fields.length), text: '' })} 
                className="text-indigo-600 font-medium hover:underline mt-2 inline-block"
              >
                + Thêm lựa chọn
              </button>
            )}
            <p className="text-red-500 text-sm mt-1">{errors.choices?.message}</p>
          </div>
        )}

        {/* PHẦN ĐÁP ÁN ĐÚNG */}
        <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
          <label className="block font-medium mb-3">
            {questionType === 'fill_blank' ? 'Đáp án đúng (có thể nhập nhiều đáp án cách nhau | )' : 'Chọn đáp án đúng'}
          </label>
          
          {questionType === 'single' && (
            <div className="flex gap-6">
              {fields.map((field, idx) => {
                const letter = String.fromCharCode(65 + idx);
                return (
                  <label key={field.id} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      value={letter} 
                      {...register('correct_answer')} 
                      className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700 text-lg">{letter}</span>
                  </label>
                );
              })}
            </div>
          )}

          {questionType === 'multiple' && (
            <div className="flex gap-6">
              {fields.map((field, idx) => {
                const letter = String.fromCharCode(65 + idx);
                return (
                  <label key={field.id} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      value={letter}
                      checked={watch('correct_answer')?.split(',').includes(letter) || false}
                      onChange={(e) => {
                        let currentAnswers = watch('correct_answer') ? watch('correct_answer').split(',') : [];
                        if (e.target.checked) {
                          currentAnswers.push(letter);
                        } else {
                          currentAnswers = currentAnswers.filter(ans => ans !== letter);
                        }
                        setValue('correct_answer', currentAnswers.sort().join(','));
                      }}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700 text-lg">{letter}</span>
                  </label>
                );
              })}
            </div>
          )}

          {questionType === 'fill_blank' && (
            <>
              <input {...register('correct_answer')} placeholder="VD: push|đẩy" className="w-full border rounded-lg p-2 focus:outline-none focus:ring focus:ring-indigo-200" />
              <p className="text-xs text-gray-500 mt-2">Ví dụ: push|đẩy (học viên nhập "push" hoặc "đẩy" đều đúng)</p>
            </>
          )}
          
          <p className="text-red-500 text-sm mt-2">{errors.correct_answer?.message}</p>
        </div>

        <div>
          <label className="block font-medium mb-1">Giải thích (hiển thị sau khi chấm)</label>
          <textarea {...register('explanation')} rows={2} className="w-full border rounded-lg p-2 focus:outline-none focus:ring focus:ring-indigo-200" />
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 shadow-sm font-medium transition">
            {isEdit ? 'Cập nhật' : 'Lưu câu hỏi'}
          </button>
          <button type="button" onClick={() => navigate('/admin/questions')} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl hover:bg-gray-200 font-medium transition">
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}