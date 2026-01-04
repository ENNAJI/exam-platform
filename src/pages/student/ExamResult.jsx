import { useLocation, Link } from 'react-router-dom';
import { Award, Home, RotateCcw } from 'lucide-react';
import Header from '../../components/Header';

export default function ExamResult() {
  const location = useLocation();
  const { score, correctAnswers, totalQuestions } = location.state || { score: 0, correctAnswers: 0, totalQuestions: 0 };

  const getMessage = () => {
    if (score >= 80) return { text: 'Excellent travail !', color: 'var(--secondary)' };
    if (score >= 60) return { text: 'Bon travail !', color: 'var(--primary)' };
    if (score >= 50) return { text: 'Passable, continuez vos efforts !', color: 'var(--warning)' };
    return { text: 'Vous devez réviser davantage.', color: 'var(--danger)' };
  };

  const message = getMessage();

  return (
    <div>
      <Header role="student" />
      <div className="container">
        <div className="card result-card">
          <div style={{ marginBottom: '20px' }}>
            <Award size={80} color={message.color} />
          </div>
          
          <div className="result-score" style={{ color: message.color }}>
            {score}%
          </div>
          
          <div className="result-message">
            {message.text}
          </div>

          <p style={{ fontSize: '18px', marginBottom: '30px' }}>
            Vous avez obtenu <strong>{correctAnswers}</strong> bonnes réponses sur <strong>{totalQuestions}</strong> questions.
          </p>

          <div className="flex gap-4" style={{ justifyContent: 'center' }}>
            <Link to="/student" className="btn btn-primary">
              <RotateCcw size={18} />
              Passer un autre examen
            </Link>
            <Link to="/" className="btn btn-secondary">
              <Home size={18} />
              Accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
