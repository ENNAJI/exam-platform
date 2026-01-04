import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Clock, Calendar, LogOut, User, Play } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function StudentPortal() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [classData, setClassData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [scheduledExams, setScheduledExams] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const currentStudent = storage.getCurrentStudent();
    if (!currentStudent) {
      navigate('/login');
      return;
    }
    // Rafraîchir les données de l'étudiant depuis le storage
    const refreshedStudent = storage.getStudentById(currentStudent.id) || currentStudent;
    setStudent(refreshedStudent);
    
    const foundClass = storage.getClassById(refreshedStudent.classId);
    setClassData(foundClass);
    
    if (foundClass) {
      setCourses(storage.getCoursesByClass(foundClass.id));
    }
    
    // Récupérer les examens planifiés pour cet étudiant spécifiquement
    const allScheduled = storage.getScheduledExams();
    const studentScheduled = allScheduled.filter(s => {
      // Vérifier si l'étudiant est dans la liste des étudiants invités
      if (s.studentIds && s.studentIds.length > 0) {
        return s.studentIds.includes(refreshedStudent.id);
      }
      // Sinon, vérifier par classe
      return s.classId === refreshedStudent.classId;
    });
    setScheduledExams(studentScheduled);
    
    // Récupérer les résultats de l'étudiant
    setResults(storage.getResultsByStudent(refreshedStudent.id));
  }, [navigate]);

  const handleLogout = () => {
    storage.logoutStudent();
    navigate('/');
  };

  const getExamStatus = (schedule) => {
    const now = new Date();
    const start = new Date(schedule.startDateTime);
    const end = new Date(schedule.endDateTime);
    
    // Vérifier si l'étudiant a déjà passé cet examen
    const hasResult = results.some(r => r.examId === schedule.examId);
    if (hasResult) return { text: 'Terminé', class: 'badge-success', canTake: false };
    
    if (now < start) return { text: 'À venir', class: 'badge-info', canTake: false };
    if (now >= start && now <= end) return { text: 'Disponible', class: 'badge-warning', canTake: true };
    return { text: 'Expiré', class: 'badge-secondary', canTake: false };
  };

  if (!student) return null;

  return (
    <div>
      <header className="header">
        <div className="container">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={32} />
            Espace Étudiant
          </h1>
          <div className="flex flex-center gap-4">
            <span className="flex flex-center gap-2">
              <User size={18} />
              {student.firstName} {student.lastName}
            </span>
            <button onClick={handleLogout} className="btn btn-secondary">
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        {classData && (
          <div className="card mb-4">
            <h2>Bienvenue, {student.firstName} !</h2>
            <p>Classe : <strong>{classData.name}</strong> - {classData.year}</p>
          </div>
        )}

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Examens à venir */}
          <div className="card">
            <h3 className="flex flex-center gap-2 mb-4">
              <Calendar size={24} color="var(--warning)" />
              Examens
            </h3>
            
            {scheduledExams.length === 0 ? (
              <p style={{ color: 'var(--gray-600)' }}>Aucun examen planifié.</p>
            ) : (
              <div>
                {scheduledExams.map(schedule => {
                  const exam = storage.getExamById(schedule.examId);
                  const status = getExamStatus(schedule);
                  const startDate = new Date(schedule.startDateTime);

                  return (
                    <div key={schedule.id} style={{
                      padding: '12px',
                      background: 'var(--gray-50)',
                      borderRadius: '8px',
                      marginBottom: '8px'
                    }}>
                      <div className="flex flex-between flex-center">
                        <div>
                          <strong>{exam?.title || 'Examen'}</strong>
                          <p style={{ fontSize: '12px', color: 'var(--gray-600)', margin: '4px 0 0' }}>
                            {startDate.toLocaleDateString('fr-FR')} à {startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex flex-center gap-2">
                          <span className={`badge ${status.class}`}>{status.text}</span>
                          {status.canTake && (
                            <Link to={`/student/take-exam/${schedule.id}`} className="btn btn-primary" style={{ padding: '5px 10px' }}>
                              <Play size={14} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mes cours */}
          <div className="card">
            <h3 className="flex flex-center gap-2 mb-4">
              <BookOpen size={24} color="var(--primary)" />
              Mes cours
            </h3>
            
            {courses.length === 0 ? (
              <p style={{ color: 'var(--gray-600)' }}>Aucun cours disponible.</p>
            ) : (
              <div>
                {courses.map(course => (
                  <Link 
                    key={course.id} 
                    to={`/student/course/${course.id}`}
                    style={{
                      display: 'block',
                      padding: '12px',
                      background: 'var(--gray-50)',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'background 0.2s'
                    }}
                  >
                    <strong style={{ color: 'var(--primary)' }}>{course.title}</strong>
                    <p style={{ fontSize: '12px', color: 'var(--gray-600)', margin: '4px 0 0' }}>
                      {course.description?.substring(0, 80)}...
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mes résultats */}
        <div className="card mt-4">
          <h3 className="flex flex-center gap-2 mb-4">
            <FileText size={24} color="var(--secondary)" />
            Mes résultats
          </h3>
          
          {results.length === 0 ? (
            <p style={{ color: 'var(--gray-600)' }}>Aucun résultat disponible.</p>
          ) : (
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
                {results.map(result => {
                  const exam = storage.getExamById(result.examId);
                  return (
                    <tr key={result.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                      <td style={{ padding: '12px' }}>{exam?.title || 'Examen'}</td>
                      <td style={{ padding: '12px' }}>{new Date(result.submittedAt).toLocaleDateString('fr-FR')}</td>
                      <td style={{ textAlign: 'center', padding: '12px' }}>
                        <span className={`badge ${result.score >= 50 ? 'badge-success' : 'badge-warning'}`}>
                          {result.score}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px' }}>
                        {result.correctAnswers} / {result.totalQuestions}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
