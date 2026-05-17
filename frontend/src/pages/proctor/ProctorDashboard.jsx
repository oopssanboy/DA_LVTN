import { useEffect, useState } from 'react'
import { EyeIcon, ExclamationTriangleIcon, NoSymbolIcon } from '@heroicons/react/24/outline'
import api from '../../services/axios'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import Swal from 'sweetalert2'

window.Pusher = Pusher

export default function ProctorDashboard() {
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState(null)
  const [attempts, setAttempts] = useState([])

  useEffect(() => {
    fetchActiveExams()
    const echo = new Echo({
      broadcaster: 'reverb',
      key: import.meta.env.VITE_REVERB_APP_KEY,
      wsHost: import.meta.env.VITE_REVERB_HOST || '127.0.0.1',
      wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
      wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
      forceTLS: false,
      enabledTransports: ['ws', 'wss'],
    })
    window.echo = echo
    return () => echo.disconnect()
  }, [])

  const fetchActiveExams = async () => {
    try {
      const res = await api.get('/proctor/active-exams')
      setExams(res.data)
    } catch (err) { console.error(err) }
  }

  const fetchAttempts = async (examId) => {
    try {
      const res = await api.get(`/proctor/exams/${examId}/attempts`)
      setAttempts(res.data)
    } catch (err) { console.error(err) }
  }

  const handleSelectExam = (exam) => {
    setSelectedExam(exam)
    fetchAttempts(exam.id)
    
    // Đồng bộ kênh lắng nghe công khai của kỳ thi chỉ định
    if (window.echo) {
      window.echo.leaveChannel(`exam.${exam.id}`);
    }

    window.echo.channel(`exam.${exam.id}`)
      .listen('.violation.updated', (e) => {
        console.log("📡 Realtime cập nhật biến động danh sách phòng thi:", e);
        fetchAttempts(exam.id); // Tự động load lại bảng khi sinh viên vi phạm hoặc có tương tác
      });
  }

  const forceSubmit = async (attemptId) => {
    const confirm = await Swal.fire({
      title: 'Thu bài khẩn cấp?',
      text: 'Hệ thống sẽ ép khóa đề thi và tính điểm sinh viên tại thời điểm hiện tại!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Đình chỉ & Thu bài',
      cancelButtonText: 'Hủy'
    });
    if (!confirm.isConfirmed) return;

    try {
      await api.post(`/proctor/attempts/${attemptId}/force-submit`)
      Swal.fire('Thành công', 'Đã thực hiện ép thu bài lượt thi này.', 'success')
      fetchAttempts(selectedExam.id)
    } catch (err) {
      Swal.fire('Lỗi', 'Thao tác thất bại!', 'error')
    }
  }

  // 👉 CẢI TIẾN: Bổ sung ô nhập nội dung cảnh báo thời gian thực gửi trực tiếp xuống sinh viên
  const sendWarning = async (attemptId) => {
    const { value: warningText } = await Swal.fire({
      title: 'Nội dung nhắc nhở',
      input: 'text',
      inputLabel: 'Nhập lời nhắn gửi trực tiếp đến màn hình làm bài sinh viên:',
      inputPlaceholder: 'Ví dụ: Nghiêm túc làm bài / Không bật tab khác...',
      showCancelButton: true,
      confirmButtonText: 'Phát tín hiệu',
      cancelButtonText: 'Hủy bỏ',
      confirmButtonColor: '#eab308',
      inputValidator: (value) => {
        if (!value) {
          return 'Bạn không thể phát cảnh báo rỗng!';
        }
      }
    });

    if (!warningText) return;

    try {
      await api.post(`/proctor/attempts/${attemptId}/warn`, {
        message: warningText
      });
      Swal.fire({ title: 'Đã gửi!', text: 'Thông điệp cảnh báo đã đẩy tới màn hình sinh viên.', icon: 'success', timer: 1500, showConfirmButton: false });
      fetchAttempts(selectedExam.id);
    } catch (err) {
      Swal.fire('Lỗi truyền tin', 'Không thể kết nối websocket tới sinh viên!', 'error');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Hội đồng Giám thị</h1>
        <p className="text-sm text-gray-500 mt-1">Giám sát tiến độ phòng thi trực tuyến thời gian thực</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <h3 className="font-bold text-gray-800 text-sm border-b pb-2">Kỳ thi đang kích hoạt</h3>
          {exams.map(e => (
            <div
              key={e.id}
              onClick={() => handleSelectExam(e)}
              className={`p-3 rounded-xl cursor-pointer transition border text-sm ${
                selectedExam?.id === e.id 
                  ? 'bg-blue-50 border-blue-200 font-semibold text-blue-700' 
                  : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div>{e.title}</div>
              <div className="text-xs text-gray-400 mt-1">Đang làm bài: {e.active_attempts} thí sinh</div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          {selectedExam ? (
            <>
              <h3 className="font-bold text-gray-900">{selectedExam.title}</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                  <thead className="bg-gray-50">
                    <tr className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                      <th className="px-4 py-3">Thí sinh</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Thời gian</th>
                      <th className="px-4 py-3 text-center">Số vi phạm</th>
                      <th className="px-4 py-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {attempts.map(att => (
                      <tr key={att.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{att.student?.name}</td>
                        <td className="px-4 py-3">
                          {att.status === 'in_progress' ? (
                            <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-xs">Đang làm bài</span>
                          ) : (
                            <span className="text-gray-500 font-semibold bg-gray-50 px-2 py-0.5 rounded border border-gray-200 text-xs">Đã nộp bài ({att.total_score}đ)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-600 text-xs">
                          {att.status === 'in_progress' ? `${Math.floor(att.remaining_seconds / 60)} phút` : 'Hoàn thành'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {att.violation_count > 0 ? (
                            <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 border border-red-100 px-2 py-0.5 rounded text-xs">
                              <ExclamationTriangleIcon className="h-3.5 w-3.5" /> {att.violation_count}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {att.status === 'in_progress' && (
                            <div className="flex gap-4 justify-center text-gray-500">
                              <button onClick={() => sendWarning(att.id)} className="hover:text-yellow-600 transition" title="Gửi lời nhắc cảnh báo">
                                <EyeIcon className="h-5 w-5" />
                              </button>
                              <button onClick={() => forceSubmit(att.id)} className="hover:text-red-600 transition" title="Ép thu bài vĩnh viễn">
                                <NoSymbolIcon className="h-5 w-5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-center py-20 font-medium">Chọn một kỳ thi ở danh mục bên trái để kích hoạt cổng theo dõi phòng thi.</p>
          )}
        </div>
      </div>
    </div>
  )
}