import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Users, BookOpen, Plus, Edit, Trash2, Eye } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function EstablishmentDetail() {
  const { id } = useParams();
  const [establishment, setEstablishment] = useState(null);
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', year: '' });

  useEffect(() => {
    const foundEstablishment = storage.getEstablishmentById(id);
    setEstablishment(foundEstablishment);
    setClasses(storage.getClasses().filter(c => c.establishmentId === id));
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingClass) {
      storage.updateClass(editingClass.id, formData);
    } else {
      storage.addClass({ ...formData, establishmentId: id });
    }
    setClasses(storage.getClasses().filter(c => c.establishmentId === id));
    setShowModal(false);
    setEditingClass(null);
    setFormData({ name: '', description: '', year: '' });
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setFormData({ 
      name: classItem.name, 
      description: classItem.description || '', 
      year: classItem.year || '' 
    });
    setShowModal(true);
  };

  const handleDelete = (classId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) {
      storage.deleteClass(classId);
      setClasses(storage.getClasses().filter(c => c.establishmentId === id));
    }
  };

  const getStudentCount = (classId) => {
    return storage.getStudentsByClass(classId).length;
  };

  const getCourseCount = (classId) => {
    return storage.getCoursesByClass(classId).length;
  };

  if (!establishment) {
    return (
      <div>
        <Header role="teacher" />
        <div className="container">
          <p>Établissement non trouvé.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header role="teacher" />
      <div className="container">
        <Link to="/teacher/establishments" className="btn btn-secondary mb-4">
          <ArrowLeft size={18} />
          Retour aux établissements
        </Link>

        <div className="card mb-4">
          <div className="flex flex-center gap-2">
            <Building2 size={32} color="var(--primary)" />
            <div>
              <h2 style={{ margin: 0 }}>{establishment.name}</h2>
              {establishment.city && (
                <p style={{ color: 'var(--gray-600)', margin: '4px 0 0' }}>📍 {establishment.city}</p>
              )}
            </div>
          </div>
          {establishment.description && (
            <p style={{ marginTop: '16px' }}>{establishment.description}</p>
          )}
        </div>

        <div className="flex flex-between flex-center mb-4">
          <h3>
            <Users size={24} style={{ display: 'inline', marginRight: '8px' }} />
            Classes ({classes.length})
          </h3>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={18} />
            Nouvelle classe
          </button>
        </div>

        {classes.length === 0 ? (
          <div className="card text-center">
            <p>Aucune classe dans cet établissement.</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary mt-4">
              <Plus size={18} />
              Créer une classe
            </button>
          </div>
        ) : (
          <div className="grid">
            {classes.map((classItem) => (
              <div key={classItem.id} className="exam-card">
                <h3>{classItem.name}</h3>
                <p>{classItem.description}</p>
                <p style={{ fontSize: '14px', color: 'var(--gray-600)' }}>Année: {classItem.year}</p>
                
                <div className="flex gap-2 mb-4 mt-4">
                  <span className="badge badge-info">
                    <Users size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {getStudentCount(classItem.id)} étudiants
                  </span>
                  <span className="badge badge-success">
                    <BookOpen size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {getCourseCount(classItem.id)} cours
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link to={`/teacher/class/${classItem.id}`} className="btn btn-primary">
                    <Eye size={16} />
                  </Link>
                  <button onClick={() => handleEdit(classItem)} className="btn btn-secondary">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(classItem.id)} className="btn btn-danger">
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
            <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
              <h3 className="mb-4">{editingClass ? 'Modifier la classe' : 'Nouvelle classe'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <label>Nom de la classe *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Licence 3 Informatique"
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description de la classe..."
                    rows={3}
                  />
                </div>
                <div className="input-group">
                  <label>Année universitaire *</label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="Ex: 2025-2026"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    {editingClass ? 'Modifier' : 'Créer'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setShowModal(false); setEditingClass(null); }} 
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
