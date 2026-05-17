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

      const res = await api.get(`/questions?${params.toString()}`);
      setQuestions(res.data.data || []);
    } catch (err) { 
      toast.error('Lỗi đồng bộ danh sách dữ liệu câu hỏi'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn câu hỏi này khỏi ngân hàng đề?')) {
      await api.delete(`/questions/${id}`);
      toast.success('Đã gỡ bỏ câu hỏi thành công');
      fetchQuestions();
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/questions/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ngan_hang_cau_hoi.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Export Excel thất bại!');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post('/questions/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Import dữ liệu câu hỏi Excel thành công!');
      fetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'File Excel sai cấu trúc định dạng mẫu!');
    }
  };

  const selectClass = "px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition";

  return (
    <div className="space-y-6">
      {/* Khối Header điều khiển */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-5 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ngân hàng câu hỏi</h1>
          <p className="text-sm text-gray-500 mt-1">Cấu hình kho dữ liệu câu hỏi trắc nghiệm và điền khuyết</p>
        </div>
        
        {/* Thanh Action hành động */}
        <div className="flex flex-wrap gap-2.5">
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx,.xls" className="hidden" />
          <button onClick={() => fileInputRef.current.click()} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition active:scale-95">
            <Upload size={16} /> Nhập Excel
          </button>
          <button onClick={handleExport} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition active:scale-95">
            <Download size={16} /> Xuất dữ liệu
          </button>
          <Link to="/admin/questions/create" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/10 transition active:scale-95">
            <Plus size={16} /> Thêm câu hỏi
          </Link>
        </div>
      </div>

      {/* Thanh công cụ lọc bộ lọc Filter */}
      <div className="flex flex-wrap gap-4 items-center bg-gray-50 border border-gray-100 p-4 rounded-2xl">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Bộ lọc tìm nhanh:</span>
        <input type="text" placeholder="Lọc theo môn học..." value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2 w-64 text-sm outline-none focus:border-indigo-500" />
        <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} className={selectClass}>
          <option value="">-- Tất cả độ khó --</option>
          <option value="easy">Nhận biết (Dễ)</option>
          <option value="medium">Thông hiểu (Vừa)</option>
          <option value="hard">Vận dụng (Khó)</option>
        </select>
      </div>

      {/* Bảng hiển thị kết quả */}
      {loading ? (
        <div className="text-center py-20 text-sm text-gray-400 font-medium">Đang tải ngân hàng câu hỏi...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
              <thead className="bg-gray-50">
                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Môn học</th>
                  <th className="px-6 py-4">Chủ đề</th>
                  <th className="px-6 py-4">Nội dung câu hỏi</th>
                  <th className="px-6 py-4 text-center">Phân loại</th>
                  <th className="px-6 py-4 text-center">Độ khó</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {questions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400 font-medium">Không tìm thấy câu hỏi nào khớp với bộ lọc.</td>
                  </tr>
                ) : (
                  questions.map(q => (
                    <tr key={q.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">{q.subject}</td>
                      <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">{q.topic}</td>
                      <td className="px-6 py-4 max-w-md truncate text-gray-700" dangerouslySetInnerHTML={{ __html: q.content }} />
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {q.type === 'single' ? (
                          <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 rounded-md">Một đáp án</span>
                        ) : q.type === 'multiple' ? (
                          <span className="px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100 rounded-md">Nhiều đáp án</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-md">Điền từ trống</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {q.difficulty === 'easy' ? (
                          <span className="text-emerald-600 font-semibold text-xs">Dễ</span>
                        ) : q.difficulty === 'medium' ? (
                          <span className="text-amber-600 font-semibold text-xs">Vừa</span>
                        ) : (
                          <span className="text-red-600 font-semibold text-xs">Khó</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap text-gray-500">
                        <Link to={`/admin/questions/${q.id}/edit`} className="hover:text-amber-600 transition inline-block"><Edit size={18} /></Link>
                        <button onClick={() => handleDelete(q.id)} className="hover:text-red-600 transition inline-block"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}