import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function QuestionList() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/questions');
      setQuestions(res.data.data);
    } catch (error) {
      toast.error('Không thể tải danh sách câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xoá câu hỏi này?')) return;
    try {
      await api.delete(`/questions/${id}`);
      toast.success('Xoá thành công');
      fetchQuestions();
    } catch (error) {
      toast.error('Xoá thất bại');
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý câu hỏi</h1>
        <Link
          to="/admin/questions/create"
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-700"
        >
          + Thêm câu hỏi
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Môn</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chủ đề</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nội dung</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Độ khó</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {questions.map((q) => (
              <tr key={q.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{q.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{q.subject}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{q.topic}</td>
                <td className="px-6 py-4 text-sm max-w-md truncate" dangerouslySetInnerHTML={{ __html: q.content }} />
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {q.type === 'single' ? '1 đáp án' : q.type === 'multiple' ? 'Nhiều đáp án' : 'Điền khuyết'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{q.difficulty}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <Link to={`/admin/questions/${q.id}/edit`} className="text-blue-600 hover:underline">Sửa</Link>
                  <button onClick={() => handleDelete(q.id)} className="text-red-600 hover:underline">Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}