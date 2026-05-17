import { useEffect, useState } from 'react'
import { EyeIcon, ExclamationTriangleIcon, NoSymbolIcon } from '@heroicons/react/24/outline'
import api from '../../services/axios'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

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
      wsHost: import.meta.env.VITE_REVERB_HOST,
      wsPort: import.meta.env.VITE_REVERB_PORT,
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
      if (window.echo) {
        window.echo.channel(`proctor.exam.${examId}`).listen('.violation.updated', () => fetchAttempts(examId))
      }
    } catch (err) { console.error(err) }
  }

  const forceSubmit = async (attemptId) => {
    if (confirm('Force submit bài thi này?')) {
      await api.post(`/proctor/attempts/${attemptId}/force-submit`)
      fetchAttempts(selectedExam.id)
    }
  }

  const sendWarning = async (attemptId) => {
    const msg = prompt('Nhập nội dung cảnh báo:')
    if (msg) await api.post(`/proctor/attempts/${attemptId}/warn`, { message: msg })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Giám sát kỳ thi</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-3">Kỳ thi đang diễn ra</h2>
          <div className="space-y-2">
            {exams.map(exam => (
              <div key={exam.id} onClick={() => { setSelectedExam(exam); fetchAttempts(exam.id) }} className="p-3 rounded-xl cursor-pointer hover:bg-gray-50 transition border">
                <div className="font-medium">{exam.title}</div>
                <div className="text-sm text-gray-500">Đang thi: {exam.active_attempts}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="md:col-span-2 card p-4">
          {selectedExam ? (
            <>
              <h2 className="text-lg font-semibold mb-3">{selectedExam.title}</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Họ tên</th>
                      <th className="p-2 text-left">Email</th>
                      <th className="p-2 text-left">TG còn lại</th>
                      <th className="p-2 text-center">Vi phạm</th>
                      <th className="p-2 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map(att => (
                      <tr key={att.id} className="border-t">
                        <td className="p-2">{att.student?.name}</td>
                        <td className="p-2">{att.student?.email}</td>
                        <td className="p-2 font-mono">
                          {att.status === 'in_progress' ? Math.floor(att.remaining_seconds / 60) + ':' + (att.remaining_seconds % 60) : 'Đã nộp'}
                        </td>
                        <td className="p-2 text-center">
                          {att.violation_count > 0 && (
                            <span className="inline-flex items-center gap-1 text-red-600"><ExclamationTriangleIcon className="h-4 w-4" /> {att.violation_count}</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {att.status === 'in_progress' && (
                            <div className="flex gap-2 justify-center">
                              <button onClick={() => forceSubmit(att.id)} className="text-red-600 hover:text-red-800"><NoSymbolIcon className="h-5 w-5" /></button>
                              <button onClick={() => sendWarning(att.id)} className="text-yellow-600 hover:text-yellow-800"><EyeIcon className="h-5 w-5" /></button>
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
            <p className="text-gray-500 text-center py-10">Chọn một kỳ thi để giám sát</p>
          )}
        </div>
      </div>
    </div>
  )
}