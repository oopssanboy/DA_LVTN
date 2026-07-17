import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, FileText, CheckSquare, BarChart, LogOut, Menu, X, BookOpen, Bell, GraduationCap } from 'lucide-react';

export default function TeacherLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: 'Tổng quan', path: '/teacher/dashboard', icon: LayoutDashboard },
    { name: 'Lớp học của tôi', path: '/teacher/classes', icon: Users },
    { name: 'Ngân hàng Câu hỏi', path: '/teacher/questions', icon: FileText },
    { name: 'Kỳ thi của tôi', path: '/teacher/exams', icon: CheckSquare },
    { name: 'Quản lý thông báo', path: '/teacher/notifications', icon: Bell },
    { name: 'Thống kê & Báo cáo', path: '/teacher/statistics', icon: BarChart },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-blue-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-between px-4 bg-blue-950">
          {sidebarOpen && <span className="text-lg font-bold flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-300"/> GIẢNG VIÊN</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-blue-800 rounded">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} className={`flex items-center px-4 py-3 mb-1 transition-colors ${isActive ? 'bg-blue-600 border-r-4 border-white text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}>
                <item.icon size={20} className="min-w-[20px]" />
                {sidebarOpen && <span className="ml-4 text-sm font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 bg-blue-950">
          {sidebarOpen && (
            <div className="mb-4">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-blue-400">{user?.code}</p>
            </div>
          )}
          <button onClick={logout} className="flex items-center w-full px-4 py-2 text-red-300 hover:bg-red-500/20 rounded transition-colors">
            <LogOut size={20} />
            {sidebarOpen && <span className="ml-4 text-sm font-medium">Đăng xuất</span>}
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8">
          <a href='/' className="text-2xl font-bold text-gray-800 flex items-center gap-2"><GraduationCap className="w-8 h-8 text-blue-600" /> Trang chủ NQ EduTech</a>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}