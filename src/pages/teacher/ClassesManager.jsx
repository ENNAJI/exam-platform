import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Users, BookOpen, Eye } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function ClassesManager() {
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', year: '' });

  useEffect(() => {
    setClasses(storage.getClasses());
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingClass) {
      storage.updateClass(editingClass.id, formData);
    } else {
      storage.addClass(formData);
    }
    setClasses(storage.getClasses());
    setShowModal(false);
    setEditingClass(null);
    setFormData({ name: '', description: '', year: '' });
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setFormData({ name: classItem.name, description: classItem.description, year: classItem.year });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) {
      storage.deleteClass(id);
      setClasses(storage.getClasses());
    }
  };

  const getStudentCount = (classId) => {
    return storage.getStudentsByClass(classId).length;
  };

  const getCourseCount = (classId) => {
    return storage.getCoursesByClass(classId).length;
  };

  return (
    <div>
      <Header role="teacher" />
      <div className="container">
        <div className="flex flex-between flex-center mb-4">
          <h2>Gestion des Classes</h2>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={18} />
            Nouvelle classe
          </button>
        </div>

        {classes.length === 0 ? (
          <div className="card text-center">
            <p>Aucune classe créée. Commencez par créer votre première classe !</p>
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
                  <label>Nom de la classe</label>
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
                  <label>Année universitaire</label>
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
                  <button type="button" onClick={() => { setShowModal(false); setEditingClass(null); }} className="btn btn-secondary">
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
