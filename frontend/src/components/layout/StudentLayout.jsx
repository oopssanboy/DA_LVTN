import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Edit3, Clock, User, LogOut, Menu, X, GraduationCap } from 'lucide-react';

export default function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: 'Trang chủ Sinh viên', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Kỳ thi của tôi', path: '/student/exams', icon: Edit3 },
    { name: 'Lịch sử làm bài', path: '/student/history', icon: Clock },
    { name: 'Hồ sơ cá nhân', path: '/student/profile', icon: User },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-emerald-900 text-white transition-all duration-300 flex flex-col shadow-xl z-20`}>
        <div className="h-16 flex items-center justify-between px-4 bg-emerald-950">
          {sidebarOpen && <span className="text-lg font-bold flex items-center gap-2"><GraduationCap className="w-6 h-6 text-emerald-300"/> SINH VIÊN</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-emerald-800 rounded">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="flex-1 py-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`flex items-center px-4 py-3 mb-1 transition-colors ${isActive ? 'bg-emerald-600 border-r-4 border-white text-white shadow-inner' : 'text-emerald-200 hover:bg-emerald-800 hover:text-white'}`}>
                <item.icon size={20} className="min-w-[20px]" />
                {sidebarOpen && <span className="ml-4 text-sm font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 bg-emerald-950 border-t border-emerald-800/50">
          {sidebarOpen && (
            <div className="mb-4">
              <p className="text-sm font-bold truncate">{user?.name}</p>
              <p className="text-xs text-emerald-400 font-mono">{user?.code}</p>
            </div>
          )}
          <button onClick={logout} className="flex items-center w-full px-4 py-2 text-red-300 hover:bg-red-500/20 rounded transition-colors">
            <LogOut size={20} />
            {sidebarOpen && <span className="ml-4 text-sm font-medium">Đăng xuất</span>}
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm">
          <h1 className="text-xl font-bold text-gray-800">Cổng Thi Trắc Nghiệm STU</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}