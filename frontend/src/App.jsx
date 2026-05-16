import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './components/layout/AdminLayout';
import QuestionList from './pages/admin/QuestionList';
import QuestionForm from './pages/admin/QuestionForm';
import ExamManager from './pages/admin/ExamManager';
import ExamForm from './pages/admin/ExamForm';
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
          <Route path="/proctor" element={<ProctorDashboard />} />
          <Route path="/teacher/exams/:examId/statistics" element={<ExamStatistics />} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<div>Dashboard (chưa có)</div>} />
            <Route path="questions" element={<QuestionList />} />
            <Route path="questions/create" element={<QuestionForm />} />
            <Route path="questions/:id/edit" element={<QuestionForm />} />
            <Route path="/admin/exams" element={<ExamManager />} />
            <Route path="/admin/exams/create" element={<ExamForm />} />
            <Route path="/admin/exams/:id/edit" element={<ExamForm />} />
            
          </Route>
          <Route path="/" element={<Navigate to="/admin" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;