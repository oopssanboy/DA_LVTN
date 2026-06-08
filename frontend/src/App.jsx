// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// import { Toaster } from 'react-hot-toast'
// import { AuthProvider, useAuth } from './context/AuthContext'

// import AdminLayout from './components/layout/AdminLayout'
// import StudentLayout from './components/layout/StudentLayout'
// import ProctorLayout from './components/layout/ProctorLayout'

// import Login from './pages/auth/Login'
// import AdminDashboard from './pages/admin/AdminDashboard'
// import QuestionList from './pages/admin/QuestionList'
// import QuestionForm from './pages/admin/QuestionForm'
// import ExamManager from './pages/admin/ExamManager'
// import ExamForm from './pages/admin/ExamForm'
// import ExamStatistics from './pages/teacher/ExamStatistics'
// import ProctorDashboard from './pages/proctor/ProctorDashboard'
// import StudentHome from './pages/student/StudentHome'
// import ExamRoom from './pages/student/ExamRoom'
// import ExamResult from './pages/student/ExamResult'
// import StudentProfile from './pages/student/StudentProfile'

// const ProtectedRoute = ({ children, allowedRoles }) => {
//   const { user, loading } = useAuth()
//   const token = localStorage.getItem('token')

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
//       </div>
//     )
//   }

//   if (!token || !user) {
//     return <Navigate to="/login" replace />
//   }

//   const role = user.role;
//   if (allowedRoles && !allowedRoles.includes(role)) {
//     if (role === 'admin' || role === 'teacher') return <Navigate to="/admin/dashboard" replace />
//     if (role === 'proctor') return <Navigate to="/proctor/dashboard" replace />
//     if (role === 'student') return <Navigate to="/student/home" replace />
//     return <Navigate to="/login" replace />
//   }

//   return children
// }

// function App() {
//   return (
//     <AuthProvider>
//       <BrowserRouter>
//         <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
//         <Routes>
//           <Route path="/login" element={<Login />} />
          
//           <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><AdminLayout /></ProtectedRoute>}>
//             <Route path="dashboard" element={<AdminDashboard />} />
//             <Route path="questions" element={<QuestionList />} />
//             <Route path="questions/create" element={<QuestionForm />} />
//             <Route path="questions/:id/edit" element={<QuestionForm />} />
//             <Route path="exams" element={<ExamManager />} />
//             <Route path="exams/create" element={<ExamForm />} />
//             <Route path="exams/:id/edit" element={<ExamForm />} />
//           </Route>
          
//           <Route path="/teacher/exams/:examId/statistics" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><ExamStatistics /></ProtectedRoute>} />
          
//           <Route path="/proctor" element={<ProtectedRoute allowedRoles={['proctor', 'admin', 'teacher']}><ProctorLayout /></ProtectedRoute>}>
//             <Route path="dashboard" element={<ProctorDashboard />} />
//           </Route>
          
//           <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout /></ProtectedRoute>}>
//             <Route path="home" element={<StudentHome />} />
//             <Route path="exam/:attemptId" element={<ExamRoom />} />
//             <Route path="exam-result/:attemptId" element={<ExamResult />} />
//             <Route path="profile" element={<StudentProfile />} />
//           </Route>

//           <Route path="/" element={<Navigate to="/login" replace />} />
//           <Route path="*" element={<div className="min-h-screen flex items-center justify-center text-xl font-bold text-gray-500">404 - KHÔNG TÌM THẤY TRANG</div>} />
//         </Routes>
//       </BrowserRouter>
//     </AuthProvider>
//   )
// }

// export default App

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import TeacherLayout from './components/layout/TeacherLayout';
import ProctorLayout from './components/layout/ProctorLayout';
import StudentLayout from './components/layout/StudentLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';

// Existing Components
import AdminDashboard from './pages/admin/AdminDashboard';
import QuestionList from './pages/admin/QuestionList';
import QuestionForm from './pages/admin/QuestionForm';
import ExamManager from './pages/admin/ExamManager';
import ExamForm from './pages/admin/ExamForm';
import ExamStatistics from './pages/teacher/ExamStatistics';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import ProctorDashboard from './pages/proctor/ProctorDashboard';
import StudentHome from './pages/student/StudentHome';
import ExamRoom from './pages/student/ExamRoom';
import ExamResult from './pages/student/ExamResult';
import StudentProfile from './pages/student/StudentProfile';

// Middleware Bảo vệ
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role;
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
    if (role === 'proctor') return <Navigate to="/proctor/dashboard" replace />;
    if (role === 'student') return <Navigate to="/student/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

// Màn hình tạm cho các chức năng sắp phát triển
const PlaceholderPage = ({ title }) => (
  <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 min-h-[60vh] flex flex-col items-center justify-center">
    <h2 className="text-3xl font-bold text-gray-300 mb-2">{title}</h2>
    <p className="text-gray-500">Giao diện này đang trong quá trình phát triển...</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          {/* TRANG CHỦ CHUNG DÀNH CHO MỌI ACTOR */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          
          {/* 1. ADMIN CÓ TOÀN QUYỀN */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="subjects" element={<PlaceholderPage title="Quản lý Môn học" />} />
            <Route path="courses" element={<PlaceholderPage title="Quản lý Khóa học" />} />
            <Route path="classes" element={<PlaceholderPage title="Quản lý Lớp học" />} />
            <Route path="users" element={<PlaceholderPage title="Quản lý Người dùng" />} />
            <Route path="questions" element={<QuestionList />} />
            <Route path="questions/create" element={<QuestionForm />} />
            <Route path="questions/:id/edit" element={<QuestionForm />} />
            <Route path="exams" element={<ExamManager />} />
            <Route path="exams/create" element={<ExamForm />} />
            <Route path="exams/:id/edit" element={<ExamForm />} />
            <Route path="monitor" element={<PlaceholderPage title="Giám sát phòng thi toàn cục" />} />
            <Route path="statistics" element={<ExamStatistics />} />
          </Route>

          {/* 2. GIẢNG VIÊN (Quản lý lớp được phân, biên soạn) */}
          <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="classes" element={<PlaceholderPage title="Lớp học của tôi" />} />
            <Route path="questions" element={<QuestionList />} />
            <Route path="questions/create" element={<QuestionForm />} />
            <Route path="questions/:id/edit" element={<QuestionForm />} />
            <Route path="exams" element={<ExamManager />} />
            <Route path="exams/create" element={<ExamForm />} />
            <Route path="exams/:id/edit" element={<ExamForm />} />
            <Route path="statistics" element={<ExamStatistics />} />
          </Route>
          
          {/* 3. GIÁM THỊ (Chỉ giám sát) */}
          <Route path="/proctor" element={<ProtectedRoute allowedRoles={['proctor']}><ProctorLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<ProctorDashboard />} />
            <Route path="monitor" element={<PlaceholderPage title="Danh sách lớp phân công giám sát" />} />
          </Route>
          
          {/* 4. SINH VIÊN */}
          <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<StudentHome />} />
            <Route path="exams" element={<PlaceholderPage title="Kỳ thi của tôi" />} />
            <Route path="history" element={<PlaceholderPage title="Lịch sử làm bài" />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>
          
          {/* Phòng thi không cần Sidebar */}
          <Route path="/student/exam/:attemptId" element={<ProtectedRoute allowedRoles={['student']}><ExamRoom /></ProtectedRoute>} />
          <Route path="/student/exam-result/:attemptId" element={<ProtectedRoute allowedRoles={['student']}><ExamResult /></ProtectedRoute>} />

          <Route path="*" element={<div className="min-h-screen flex items-center justify-center text-xl font-bold text-gray-500">404 - KHÔNG TÌM THẤY TRANG</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;