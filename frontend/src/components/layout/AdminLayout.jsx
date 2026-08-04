import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, BookOpen, Users, FileText, CheckSquare, BarChart, Eye, LogOut, Menu, X, Layers, GraduationCap, Shield, Bell, Bookmark, UserX } from 'lucide-react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: 'Tổng quan', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Quản lý Môn học', path: '/admin/subjects', icon: BookOpen },
    { name: 'Quản lý Khóa học', path: '/admin/courses', icon: Layers },
    { name: 'Quản lý Đợt đăng ký KH', path: '/admin/cohort', icon: Layers },
    { name: 'Quản lý Lớp học', path: '/admin/classes', icon: GraduationCap },
    { name: 'Quản lý Người dùng', path: '/admin/users', icon: Users },
    { name: 'Ngân hàng Câu hỏi', path: '/admin/questions', icon: FileText },
    { name: 'Quản lý Chủ đề', path: '/admin/topics', icon: Bookmark },
    { name: 'Quản lý Kỳ thi', path: '/admin/exams', icon: CheckSquare },
    { name: 'Giám sát phòng thi', path: '/admin/monitor', icon: Eye },
    { name: 'Quản lý thông báo', path: '/admin/notifications', icon: Bell },
    { name: 'Xét duyệt Kỷ luật', path: '/admin/expulsions', icon: UserX },
    { name: 'Thống kê & Báo cáo', path: '/admin/statistics', icon: BarChart },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-between px-4 bg-gray-950">
          {sidebarOpen && <span className="text-lg font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-primary-400"/> ADMIN</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-gray-800 rounded">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} className={`flex items-center px-4 py-3 mb-1 transition-colors ${isActive ? 'bg-primary-600 border-r-4 border-white text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <item.icon size={20} className="min-w-[20px]" />
                {sidebarOpen && <span className="ml-4 text-sm font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 bg-gray-950">
          {sidebarOpen && (
            <div className="mb-4">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.code}</p>
            </div>
          )}
          <button onClick={logout} className="flex items-center w-full px-4 py-2 text-red-400 hover:bg-red-500/10 rounded transition-colors">
            <LogOut size={20} />
            {sidebarOpen && <span className="ml-4 text-sm font-medium">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8">
          <a href='/' className="text-2xl font-bold text-gray-800 flex items-center gap-2"><GraduationCap className="w-8 h-8 text-blue-600" /> Trang chủ NQ EduTech</a>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">A</div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}