import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import MatrixRows from '../../components/admin/MatrixRows';

export default function ExamForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    class_id: '',
    title: '',
    subject: '',
    duration: 60,
    total_questions: 0,
    start_time: '',
    end_time: '',
    password: '',
    is_active: false,
    shuffle_questions: true,
    shuffle_options: true,
    passing_score: 5,
    matrices: [{ topic: '', difficulty: 'easy', quantity: 1 }],
  });

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  // Fetch danh sách lớp
  api.get('/classes')
    .then(res => {
      // Ưu tiên res.data.data (nếu dùng Resource/Pagination), nếu không có thì lấy trực tiếp res.data
      const classList = res.data.data || res.data || [];
      setClasses(classList);
    })
    .catch(err => {
      console.error('Lỗi khi tải danh sách lớp:', err);
    });

  if (isEdit) {
    api.get(`/exams/${id}`).then(res => {
      const exam = res.data.data;
      setFormData({
        class_id: exam.class_id,
        title: exam.title,
        subject: exam.subject,
        duration: exam.duration,
        total_questions: exam.total_questions,
        start_time: exam.start_time ? exam.start_time.slice(0, 16) : '',
        end_time: exam.end_time ? exam.end_time.slice(0, 16) : '',
        password: exam.password || '',
        is_active: exam.is_active,
        shuffle_questions: exam.shuffle_questions,
        shuffle_options: exam.shuffle_options,
        passing_score: exam.passing_score,
        matrices: exam.matrices && exam.matrices.length > 0 ? exam.matrices : [{ topic: '', difficulty: 'easy', quantity: 1 }],
      });
    }).catch(err => {
       console.error('Lỗi khi tải chi tiết kỳ thi:', err);
    });
  }
}, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTotalQuestionsChange = (e) => {
    const val = parseInt(e.target.value) || 0;
    setFormData(prev => ({ ...prev, total_questions: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totalQ = formData.matrices.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
    if (totalQ !== parseInt(formData.total_questions)) {
      alert(`Tổng số câu hỏi (${totalQ}) không khớp với tổng số câu bạn nhập (${formData.total_questions})`);
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/exams/${id}`, formData);
      } else {
        await api.post('/exams', formData);
      }
      navigate('/admin/exams');
    } catch (error) {
      if (error.response?.status === 422) {
        // Trích xuất các lỗi validation chi tiết từ Laravel
        const validationErrors = error.response.data.errors;
        const errorMessages = Object.values(validationErrors).flat().join('\n');
        alert(`Vui lòng kiểm tra lại thông tin:\n${errorMessages}`);
      } else {
        alert(error.response?.data?.message || 'Lỗi lưu kỳ thi');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Sửa kỳ thi' : 'Tạo kỳ thi mới'}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Lớp học</label>
            <select name="class_id" value={formData.class_id} onChange={handleChange} required className="w-full border rounded px-3 py-2">
              <option value="">Chọn lớp</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Tiêu đề kỳ thi</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Môn học</label>
            <input type="text" name="subject" value={formData.subject} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Thời gian làm bài (phút)</label>
            <input type="number" name="duration" value={formData.duration} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Tổng số câu hỏi</label>
            <input type="number" name="total_questions" value={formData.total_questions} onChange={handleTotalQuestionsChange} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Điểm đậu (thang 10)</label>
            <input type="number" step="0.5" name="passing_score" value={formData.passing_score} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Ngày bắt đầu</label>
            <input type="datetime-local" name="start_time" value={formData.start_time} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Ngày kết thúc</label>
            <input type="datetime-local" name="end_time" value={formData.end_time} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Mật khẩu (nếu có)</label>
            <input type="text" name="password" value={formData.password} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} />
            Kích hoạt kỳ thi
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="shuffle_questions" checked={formData.shuffle_questions} onChange={handleChange} />
            Xáo trộn câu hỏi
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="shuffle_options" checked={formData.shuffle_options} onChange={handleChange} />
            Xáo trộn đáp án
          </label>
        </div>

        <MatrixRows matrices={formData.matrices} setMatrices={(newMatrices) => setFormData({ ...formData, matrices: newMatrices })} />

        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700">
            {loading ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo mới')}
          </button>
          <button type="button" onClick={() => navigate('/admin/exams')} className="bg-gray-200 px-6 py-2 rounded-lg">Hủy</button>
        </div>
      </form>
    </div>
  );
}