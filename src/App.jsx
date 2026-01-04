import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { initDemoData } from './data/storage';
import { TeacherRoute, StudentRoute } from './components/ProtectedRoute';

import Login from './pages/Login';
import RegisterTeacher from './pages/RegisterTeacher';

import TeacherDashboard from './pages/teacher/TeacherDashboard';
import CreateExam from './pages/teacher/CreateExam';
import EditExam from './pages/teacher/EditExam';
import ExamResults from './pages/teacher/ExamResults';
import AllResults from './pages/teacher/AllResults';
import EstablishmentsManager from './pages/teacher/EstablishmentsManager';
import EstablishmentDetail from './pages/teacher/EstablishmentDetail';
import ClassesManager from './pages/teacher/ClassesManager';
import ClassDetail from './pages/teacher/ClassDetail';
import StudentsManager from './pages/teacher/StudentsManager';
import CoursesManager from './pages/teacher/CoursesManager';
import CourseDetail from './pages/teacher/CourseDetail';
import ScheduleExam from './pages/teacher/ScheduleExam';
import ScheduledExams from './pages/teacher/ScheduledExams';

import StudentPortal from './pages/student/StudentPortal';
import StudentDashboard from './pages/student/StudentDashboard';
import TakeExam from './pages/student/TakeExam';
import TakeScheduledExam from './pages/student/TakeScheduledExam';
import ExamResult from './pages/student/ExamResult';
import StudentResults from './pages/student/StudentResults';
import StudentCourseView from './pages/student/StudentCourseView';

function App() {
  useEffect(() => {
    initDemoData();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Page de connexion comme page d'accueil */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register-teacher" element={<RegisterTeacher />} />
        
        {/* Routes Enseignant (protégées) */}
        <Route path="/teacher" element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />
        <Route path="/teacher/create" element={<TeacherRoute><CreateExam /></TeacherRoute>} />
        <Route path="/teacher/edit/:id" element={<TeacherRoute><EditExam /></TeacherRoute>} />
        <Route path="/teacher/results" element={<TeacherRoute><AllResults /></TeacherRoute>} />
        <Route path="/teacher/results/:id" element={<TeacherRoute><ExamResults /></TeacherRoute>} />
        <Route path="/teacher/establishments" element={<TeacherRoute><EstablishmentsManager /></TeacherRoute>} />
        <Route path="/teacher/establishment/:id" element={<TeacherRoute><EstablishmentDetail /></TeacherRoute>} />
        <Route path="/teacher/classes" element={<TeacherRoute><ClassesManager /></TeacherRoute>} />
        <Route path="/teacher/class/:id" element={<TeacherRoute><ClassDetail /></TeacherRoute>} />
        <Route path="/teacher/class/:classId/students" element={<TeacherRoute><StudentsManager /></TeacherRoute>} />
        <Route path="/teacher/class/:classId/courses" element={<TeacherRoute><CoursesManager /></TeacherRoute>} />
        <Route path="/teacher/course/:id" element={<TeacherRoute><CourseDetail /></TeacherRoute>} />
        <Route path="/teacher/course/:courseId/create-exam" element={<TeacherRoute><CreateExam /></TeacherRoute>} />
        <Route path="/teacher/schedule-exam/:examId" element={<TeacherRoute><ScheduleExam /></TeacherRoute>} />
        <Route path="/teacher/scheduled-exams" element={<TeacherRoute><ScheduledExams /></TeacherRoute>} />
        
        {/* Routes Étudiant (protégées) */}
        <Route path="/student" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
        <Route path="/student/dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
        <Route path="/student/exam/:id" element={<TakeExam />} />
        <Route path="/student/take-exam/:scheduleId" element={<StudentRoute><TakeScheduledExam /></StudentRoute>} />
        <Route path="/student/result/:id" element={<ExamResult />} />
        <Route path="/student/results" element={<StudentResults />} />
        <Route path="/student/course/:id" element={<StudentRoute><StudentCourseView /></StudentRoute>} />
      </Routes>
    </Router>
  );
}

export default App
