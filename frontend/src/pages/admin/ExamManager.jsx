import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, Edit, Trash2, ShieldAlert, ShieldCheck, Loader2, ArrowLeft, BookOpen, Layers, CheckSquare, Settings, Lock, Unlock, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import Badge from '../../components/common/Badge';

export default function ExamManager() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // View mode: 'classes' (Màn hình Card) | 'exams' (Màn hình Danh sách)
  const [viewMode, setViewMode] = useState('classes');
  
  // States cho Lớp học
  const [classes, setClasses] = useState([]);
  const [classLoading, setClassLoading] = useState(true);
  const [classSearch, setClassSearch] = useState('');
  const [classPage, setClassPage] = useState(1);
  const [classTotalPages, setClassTotalPages] = useState(1);
  const [selectedClass, setSelectedClass] = useState(null);

  // States cho Kỳ thi
  const [exams, setExams] = useState([]);
  const [examLoading, setExamLoading] = useState(false);
  const [examSearch, setExamSearch] = useState('');
  const [examPage, setExamPage] = useState(1);
  const [examTotalPages, setExamTotalPages] = useState(1);

  useEffect(() => {
    if (viewMode === 'classes') fetchClasses();
  }, [classPage, classSearch, viewMode]);

  useEffect(() => {
    if (viewMode === 'exams' && selectedClass) fetchExams();
  }, [examPage, examSearch, selectedClass, viewMode]);

  // --- API LỚP HỌC ---
  const fetchClasses = async () => {
    setClassLoading(true);
    try {
      // Dùng endpoint classes của teacher/admin
      const endpoint = user.role === 'admin' ? '/admin/classes' : '/teacher/classes';
      const res = await api.get(endpoint, {
        params: { search: classSearch, page: classPage, per_page: 8 }
      });
      setClasses(res.data.data);
      setClassTotalPages(res.data.last_page);
    } catch (error) {
      toast.error('Lỗi tải danh sách lớp học');
    } finally {
      setClassLoading(false);
    }
  };

  const handleSelectClass = (cls) => {
    setSelectedClass(cls);
    setExamPage(1);
    setExamSearch('');
    setViewMode('exams');
  };

  // --- API KỲ THI ---
  const fetchExams = async () => {
    setExamLoading(true);
    try {
      const endpoint = user.role === 'admin' ? '/admin/exams' : '/teacher/exams';
      const res = await api.get(endpoint, {
        params: { search: examSearch, page: examPage, per_page: 10, class_id: selectedClass.id }
      });
      setExams(res.data.data);
      setExamTotalPages(res.data.meta?.last_page || 1);
    } catch (error) {
      toast.error('Lỗi tải danh sách kỳ thi');
    } finally {
      setExamLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Xóa kỳ thi?', text: "Hành động này không thể hoàn tác!", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy'
    });
    if (result.isConfirmed) {
      try {
        const endpoint = user.role === 'admin' ? `/admin/exams/${id}` : `/teacher/exams/${id}`;
        await api.delete(endpoint);
        toast.success('Xóa kỳ thi thành công');
        fetchExams();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Lỗi khi xóa kỳ thi');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const endpoint = user.role === 'admin' ? `/admin/exams/${id}/status` : `/teacher/exams/${id}/status`;
      const res = await api.patch(endpoint);
      toast.success(res.data.message);
      fetchExams();
    } catch (error) {
      toast.error('Lỗi cập nhật trạng thái');
    }
  };

  const handleGenerateExam = async (id) => {
    const result = await Swal.fire({
      title: 'Sinh đề thi?', text: "Hệ thống sẽ bốc ngẫu nhiên câu hỏi dựa theo ma trận bạn đã thiết lập.", icon: 'info',
      showCancelButton: true, confirmButtonColor: '#3b82f6', confirmButtonText: 'Sinh ngay', cancelButtonText: 'Hủy'
    });
    if (result.isConfirmed) {
      const toastId = toast.loading('Đang xử lý sinh đề...');
      try {
        const endpoint = user.role === 'admin' ? `/admin/exams/${id}/generate` : `/teacher/exams/${id}/generate`;
        await api.post(endpoint);
        toast.success('Sinh đề thi thành công!', { id: toastId });
      } catch (error) {
        toast.error(error.response?.data?.message || 'Lỗi sinh đề thi', { id: toastId });
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ---------------------------------------------------- */}
      {/* MÀN HÌNH 1: CARD LỚP HỌC */}
      {/* ---------------------------------------------------- */}
      {viewMode === 'classes' && (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-600"/> Quản lý Kỳ thi theo Lớp
              </h1>
              <p className="text-gray-500 mt-1">Chọn lớp học để xem và cấu hình kỳ thi.</p>
            </div>
            {/* Nút Tạo Kỳ Thi (Dẫn thẳng sang trang tạo chung) */}
            <button onClick={() => navigate('create')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition shadow-sm">
              <Plus size={20} /> Tạo Kỳ thi mới
            </button>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" placeholder="Tìm tên lớp, mã lớp..." value={classSearch} onChange={e => setClassSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500 bg-gray-50"
              />
            </div>
          </div>

          {classLoading ? (
             <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500"/></div>
          ) : classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {classes.map(cls => (
                <div 
                  key={cls.id} 
                  onClick={() => handleSelectClass(cls)}
                  className="bg-white border border-gray-200 rounded-2xl p-6 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all group flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                      <Layers className="w-6 h-6" />
                    </div>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 shadow-sm">
                      {cls.exams_count || 0} Kỳ thi
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 mb-1 group-hover:text-blue-600 transition">{cls.name}</h3>
                  <p className="text-sm text-gray-500 font-medium mb-4 flex-1">{cls.cohort?.course?.title || 'Chưa thuộc khóa học'}</p>
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Xem danh sách <ArrowLeft className="w-4 h-4 rotate-180"/>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-500">
              Không tìm thấy lớp học nào.
            </div>
          )}

          {/* Phân trang Lớp học */}
          {classTotalPages > 1 && (
            <div className="flex justify-end gap-2 mt-6">
              <button disabled={classPage === 1} onClick={() => setClassPage(p => p - 1)} className="px-4 py-2 border rounded-xl disabled:opacity-50 font-medium hover:bg-gray-50">Trước</button>
              <span className="px-4 py-2 text-gray-600 font-bold bg-white border rounded-xl">{classPage} / {classTotalPages}</span>
              <button disabled={classPage === classTotalPages} onClick={() => setClassPage(p => p + 1)} className="px-4 py-2 border rounded-xl disabled:opacity-50 font-medium hover:bg-gray-50">Sau</button>
            </div>
          )}
        </div>
      )}


      {/* ---------------------------------------------------- */}
      {/* MÀN HÌNH 2: DANH SÁCH KỲ THI TRONG LỚP */}
      {/* ---------------------------------------------------- */}
      {viewMode === 'exams' && selectedClass && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in slide-in-from-right-8 duration-300">
          
          {/* Header Bảng */}
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between gap-4 items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => setViewMode('classes')} className="p-2 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition shadow-sm">
                <ArrowLeft className="w-5 h-5 text-gray-600"/>
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">Kỳ thi lớp: {selectedClass.name}</h2>
                <p className="text-sm text-gray-500">Thuộc: {selectedClass.cohort?.course?.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" placeholder="Tìm tên kỳ thi..." value={examSearch} onChange={e => setExamSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <button onClick={() => navigate('create', { state: { class_id: selectedClass.id } })} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition shrink-0 shadow-sm text-sm">
                <Plus size={18} /> <span className="hidden sm:inline">Tạo Mới</span>
              </button>
            </div>
          </div>

          {/* Table Kỳ Thi */}
          {examLoading ? (
            <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>
          ) : exams.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Tên kỳ thi</th>
                    <th className="px-6 py-4">Sở hữu</th>
                    <th className="px-6 py-4">Cấu hình</th>
                    <th className="px-6 py-4 text-center">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {exams.map((item) => {
                    const isOwner = user.role === 'admin' || item.teacher_id === user.id;

                    return (
                      <tr key={item.id} className={`hover:bg-gray-50 transition ${!isOwner ? 'bg-slate-50/50' : ''}`}>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-800 text-base mb-1">{item.title}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1"><CheckSquare className="w-3 h-3"/> Môn: {item.subject_name}</p>
                        </td>
                        <td className="px-6 py-4">
                          {isOwner ? (
                            <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-[11px] font-bold">Tôi tạo</span>
                          ) : (
                            <div>
                              <span className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-bold">GV Khác</span>
                              <p className="text-xs text-slate-500 mt-1">{item.teacher_name}</p>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium space-y-1">
                          <p><span className="text-gray-400">Thời gian:</span> <span className="text-gray-700">{item.duration} Phút</span></p>
                          <p><span className="text-gray-400">Câu hỏi:</span> <span className="text-gray-700">{item.total_questions} (Sinh {item.questions_count})</span></p>
                          {item.in_progress_count > 0 && <p className="text-green-600 font-bold animate-pulse">Có {item.in_progress_count} SV đang làm</p>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.is_active ? 
                            <Badge variant="success"><div className="flex items-center gap-1"><Unlock size={12}/> Đang Mở</div></Badge> : 
                            <Badge variant="danger"><div className="flex items-center gap-1"><Lock size={12}/> Đã Khóa</div></Badge>
                          }
                        </td>
                        <td className="px-6 py-4">
                          {isOwner ? (
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleGenerateExam(item.id)} title="Sinh câu hỏi từ Ma trận" className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"><Settings size={18} /></button>
                              <button onClick={() => navigate(`${item.id}/edit`)} className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition"><Edit size={18} /></button>
                              <button onClick={() => handleToggleStatus(item.id)} title={item.is_active ? "Khóa phòng" : "Mở phòng"} className={`p-2 rounded-lg transition ${item.is_active ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}>
                                {item.is_active ? <Lock size={18} /> : <Unlock size={18} />}
                              </button>
                              <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"><Trash2 size={18} /></button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end text-slate-400 text-xs font-bold gap-1 bg-slate-100 px-3 py-2 rounded-lg inline-flex ml-auto cursor-not-allowed">
                               <ShieldAlert className="w-4 h-4"/> Chỉ xem
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">Chưa có kỳ thi nào trong lớp này.</div>
          )}

         
          {examTotalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button disabled={examPage === 1} onClick={() => setExamPage(p => p - 1)} className="px-4 py-2 bg-white border rounded-xl disabled:opacity-50 font-medium hover:bg-gray-100 transition">Trước</button>
              <span className="px-4 py-2 font-bold bg-white border rounded-xl text-gray-700">{examPage} / {examTotalPages}</span>
              <button disabled={examPage === examTotalPages} onClick={() => setExamPage(p => p + 1)} className="px-4 py-2 bg-white border rounded-xl disabled:opacity-50 font-medium hover:bg-gray-100 transition">Sau</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}