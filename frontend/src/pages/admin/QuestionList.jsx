import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Upload, Download } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function QuestionList() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');

  useEffect(() => { fetchQuestions(); }, [filterSubject, filterDifficulty]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterSubject) params.append('subject', filterSubject);
      if (filterDifficulty) params.append('difficulty', filterDifficulty);

      // Đã có sẵn phân trang và query trong api controller /questions
      const res = await api.get(`/questions?${params.toString()}`);
      setQuestions(res.data.data || []);
    } catch (err) { toast.error('Lỗi tải dữ liệu'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Xóa câu hỏi?')) {
      await api.delete(`/questions/${id}`);
      toast.success('Đã xóa');
      fetchQuestions();
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const loadingToast = toast.loading('Đang import dữ liệu...');
    try {
      await api.post('/questions/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Import thành công', { id: loadingToast });
      fetchQuestions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi import', { id: loadingToast });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    const loadingToast = toast.loading('Đang xuất file Excel...');
    try {
      const params = new URLSearchParams();
      if (filterSubject) params.append('subject', filterSubject);
      if (filterDifficulty) params.append('difficulty', filterDifficulty);

      const response = await api.get(`/questions/export?${params.toString()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Danh_sach_cau_hoi.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Xuất file thành công', { id: loadingToast });
    } catch (error) {
      // ĐỌC LỖI TỪ BLOB NẾU BACKEND TRẢ VỀ LỖI
      if (error.response && error.response.data instanceof Blob) {
        const textError = await error.response.data.text();
        console.error("Lỗi từ backend trả về:", textError); // Bật F12 (Console) để xem dòng này
        toast.error('Lỗi Server: Vui lòng xem Console (F12)', { id: loadingToast });
      } else {
        toast.error('Lỗi mạng hoặc không thể xuất file', { id: loadingToast });
      }
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ngân hàng câu hỏi</h1>
        <div className="flex gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 shadow-sm transition">
            <Download size={18} /> Xuất Excel
          </button>
          <input
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden"
          />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 shadow-sm transition">
            <Upload size={18} /> Import Excel
          </button>
          <Link to="/admin/questions/create" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 shadow-sm transition">
            <Plus size={18} /> Thêm câu hỏi
          </Link>
        </div>
      </div>
      <div className="flex gap-4 mb-4">
        <input type="text" placeholder="Lọc theo môn học..." value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2 w-64 text-sm outline-none focus:border-indigo-500" />
        <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 bg-white">
          <option value="">Tất cả độ khó</option>
          <option value="easy">Dễ</option>
          <option value="medium">Trung bình</option>
          <option value="hard">Khó</option>
        </select>
      </div>

      {loading ? <div className="text-center py-10">Đang tải...</div> : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr><th className="px-6 py-3 text-left">Môn</th><th className="px-6 py-3 text-left">Chủ đề</th><th className="px-6 py-3 text-left">Nội dung</th><th className="px-6 py-3 text-left">Loại</th><th className="px-6 py-3 text-center">Thao tác</th></tr>
              </thead>
              <tbody className="divide-y">
                {questions.map(q => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{q.subject}</td>
                    <td className="px-6 py-4">{q.topic}</td>
                    <td className="px-6 py-4 max-w-md truncate" dangerouslySetInnerHTML={{ __html: q.content }} />
                    <td className="px-6 py-4">{q.type === 'single' ? '1 đáp án' : q.type === 'multiple' ? 'Nhiều đáp án' : 'Điền khuyết'}</td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <Link to={`/admin/questions/${q.id}/edit`} className="text-yellow-600"><Edit size={16} /></Link>
                      <button onClick={() => handleDelete(q.id)} className="text-red-500"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}