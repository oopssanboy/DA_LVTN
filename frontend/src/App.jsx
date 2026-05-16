import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login'
import StudentLayout from './components/layout/StudentLayout'
import AdminLayout from './components/layout/AdminLayout'

// Các trang (Pages) hiện có trong project của bạn
import StudentHome from './pages/student/StudentHome'
import ExamManager from './pages/admin/ExamManager'
import ProctorDashboard from './components/proctor/ProctorDashboard'

// Tạo các component Dashboard tạm thời (Nếu bạn chưa tạo file riêng)
const AdminDashboard = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h1 className="text-2xl font-bold text-slate-800">Tổng quan Quản trị viên</h1>
    <p className="text-slate-500 mt-2">Chào mừng bạn đến với hệ thống quản lý thi trực tuyến.</p>
  </div>
);

const TeacherDashboard = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h1 className="text-2xl font-bold text-slate-800">Tổng quan Giảng viên</h1>
    <p className="text-slate-500 mt-2">Quản lý câu hỏi, đề thi và xem thống kê tại đây.</p>
  </div>
);

// Component dùng để bảo vệ các Route (Yêu cầu phải có Token & Đúng Role)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  
  if (!token || !userStr) {
    return <Navigate to="/login" replace />
  }

  try {
    const user = JSON.parse(userStr)
    // Nếu có yêu cầu role nhưng user không có quyền -> Đẩy về trang chủ của họ
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        if(user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
        if(user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />
        if(user.role === 'proctor') return <Navigate to="/proctor/dashboard" replace />
        return <Navigate to="/student/home" replace />
    }
    return children
  } catch (e) {
    localStorage.clear()
    return <Navigate to="/login" replace />
  }
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* ===================== ADMIN ROUTES ===================== */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="exams" element={<ExamManager />} />
        </Route>

        {/* ==================== TEACHER ROUTES ==================== */}
        <Route path="/teacher" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <AdminLayout /> {/* Giảng viên dùng chung layout Admin tạm thời */}
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<TeacherDashboard />} />
        </Route>

        {/* ==================== PROCTOR ROUTES ==================== */}
        <Route path="/proctor" element={
          <ProtectedRoute allowedRoles={['proctor', 'admin', 'teacher']}>
            <AdminLayout /> 
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<ProctorDashboard />} />
        </Route>

        {/* ==================== STUDENT ROUTES ==================== */}
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentLayout />
          </ProtectedRoute>
        }>
          <Route path="home" element={<StudentHome />} />
        </Route>

        {/* Trang 404 nếu gõ sai đường dẫn */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <h1 className="text-3xl font-bold text-slate-400">404 - Không tìm thấy trang</h1>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App