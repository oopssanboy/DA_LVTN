import { Outlet, NavLink } from 'react-router-dom';
import { 
  HomeIcon, QuestionMarkCircleIcon, 
  FolderIcon, ArrowLeftOnRectangleIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Câu hỏi', href: '/admin/questions', icon: QuestionMarkCircleIcon },
  { name: 'Kỳ thi', href: '/admin/exams', icon: FolderIcon },
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-primary">ExamPro</h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="mb-2 text-sm text-gray-600">{user?.name}</div>
          <button
            onClick={logout}
            className="flex items-center w-full text-red-500 hover:bg-red-50 p-2 rounded"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
            Đăng xuất
          </button>
        </div>
      </div>
      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}