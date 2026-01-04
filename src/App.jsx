import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { initDemoData } from './data/storage';

import Home from './pages/Home';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import CreateExam from './pages/teacher/CreateExam';
import EditExam from './pages/teacher/EditExam';
import ExamResults from './pages/teacher/ExamResults';
import AllResults from './pages/teacher/AllResults';
import ClassesManager from './pages/teacher/ClassesManager';
import ClassDetail from './pages/teacher/ClassDetail';
import StudentsManager from './pages/teacher/StudentsManager';
import CoursesManager from './pages/teacher/CoursesManager';
import CourseDetail from './pages/teacher/CourseDetail';
import ScheduleExam from './pages/teacher/ScheduleExam';
import ScheduledExams from './pages/teacher/ScheduledExams';

import StudentLogin from './pages/student/StudentLogin';
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
        <Route path="/" element={<Home />} />
        
        {/* Routes Enseignant */}
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/teacher/create" element={<CreateExam />} />
        <Route path="/teacher/edit/:id" element={<EditExam />} />
        <Route path="/teacher/results" element={<AllResults />} />
        <Route path="/teacher/results/:id" element={<ExamResults />} />
        <Route path="/teacher/classes" element={<ClassesManager />} />
        <Route path="/teacher/class/:id" element={<ClassDetail />} />
        <Route path="/teacher/class/:classId/students" element={<StudentsManager />} />
        <Route path="/teacher/class/:classId/courses" element={<CoursesManager />} />
        <Route path="/teacher/course/:id" element={<CourseDetail />} />
        <Route path="/teacher/course/:courseId/create-exam" element={<CreateExam />} />
        <Route path="/teacher/schedule-exam/:examId" element={<ScheduleExam />} />
        <Route path="/teacher/scheduled-exams" element={<ScheduledExams />} />
        
        {/* Routes Étudiant */}
        <Route path="/login" element={<StudentLogin />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/dashboard" element={<StudentPortal />} />
        <Route path="/student/exam/:id" element={<TakeExam />} />
        <Route path="/student/take-exam/:scheduleId" element={<TakeScheduledExam />} />
        <Route path="/student/result/:id" element={<ExamResult />} />
        <Route path="/student/results" element={<StudentResults />} />
        <Route path="/student/course/:id" element={<StudentCourseView />} />
      </Routes>
    </Router>
  );
}

export default App
