import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Send, Users } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function ScheduleExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    instructions: ''
  });

  useEffect(() => {
    const foundExam = storage.getExamById(examId);
    if (foundExam) {
      setExam(foundExam);
      if (foundExam.classId) {
        const foundClass = storage.getClassById(foundExam.classId);
        setClassData(foundClass);
        setStudents(storage.getStudentsByClass(foundExam.classId));
      }
    }
  }, [examId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (endDateTime <= startDateTime) {
      alert('La date de fin doit être après la date de début.');
      return;
    }

    storage.scheduleExam({
      examId: exam.id,
      classId: exam.classId,
      courseId: exam.courseId,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      instructions: formData.instructions
    });

    alert('Examen planifié avec succès !');
    navigate('/teacher/scheduled-exams');
  };

  const sendInvitations = () => {
    if (students.length === 0) {
      alert('Aucun étudiant dans cette classe.');
      return;
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    
    students.forEach(student => {
      storage.saveEmailInvitation({
        studentId: student.id,
        email: student.email,
        examId: exam.id,
        type: 'exam_invitation'
      });
    });

    const emails = students.map(s => s.email).join(',');
    const subject = encodeURIComponent(`Invitation à l'examen : ${exam.title}`);
    const body = encodeURIComponent(
      `Bonjour,\n\n` +
      `Vous êtes invité(e) à passer l'examen "${exam.title}".\n\n` +
      `Date et heure : ${startDateTime.toLocaleDateString('fr-FR')} à ${startDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n` +
      `Durée : ${exam.duration} minutes\n\n` +
      `${formData.instructions ? `Instructions : ${formData.instructions}\n\n` : ''}` +
      `Connectez-vous à la plateforme avec votre lien personnel pour passer l'examen.\n\n` +
      `Cordialement,\nL'équipe pédagogique`
    );
    window.open(`mailto:${emails}?subject=${subject}&body=${body}`);
    
    alert(`Invitations préparées pour ${students.length} étudiants.`);
  };

  if (!exam) {
    return (
      <div>
        <Header role="teacher" />
        <div className="container"><p>Examen non trouvé.</p></div>
      </div>
    );
  }

  return (
    <div>
      <Header role="teacher" />
      <div className="container">
        <Link to="/teacher" className="btn btn-secondary mb-4">
          <ArrowLeft size={18} />
          Retour
        </Link>

        <h2 className="mb-4">Planifier l'examen</h2>

        <div className="card mb-4">
          <h3>{exam.title}</h3>
          <p>{exam.description}</p>
          <div className="flex gap-2 mt-4">
            <span className="badge badge-info">
              <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
              {exam.duration} minutes
            </span>
            <span className="badge badge-info">
              {exam.questions?.length || 0} questions
            </span>
            {classData && (
              <span className="badge badge-success">
                <Users size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {students.length} étudiants ({classData.name})
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card mb-4">
            <h3 className="mb-4">
              <Calendar size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Période de l'examen
            </h3>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="input-group">
                <label>Date de début</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Heure de début</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Date de fin</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Heure de fin</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Instructions pour les étudiants</label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="Instructions spéciales pour cet examen..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">
              <Calendar size={18} />
              Planifier l'examen
            </button>
            {students.length > 0 && formData.startDate && formData.startTime && (
              <button type="button" onClick={sendInvitations} className="btn btn-success">
                <Send size={18} />
                Envoyer les invitations ({students.length})
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
