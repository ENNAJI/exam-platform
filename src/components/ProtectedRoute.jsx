import { Navigate } from 'react-router-dom';
import { storage } from '../data/storage';

export function TeacherRoute({ children }) {
  const teacher = storage.getCurrentTeacher();
  
  if (!teacher) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export function StudentRoute({ children }) {
  const student = storage.getCurrentStudent();
  
  if (!student) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}
