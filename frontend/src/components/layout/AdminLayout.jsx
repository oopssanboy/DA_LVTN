import { Outlet, Link, useNavigate } from 'react-router-dom'
import { FaSignOutAlt, FaUserCircle, FaBook, FaUsers, FaChartBar } from 'react-icons/fa'

export default function AdminLayout() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="h-16 flex items-center justify-center font-bold text-xl border-b border-slate-800 text-orange-500">
          HỆ THỐNG THI
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to={`/${user.role}/dashboard`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition text-slate-300 hover:text-white">
            <FaChartBar /> Tổng quan
          </Link>
          <Link to="/admin/exams" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition text-slate-300 hover:text-white">
            <FaBook /> Quản lý Kỳ thi
          </Link>
          {user.role === 'admin' && (
            <Link to="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition text-slate-300 hover:text-white">
              <FaUsers /> Quản lý Người dùng
            </Link>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm border-b px-6 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700 capitalize">Khu vực {user.role}</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <FaUserCircle className="text-xl" /> {user.name}
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium flex items-center gap-2"
            >
              <FaSignOutAlt /> Đăng xuất
            </button>
          </div>
        </header>

        {/* Đổ các component con vào đây */}
        <div className="p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}