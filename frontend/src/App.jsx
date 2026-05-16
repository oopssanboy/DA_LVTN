import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './components/layout/AdminLayout';
import StudentLayout from './components/layout/StudentLayout';
import QuestionList from './pages/admin/QuestionList';
import QuestionForm from './pages/admin/QuestionForm';
import ExamManager from './pages/admin/ExamManager';
import ExamForm from './pages/admin/ExamForm';
import ExamStatistics from './components/teacher/ExamStatistics';
import ProctorDashboard from './components/proctor/ProctorDashboard';
import ExamList from './components/student/ExamList';
import ExamRoom from './components/student/ExamRoom';
import ExamResult from './components/student/ExamResult';
import Login from './pages/auth/Login';
import { Toaster } from 'react-hot-toast';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Admin & Teacher routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<div>Dashboard (đang phát triển)</div>} />
            <Route path="questions" element={<QuestionList />} />
            <Route path="questions/create" element={<QuestionForm />} />
            <Route path="questions/:id/edit" element={<QuestionForm />} />
            <Route path="exams" element={<ExamManager />} />
            <Route path="exams/create" element={<ExamForm />} />
            <Route path="exams/:id/edit" element={<ExamForm />} />
          </Route>
          
          {/* Teacher statistics */}
          <Route path="/teacher/exams/:examId/statistics" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><ExamStatistics /></ProtectedRoute>} />
          
          {/* Proctor */}
          <Route path="/proctor" element={<ProtectedRoute allowedRoles={['proctor', 'admin', 'teacher']}><ProctorDashboard /></ProtectedRoute>} />
          
          {/* Student routes */}
          <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout /></ProtectedRoute>}>
            <Route path="home" element={<ExamList />} />
            <Route path="exam/:attemptId" element={<ExamRoom />} />
            <Route path="exam-result/:attemptId" element={<ExamResult />} />
          </Route>
          
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;