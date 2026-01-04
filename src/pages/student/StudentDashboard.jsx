import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, HelpCircle, Play } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function StudentDashboard() {
  const [exams, setExams] = useState([]);

  useEffect(() => {
    const allExams = storage.getExams();
    setExams(allExams.filter(e => e.isActive));
  }, []);

  return (
    <div>
      <Header role="student" />
      <div className="container">
        <h2 className="mb-4">Examens disponibles</h2>

        {exams.length === 0 ? (
          <div className="card text-center">
            <p>Aucun examen disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid">
            {exams.map((exam) => (
              <div key={exam.id} className="exam-card">
                <span className="badge badge-success mb-4">Disponible</span>
                <h3>{exam.title}</h3>
                <p>{exam.description}</p>
                <div className="flex gap-2 mb-4">
                  <span className="badge badge-info">
                    <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {exam.duration} min
                  </span>
                  <span className="badge badge-info">
                    <HelpCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {exam.questions?.length || 0} questions
                  </span>
                </div>
                <Link to={`/student/exam/${exam.id}`} className="btn btn-primary">
                  <Play size={18} />
                  Commencer l'examen
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
