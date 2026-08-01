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


import AdminLayout from './components/layout/AdminLayout';
import TeacherLayout from './components/layout/TeacherLayout';
import ProctorLayout from './components/layout/ProctorLayout';
import StudentLayout from './components/layout/StudentLayout';


import Home from './pages/Home';
import Login from './pages/auth/Login';


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
import TopicManager from './pages/admin/TopicManager';
import ExamStatistics from './pages/teacher/ExamStatistics';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherClassManager from './pages/teacher/TeacherClassManager.jsx';
import ProctorDashboard from './pages/proctor/ProctorDashboard';
import ExamMonitor from './pages/proctor/ExamMonitor';
import StudentHome from './pages/student/StudentHome';
import ExamRoom from './pages/student/ExamRoom';
import ExamResult from './pages/student/ExamResult';
import MyExams from './pages/student/MyExams.jsx';
import ExamHistory from './pages/student/ExamHistory';
import StudentProfile from './pages/student/StudentProfile';
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
          <Route path="/login" element={<Login />} />
    
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
            <Route path="topics" element={<TopicManager />} />
          </Route>
       
          <Route path="/proctor" element={<ProtectedRoute allowedRoles={['proctor']}><ProctorLayout /></ProtectedRoute>}>
            <Route path="/proctor/dashboard" element={<ProctorDashboard />} />
            <Route path="/proctor/monitor/:examId" element={<ExamMonitor />} />
          </Route>
          
     
          <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<StudentHome />} />
            <Route path="exams" element={<MyExams />} />
            <Route path="history" element={<ExamHistory />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="radar" element={<StudentRadar />} />
            <Route path="learning-path" element={<LearningPath />} />
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