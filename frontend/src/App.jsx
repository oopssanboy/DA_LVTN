import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'  // ← phải có
import Login from './pages/auth/Login'
import AdminLayout from './components/layout/AdminLayout'
import StudentLayout from './components/layout/StudentLayout'
import ProctorLayout from './components/layout/ProctorLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import QuestionList from './pages/admin/QuestionList'
import QuestionForm from './pages/admin/QuestionForm'
import ExamManager from './pages/admin/ExamManager'
import ExamForm from './pages/admin/ExamForm'
import ExamStatistics from './components/teacher/ExamStatistics'
import StudentHome from './pages/student/StudentHome'
import ExamRoom from './pages/student/ExamRoom'
import ExamResult from './components/student/ExamResult'
import StudentProfile from './pages/student/StudentProfile'
import ProctorDashboard from './components/proctor/ProctorDashboard'

const getRole = () => {
  const userStr = localStorage.getItem('user')
  if (!userStr) return null
  try { return JSON.parse(userStr).role } catch { return null }
}

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token')
  const role = getRole()
  if (!token) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (role === 'teacher') return <Navigate to="/admin/dashboard" replace />
    if (role === 'proctor') return <Navigate to="/proctor/dashboard" replace />
    if (role === 'student') return <Navigate to="/student/home" replace />
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  return (
    <AuthProvider>   {/* ← BỌC TOÀN BỘ */}
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Admin & Teacher */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><AdminLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="questions" element={<QuestionList />} />
            <Route path="questions/create" element={<QuestionForm />} />
            <Route path="questions/:id/edit" element={<QuestionForm />} />
            <Route path="exams" element={<ExamManager />} />
            <Route path="exams/create" element={<ExamForm />} />
            <Route path="exams/:id/edit" element={<ExamForm />} />
          </Route>
          <Route path="/teacher/exams/:examId/statistics" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><ExamStatistics /></ProtectedRoute>} />
          {/* Proctor */}
          <Route path="/proctor" element={<ProtectedRoute allowedRoles={['proctor', 'admin', 'teacher']}><ProctorLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<ProctorDashboard />} />
          </Route>
          {/* Student */}
          <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout /></ProtectedRoute>}>
            <Route path="home" element={<StudentHome />} />
            <Route path="exam/:attemptId" element={<ExamRoom />} />
            <Route path="exam-result/:attemptId" element={<ExamResult />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<div className="min-h-screen flex items-center justify-center">404</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App