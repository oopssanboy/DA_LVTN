

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';


import AdminLayout from './components/layout/AdminLayout';
import TeacherLayout from './components/layout/TeacherLayout';
import ProctorLayout from './components/layout/ProctorLayout';
import StudentLayout from './components/layout/StudentLayout';


import Home from './pages/Home';
import Courses from './pages/Courses';
import Teachers from './pages/Teachers';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/auth/Login';
import ProfileManager from './pages/auth/ProfileManager.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';


import AdminDashboard from './pages/admin/AdminDashboard';
import QuestionList from './pages/admin/QuestionList';
import QuestionForm from './pages/admin/QuestionForm';
import ExamManager from './pages/admin/ExamManager';
import ExamForm from './pages/admin/ExamForm';
import UserManager from './pages/admin/UserManager.jsx';
import SubjectManager from './pages/admin/SubjectManager.jsx';
import CourseManager from './pages/admin/CourseManager.jsx';
import CohortManager from './pages/admin/CohortManager.jsx';
import ClassManager from './pages/admin/ClassManager.jsx';
import ExpulsionManager from './pages/admin/ExpulsionManager.jsx';
import TopicManager from './pages/admin/TopicManager.jsx';
import NotificationManager from './pages/admin/NotificationManager.jsx';
import ExamStatistics from './pages/teacher/ExamStatistics';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherClassManager from './pages/teacher/TeacherClassManager.jsx';

import PostExamManager from './pages/teacher/PostExamManager';
import ProctorDashboard from './pages/proctor/ProctorDashboard';
import ExamMonitor from './pages/proctor/ExamMonitor';
import ReportManager from './pages/proctor/ReportManager';
import StudentHome from './pages/student/StudentHome';
import ExamRoom from './pages/student/ExamRoom';
import ExamResult from './pages/student/ExamResult';
import MyExams from './pages/student/MyExams.jsx';
import ExamHistory from './pages/student/ExamHistory';
import ComplaintManager from './pages/student/ComplaintManager';

import StudentRadar from './pages/student/StudentRadar';
import LearningPath from './pages/student/LearningPath.jsx';


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


const PlaceholderPage = ({ title }) => (
  <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 min-h-[60vh] flex flex-col items-center justify-center">
    <h2 className="text-3xl font-bold text-gray-300 mb-2">{title}</h2>
    <p className="text-gray-500">Giao diện này chưa làm</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>

          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
    
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="subjects" element={<SubjectManager />} />
            <Route path="courses" element={<CourseManager />} />
            <Route path="cohort" element={<CohortManager />} />
            <Route path="classes" element={<ClassManager />} />
            <Route path="users" element={<UserManager />} />
            <Route path="questions" element={<QuestionList />} />
            <Route path="questions/create" element={<QuestionForm />} />
            <Route path="questions/:id/edit" element={<QuestionForm />} />
            <Route path="exams" element={<ExamManager />} />
            <Route path="exams/create" element={<ExamForm />} />
            <Route path="exams/:id/edit" element={<ExamForm />} />
            <Route path="/admin/monitor" element={<ProctorDashboard />} />
            <Route path="/admin/monitor/:examId" element={<ExamMonitor />} />
            <Route path="statistics" element={<ExamStatistics />} />
            <Route path="topics" element={<TopicManager />} />
            <Route path="expulsions" element={<ExpulsionManager />} />
            <Route path="notifications" element={<NotificationManager basePath="/admin" />} />
          </Route>

          <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="classes" element={<TeacherClassManager />} />
            <Route path="questions" element={<QuestionList />} />
            <Route path="questions/create" element={<QuestionForm />} />
            <Route path="questions/:id/edit" element={<QuestionForm />} />
            <Route path="exams" element={<ExamManager />} />
            <Route path="exams/create" element={<ExamForm />} />
            <Route path="exams/:id/edit" element={<ExamForm />} />
            <Route path="statistics" element={<ExamStatistics />} />
            
            <Route path="notifications" element={<NotificationManager basePath="/teacher" />} />
            <Route path="post-exam" element={<PostExamManager />} />
            <Route path="profile" element={<ProfileManager />} />
          </Route>
       
          <Route path="/proctor" element={<ProtectedRoute allowedRoles={['proctor']}><ProctorLayout /></ProtectedRoute>}>
            <Route path="/proctor/dashboard" element={<ProctorDashboard />} />
            <Route path="/proctor/monitor/:examId" element={<ExamMonitor />} />
            <Route path="/proctor/reports" element={<ReportManager />} />
            <Route path="profile" element={<ProfileManager />} />
          </Route>
          
     
          <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<StudentHome />} />
            <Route path="exams" element={<MyExams />} />
            <Route path="history" element={<ExamHistory />} />
           
            <Route path="radar" element={<StudentRadar />} />
            <Route path="learning-path" element={<LearningPath />} />
            <Route path="complaints" element={<ComplaintManager />} />
            <Route path="profile" element={<ProfileManager />} />
          </Route>
          
     
          <Route path="/student/exam/:attemptId" element={<ProtectedRoute allowedRoles={['student']}><ExamRoom /></ProtectedRoute>} />
          <Route path="/student/exam-result/:attemptId" element={<ProtectedRoute allowedRoles={['student']}><ExamResult /></ProtectedRoute>} />

          <Route path="*" element={<div className="min-h-screen flex items-center justify-center text-xl font-bold text-gray-500">404 - KHÔNG TÌM THẤY TRANG</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;