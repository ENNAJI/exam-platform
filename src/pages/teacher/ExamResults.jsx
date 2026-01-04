import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Award } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function ExamResults() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const foundExam = storage.getExamById(id);
    setExam(foundExam);
    setResults(storage.getResultsByExam(id));
  }, [id]);

  if (!exam) {
    return (
      <div>
        <Header role="teacher" />
        <div className="container">
          <p>Examen non trouvé.</p>
        </div>
      </div>
    );
  }

  const averageScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0;

  return (
    <div>
      <Header role="teacher" />
      <div className="container">
        <Link to="/teacher" className="btn btn-secondary mb-4">
          <ArrowLeft size={18} />
          Retour
        </Link>

        <h2 className="mb-4">Résultats : {exam.title}</h2>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '30px' }}>
          <div className="card text-center">
            <h3 style={{ fontSize: '36px', color: 'var(--primary)' }}>{results.length}</h3>
            <p>Participations</p>
          </div>
          <div className="card text-center">
            <h3 style={{ fontSize: '36px', color: 'var(--secondary)' }}>{averageScore}%</h3>
            <p>Moyenne</p>
          </div>
          <div className="card text-center">
            <h3 style={{ fontSize: '36px', color: 'var(--warning)' }}>{exam.questions.length}</h3>
            <p>Questions</p>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="card text-center">
            <p>Aucun étudiant n'a encore passé cet examen.</p>
          </div>
        ) : (
          <div className="card">
            <h3 className="mb-4">Liste des résultats</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Étudiant</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Date</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Score</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Bonnes réponses</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                    <td style={{ padding: '12px' }}>
                      <div className="flex flex-center gap-2">
                        <User size={18} />
                        {result.studentName}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div className="flex flex-center gap-2">
                        <Calendar size={18} />
                        {new Date(result.submittedAt).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px' }}>
                      <span className={`badge ${result.score >= 50 ? 'badge-success' : 'badge-warning'}`}>
                        {result.score}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px' }}>
                      {result.correctAnswers} / {result.totalQuestions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
