import { useEffect, useState } from 'react'
import { ChartBarIcon, DocumentTextIcon, ClipboardDocumentListIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import api from '../../services/api'

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
}

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
    <div className={`p-3 rounded-full ${colorClasses[color]}`}>
      <Icon className="h-6 w-6" />
    </div>
  </div>
)

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalQuestions: 0, totalExams: 0, totalUsers: 0, totalAttempts: 0 })
  const [recentExams, setRecentExams] = useState([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [questions, exams, users, attempts] = await Promise.all([
          api.get('/questions?per_page=1').then(res => res.data.meta?.total || res.data.total || 0),
          api.get('/exams?per_page=1').then(res => res.data.meta?.total || res.data.total || 0),
          api.get('/users?per_page=1').then(res => res.data.meta?.total || res.data.total || 0),
          api.get('/attempts?per_page=1').then(res => res.data.meta?.total || res.data.total || 0),
        ])
        setStats({
          totalQuestions: questions || 0,
          totalExams: exams || 0,
          totalUsers: users || 0,
          totalAttempts: attempts || 0,
        })
        const examsRes = await api.get('/exams?per_page=5')
        setRecentExams(examsRes.data.data || [])
      } catch (error) {
        console.error(error)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Câu hỏi" value={stats.totalQuestions} icon={DocumentTextIcon} color="blue" />
        <StatCard title="Kỳ thi" value={stats.totalExams} icon={ClipboardDocumentListIcon} color="green" />
        <StatCard title="Người dùng" value={stats.totalUsers} icon={UserGroupIcon} color="purple" />
        <StatCard title="Lượt thi" value={stats.totalAttempts} icon={ChartBarIcon} color="orange" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4">Kỳ thi gần đây</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                <th className="pb-3">Tiêu đề</th>
                <th className="pb-3">Môn</th>
                <th className="pb-3">Thời gian</th>
                <th className="pb-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentExams.map(exam => (
                <tr key={exam.id} className="hover:bg-gray-50">
                  <td className="py-3">{exam.title}</td>
                  <td>{exam.subject}</td>
                  <td>{exam.duration} phút</td>
                  <td>
                    {exam.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Đang mở</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Đóng</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}