import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/student/home" className="text-xl font-bold text-orange-600">ExamPro</Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Xin chào, {user?.name}</span>
              <button onClick={handleLogout} className="text-red-600 hover:text-red-800">Đăng xuất</button>
            </div>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </div>
    </div>
  );
}