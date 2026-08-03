import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { LayoutDashboard, Edit3, Clock, User, LogOut, Menu, X, GraduationCap, Bell, CheckCircle2 } from 'lucide-react';
import { FaGraduationCap } from "react-icons/fa6";
import { MdOutlineRadar } from "react-icons/md";

export default function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const notificationRef = useRef(null);
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: 'Trang chủ Sinh viên', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Kỳ thi của tôi', path: '/student/exams', icon: Edit3 },
    { name: 'Năng lực (Radar)', path: '/student/radar', icon: MdOutlineRadar},
    { name: 'Lộ trình học tập', path: '/student/learning-path', icon: FaGraduationCap },
    { name: 'Lịch sử làm bài', path: '/student/history', icon: Clock },
    { name: 'Hồ sơ cá nhân', path: 'profile', icon: User },
  ];

  useEffect(() => {
    api.get('/auth/notifications')
       .then(res => setNotifications(res.data))
       .catch(console.error);

    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (e, notiId) => {
    e.stopPropagation();
    try {
      await api.post(`/auth/notifications/${notiId}/read`);
      setNotifications(notifications.map(n => n.id === notiId ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Lỗi đánh dấu đọc:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-emerald-900 text-white transition-all duration-300 flex flex-col shadow-xl z-20`}>
        <div className="h-16 flex items-center justify-between px-4 bg-emerald-950">
          {sidebarOpen && <span className="text-lg font-bold flex items-center gap-2"><GraduationCap className="w-6 h-6 text-emerald-300"/> HỌC VIÊN</span>}
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
            <div className="mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center cursor-pointer hover:border-blue-500 transition">
                      {user?.avatar ? (
                          <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                          <span className="font-bold text-slate-500">{user?.name?.charAt(0)?.toUpperCase()}</span>
                      )}
                  </div>
                 
                  <div className="flex flex-col overflow-hidden">
                      <p className="text-sm font-semibold truncate">{user?.name}</p>
                      <p className="text-xs text-blue-400 truncate">{user?.code}</p>
                  </div>
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
          
          <a href='/' className="text-2xl font-bold text-gray-800 flex items-center gap-2"><GraduationCap className="w-8 h-8 text-blue-600" /> Trang chủ NQ EduTech</a>
   
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <Bell className="w-6 h-6" />
          
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                  <h3 className="font-bold text-slate-800 text-base">Thông báo của bạn</h3>
                  {unreadCount > 0 && <span className=" text-xs font-bold px-2 py-0.5 ">{unreadCount} mới</span>}
                </div>
                
                <div className="max-h-[350px] overflow-y-auto">
                    {notifications.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {notifications.map(noti => (
                                <div key={noti.id} className={`p-4 transition-colors ${!noti.is_read ? 'bg-emerald-200' : 'hover:bg-slate-50'}`}>
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                        <div className={`font-bold text-sm ${!noti.is_read ? 'text-slate-800' : 'text-slate-800'}`}>{noti.title}</div>
                                        {!noti.is_read && (
                                            <button onClick={(e) => handleMarkAsRead(e, noti.id)} className="text-xs shrink-0" title="Đánh dấu đã đọc">
                                              Đã đọc
                                            </button>
                                        )}
                                    </div>
                                    <div className={`text-sm line-clamp-2 ${!noti.is_read ? 'text-slate-800' : 'text-slate-600'}`}>{noti.content}</div>
                                    <div className={`text-xs mt-2 font-medium ${!noti.is_read ? 'text-slate-800' : 'text-slate-400'}`}>
                                        {new Date(noti.created_at).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[250px]">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Bell className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-800 font-bold mb-1">Chưa có thông báo nào</p>
                            <p className="text-sm text-slate-500">Hệ thống chưa có thông báo mới cho bạn.</p>
                        </div>
                    )}
                </div>
              </div>
            )}
          </div>

        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}