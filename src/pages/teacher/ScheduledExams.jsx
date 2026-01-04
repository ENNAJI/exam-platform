import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, Trash2, Send, Eye } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function ScheduledExams() {
  const [scheduledExams, setScheduledExams] = useState([]);
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    setScheduledExams(storage.getScheduledExams());
    setExams(storage.getExams());
    setClasses(storage.getClasses());
  }, []);

  const getExam = (examId) => exams.find(e => e.id === examId);
  const getClass = (classId) => classes.find(c => c.id === classId);

  const getStatus = (schedule) => {
    const now = new Date();
    const start = new Date(schedule.startDateTime);
    const end = new Date(schedule.endDateTime);
    
    if (now < start) return { text: 'À venir', class: 'badge-info' };
    if (now >= start && now <= end) return { text: 'En cours', class: 'badge-success' };
    return { text: 'Terminé', class: 'badge-warning' };
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette planification ?')) {
      storage.deleteScheduledExam(id);
      setScheduledExams(storage.getScheduledExams());
    }
  };

  const sendReminders = (schedule) => {
    const exam = getExam(schedule.examId);
    const classData = getClass(schedule.classId);
    if (!classData) return;

    const students = storage.getStudentsByClass(schedule.classId);
    const startDateTime = new Date(schedule.startDateTime);

    students.forEach(student => {
      storage.saveEmailInvitation({
        studentId: student.id,
        email: student.email,
        examId: schedule.examId,
        type: 'exam_reminder'
      });
    });

    const emails = students.map(s => s.email).join(',');
    const subject = encodeURIComponent(`Rappel : Examen "${exam?.title}" bientôt`);
    const body = encodeURIComponent(
      `Bonjour,\n\n` +
      `Ceci est un rappel pour l'examen "${exam?.title}".\n\n` +
      `Date et heure : ${startDateTime.toLocaleDateString('fr-FR')} à ${startDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n\n` +
      `N'oubliez pas de vous connecter à temps !\n\n` +
      `Cordialement,\nL'équipe pédagogique`
    );
    window.open(`mailto:${emails}?subject=${subject}&body=${body}`);
  };

  return (
    <div>
      <Header role="teacher" />
      <div className="container">
        <h2 className="mb-4">Examens planifiés</h2>

        {scheduledExams.length === 0 ? (
          <div className="card text-center">
            <p>Aucun examen planifié.</p>
            <Link to="/teacher" className="btn btn-primary mt-4">
              Voir les examens
            </Link>
          </div>
        ) : (
          <div className="grid">
            {scheduledExams.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)).map((schedule) => {
              const exam = getExam(schedule.examId);
              const classData = getClass(schedule.classId);
              const status = getStatus(schedule);
              const startDate = new Date(schedule.startDateTime);
              const endDate = new Date(schedule.endDateTime);

              return (
                <div key={schedule.id} className="exam-card">
                  <div className="flex flex-between flex-center mb-4">
                    <span className={`badge ${status.class}`}>{status.text}</span>
                    <button onClick={() => handleDelete(schedule.id)} className="btn btn-danger" style={{ padding: '5px 10px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h3>{exam?.title || 'Examen supprimé'}</h3>
                  
                  {classData && (
                    <p className="flex flex-center gap-2" style={{ color: 'var(--gray-600)' }}>
                      <Users size={16} />
                      {classData.name}
                    </p>
                  )}

                  <div style={{ marginTop: '16px', padding: '12px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                    <p className="flex flex-center gap-2" style={{ marginBottom: '8px' }}>
                      <Calendar size={16} />
                      <strong>Début :</strong> {startDate.toLocaleDateString('fr-FR')} à {startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="flex flex-center gap-2">
                      <Clock size={16} />
                      <strong>Fin :</strong> {endDate.toLocaleDateString('fr-FR')} à {endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {exam && (
                      <Link to={`/teacher/results/${exam.id}`} className="btn btn-primary">
                        <Eye size={16} />
                        Résultats
                      </Link>
                    )}
                    {status.text === 'À venir' && (
                      <button onClick={() => sendReminders(schedule)} className="btn btn-secondary">
                        <Send size={16} />
                        Rappel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
