import { Outlet, Link, useNavigate } from 'react-router-dom'
import { FaUserGraduate, FaHome, FaUserCircle, FaSignOutAlt } from 'react-icons/fa'

export default function StudentLayout() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm mb-6 py-4 border-b">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <Link to="/student/home" className="font-bold text-xl flex items-center gap-2 text-orange-600">
            <FaUserGraduate className="text-2xl" /> Cổng thi sinh viên
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/student/home" className="flex items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition">
              <FaHome /> Trang chủ
            </Link>
            <Link to="/student/profile" className="flex items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition">
              <FaUserCircle /> {user?.name || 'Tài khoản'}
            </Link>
            <button 
              onClick={() => {
                localStorage.clear();
                navigate('/login')
              }} 
              className="flex items-center gap-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <Outlet />
      </div>
    </div>
  )
}