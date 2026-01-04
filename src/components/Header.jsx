import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function Header({ role }) {
  return (
    <header className="header">
      <div className="container">
        <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GraduationCap size={32} />
            ExamPro
          </h1>
        </Link>
        <nav className="nav-links">
          {role === 'teacher' && (
            <>
              <Link to="/teacher">Examens</Link>
              <Link to="/teacher/classes">Classes</Link>
              <Link to="/teacher/scheduled-exams">Planification</Link>
              <Link to="/teacher/results">Résultats</Link>
            </>
          )}
          {role === 'student' && (
            <>
              <Link to="/student">Examens disponibles</Link>
              <Link to="/student/results">Mes résultats</Link>
            </>
          )}
          <Link to="/">Accueil</Link>
        </nav>
      </div>
    </header>
  );
}
