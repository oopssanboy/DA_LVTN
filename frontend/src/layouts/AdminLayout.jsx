import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import './AdminLayout.css';
import { FaEye, FaChartPie, FaUsers, FaFileAlt, FaUserCircle, FaSignOutAlt, FaListAlt } from 'react-icons/fa';

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const userName = localStorage.getItem('userName') || 'Admin';

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const menuItems = [
        { path: '/admin/dashboard', name: 'Thống kê', icon: <FaChartPie className="sidebar-icon" /> },
        { path: '/admin/students', name: 'Quản lý sinh viên', icon: <FaUsers className="sidebar-icon" /> },
        { path: '/admin/exams', name: 'Quản lý Kỳ thi', icon: <FaListAlt className="sidebar-icon" /> },
        { path: '/admin/questions', name: 'Ngân hàng câu hỏi', icon: <FaFileAlt className="sidebar-icon" /> },
        { path: '/admin/notifications', name: 'Quản lý thông báo', icon: <FaFileAlt className="sidebar-icon" /> },
        { path: '/admin/proctoring', name: 'Giám sát phòng thi', icon: <FaEye className="sidebar-icon" /> },
    ];

    return (
        <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            
            {/* --- SIDEBAR BÊN TRÁI --- */}
            <div className="custom-sidebar z-3 position-relative">
                {/* Logo / Header của Sidebar */}
                <div className="sidebar-header text-center">
                    <h5 style={{ color: '#2563eb', fontWeight: '700', letterSpacing: '-0.5px' }} className="mb-1">
                        HỆ THỐNG THI
                    </h5>
                    <small style={{ color: '#64748b' }}>Xin chào, <span className="fw-medium text-dark">{userName}</span></small>
                </div>
                
                {/* Danh sách Menu */}
                <div className="d-flex flex-column flex-grow-1 py-3">
                    {menuItems.map((item, index) => {
                        const isActive = location.pathname.includes(item.path);
                        return (
                            <Link 
                                key={index} 
                                to={item.path} 
                                className={`sidebar-item ${isActive ? 'active' : ''}`}
                            >
                                {item.icon}
                                {item.name}
                            </Link>
                        );
                    })}
                </div>

                {/* Khu vực dưới cùng (Tài khoản & Đăng xuất) */}
                <div className="py-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                    <Link to="/admin/profile" className={`sidebar-item ${location.pathname.includes('/admin/profile') ? 'active' : ''}`}>
                        <FaUserCircle className="sidebar-icon" />
                        Thông tin tài khoản
                    </Link>
                    
                    <div className="sidebar-item sidebar-logout" onClick={handleLogout}>
                        <FaSignOutAlt className="sidebar-icon" />
                        Đăng xuất
                    </div>
                </div>
            </div>

            {/* --- NỘI DUNG BÊN PHẢI --- */}
            {/* Sử dụng nền màu xám cực nhạt (#f8fafc) để bảng biểu/card màu trắng nổi bật lên */}
            <div className="flex-grow-1 p-4" style={{ overflowY: 'auto', maxHeight: '100vh' }}>
                <Outlet /> 
            </div>
            
        </div>
    );
}