import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Mail, Upload, Send, Copy, Check, FileSpreadsheet, FileText } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function StudentsManager() {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [formData, setFormData] = useState({ code: '', firstName: '', lastName: '', email: '' });
  const [bulkData, setBulkData] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    setClassData(storage.getClassById(classId));
    setStudents(storage.getStudentsByClass(classId));
  }, [classId]);

  const handleAddStudent = (e) => {
    e.preventDefault();
    storage.addStudent({ ...formData, classId });
    setStudents(storage.getStudentsByClass(classId));
    setShowAddModal(false);
    setFormData({ code: '', firstName: '', lastName: '', email: '' });
  };

  const parseCSVLine = (line) => {
    const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
    return parts;
  };

  const handleBulkAdd = (e) => {
    e.preventDefault();
    setImportError('');
    setImportSuccess('');
    
    const lines = bulkData.split('\n').filter(line => line.trim());
    
    // Ignorer la première ligne si c'est un en-tête
    let dataLines = lines;
    if (lines.length > 0) {
      const firstLine = lines[0].toLowerCase();
      if (firstLine.includes('code') || firstLine.includes('nom') || firstLine.includes('prenom') || firstLine.includes('email')) {
        dataLines = lines.slice(1);
      }
    }
    
    const newStudents = dataLines.map(line => {
      const parts = parseCSVLine(line);
      // Format: Code, Nom, Prénom, Email
      return {
        code: parts[0] || '',
        lastName: parts[1] || '',
        firstName: parts[2] || '',
        email: parts[3] || ''
      };
    }).filter(s => s.lastName && s.firstName && s.email);
    
    if (newStudents.length > 0) {
      storage.addStudentsBulk(newStudents, classId);
      setStudents(storage.getStudentsByClass(classId));
      setImportSuccess(`${newStudents.length} étudiants importés avec succès !`);
      setBulkData('');
    } else {
      setImportError('Aucun étudiant valide trouvé. Vérifiez le format du fichier.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImportError('');
    setImportSuccess('');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setBulkData(content);
    };
    reader.onerror = () => {
      setImportError('Erreur lors de la lecture du fichier.');
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = 'Code;Nom;Prenom;Email\nETU001;Dupont;Jean;jean.dupont@email.com\nETU002;Martin;Marie;marie.martin@email.com';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modele_etudiants.csv';
    link.click();
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
                  <th style={{ textAlign: 'left', padding: '12px' }}>Code</th>
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
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: '600' }}>{student.code || '-'}</td>
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
                  <label>Code étudiant</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ex: ETU001"
                  />
                </div>
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label>Nom *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Prénom *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Email *</label>
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
            <div className="card" style={{ width: '700px', maxWidth: '90%' }}>
              <h3 className="mb-4">
                <FileSpreadsheet size={24} style={{ display: 'inline', marginRight: '8px' }} />
                Import CSV / Excel
              </h3>
              
              <div style={{ 
                padding: '16px', 
                background: 'var(--gray-50)', 
                borderRadius: '8px', 
                marginBottom: '16px' 
              }}>
                <p style={{ fontWeight: '600', marginBottom: '8px' }}>Format attendu :</p>
                <code style={{ 
                  display: 'block', 
                  padding: '8px', 
                  background: 'var(--gray-200)', 
                  borderRadius: '4px',
                  fontSize: '13px'
                }}>
                  Code ; Nom ; Prénom ; Email
                </code>
                <p style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '8px' }}>
                  Séparateurs acceptés : virgule (,), point-virgule (;) ou tabulation
                </p>
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.txt,.xls,.xlsx"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  className="btn btn-secondary"
                >
                  <Upload size={16} />
                  Charger un fichier CSV
                </button>
                <button 
                  type="button" 
                  onClick={downloadTemplate} 
                  className="btn btn-secondary"
                >
                  <FileText size={16} />
                  Télécharger le modèle
                </button>
              </div>

              {importError && (
                <div style={{ 
                  padding: '12px', 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid var(--danger)', 
                  borderRadius: '8px', 
                  color: 'var(--danger)', 
                  marginBottom: '16px' 
                }}>
                  {importError}
                </div>
              )}

              {importSuccess && (
                <div style={{ 
                  padding: '12px', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  border: '1px solid var(--secondary)', 
                  borderRadius: '8px', 
                  color: 'var(--secondary)', 
                  marginBottom: '16px' 
                }}>
                  {importSuccess}
                </div>
              )}

              <form onSubmit={handleBulkAdd}>
                <div className="input-group">
                  <label>Données à importer</label>
                  <textarea
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    placeholder="Code;Nom;Prenom;Email&#10;ETU001;Dupont;Jean;jean.dupont@email.com&#10;ETU002;Martin;Marie;marie.martin@email.com"
                    rows={10}
                    style={{ fontFamily: 'monospace', fontSize: '13px' }}
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={!bulkData.trim()}>
                    <Upload size={16} />
                    Importer les étudiants
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setShowBulkModal(false); setBulkData(''); setImportError(''); setImportSuccess(''); }} 
                    className="btn btn-secondary"
                  >
                    Fermer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
