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
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async () => {
    await api.delete(`/exams/${selectedExam.id}`);
    fetchExams();
    setShowConfirm(false);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/exams/${id}/status`, { is_active: !currentStatus });
      fetchExams();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (examId) => {
    if (window.confirm('Sinh đề tự động từ ma trận câu hỏi sẽ ghi đè lên cấu trúc đề cũ. Bạn vẫn muốn tiếp tục?')) {
      try {
        await api.post(`/exams/${examId}/generate`);
        alert('Đã đồng bộ sinh cấu trúc đề thi thành công!');
      } catch (err) {
        alert(err.response?.data?.message || 'Lỗi hệ thống ngân hàng câu hỏi thiếu hụt!');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Nút Thêm mới */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý kỳ thi</h1>
          <p className="text-sm text-gray-500 mt-1">Tạo lập ma trận đề thi và kiểm soát trạng thái phòng thi</p>
        </div>
        <Link to="/admin/exams/create" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm shadow-blue-500/10 active:scale-[0.98] self-start sm:self-auto">
          <Plus size={18} /> Thêm kỳ thi mới
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-sm text-gray-400 font-medium">
          Đang tải dữ liệu phòng thi...
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
              <thead className="bg-gray-50">
                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Môn học / Tiêu đề</th>
                  <th className="px-6 py-4">Lớp chỉ định</th>
                  <th className="px-6 py-4 text-center">Thời lượng</th>
                  <th className="px-6 py-4 text-center">Mật khẩu</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {exams.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400 font-medium">Chưa có thông tin kỳ thi nào được cấu hình.</td>
                  </tr>
                ) : (
                  exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{exam.subject}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{exam.title}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{exam.class?.name || 'Chưa định lớp'}</td>
                      <td className="px-6 py-4 text-center font-medium text-gray-700">{exam.duration} phút</td>
                      <td className="px-6 py-4 text-center text-xs">
                        {exam.password ? (
                          <span className="font-mono bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-medium">{exam.password}</span>
                        ) : (
                          <span className="text-gray-300 italic">Trống</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleToggleStatus(exam.id, exam.is_active)} className="focus:outline-none transition active:scale-95">
                          {exam.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                              <CheckCircle size={14} /> Đang mở
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-500 border border-gray-200">
                              <XCircle size={14} /> Đang đóng
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500 space-x-3.5 whitespace-nowrap">
                        <button onClick={() => handleGenerate(exam.id)} className="text-blue-500 hover:text-blue-700 transition" title="Sinh đề thi từ ma trận">
                          <FileText size={18} className="inline" />
                        </button>
                        <Link to={`/admin/exams/${exam.id}/edit`} className="text-amber-500 hover:text-amber-700 transition" title="Chỉnh sửa cấu hình">
                          <Edit size={18} className="inline" />
                        </Link>
                        <button onClick={() => { setSelectedExam(exam); setShowConfirm(true); }} className="text-red-500 hover:text-red-700 transition" title="Xóa kỳ thi">
                          <Trash2 size={18} className="inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <ConfirmDialog show={showConfirm} title="Xóa kỳ thi" message={`Hành động này không thể hoàn tác. Bạn chắc chắn muốn xóa kỳ thi "${selectedExam?.title}"?`} onConfirm={handleDelete} onCancel={() => setShowConfirm(false)} />
    </div>
  );
}