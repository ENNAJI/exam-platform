import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Calendar, BookOpen } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function AllResults() {
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);

  useEffect(() => {
    setResults(storage.getResults());
    setExams(storage.getExams());
  }, []);

  const getExamTitle = (examId) => {
    const exam = exams.find(e => e.id === examId);
    return exam ? exam.title : 'Examen inconnu';
  };

  return (
    <div>
      <Header role="teacher" />
      <div className="container">
        <h2 className="mb-4">Tous les résultats</h2>

        {results.length === 0 ? (
          <div className="card text-center">
            <p>Aucun résultat disponible.</p>
          </div>
        ) : (
          <div className="card">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Étudiant</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Examen</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Date</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {results.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)).map((result) => (
                  <tr key={result.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                    <td style={{ padding: '12px' }}>
                      <div className="flex flex-center gap-2">
                        <User size={18} />
                        {result.studentName}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div className="flex flex-center gap-2">
                        <BookOpen size={18} />
                        {getExamTitle(result.examId)}
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
