import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Mail, Key, LogIn } from 'lucide-react';
import { storage } from '../../data/storage';

export default function StudentLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  
  const [loginMethod, setLoginMethod] = useState(tokenFromUrl ? 'token' : 'email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(tokenFromUrl || '');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    let student = null;

    if (loginMethod === 'email') {
      student = storage.getStudentByEmail(email);
      if (!student) {
        setError('Aucun compte trouvé avec cet email.');
        return;
      }
    } else {
      student = storage.getStudentByToken(token);
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}>
      <div className="card" style={{ width: '450px', maxWidth: '90%' }}>
        <div className="text-center mb-4">
          <GraduationCap size={60} color="var(--primary)" />
          <h2 style={{ marginTop: '16px' }}>Connexion Étudiant</h2>
          <p style={{ color: 'var(--gray-600)' }}>Accédez à vos cours et examens</p>
        </div>

        <div className="flex gap-2 mb-4" style={{ justifyContent: 'center' }}>
          <button
            onClick={() => setLoginMethod('email')}
            className={`btn ${loginMethod === 'email' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Mail size={16} />
            Email
          </button>
          <button
            onClick={() => setLoginMethod('token')}
            className={`btn ${loginMethod === 'token' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Key size={16} />
            Token
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: 'var(--danger)', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {loginMethod === 'email' ? (
            <div className="input-group">
              <label>Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                required
              />
            </div>
          ) : (
            <div className="input-group">
              <label>Token d'authentification</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Entrez votre token..."
                required
              />
              <p style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '4px' }}>
                Le token vous a été envoyé par email par votre enseignant.
              </p>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            <LogIn size={18} />
            Se connecter
          </button>
        </form>

        <div className="text-center mt-4">
          <a href="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}
