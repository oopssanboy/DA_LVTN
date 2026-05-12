import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Login from './pages/auth/Login';
import StudentManager from './pages/admin/StudentManager';
import StudentHome from './pages/student/StudentHome';
import AdminLayout from './layouts/AdminLayout';
import QuestionManager from './pages/admin/QuestionManager';
import ExamManager from './pages/admin/ExamManager';
import DoingExam from './pages/student/DoingExam';
import ReportDashboard from './pages/admin/ReportDashboard';
import ProctorDashboard from './pages/admin/ProctorDashboard';
import NotificationManager from './pages/admin/NotificationManager';
import SystemSettings from './pages/admin/SystemSettings';
import AdminProfile from './pages/admin/AdminProfile';
import StudentProfile from './pages/student/StudentProfile';

const ReportDashboardWrapper = () => {
    const { examId } = useParams();
    return <ReportDashboard examId={examId} />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        {/* --- KHU VỰC CỦA SINH VIÊN --- */}
        <Route path="/student" element={<StudentHome />} />
        <Route path="/student/exam/:id/do" element={<DoingExam />} />
        <Route path="/student/home" element={<StudentHome />} />
        <Route path="/student/profile" element={<StudentProfile />} />

        {/* --- KHU VỰC CỦA ADMIN/CTSV --- */}
        <Route path="/admin" element={<AdminLayout />}>
            <Route path="students" element={<StudentManager />} />
            <Route path="questions" element={<QuestionManager />} /> 
            <Route path="exams" element={<ExamManager />} />
            {/* Đặt Route báo cáo thống kê vào đây để dùng chung layout Admin */}
            <Route path="exams/:examId/report" element={<ReportDashboardWrapper />} />
            <Route path="proctor/:examId" element={<ProctorDashboard />} />
            <Route path="notifications" element={<NotificationManager />} />
            <Route path="proctoring" element={<ProctorDashboard />} />
            <Route path="dashboard" element={<ReportDashboard />} />
            {/* <Route path="settings" element={<SystemSettings />} /> */}
            <Route path="profile" element={<AdminProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;