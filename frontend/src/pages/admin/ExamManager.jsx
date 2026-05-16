import React, { useState, useEffect } from 'react';
import axios from '../../services/axios';
import { Link } from 'react-router-dom';
import { TrashIcon, PencilIcon, DocumentPlusIcon } from '@heroicons/react/24/outline';
import ConfirmModal from '../../components/common/ConfirmModal';

export default function ExamManager() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/exams');
      setExams(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDelete = async () => {
    try {
      await axios.delete(`/exams/${selectedExam.id}`);
      fetchExams();
    } catch (error) {
      alert('Xóa thất bại');
    } finally {
      setShowConfirm(false);
    }
  };

  const handleGenerate = async (examId) => {
    if (!window.confirm('Sinh đề sẽ xóa đề cũ. Bạn có chắc?')) return;
    try {
      await axios.post(`/exams/${examId}/generate`);
      alert('Sinh đề thành công');
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi sinh đề');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý kỳ thi</h1>
        <Link
          to="/admin/exams/create"
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
        >
          + Tạo kỳ thi mới
        </Link>
      </div>

      {loading && <p>Đang tải...</p>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiêu đề</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lớp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số câu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {exams.map((exam) => (
              <tr key={exam.id}>
                <td className="px-6 py-4">{exam.title}</td>
                <td className="px-6 py-4">{exam.class_name}</td>
                <td className="px-6 py-4">{exam.total_questions}</td>
                <td className="px-6 py-4">{exam.duration} phút</td>
                <td className="px-6 py-4">
                  {exam.is_active ? (
                    <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">Đang mở</span>
                  ) : (
                    <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-xs">Đóng</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => handleGenerate(exam.id)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Sinh đề"
                  >
                    <DocumentPlusIcon className="h-5 w-5 inline" />
                  </button>
                  <Link to={`/admin/exams/${exam.id}/edit`} className="text-yellow-600 hover:text-yellow-800">
                    <PencilIcon className="h-5 w-5 inline" />
                  </Link>
                  <button
                    onClick={() => { setSelectedExam(exam); setShowConfirm(true); }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-5 w-5 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        show={showConfirm}
        title="Xóa kỳ thi"
        message={`Bạn có chắc muốn xóa kỳ thi "${selectedExam?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}