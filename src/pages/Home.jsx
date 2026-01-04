import { Link } from 'react-router-dom';
import { GraduationCap, Users, BookOpen, LogIn } from 'lucide-react';

export default function Home() {
  return (
    <div>
      <header className="header">
        <div className="container">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GraduationCap size={32} />
            ExamPro
          </h1>
          <Link to="/login" className="btn" style={{ background: 'white', color: 'var(--primary)' }}>
            <LogIn size={18} />
            Connexion Étudiant
          </Link>
        </div>
      </header>

      <div className="container">
        <div className="home-hero">
          <h2>Plateforme d'Examens à Distance</h2>
          <p>Créez, gérez et passez vos examens en ligne en toute simplicité</p>
        </div>

        <div className="role-cards">
          <div className="role-card">
            <div className="role-card-icon">
              <Users size={40} color="#4f46e5" />
            </div>
            <h3>Espace Enseignant</h3>
            <p>Créez des classes, gérez vos étudiants, ajoutez des cours et des ressources, planifiez vos examens.</p>
            <Link to="/teacher" className="btn btn-primary">
              Accéder
            </Link>
          </div>

          <div className="role-card">
            <div className="role-card-icon">
              <BookOpen size={40} color="#10b981" />
            </div>
            <h3>Espace Étudiant</h3>
            <p>Accédez à vos cours, passez vos examens planifiés et consultez vos résultats.</p>
            <div className="flex gap-2" style={{ justifyContent: 'center' }}>
              <Link to="/login" className="btn btn-success">
                <LogIn size={18} />
                Se connecter
              </Link>
              <Link to="/student" className="btn btn-secondary">
                Mode démo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
