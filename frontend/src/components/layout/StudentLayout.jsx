import { Outlet, Link, useNavigate } from 'react-router-dom'
import { UserCircleIcon, ArrowRightOnRectangleIcon, HomeIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'

export default function StudentLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/student/home" className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                ExamPro
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/student/home" className="text-gray-700 hover:text-primary-600 flex items-center gap-1">
                <HomeIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Trang chủ</span>
              </Link>
              <Link to="/student/profile" className="text-gray-700 hover:text-primary-600 flex items-center gap-1">
                <UserCircleIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Hồ sơ</span>
              </Link>
              <button onClick={handleLogout} className="text-red-500 hover:text-red-700 flex items-center gap-1">
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}