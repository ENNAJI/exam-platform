import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, User, Users, Mail, Lock, LogIn, Key } from 'lucide-react';
import { storage } from '../data/storage';

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [loginMethod, setLoginMethod] = useState('email');
  
  // Professeur
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  
  // Étudiant
  const [studentEmail, setStudentEmail] = useState('');
  const [studentLogin, setStudentLogin] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentToken, setStudentToken] = useState('');
  
  const [error, setError] = useState('');

  const handleTeacherLogin = (e) => {
    e.preventDefault();
    setError('');

    const teacher = storage.getTeacherByEmail(teacherEmail);
    if (!teacher) {
      setError('Aucun compte professeur trouvé avec cet email.');
      return;
    }
    if (teacher.password !== teacherPassword) {
      setError('Mot de passe incorrect.');
      return;
    }

    storage.setCurrentTeacher(teacher);
    navigate('/teacher');
  };

  const handleStudentLogin = (e) => {
    e.preventDefault();
    setError('');

    let student = null;

    if (loginMethod === 'email') {
      student = storage.getStudentByEmail(studentEmail);
      if (!student) {
        setError('Aucun compte étudiant trouvé avec cet email.');
        return;
      }
      if (student.password !== studentPassword && student.token !== studentPassword) {
        setError('Mot de passe incorrect.');
        return;
      }
    } else if (loginMethod === 'login') {
      student = storage.getStudentByLogin(studentLogin);
      if (!student) {
        setError('Aucun compte trouvé avec ce login. Format attendu: Prénom.Nom');
        return;
      }
      if (student.password !== studentPassword && student.token !== studentPassword) {
        setError('Mot de passe incorrect.');
        return;
      }
    } else {
      student = storage.getStudentByToken(studentToken);
      if (!student) {
        setError('Token invalide ou expiré.');
        return;
      }
    }

    if (!student.isActive) {
      setError('Votre compte a été désactivé. Contactez votre enseignant.');
      return;
    }

    storage.setCurrentStudent(student);
    navigate('/student/dashboard');
  };

  const handleTeacherRegister = () => {
    navigate('/register-teacher');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
      padding: '20px'
    }}>
      <div className="card" style={{ width: '500px', maxWidth: '100%' }}>
        <div className="text-center mb-4">
          <GraduationCap size={60} color="var(--primary)" />
          <h2 style={{ marginTop: '16px' }}>ExamPro</h2>
          <p style={{ color: 'var(--gray-600)' }}>Plateforme d'examens à distance</p>
        </div>

        {!role ? (
          <>
            <p className="text-center mb-4" style={{ fontWeight: '600' }}>Connectez-vous en tant que :</p>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <button
                onClick={() => setRole('teacher')}
                className="card"
                style={{ 
                  cursor: 'pointer', 
                  textAlign: 'center',
                  border: '2px solid transparent',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <Users size={40} color="var(--primary)" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Professeur</h3>
                <p style={{ fontSize: '12px', color: 'var(--gray-600)' }}>Gérer les classes, cours et examens</p>
              </button>

              <button
                onClick={() => setRole('student')}
                className="card"
                style={{ 
                  cursor: 'pointer', 
                  textAlign: 'center',
                  border: '2px solid transparent',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--secondary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <User size={40} color="var(--secondary)" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Étudiant</h3>
                <p style={{ fontSize: '12px', color: 'var(--gray-600)' }}>Accéder aux cours et passer les examens</p>
              </button>
            </div>
          </>
        ) : role === 'teacher' ? (
          <>
            <button 
              onClick={() => { setRole(null); setError(''); }}
              className="btn btn-secondary mb-4"
              style={{ padding: '5px 10px', fontSize: '12px' }}
            >
              ← Retour
            </button>
            
            <h3 className="text-center mb-4">
              <Users size={24} style={{ display: 'inline', marginRight: '8px' }} />
              Connexion Professeur
            </h3>

            {error && (
              <div style={{ 
                padding: '12px', 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid var(--danger)', 
                borderRadius: '8px', 
                color: 'var(--danger)', 
                marginBottom: '16px' 
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleTeacherLogin}>
              <div className="input-group">
                <label>
                  <Mail size={16} style={{ display: 'inline', marginRight: '6px' }} />
                  Email
                </label>
                <input
                  type="email"
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  placeholder="professeur@exemple.com"
                  required
                />
              </div>
              <div className="input-group">
                <label>
                  <Lock size={16} style={{ display: 'inline', marginRight: '6px' }} />
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <LogIn size={18} />
                Se connecter
              </button>
            </form>

            <div className="text-center mt-4">
              <p style={{ color: 'var(--gray-600)', fontSize: '14px' }}>
                Pas encore de compte ?{' '}
                <button 
                  onClick={handleTeacherRegister}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--primary)', 
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Créer un compte
                </button>
              </p>
            </div>
          </>
        ) : (
          <>
            <button 
              onClick={() => { setRole(null); setError(''); }}
              className="btn btn-secondary mb-4"
              style={{ padding: '5px 10px', fontSize: '12px' }}
            >
              ← Retour
            </button>
            
            <h3 className="text-center mb-4">
              <User size={24} style={{ display: 'inline', marginRight: '8px' }} />
              Connexion Étudiant
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                style={{
                  padding: '10px 8px',
                  border: loginMethod === 'email' ? '2px solid var(--primary)' : '1px solid var(--gray-300)',
                  borderRadius: '8px',
                  background: loginMethod === 'email' ? 'rgba(59, 130, 246, 0.1)' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Mail size={20} color={loginMethod === 'email' ? 'var(--primary)' : 'var(--gray-500)'} />
                <span style={{ fontSize: '11px', fontWeight: loginMethod === 'email' ? '600' : '400', color: loginMethod === 'email' ? 'var(--primary)' : 'var(--gray-600)' }}>
                  Email
                </span>
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('login')}
                style={{
                  padding: '10px 8px',
                  border: loginMethod === 'login' ? '2px solid var(--primary)' : '1px solid var(--gray-300)',
                  borderRadius: '8px',
                  background: loginMethod === 'login' ? 'rgba(59, 130, 246, 0.1)' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <User size={20} color={loginMethod === 'login' ? 'var(--primary)' : 'var(--gray-500)'} />
                <span style={{ fontSize: '11px', fontWeight: loginMethod === 'login' ? '600' : '400', color: loginMethod === 'login' ? 'var(--primary)' : 'var(--gray-600)' }}>
                  Login
                </span>
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('token')}
                style={{
                  padding: '10px 8px',
                  border: loginMethod === 'token' ? '2px solid var(--primary)' : '1px solid var(--gray-300)',
                  borderRadius: '8px',
                  background: loginMethod === 'token' ? 'rgba(59, 130, 246, 0.1)' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Key size={20} color={loginMethod === 'token' ? 'var(--primary)' : 'var(--gray-500)'} />
                <span style={{ fontSize: '11px', fontWeight: loginMethod === 'token' ? '600' : '400', color: loginMethod === 'token' ? 'var(--primary)' : 'var(--gray-600)' }}>
                  Token
                </span>
              </button>
            </div>

            {error && (
              <div style={{ 
                padding: '12px', 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid var(--danger)', 
                borderRadius: '8px', 
                color: 'var(--danger)', 
                marginBottom: '16px' 
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleStudentLogin}>
              {loginMethod === 'email' && (
                <>
                  <div className="input-group">
                    <label>Adresse email</label>
                    <input
                      type="email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="etudiant@exemple.com"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Mot de passe</label>
                    <input
                      type="password"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      placeholder="Votre mot de passe"
                      required
                    />
                  </div>
                </>
              )}

              {loginMethod === 'login' && (
                <>
                  <div className="input-group">
                    <label>Login (Prénom.Nom)</label>
                    <input
                      type="text"
                      value={studentLogin}
                      onChange={(e) => setStudentLogin(e.target.value)}
                      placeholder="Jean.Dupont"
                      required
                    />
                    <p style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '4px' }}>
                      Format: Prénom.Nom (ex: Jean.Dupont)
                    </p>
                  </div>
                  <div className="input-group">
                    <label>Mot de passe</label>
                    <input
                      type="password"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      placeholder="Votre mot de passe"
                      required
                    />
                  </div>
                </>
              )}

              {loginMethod === 'token' && (
                <div className="input-group">
                  <label>Token d'authentification</label>
                  <input
                    type="text"
                    value={studentToken}
                    onChange={(e) => setStudentToken(e.target.value)}
                    placeholder="Entrez votre token..."
                    required
                  />
                  <p style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '4px' }}>
                    Le token vous a été fourni par votre professeur.
                  </p>
                </div>
              )}

              <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: '8px' }}>
                <LogIn size={18} />
                Se connecter
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
