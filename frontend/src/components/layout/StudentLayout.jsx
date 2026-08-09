import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { LayoutDashboard, Edit3, Clock, User, LogOut, Menu, X, GraduationCap, Bell, MessageSquareWarning, CheckCheck, BookOpen } from 'lucide-react';
import { FaGraduationCap } from "react-icons/fa6";
import { MdOutlineRadar } from "react-icons/md";

export default function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);
  
  const [selectedNoti, setSelectedNoti] = useState(null);
  const [showNotiModal, setShowNotiModal] = useState(false);

  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: 'Trang chủ Sinh viên', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Khóa học của tôi', path: '/student/my-courses', icon: BookOpen },
    { name: 'Kỳ thi của tôi', path: '/student/exams', icon: Edit3 },
    { name: 'Phòng Ôn tập', path: '/student/practice', icon: Edit3 },
    { name: 'Năng lực (Radar)', path: '/student/radar', icon: MdOutlineRadar},
    { name: 'Lộ trình học tập', path: '/student/learning-path', icon: FaGraduationCap },
    { name: 'Lịch sử làm bài', path: '/student/history', icon: Clock },
    { name: 'Khiếu nại', path: '/student/complaints', icon: MessageSquareWarning },
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

  const handleViewNotification = async (e, notif) => {
    e.stopPropagation();
    setSelectedNoti(notif);
    setShowNotiModal(true);
    setShowNotifications(false); 

    if (!notif.is_read) {
        try {
            await api.post(`/auth/notifications/${notif.id}/read`);
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n));
        } catch (error) {
            console.error('Lỗi đánh dấu đọc:', error);
        }
    }
  };

  const markAllAsRead = async () => {
    try {
        await api.put('/auth/notifications/read-all');
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (error) {
        console.error("Lỗi khi cập nhật thông báo", error);
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
                className="relative p-2.5 text-slate-500 hover:text-blue-600 transition bg-slate-100 hover:bg-blue-50 rounded-full"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 flex flex-col">
      
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                        <h3 className="font-bold text-slate-800">Thông báo</h3>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{unreadCount} Mới</span>
                    </div>

                    <div className="overflow-y-auto max-h-[260px] custom-scrollbar bg-slate-50/50">
                        {notifications.length > 0 ? (
                            <div className="divide-y divide-slate-100/50">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={(e) => handleViewNotification(e, notif)}
                                        className={`p-4 hover:bg-white cursor-pointer transition flex items-start gap-3 border-l-4 ${
                                            !notif.is_read ? 'bg-white border-emerald-500 shadow-sm' : 'border-transparent opacity-75 hover:opacity-100'
                                        }`}
                                    >
                                        <div className="flex-1">
                                            <p className={`text-sm ${!notif.is_read ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.content}</p>
                                            <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-wide">
                                                {new Date(notif.created_at).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                        {!notif.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                    <Bell className="w-6 h-6 text-slate-300" />
                                </div>
                                Chưa có thông báo nào.
                            </div>
                        )}
                    </div>

                    {unreadCount > 0 && (
                        <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                            <button
                                onClick={markAllAsRead}
                                className="w-full py-2.5 text-sm font-bold text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition flex items-center justify-center gap-2"
                            >
                                <CheckCheck className="w-4 h-4" /> Đánh dấu đã đọc tất cả
                            </button>
                        </div>
                    )}
                </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">
          <Outlet />
        </div>
      </main>

      {showNotiModal && selectedNoti && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-blue-50/50 shrink-0">
                      <h3 className="font-bold text-lg text-blue-800 flex items-center gap-2">
                          <Bell className="w-5 h-5 text-blue-600" /> Chi tiết thông báo
                      </h3>
                      <button onClick={() => setShowNotiModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 bg-white rounded-xl shadow-sm border border-slate-200 transition">
                          <X className="w-5 h-5"/>
                      </button>
                  </div>
                  
                  <div className="p-6 bg-slate-50/30 overflow-y-auto max-h-[60vh]">
                      <h4 className="text-xl font-bold text-slate-800 mb-2">{selectedNoti.title}</h4>
                      <p className="text-xs text-slate-500 font-medium mb-5">
                          Thời gian: {new Date(selectedNoti.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </p>
                      <div className="text-slate-700 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm leading-relaxed whitespace-pre-wrap text-sm">
                          {selectedNoti.content}
                      </div>
                  </div>
                  
                  <div className="p-4 border-t border-slate-100 bg-white flex justify-end shrink-0">
                      <button onClick={() => setShowNotiModal(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-sm">
                          Đóng lại
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}