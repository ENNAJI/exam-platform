import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Mail, Upload, Send, Copy, Check } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function StudentsManager() {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '' });
  const [bulkData, setBulkData] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);

  useEffect(() => {
    setClassData(storage.getClassById(classId));
    setStudents(storage.getStudentsByClass(classId));
  }, [classId]);

  const handleAddStudent = (e) => {
    e.preventDefault();
    storage.addStudent({ ...formData, classId });
    setStudents(storage.getStudentsByClass(classId));
    setShowAddModal(false);
    setFormData({ firstName: '', lastName: '', email: '' });
  };

  const handleBulkAdd = (e) => {
    e.preventDefault();
    const lines = bulkData.split('\n').filter(line => line.trim());
    const newStudents = lines.map(line => {
      const parts = line.split(/[,;\t]/).map(p => p.trim());
      return {
        firstName: parts[0] || '',
        lastName: parts[1] || '',
        email: parts[2] || ''
      };
    }).filter(s => s.firstName && s.lastName && s.email);
    
    if (newStudents.length > 0) {
      storage.addStudentsBulk(newStudents, classId);
      setStudents(storage.getStudentsByClass(classId));
    }
    setShowBulkModal(false);
    setBulkData('');
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ?')) {
      storage.deleteStudent(id);
      setStudents(storage.getStudentsByClass(classId));
    }
  };

  const copyToken = (token) => {
    navigator.clipboard.writeText(`${window.location.origin}/login?token=${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const sendInvitationEmail = (student) => {
    const loginUrl = `${window.location.origin}/login?token=${student.token}`;
    const subject = encodeURIComponent(`Invitation à la plateforme d'examens - ${classData?.name}`);
    const body = encodeURIComponent(
      `Bonjour ${student.firstName} ${student.lastName},\n\n` +
      `Vous êtes invité(e) à rejoindre la plateforme d'examens en ligne.\n\n` +
      `Cliquez sur le lien suivant pour vous connecter :\n${loginUrl}\n\n` +
      `Cordialement,\nL'équipe pédagogique`
    );
    window.open(`mailto:${student.email}?subject=${subject}&body=${body}`);
    
    storage.saveEmailInvitation({
      studentId: student.id,
      email: student.email,
      type: 'authentication'
    });
  };

  const sendAllInvitations = () => {
    students.forEach(student => {
      storage.saveEmailInvitation({
        studentId: student.id,
        email: student.email,
        type: 'authentication'
      });
    });
    
    const emails = students.map(s => s.email).join(',');
    const subject = encodeURIComponent(`Invitation à la plateforme d'examens - ${classData?.name}`);
    const body = encodeURIComponent(
      `Bonjour,\n\n` +
      `Vous êtes invité(e) à rejoindre la plateforme d'examens en ligne.\n\n` +
      `Veuillez utiliser votre lien personnel d'authentification qui vous a été envoyé.\n\n` +
      `Cordialement,\nL'équipe pédagogique`
    );
    window.open(`mailto:${emails}?subject=${subject}&body=${body}`);
    alert('Les invitations ont été préparées. Vérifiez votre client email.');
  };

  if (!classData) {
    return (
      <div>
        <Header role="teacher" />
        <div className="container"><p>Classe non trouvée.</p></div>
      </div>
    );
  }

  return (
    <div>
      <Header role="teacher" />
      <div className="container">
        <Link to={`/teacher/class/${classId}`} className="btn btn-secondary mb-4">
          <ArrowLeft size={18} />
          Retour à la classe
        </Link>

        <div className="flex flex-between flex-center mb-4">
          <h2>Étudiants - {classData.name}</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowBulkModal(true)} className="btn btn-secondary">
              <Upload size={18} />
              Import en masse
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              <Plus size={18} />
              Ajouter un étudiant
            </button>
          </div>
        </div>

        {students.length > 0 && (
          <div className="card mb-4">
            <button onClick={sendAllInvitations} className="btn btn-success">
              <Send size={18} />
              Envoyer les invitations à tous ({students.length} étudiants)
            </button>
          </div>
        )}

        {students.length === 0 ? (
          <div className="card text-center">
            <p>Aucun étudiant dans cette classe.</p>
          </div>
        ) : (
          <div className="card">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Nom</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Prénom</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Email</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Lien d'accès</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                    <td style={{ padding: '12px' }}>{student.lastName}</td>
                    <td style={{ padding: '12px' }}>{student.firstName}</td>
                    <td style={{ padding: '12px' }}>{student.email}</td>
                    <td style={{ textAlign: 'center', padding: '12px' }}>
                      <button 
                        onClick={() => copyToken(student.token)} 
                        className="btn btn-secondary"
                        style={{ padding: '5px 10px' }}
                      >
                        {copiedToken === student.token ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px' }}>
                      <div className="flex gap-2" style={{ justifyContent: 'center' }}>
                        <button onClick={() => sendInvitationEmail(student)} className="btn btn-primary" style={{ padding: '5px 10px' }}>
                          <Mail size={14} />
                        </button>
                        <button onClick={() => handleDelete(student.id)} className="btn btn-danger" style={{ padding: '5px 10px' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showAddModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
              <h3 className="mb-4">Ajouter un étudiant</h3>
              <form onSubmit={handleAddStudent}>
                <div className="input-group">
                  <label>Prénom</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">Ajouter</button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Annuler</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showBulkModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="card" style={{ width: '600px', maxWidth: '90%' }}>
              <h3 className="mb-4">Import en masse</h3>
              <p style={{ marginBottom: '16px', color: 'var(--gray-600)' }}>
                Entrez un étudiant par ligne au format : Prénom, Nom, Email<br />
                (séparés par virgule, point-virgule ou tabulation)
              </p>
              <form onSubmit={handleBulkAdd}>
                <div className="input-group">
                  <label>Liste des étudiants</label>
                  <textarea
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    placeholder="Jean, Dupont, jean.dupont@email.com&#10;Marie, Martin, marie.martin@email.com"
                    rows={10}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">Importer</button>
                  <button type="button" onClick={() => setShowBulkModal(false)} className="btn btn-secondary">Annuler</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
