import { Outlet, Link, useNavigate } from 'react-router-dom'
import { FaUserGraduate, FaHome, FaUserCircle, FaSignOutAlt } from 'react-icons/fa'

export default function StudentLayout() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const navigate = useNavigate()

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8fafc' }}>
      <nav className="navbar navbar-expand-lg bg-white shadow-sm mb-4 py-3 border-bottom">
        <div className="container">
          <Link to="/student/home" className="navbar-brand fw-bold d-flex align-items-center gap-2 text-primary">
            <FaUserGraduate className="fs-4" /> Cổng thi sinh viên
          </Link>
          <div className="d-flex align-items-center gap-3">
            <Link to="/student/home" className="btn btn-light d-flex align-items-center gap-1">
              <FaHome /> Trang chủ
            </Link>
            <Link to="/student/profile" className="btn btn-light d-flex align-items-center gap-1">
              <FaUserCircle /> {user?.name || 'Tài khoản'}
            </Link>
            <button onClick={() => { localStorage.clear(); navigate('/login') }} className="btn btn-light text-danger d-flex align-items-center gap-1">
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </nav>
      <div className="container pb-5">
        <Outlet />
      </div>
    </div>
  )
}