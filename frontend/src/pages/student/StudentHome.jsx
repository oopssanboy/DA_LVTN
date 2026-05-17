import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClockIcon, AcademicCapIcon, PlayIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import api from '../../services/axios'

export default function StudentHome() {
  const [exams, setExams] = useState([])
  const [history, setHistory] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const examsRes = await api.get('/student/exams')
        setExams(examsRes.data)
        const historyRes = await api.get('/student/exams/history')
        setHistory(historyRes.data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchData()
  }, [])

  const startExam = async (examId) => {
    try {
      const res = await api.post(`/student/exams/${examId}/start`)
      navigate(`/student/exam/${res.data.attempt_id}`)
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể bắt đầu thi')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kỳ thi của tôi</h1>
        <p className="text-gray-500 mt-1">Chọn kỳ thi để bắt đầu làm bài</p>
      </div>

      {exams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Hiện chưa có kỳ thi nào dành cho bạn.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <div key={exam.id} className="card group hover:shadow-lg transition-all duration-300">
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{exam.title}</h3>
                <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><AcademicCapIcon className="h-4 w-4" /> {exam.subject}</span>
                  <span className="flex items-center gap-1"><ClockIcon className="h-4 w-4" /> {exam.duration} phút</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">Lớp: {exam.class?.course?.title} - {exam.class?.name}</p>
                <button
                  onClick={() => startExam(exam.id)}
                  className="mt-4 w-full flex items-center justify-center gap-2 btn-primary py-2 text-sm"
                >
                  <PlayIcon className="h-4 w-4" />
                  {exam.attempt_status === 'in_progress' ? 'Tiếp tục' : 'Vào thi'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Lịch sử làm bài</h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-6 py-3">Kỳ thi</th>
                  <th className="px-6 py-3 text-center">Điểm</th>
                  <th className="px-6 py-3 text-center">Kết quả</th>
                  <th className="px-6 py-3 text-right">Ngày thi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{h.exam_title}</td>
                    <td className="px-6 py-4 text-center font-bold text-primary-600">{h.score}/10</td>
                    <td className="px-6 py-4 text-center">
                      {h.is_passed ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">Đạt</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">Chưa đạt</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">{new Date(h.completed_at).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}