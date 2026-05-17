import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  HomeIcon, DocumentTextIcon, ClipboardDocumentListIcon,
  ChartBarIcon, UserGroupIcon, Cog6ToothIcon,
  ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: HomeIcon },
  { name: 'Câu hỏi', path: '/admin/questions', icon: DocumentTextIcon },
  { name: 'Kỳ thi', path: '/admin/exams', icon: ClipboardDocumentListIcon },
  { name: 'Thống kê', path: '/teacher/exams', icon: ChartBarIcon }, // tạm
  { name: 'Người dùng', path: '/admin/users', icon: UserGroupIcon },
  { name: 'Cài đặt', path: '/admin/settings', icon: Cog6ToothIcon },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-5 border-b">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">ExamPro</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'Quản trị viên' : 'Giảng viên'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all">
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600">
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 hidden sm:block">{user?.email}</span>
            </div>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}