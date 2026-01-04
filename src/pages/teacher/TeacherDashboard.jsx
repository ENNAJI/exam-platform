import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Clock, HelpCircle } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function TeacherDashboard() {
  const [exams, setExams] = useState([]);

  useEffect(() => {
    setExams(storage.getExams());
  }, []);

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet examen ?')) {
      const updated = storage.deleteExam(id);
      setExams(updated);
    }
  };

  const toggleActive = (id) => {
    const exam = storage.getExamById(id);
    const updated = storage.updateExam(id, { isActive: !exam.isActive });
    setExams(updated);
  };

  return (
    <div>
      <Header role="teacher" />
      <div className="container">
        <div className="flex flex-between flex-center mb-4">
          <h2>Mes Examens</h2>
          <Link to="/teacher/create" className="btn btn-primary">
            <Plus size={18} />
            Créer un examen
          </Link>
        </div>

        {exams.length === 0 ? (
          <div className="card text-center">
            <p>Aucun examen créé. Commencez par créer votre premier examen !</p>
          </div>
        ) : (
          <div className="grid">
            {exams.map((exam) => (
              <div key={exam.id} className="exam-card">
                <div className="flex flex-between flex-center mb-4">
                  <span className={`badge ${exam.isActive ? 'badge-success' : 'badge-warning'}`}>
                    {exam.isActive ? 'Actif' : 'Inactif'}
                  </span>
                  <button 
                    onClick={() => toggleActive(exam.id)}
                    className="btn btn-secondary"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                  >
                    {exam.isActive ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
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
                <div className="flex gap-2">
                  <Link to={`/teacher/edit/${exam.id}`} className="btn btn-secondary">
                    <Edit size={16} />
                  </Link>
                  <Link to={`/teacher/results/${exam.id}`} className="btn btn-primary">
                    <Eye size={16} />
                  </Link>
                  <button onClick={() => handleDelete(exam.id)} className="btn btn-danger">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
