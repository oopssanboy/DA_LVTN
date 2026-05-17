import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, FileText, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function ExamManager() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams');
      setExams(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    await api.delete(`/exams/${selectedExam.id}`);
    fetchExams();
    setShowConfirm(false);
  };

  const handleGenerate = async (examId) => {
    if (window.confirm('Sinh đề sẽ xóa đề cũ. Bạn có chắc?')) {
      await api.post(`/exams/${examId}/generate`);
      alert('Sinh đề thành công');
    }
  };
  const handleToggleStatus = async (exam) => {
    try {
      const newStatus = !exam.is_active;
      await api.patch(`/exams/${exam.id}/status`, { is_active: newStatus });
      // Cập nhật state trực tiếp để UI phản hồi nhanh mà không cần gọi lại fetchExams()
      setExams(exams.map(e => e.id === exam.id ? { ...e, is_active: newStatus } : e));
    } catch (err) {
      alert('Lỗi cập nhật trạng thái kỳ thi');
      console.error(err);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý kỳ thi</h1>
        <Link to="/admin/exams/create" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-sm">
          <Plus size={18} /> Tạo kỳ thi
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Tiêu đề</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Lớp</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Số câu</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Thời gian</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Trạng thái</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {exams.map(exam => (
                  <tr key={exam.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium">{exam.title}</td>
                    <td className="px-6 py-4 text-gray-600">{exam.class_name}</td>
                    <td className="px-6 py-4">{exam.total_questions}</td>
                    <td className="px-6 py-4">{exam.duration} phút</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(exam)}
                        className="hover:opacity-80 transition"
                        title="Nhấn để thay đổi trạng thái"
                      >
                        {exam.is_active ? (
                          <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit text-xs cursor-pointer">
                            <CheckCircle size={12} /> Đang mở
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-1 rounded-full w-fit text-xs cursor-pointer">
                            <XCircle size={12} /> Đóng
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button onClick={() => handleGenerate(exam.id)} className="text-blue-500 hover:text-blue-700" title="Sinh đề">
                        <FileText size={16} />
                      </button>
                      <Link to={`/admin/exams/${exam.id}/edit`} className="text-yellow-600 hover:text-yellow-800">
                        <Edit size={16} />
                      </Link>
                      <button onClick={() => { setSelectedExam(exam); setShowConfirm(true); }} className="text-red-500 hover:text-red-700">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <ConfirmDialog show={showConfirm} title="Xóa kỳ thi" message={`Xóa "${selectedExam?.title}"?`} onConfirm={handleDelete} onCancel={() => setShowConfirm(false)} />
    </div>
  );
}