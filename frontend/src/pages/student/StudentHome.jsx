import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClockIcon, AcademicCapIcon, PlayIcon, DocumentTextIcon, KeyIcon } from '@heroicons/react/24/outline'
import api from '../../services/axios'
import Swal from 'sweetalert2'

export default function StudentHome() {
  const [exams, setExams] = useState([])
  const [history, setHistory] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      // 1. Tải danh sách kỳ thi hiện tại
      try {
        const examsRes = await api.get('/student/exams')
        setExams(examsRes.data)
      } catch (err) {
        console.error("Lỗi tải danh sách kỳ thi:", err)
      }

      // 2. Tải lịch sử làm bài (tách riêng try-catch)
      try {
        const historyRes = await api.get('/student/exams/history')
        setHistory(historyRes.data)
      } catch (err) {
        console.error("Lỗi tải lịch sử thi:", err)
      }
    }
    
    fetchData()
  }, [])

  const startExam = async (exam) => {
    let passwordInput = null;

    // Kiểm tra nếu kỳ thi này yêu cầu mật khẩu bảo mật (trường password trong DB không rỗng)
    if (exam.password) {
      const { value: password } = await Swal.fire({
        title: 'Mật khẩu phòng thi',
        text: `Kỳ thi "${exam.title}" yêu cầu mật khẩu để truy cập đề thi.`,
        input: 'password',
        inputPlaceholder: 'Nhập mật khẩu phòng thi tại đây...',
        inputAttributes: {
          autocapitalize: 'off',
          autocorrect: 'off'
        },
        showCancelButton: true,
        confirmButtonText: 'Xác nhận vào thi',
        cancelButtonText: 'Hủy bỏ',
        confirmButtonColor: '#2563eb',
        inputValidator: (value) => {
          if (!value) {
            return 'Bạn bắt buộc phải nhập mật khẩu!';
          }
        }
      });

      // Nếu sinh viên bấm hủy hoặc không nhập mật khẩu thì dừng luồng xử lý
      if (!password) return;
      passwordInput = password;
    }

    try {
      // Gửi request POST kèm password lên backend
      const res = await api.post(`/student/exams/${exam.id}/start`, {
        password: passwordInput
      });
      
      // Thành công thì chuyển hướng trực tiếp tới phòng thi thông qua attempt_id
      navigate(`/student/exam/${res.data.attempt_id}`)
    } catch (err) {
      Swal.fire({
        title: 'Chặn quyền truy cập!',
        text: err.response?.data?.message || 'Mật khẩu phòng thi không đúng hoặc lỗi hệ thống.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kỳ thi của tôi</h1>
        <p className="text-gray-500 mt-1">Chọn kỳ thi được chỉ định để bắt đầu làm bài</p>
      </div>

      {exams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Hiện chưa có kỳ thi nào diễn ra dành cho bạn.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden">
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">{exam.title}</h3>
                    {exam.password && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                        <KeyIcon className="h-3 w-3" /> Khóa
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><AcademicCapIcon className="h-4 w-4 text-blue-500" /> {exam.subject}</span>
                    <span className="flex items-center gap-1"><ClockIcon className="h-4 w-4 text-emerald-500" /> {exam.duration} phút</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-50">
                  <p className="text-xs text-gray-400">Lớp học: <span className="text-gray-600 font-medium">{exam.class?.course?.title} - {exam.class?.name}</span></p>
                  
                  <button
                    onClick={() => {
                      if (exam.attempt_status === 'in_progress') {
                        // Nếu đang làm dở, chuyển tiếp vào phòng luôn bằng attempt_id sẵn có không cần hỏi lại mật khẩu
                        navigate(`/student/exam/${exam.attempt_id}`);
                      } else {
                        // Nếu thi mới hoàn toàn, kích hoạt hàm kiểm tra mật khẩu phòng thi
                        startExam(exam);
                      }
                    }}
                    className={`mt-4 w-full flex items-center justify-center gap-2 font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] ${
                      exam.attempt_status === 'in_progress'
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10'
                    }`}
                  >
                    <PlayIcon className="h-4 w-4" />
                    {exam.attempt_status === 'in_progress' ? 'Tiếp tục làm bài' : 'Bắt đầu vào thi'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lịch sử làm bài */}
      {history.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Lịch sử làm bài thi</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Kỳ thi</th>
                    <th className="px-6 py-4 text-center">Điểm số</th>
                    <th className="px-6 py-4 text-center">Kết quả</th>
                    <th className="px-6 py-4 text-right">Ngày nộp bài</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {history.map(h => (
                    <tr key={h.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{h.exam_title}</td>
                      <td className="px-6 py-4 text-center font-bold text-blue-600 text-base">{h.score}/10</td>
                      <td className="px-6 py-4 text-center">
                        {h.is_passed ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">Đạt</span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">Chưa đạt</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">
                        {new Date(h.completed_at).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}