import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut } from 'lucide-react';
import { storage } from '../data/storage';

export default function Header({ role }) {
  const navigate = useNavigate();
  const teacher = storage.getCurrentTeacher();

  const handleLogout = () => {
    if (role === 'teacher') {
      storage.logoutTeacher();
    } else {
      storage.logoutStudent();
    }
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="container">
        <Link to={role === 'teacher' ? '/teacher' : '/student/dashboard'} style={{ textDecoration: 'none', color: 'white' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GraduationCap size={32} />
            ExamPro
          </h1>
        </Link>
        <nav className="nav-links">
          {role === 'teacher' && (
            <>
              <Link to="/teacher">Examens</Link>
              <Link to="/teacher/establishments">Établissements</Link>
              <Link to="/teacher/classes">Classes</Link>
              <Link to="/teacher/scheduled-exams">Planification</Link>
              <Link to="/teacher/results">Résultats</Link>
              {teacher && (
                <span style={{ opacity: 0.8, fontSize: '14px' }}>
                  {teacher.firstName} {teacher.lastName}
                </span>
              )}
            </>
          )}
          {role === 'student' && (
            <>
              <Link to="/student">Examens disponibles</Link>
              <Link to="/student/results">Mes résultats</Link>
            </>
          )}
          <button 
            onClick={handleLogout}
            style={{ 
              background: 'rgba(255,255,255,0.2)', 
              border: 'none', 
              color: 'white', 
              padding: '6px 12px', 
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </nav>
      </div>
    </header>
  );
}
