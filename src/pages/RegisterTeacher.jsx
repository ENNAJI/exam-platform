import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, User, Mail, Lock, UserPlus } from 'lucide-react';
import { storage } from '../data/storage';

export default function RegisterTeacher() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    const existingTeacher = storage.getTeacherByEmail(formData.email);
    if (existingTeacher) {
      setError('Un compte existe déjà avec cet email.');
      return;
    }

    storage.addTeacher({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password
    });

    alert('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
    navigate('/login');
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
          <h2 style={{ marginTop: '16px' }}>Créer un compte Professeur</h2>
          <p style={{ color: 'var(--gray-600)' }}>Rejoignez ExamPro</p>
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

        <form onSubmit={handleSubmit}>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label>
                <User size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Prénom
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Jean"
                required
              />
            </div>
            <div className="input-group">
              <label>Nom</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Dupont"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>
              <Mail size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="input-group">
            <label>
              <Lock size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            <UserPlus size={18} />
            Créer mon compte
          </button>
        </form>

        <div className="text-center mt-4">
          <p style={{ color: 'var(--gray-600)', fontSize: '14px' }}>
            Déjà un compte ?{' '}
            <button 
              onClick={() => navigate('/login')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--primary)', 
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
