import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Send, Users, Check, Mail, Copy, Eye } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function ScheduleExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [classData, setClassData] = useState(null);
  const [course, setCourse] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    instructions: ''
  });
  const [invitationsSent, setInvitationsSent] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  useEffect(() => {
    const foundExam = storage.getExamById(examId);
    setClasses(storage.getClasses());
    
    if (foundExam) {
      setExam(foundExam);
      
      // Récupérer le cours associé
      if (foundExam.courseId) {
        const foundCourse = storage.getCourseById(foundExam.courseId);
        setCourse(foundCourse);
        if (foundCourse?.classId) {
          setSelectedClassId(foundCourse.classId);
          const foundClass = storage.getClassById(foundCourse.classId);
          setClassData(foundClass);
          const classStudents = storage.getStudentsByClass(foundCourse.classId);
          setAllStudents(classStudents);
          setSelectedStudents(classStudents.map(s => s.id));
        }
      } else if (foundExam.classId) {
        setSelectedClassId(foundExam.classId);
        const foundClass = storage.getClassById(foundExam.classId);
        setClassData(foundClass);
        const classStudents = storage.getStudentsByClass(foundExam.classId);
        setAllStudents(classStudents);
        setSelectedStudents(classStudents.map(s => s.id));
      }
    }
  }, [examId]);

  const handleClassChange = (classId) => {
    setSelectedClassId(classId);
    if (classId) {
      const foundClass = storage.getClassById(classId);
      setClassData(foundClass);
      const classStudents = storage.getStudentsByClass(classId);
      setAllStudents(classStudents);
      setSelectedStudents(classStudents.map(s => s.id));
    } else {
      setClassData(null);
      setAllStudents([]);
      setSelectedStudents([]);
    }
  };

  const toggleStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const selectAllStudents = () => {
    setSelectedStudents(allStudents.map(s => s.id));
  };

  const deselectAllStudents = () => {
    setSelectedStudents([]);
  };

  const generatePassword = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedStudents.length === 0) {
      alert('Veuillez sélectionner au moins un étudiant.');
      return;
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (endDateTime <= startDateTime) {
      alert('La date de fin doit être après la date de début.');
      return;
    }

    // Générer les identifiants pour chaque étudiant sélectionné
    const studentCredentials = [];
    selectedStudents.forEach(studentId => {
      const student = allStudents.find(s => s.id === studentId);
      if (student) {
        const password = generatePassword();
        // Mettre à jour l'étudiant avec le mot de passe pour cet examen
        const examAccess = {
          examId: exam.id,
          password: password,
          grantedAt: new Date().toISOString()
        };
        
        // Récupérer les accès existants ou créer un nouveau tableau
        const existingAccesses = student.examAccesses || [];
        existingAccesses.push(examAccess);
        storage.updateStudent(studentId, { examAccesses: existingAccesses, password: password });
        
        studentCredentials.push({
          student,
          password,
          email: student.email
        });
      }
    });

    storage.scheduleExam({
      examId: exam.id,
      classId: selectedClassId,
      courseId: exam.courseId,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      instructions: formData.instructions,
      studentIds: selectedStudents,
      studentCredentials: studentCredentials.map(sc => ({ studentId: sc.student.id, password: sc.password }))
    });

    setInvitationsSent(false);
    alert('Examen planifié avec succès ! Vous pouvez maintenant envoyer les invitations.');
  };

  const sendInvitations = () => {
    if (selectedStudents.length === 0) {
      alert('Aucun étudiant sélectionné.');
      return;
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const selectedStudentsList = allStudents.filter(s => selectedStudents.includes(s.id));
    
    // Préparer les emails individuels avec les identifiants
    let emailContent = '';
    selectedStudentsList.forEach(student => {
      const password = student.password || student.token;
      
      storage.saveEmailInvitation({
        studentId: student.id,
        email: student.email,
        examId: exam.id,
        type: 'exam_invitation',
        password: password
      });

      emailContent += `\n--- ${student.firstName} ${student.lastName} (${student.email}) ---\n`;
      emailContent += `Login: ${student.email}\n`;
      emailContent += `Mot de passe: ${password}\n`;
    });

    const platformUrl = window.location.origin;
    const emails = selectedStudentsList.map(s => s.email).join(',');
    const subject = encodeURIComponent(`Invitation à l'examen : ${exam.title}`);
    const body = encodeURIComponent(
      `Bonjour,\n\n` +
      `Vous êtes invité(e) à passer l'examen "${exam.title}".\n\n` +
      `📅 Date : ${startDateTime.toLocaleDateString('fr-FR')}\n` +
      `🕐 Heure : ${startDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n` +
      `⏱️ Durée : ${exam.duration} minutes\n\n` +
      `🔗 Plateforme : ${platformUrl}\n\n` +
      `${formData.instructions ? `📋 Instructions : ${formData.instructions}\n\n` : ''}` +
      `Vos identifiants de connexion :\n` +
      `${emailContent}\n\n` +
      `⚠️ L'examen ne sera accessible qu'aux dates et heures indiquées.\n` +
      `Les supports de cours et fiches de révision sont accessibles dès maintenant.\n\n` +
      `Cordialement,\nL'équipe pédagogique`
    );
    window.open(`mailto:${emails}?subject=${subject}&body=${body}`);
    
    setInvitationsSent(true);
    alert(`Invitations préparées pour ${selectedStudentsList.length} étudiants.`);
  };

  const copyCredentials = () => {
    const selectedStudentsList = allStudents.filter(s => selectedStudents.includes(s.id));
    let text = `Identifiants pour l'examen "${exam.title}"\n\n`;
    selectedStudentsList.forEach(student => {
      text += `${student.firstName} ${student.lastName}\n`;
      text += `Email: ${student.email}\n`;
      text += `Mot de passe: ${student.password || student.token}\n\n`;
    });
    navigator.clipboard.writeText(text);
    alert('Identifiants copiés dans le presse-papier !');
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
            {exam.examType && (
              <span className={`badge ${exam.examType === 'control' ? 'badge-warning' : 'badge-success'}`}>
                {exam.examType === 'control' ? 'Contrôle' : 'Examen'}
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Sélection de la classe */}
          <div className="card mb-4">
            <h3 className="mb-4">
              <Users size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Sélection des étudiants
            </h3>

            <div className="input-group">
              <label>Classe</label>
              <select value={selectedClassId} onChange={(e) => handleClassChange(e.target.value)} required>
                <option value="">-- Sélectionner une classe --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
              </select>
            </div>

            {allStudents.length > 0 && (
              <>
                <div className="flex flex-between flex-center mb-2">
                  <label style={{ fontWeight: '600' }}>Étudiants ({selectedStudents.length}/{allStudents.length} sélectionnés)</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={selectAllStudents} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                      Tout sélectionner
                    </button>
                    <button type="button" onClick={deselectAllStudents} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                      Tout désélectionner
                    </button>
                  </div>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '8px' }}>
                  {allStudents.map(student => (
                    <div 
                      key={student.id} 
                      onClick={() => toggleStudent(student.id)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        padding: '8px 12px',
                        background: selectedStudents.includes(student.id) ? 'var(--gray-100)' : 'white',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginBottom: '4px'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedStudents.includes(student.id)} 
                        onChange={() => toggleStudent(student.id)}
                      />
                      <div style={{ flex: 1 }}>
                        <strong>{student.firstName} {student.lastName}</strong>
                        {student.code && <span style={{ color: 'var(--gray-600)', marginLeft: '8px' }}>({student.code})</span>}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--gray-600)' }}>{student.email}</span>
                      {selectedStudents.includes(student.id) && <Check size={16} color="var(--secondary)" />}
                    </div>
                  ))}
                </div>
              </>
            )}

            {selectedClassId && allStudents.length === 0 && (
              <p style={{ color: 'var(--warning)', padding: '12px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                Aucun étudiant dans cette classe. Ajoutez des étudiants avant de planifier l'examen.
              </p>
            )}
          </div>

          {/* Période de l'examen */}
          <div className="card mb-4">
            <h3 className="mb-4">
              <Calendar size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Période de l'examen
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: '16px', background: 'var(--gray-50)', padding: '10px', borderRadius: '6px' }}>
              ⚠️ L'examen ne sera accessible aux étudiants que pendant cette période. Les supports de cours et fiches de révision restent accessibles en permanence.
            </p>

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

          {/* Boutons d'action */}
          <div className="flex gap-2 mb-4">
            <button type="submit" className="btn btn-primary" disabled={selectedStudents.length === 0}>
              <Calendar size={18} />
              Planifier l'examen ({selectedStudents.length} étudiants)
            </button>
          </div>
        </form>

        {/* Section Invitations */}
        {selectedStudents.length > 0 && formData.startDate && formData.startTime && (
          <div className="card mb-4">
            <h3 className="mb-4">
              <Mail size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Invitations et identifiants
            </h3>

            <div className="flex gap-2 mb-4">
              <button type="button" onClick={sendInvitations} className="btn btn-success">
                <Send size={18} />
                Envoyer les invitations par email ({selectedStudents.length})
              </button>
              <button type="button" onClick={copyCredentials} className="btn btn-secondary">
                <Copy size={18} />
                Copier les identifiants
              </button>
              <button type="button" onClick={() => setShowCredentials(!showCredentials)} className="btn btn-secondary">
                <Eye size={18} />
                {showCredentials ? 'Masquer' : 'Afficher'} les identifiants
              </button>
            </div>

            {invitationsSent && (
              <p style={{ color: 'var(--secondary)', marginBottom: '12px' }}>
                ✅ Invitations envoyées avec succès !
              </p>
            )}

            {showCredentials && (
              <div style={{ background: 'var(--gray-50)', borderRadius: '8px', padding: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                <table style={{ width: '100%', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Étudiant</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Email (Login)</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Mot de passe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allStudents.filter(s => selectedStudents.includes(s.id)).map(student => (
                      <tr key={student.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                        <td style={{ padding: '8px' }}>{student.firstName} {student.lastName}</td>
                        <td style={{ padding: '8px' }}>{student.email}</td>
                        <td style={{ padding: '8px', fontFamily: 'monospace' }}>{student.password || student.token}</td>
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
