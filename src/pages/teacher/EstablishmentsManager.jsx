import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Building2, Users, BookOpen, Eye } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function EstablishmentsManager() {
  const [establishments, setEstablishments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEstablishment, setEditingEstablishment] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    address: '', 
    city: '', 
    type: 'university',
    description: '' 
  });

  useEffect(() => {
    const teacher = storage.getCurrentTeacher();
    if (teacher) {
      setEstablishments(storage.getEstablishmentsByTeacher(teacher.id));
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingEstablishment) {
      storage.updateEstablishment(editingEstablishment.id, formData);
    } else {
      storage.addEstablishment(formData);
    }
    const teacher = storage.getCurrentTeacher();
    setEstablishments(storage.getEstablishmentsByTeacher(teacher.id));
    setShowModal(false);
    setEditingEstablishment(null);
    setFormData({ name: '', address: '', city: '', type: 'university', description: '' });
  };

  const handleEdit = (establishment) => {
    setEditingEstablishment(establishment);
    setFormData({ 
      name: establishment.name, 
      address: establishment.address || '', 
      city: establishment.city || '',
      type: establishment.type || 'university',
      description: establishment.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet établissement ? Toutes les classes associées seront également supprimées.')) {
      storage.deleteEstablishment(id);
      const teacher = storage.getCurrentTeacher();
      setEstablishments(storage.getEstablishmentsByTeacher(teacher.id));
    }
  };

  const getClassCount = (establishmentId) => {
    return storage.getClasses().filter(c => c.establishmentId === establishmentId).length;
  };

  const getTypeLabel = (type) => {
    const types = {
      'university': 'Université',
      'school': 'École',
      'highschool': 'Lycée',
      'college': 'Collège',
      'training': 'Centre de formation',
      'other': 'Autre'
    };
    return types[type] || type;
  };

  return (
    <div>
      <Header role="teacher" />
      <div className="container">
        <div className="flex flex-between flex-center mb-4">
          <h2>
            <Building2 size={28} style={{ display: 'inline', marginRight: '10px' }} />
            Mes Établissements
          </h2>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={18} />
            Nouvel établissement
          </button>
        </div>

        {establishments.length === 0 ? (
          <div className="card text-center">
            <Building2 size={60} color="var(--gray-300)" style={{ marginBottom: '16px' }} />
            <h3>Aucun établissement</h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: '20px' }}>
              Commencez par créer votre établissement d'attache pour y associer vos classes.
            </p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <Plus size={18} />
              Créer mon premier établissement
            </button>
          </div>
        ) : (
          <div className="grid">
            {establishments.map((establishment) => (
              <div key={establishment.id} className="exam-card">
                <div className="flex flex-center gap-2 mb-4">
                  <Building2 size={28} color="var(--primary)" />
                  <div>
                    <h3 style={{ margin: 0 }}>{establishment.name}</h3>
                    <span className="badge badge-info" style={{ marginTop: '4px' }}>
                      {getTypeLabel(establishment.type)}
                    </span>
                  </div>
                </div>
                
                {establishment.city && (
                  <p style={{ color: 'var(--gray-600)', fontSize: '14px', marginBottom: '8px' }}>
                    📍 {establishment.city}
                  </p>
                )}
                
                {establishment.description && (
                  <p style={{ fontSize: '14px', marginBottom: '16px' }}>{establishment.description}</p>
                )}

                <div className="flex gap-2 mb-4">
                  <span className="badge badge-success">
                    <Users size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {getClassCount(establishment.id)} classes
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link to={`/teacher/establishment/${establishment.id}`} className="btn btn-primary">
                    <Eye size={16} />
                    Voir
                  </Link>
                  <button onClick={() => handleEdit(establishment)} className="btn btn-secondary">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(establishment.id)} className="btn btn-danger">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="card" style={{ width: '550px', maxWidth: '90%' }}>
              <h3 className="mb-4">
                <Building2 size={24} style={{ display: 'inline', marginRight: '8px' }} />
                {editingEstablishment ? 'Modifier l\'établissement' : 'Nouvel établissement'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <label>Nom de l'établissement *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Université Mohammed V"
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Type d'établissement</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="university">Université</option>
                    <option value="school">École</option>
                    <option value="highschool">Lycée</option>
                    <option value="college">Collège</option>
                    <option value="training">Centre de formation</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label>Ville</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Ex: Rabat"
                    />
                  </div>
                  <div className="input-group">
                    <label>Adresse</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Adresse complète"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description de l'établissement..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    {editingEstablishment ? 'Modifier' : 'Créer'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setShowModal(false); setEditingEstablishment(null); }} 
                    className="btn btn-secondary"
                  >
                    Annuler
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
