import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Mail, Key, LogIn, User } from 'lucide-react';
import { storage } from '../../data/storage';

export default function StudentLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  
  const [loginMethod, setLoginMethod] = useState('email'); // 'email', 'login', 'token'
  const [email, setEmail] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(tokenFromUrl || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Charger les données depuis le serveur au démarrage
  useEffect(() => {
    const loadData = async () => {
      try {
        await storage.loadFromServer();
      } catch (e) {
        console.log('Mode hors-ligne');
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Recharger les données depuis le serveur avant la connexion
    try {
      await storage.loadFromServer();
    } catch (e) {
      console.log('Mode hors-ligne');
    }

    let student = null;

    if (loginMethod === 'email') {
      // Connexion par email + mot de passe
      student = storage.getStudentByEmail(email);
      if (!student) {
        setError('Aucun compte trouvé avec cet email.');
        return;
      }
      if (student.password !== password && student.token !== password) {
        setError('Mot de passe incorrect.');
        return;
      }
    } else if (loginMethod === 'login') {
      // Connexion par login (Prénom.Nom) + mot de passe
      student = storage.getStudentByLogin(login);
      if (!student) {
        setError('Aucun compte trouvé avec ce login. Format attendu: Prénom.Nom');
        return;
      }
      if (student.password !== password && student.token !== password) {
        setError('Mot de passe incorrect.');
        return;
      }
    } else if (loginMethod === 'token') {
      // Connexion par token uniquement
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
      <div className="card" style={{ width: '480px', maxWidth: '95%' }}>
        <div className="text-center mb-4">
          <GraduationCap size={60} color="var(--primary)" />
          <h2 style={{ marginTop: '16px' }}>Connexion Étudiant</h2>
          <p style={{ color: 'var(--gray-600)' }}>Accédez à vos cours et examens</p>
        </div>

        {/* Sélection de la méthode de connexion */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
            Méthode de connexion
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
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
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: 'var(--danger)', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Connexion par Email */}
          {loginMethod === 'email' && (
            <>
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
              <div className="input-group">
                <label>Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  required
                />
              </div>
            </>
          )}

          {/* Connexion par Login (Prénom.Nom) */}
          {loginMethod === 'login' && (
            <>
              <div className="input-group">
                <label>Login (Prénom.Nom)</label>
                <input
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  required
                />
              </div>
            </>
          )}

          {/* Connexion par Token */}
          {loginMethod === 'token' && (
            <div className="input-group">
              <label>Token d'authentification</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Entrez votre token..."
                required
              />
              <p style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '4px' }}>
                Le token vous a été fourni par votre enseignant.
              </p>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
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
