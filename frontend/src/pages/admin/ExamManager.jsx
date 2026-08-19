import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, Edit, Trash2, ShieldAlert, Loader2, ArrowLeft, BookOpen, Layers, CheckSquare, Settings, Lock, Unlock, Eye, CirclePlay, FileText, Calendar, Users, Shield, CheckCircle2, XCircle, X, UserCircle, BarChart } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import Badge from '../../components/common/Badge';

export default function ExamManager() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [viewMode, setViewMode] = useState('classes');
  
  const [classes, setClasses] = useState([]);
  const [classLoading, setClassLoading] = useState(true);
  const [classSearch, setClassSearch] = useState('');
  const [classPage, setClassPage] = useState(1);
  const [classTotalPages, setClassTotalPages] = useState(1);
  const [selectedClass, setSelectedClass] = useState(null);

  const [exams, setExams] = useState([]);
  const [examLoading, setExamLoading] = useState(false);
  const [examSearch, setExamSearch] = useState('');
  const [examPage, setExamPage] = useState(1);
  const [examTotalPages, setExamTotalPages] = useState(1);

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [viewingQuestions, setViewingQuestions] = useState(false); // Cờ chuyển đổi tab xem câu hỏi

  useEffect(() => {
    if (viewMode === 'classes') fetchClasses();
  }, [classPage, classSearch, viewMode]);

  useEffect(() => {
    if (viewMode === 'exams' && selectedClass) fetchExams();
  }, [examPage, examSearch, selectedClass, viewMode]);

  const fetchClasses = async () => {
    setClassLoading(true);
    try {
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

  const handleViewDetails = async (id) => {
    setShowViewModal(true);
    setLoadingDetails(true);
    setViewingQuestions(false);
    try {
        const endpoint = user.role === 'admin' ? `/admin/exams/${id}` : `/teacher/exams/${id}`;
        const res = await api.get(endpoint);
        setSelectedExam(res.data.data || res.data);
    } catch (error) {
        toast.error('Lỗi tải chi tiết kỳ thi');
        setShowViewModal(false);
    } finally {
        setLoadingDetails(false);
    }
  };

  const formatDateTime = (dateString) => {
      if (!dateString) return 'Không giới hạn';
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  let easyPoint = 0, mediumPoint = 0, hardPoint = 0;
  let hasEasy = false, hasMedium = false, hasHard = false;
  if (selectedExam?.scoring_method === 'weighted' && selectedExam.matrices) {
      let totalWeight = 0;
      selectedExam.matrices.forEach(m => {
          const w = m.difficulty === 'easy' ? 1 : m.difficulty === 'medium' ? 2 : 3;
          totalWeight += (Number(m.quantity) * w);
          if (m.difficulty === 'easy') hasEasy = true;
          if (m.difficulty === 'medium') hasMedium = true;
          if (m.difficulty === 'hard') hasHard = true;
      });
      if (totalWeight > 0) {
          easyPoint = 10 * (1 / totalWeight);
          mediumPoint = 10 * (2 / totalWeight);
          hardPoint = 10 * (3 / totalWeight);
      }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
      
      {viewMode === 'classes' && (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                Quản lý Kỳ thi theo Lớp
              </h1>
              <p className="text-gray-500 mt-1">Chọn lớp học để xem và cấu hình kỳ thi.</p>
            </div>
        
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {classes.map(cls => (
                <div 
                  key={cls.id} 
                  onClick={() => handleSelectClass(cls)}
                  className="bg-white border border-gray-200 rounded-2xl p-6 cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                      <Layers className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 mb-1 group-hover:text-blue-600 transition">{cls.name}</h3>
                  <p className="text-sm text-gray-500 font-medium mb-4 flex-1">{cls.cohort?.course?.title || 'Chưa thuộc khóa học'}</p>
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-blue-600 font-bold ">
                    Xem danh sách
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 shadow-sm">
                      {cls.exams_count || 0} Kỳ thi
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-500">
              Không tìm thấy lớp học nào.
            </div>
          )}

          {classTotalPages > 1 && (
            <div className="flex justify-end gap-2 mt-6">
              <button disabled={classPage === 1} onClick={() => setClassPage(p => p - 1)} className="px-4 py-2 border rounded-xl disabled:opacity-50 font-medium hover:bg-gray-50">Trước</button>
              <span className="px-4 py-2 text-gray-600 font-bold bg-white border rounded-xl">{classPage} / {classTotalPages}</span>
              <button disabled={classPage === classTotalPages} onClick={() => setClassPage(p => p + 1)} className="px-4 py-2 border rounded-xl disabled:opacity-50 font-medium hover:bg-gray-50">Sau</button>
            </div>
          )}
        </div>
      )}

      {viewMode === 'exams' && selectedClass && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in slide-in-from-right-8 duration-300">
          
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between gap-4 items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => setViewMode('classes')} className="p-2 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition shadow-sm">
                <ArrowLeft className="w-4 h-4" />
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
                      const isOwner = user.role === 'admin' || String(item.teacher_id) === String(user.id);
                      const isRunning = item.in_progress_count > 0; 

                    return (
                      <tr key={item.id} className={`hover:bg-gray-50 transition ${!isOwner ? 'bg-slate-50/50' : ''}`}>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-800 text-base mb-1">{item.title}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1"><CheckSquare className="w-3 h-3"/> Môn: {item.subject_name}</p>
                        </td>
                        <td className="px-6 py-4">
                          {isOwner ? (
                            <span className=" px-2.5 py-1 rounded-md text-xm font-bold">Bạn</span>
                          ) : (
                            <div>
                              <span className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-bold">Giảng viên khác</span>
                              <p className="text-xs text-slate-500 mt-1">{item.teacher_name}</p>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium space-y-1">
                          <p><span className="text-gray-400">Thời gian:</span> <span className="text-gray-700">{item.duration} Phút</span></p>
                          <p><span className="text-gray-400">Câu hỏi:</span> <span className="text-gray-700">{item.total_questions}</span></p>
                          {item.in_progress_count > 0 && <p className="text-green-600 font-bold animate-pulse">Có {item.in_progress_count} Học viên đang làm</p>}
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
                              <button 
                                onClick={() => handleViewDetails(item.id)} 
                                title="Xem chi tiết kỳ thi" 
                                className="p-2 rounded-lg transition text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                              >
                                <Eye size={18} />
                              </button>
                              <button 
                                disabled={isRunning}
                                onClick={() => handleGenerateExam(item.id)} 
                                title={isRunning ? "Không thể sinh đề khi có học viên đang thi" : "Sinh câu hỏi từ Ma trận"} 
                                className={`p-2 rounded-lg transition ${isRunning ? 'text-slate-300 bg-slate-50 cursor-not-allowed' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}
                              >
                                <CirclePlay size={18} />
                              </button>
                              <button 
                                disabled={isRunning}
                                onClick={() => navigate(`${item.id}/edit`)} 
                                title={isRunning ? "Không thể sửa khi có học viên đang thi" : "Sửa kỳ thi"}
                                className={`p-2 rounded-lg transition ${isRunning ? 'text-slate-300 bg-slate-50 cursor-not-allowed' : 'text-amber-600 bg-amber-50 hover:bg-amber-100'}`}
                              >
                                <Edit size={18} />
                              </button>
                              <button 
                                disabled={isRunning}
                                onClick={() => handleToggleStatus(item.id)} 
                                title={isRunning ? "Không thể cấu hình khi có học viên đang thi" : (item.is_active ? "Khóa phòng" : "Mở phòng")} 
                                className={`p-2 rounded-lg transition ${isRunning ? 'text-slate-300 bg-slate-50 cursor-not-allowed' : (item.is_active ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100')}`}
                              >
                                {item.is_active ? <Lock size={18} /> : <Unlock size={18} />}
                              </button>
                              <button 
                                disabled={isRunning}
                                onClick={() => handleDelete(item.id)} 
                                title={isRunning ? "Không thể xóa khi có học viên đang thi" : "Xóa kỳ thi"}
                                className={`p-2 rounded-lg transition ${isRunning ? 'text-slate-300 bg-slate-50 cursor-not-allowed' : 'text-red-600 bg-red-50 hover:bg-red-100'}`}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                                <button 
                                    onClick={() => handleViewDetails(item.id)} 
                                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition"
                                >
                                    <Eye size={16}/> Xem chi tiết
                                </button>
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

      {showViewModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50 shrink-0">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                         
                            Chi tiết Kỳ thi: <span className="text-indigo-700">{selectedExam?.title || 'Đang tải...'}</span>
                        </h3>
                    </div>
                    <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 bg-white rounded-xl shadow-sm border border-slate-200 transition"><X className="w-5 h-5"/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    {loadingDetails ? (
                        <div className="py-20 flex justify-center flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                            <span className="text-slate-500 font-medium">Đang tải dữ liệu kỳ thi...</span>
                        </div>
                    ) : selectedExam ? (
                        
                        viewingQuestions ? (
                            <div className="space-y-4">
                                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            Danh sách câu hỏi trong đề
                                        </h4>
                                    </div>
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                            <tr>
                                                <th className="px-5 py-3 w-12 text-center">STT</th>
                                                <th className="px-5 py-3 w-1/2">Nội dung</th>
                                                <th className="px-5 py-3">Chủ đề</th>
                                                <th className="px-5 py-3 text-center">Mức độ</th>
                                                <th className="px-5 py-3 text-center">Điểm</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedExam.questions && selectedExam.questions.length > 0 ? (
                                                selectedExam.questions.map((eq, index) => (
                                                    <tr key={eq.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-5 py-3 text-center font-medium text-slate-700">{index + 1}</td>
                                                        <td className="px-5 py-3">
                                                            <div dangerouslySetInnerHTML={{ __html: eq.question?.content }} className="line-clamp-2 text-slate-800 font-medium" />
                                                        </td>
                                                        <td className="px-5 py-3 font-bold text-slate-800">{eq.question?.topic?.name || 'N/A'}</td>
                                                        <td className="px-5 py-3 text-center">
                                                            <span className={`px-2.5 py-1 font-bold text-slate-800 ${
                                                                eq.question?.difficulty === 'easy' ? '' :
                                                                eq.question?.difficulty === 'medium' ? '' :
                                                                ''
                                                            }`}>
                                                                {eq.question?.difficulty === 'easy' ? 'Dễ' : eq.question?.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 text-center font-bold ">
                                                            {Number(eq.question_score).toFixed(2)} đ
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="px-5 py-8 text-center text-slate-500 font-medium bg-slate-50/50">
                                                        Đề thi này chưa được sinh câu hỏi từ ngân hàng.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            
                            <div className="space-y-6">
                       
                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                                        Thông tin cơ bản
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-slate-700 text-xs font-bold uppercase tracking-wider">Môn học</span>
                                            <span className="font-bold text-slate-800 text-base">{selectedExam.subject_name || selectedExam.subject?.name || 'Chưa cập nhật'}</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-slate-700 text-xs font-bold uppercase tracking-wider">Giảng viên ra đề</span>
                                            <span className="font-bold text-blue-700 text-base">{selectedExam.teacher_name || selectedExam.teacher?.name || 'Chưa cập nhật'}</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-slate-700 text-xs font-bold uppercase tracking-wider">Lượt làm bài</span>
                                            <span className="font-bold text-slate-800 text-base bg-slate-100 px-2 py-0.5 rounded w-fit">
                                                {selectedExam.attempts_count || 0} lượt
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-slate-700 text-xs font-bold uppercase tracking-wider">Mật khẩu phòng thi</span>
                                            <span className="font-bold  px-2 py-0.5 rounded w-fit">
                                                {selectedExam.password || 'Không có'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                                            Cấu hình Thời gian & Điểm
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <span className="text-slate-600 font-medium text-sm">Thời lượng làm bài:</span>
                                                <span className="font-bold text-slate-800">{selectedExam.duration} phút</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <span className="text-slate-600 font-medium text-sm">Tổng số câu hỏi:</span>
                                                <span className="font-bold text-slate-800">{selectedExam.total_questions} câu</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <span className="text-slate-600 font-medium text-sm">Điểm tối thiểu (Pass):</span>
                                                <span className="font-bold text-emerald-600">{selectedExam.passing_score} / 10</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <span className="text-slate-600 font-medium text-sm">Cách chấm điểm:</span>
                                                <span className="font-bold text-slate-700">
                                                    {selectedExam.scoring_method === 'weighted' ? 'Theo trọng số độ khó' : 'Chia đều mọi câu hỏi'}
                                                </span>
                                            </div>
                                            
                                            {selectedExam.scoring_method === 'weighted' && (
                                                <div className="pt-2">
                                                    <div className="text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1">Dự kiến điểm mỗi câu theo trọng số:</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {hasEasy && <span className="text-sm font-medium  text-slate-700 px-3 py-1.5">Dễ: <strong className="font-black">{easyPoint.toFixed(2)}</strong> đ</span>}
                                                        {hasMedium && <span className="text-sm font-medium text-slate-700 px-3 py-1.5">TB: <strong className="font-black">{mediumPoint.toFixed(2)}</strong> đ</span>}
                                                        {hasHard && <span className="text-sm font-medium text-slate-700 px-3 py-1.5">Khó: <strong className="font-black">{hardPoint.toFixed(2)}</strong> đ</span>}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pt-2 border-t border-slate-100">
                                                <div className="text-xs font-bold text-slate-700 uppercase mb-2">Lịch mở phòng thi:</div>
                                                <div className="text-sm font-medium text-slate-700  p-3 rounded-xl">
                                                    Từ: <strong className="text-slate-700 text-xm">{formatDateTime(selectedExam.start_time)}</strong> <br/>
                                                    Đến: <strong className="text-slate-700 text-xm">{formatDateTime(selectedExam.end_time)}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                                             Quy chế thi
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                                                {selectedExam.is_practice ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-slate-300" />}
                                                <span className={`text-sm font-medium ${selectedExam.is_practice ? 'text-emerald-700' : 'text-slate-500'}`}>Chế độ Thi thử (Practice Mode)</span>
                                            </div>
                                            <div className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                                                {selectedExam.shuffle_questions ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-slate-300" />}
                                                <span className={`text-sm font-medium ${selectedExam.shuffle_questions ? 'text-emerald-700' : 'text-slate-500'}`}>Trộn ngẫu nhiên thứ tự Câu hỏi</span>
                                            </div>
                                            <div className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                                                {selectedExam.shuffle_options ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-slate-300" />}
                                                <span className={`text-sm font-medium ${selectedExam.shuffle_options ? 'text-emerald-700' : 'text-slate-500'}`}>Trộn ngẫu nhiên Đáp án (A,B,C,D)</span>
                                            </div>
                                            <div className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                                                {selectedExam.show_answers ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-slate-300" />}
                                                <span className={`text-sm font-medium ${selectedExam.show_answers ? 'text-emerald-700' : 'text-slate-500'}`}>Cho phép Học viên xem đáp án sau khi thi</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3 border-b border-slate-100 pb-3">
                                            Lớp học được chỉ định
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedExam.classes && selectedExam.classes.length > 0 ? (
                                                selectedExam.classes.map(cls => (
                                                    <span key={cls.id} className="px-3 py-1.5 bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm rounded-lg">
                                                        {cls.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 text-sm italic">Chưa chỉ định lớp học</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3 border-b border-slate-100 pb-3">
                                          Giám thị coi thi
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedExam.proctors && selectedExam.proctors.length > 0 ? (
                                                selectedExam.proctors.map(proc => (
                                                    <span key={proc.id} className="px-3 py-1.5 bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm rounded-lg flex items-center gap-1.5">
                                                      {proc.name || proc.email || proc.proctor_code}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 text-sm italic">Chưa phân công giám thị</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            Ma trận sinh đề tự động
                                        </h4>
                                    </div>
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                                            <tr>
                                                <th className="px-5 py-3 w-12 text-center">STT</th>
                                                <th className="px-5 py-3">Chủ đề</th>
                                                <th className="px-5 py-3 text-center">Mức độ</th>
                                                <th className="px-5 py-3 text-center">Số lượng câu</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedExam.matrices && selectedExam.matrices.length > 0 ? (
                                                selectedExam.matrices.map((m, index) => (
                                                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-5 py-3 text-center font-medium text-slate-700">{index + 1}</td>
                                                        <td className="px-5 py-3 font-bold text-slate-800">{m.topic?.name || `Chủ đề số ${m.topic_id}`}</td>
                                                        <td className="px-5 py-3 text-center">
                                                            <span className={`px-2.5 py-1 font-bold text-slate-800 ${
                                                                m.difficulty === 'easy' ? '' :
                                                                m.difficulty === 'medium' ? '' :
                                                                ''
                                                            }`}>
                                                                {m.difficulty === 'easy' ? 'Dễ' : m.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 text-center font-bold text-slate-700">{m.quantity}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="px-5 py-8 text-center text-slate-500 font-medium bg-slate-50/50">
                                                        Kỳ thi này chưa được cấu hình ma trận đề.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                            </div>
                        )
                    ) : (
                        <div className="py-10 text-center text-red-500 font-medium">Không tải được dữ liệu.</div>
                    )}
                </div>
                
                <div className="p-4 border-t border-slate-100 bg-white flex justify-between shrink-0">
                    {!loadingDetails && selectedExam && (
                        viewingQuestions ? (
                            <button onClick={() => setViewingQuestions(false)} className="bg-slate-100 hover:bg-slate-200 text-blue-700 px-6 py-2.5 rounded-xl font-bold transition shadow-sm border border-slate-200">
                                Quay lại Thông tin chung
                            </button>
                        ) : (
                            <button onClick={() => setViewingQuestions(true)} className="bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-blue-700 px-6 py-2.5 rounded-xl font-bold transition shadow-sm">
                                Xem danh sách câu hỏi đã sinh
                            </button>
                        )
                    )}
                    <button onClick={() => setShowViewModal(false)} className="bg-emerald-500 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold transition shadow-sm ml-auto border border-slate-200">
                        Đóng lại
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}