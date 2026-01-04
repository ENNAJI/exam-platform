import { useState, useEffect } from 'react';
import { Calendar, BookOpen, Award } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function StudentResults() {
  const [studentName, setStudentName] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [exams, setExams] = useState([]);

  useEffect(() => {
    setExams(storage.getExams());
  }, []);

  const getExamTitle = (examId) => {
    const exam = exams.find(e => e.id === examId);
    return exam ? exam.title : 'Examen inconnu';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (studentName.trim()) {
      setResults(storage.getResultsByStudent(studentName));
      setSearched(true);
    }
  };

  return (
    <div>
      <Header role="student" />
      <div className="container">
        <h2 className="mb-4">Mes résultats</h2>

        <div className="card" style={{ maxWidth: '500px' }}>
          <form onSubmit={handleSearch}>
            <div className="input-group">
              <label>Entrez votre nom pour voir vos résultats</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Votre nom..."
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Rechercher
            </button>
          </form>
        </div>

        {searched && (
          <div className="mt-4">
            {results.length === 0 ? (
              <div className="card text-center">
                <p>Aucun résultat trouvé pour "{studentName}".</p>
              </div>
            ) : (
              <div className="card">
                <h3 className="mb-4">Résultats pour {studentName}</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Examen</th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Date</th>
                      <th style={{ textAlign: 'center', padding: '12px' }}>Score</th>
                      <th style={{ textAlign: 'center', padding: '12px' }}>Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr key={result.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
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
                            <Award size={12} style={{ display: 'inline', marginRight: '4px' }} />
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
        )}
      </div>
    </div>
  );
}
