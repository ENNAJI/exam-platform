import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Users, BookOpen, Eye, Building2, ChevronDown, ChevronRight } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function ClassesManager() {
  const [classes, setClasses] = useState([]);
  const [establishments, setEstablishments] = useState([]);
  const [expandedEstablishments, setExpandedEstablishments] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState('');
  const [formData, setFormData] = useState({ name: '', description: '', year: '', establishmentId: '' });

  useEffect(() => {
    const teacher = storage.getCurrentTeacher();
    setClasses(storage.getClasses());
    if (teacher) {
      const teacherEstablishments = storage.getEstablishmentsByTeacher(teacher.id);
      setEstablishments(teacherEstablishments);
      // Expand all establishments by default
      const expanded = {};
      teacherEstablishments.forEach(e => { expanded[e.id] = true; });
      setExpandedEstablishments(expanded);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingClass) {
      storage.updateClass(editingClass.id, formData);
    } else {
      storage.addClass({ ...formData, establishmentId: selectedEstablishmentId || formData.establishmentId });
    }
    setClasses(storage.getClasses());
    setShowModal(false);
    setEditingClass(null);
    setSelectedEstablishmentId('');
    setFormData({ name: '', description: '', year: '', establishmentId: '' });
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setFormData({ 
      name: classItem.name, 
      description: classItem.description, 
      year: classItem.year,
      establishmentId: classItem.establishmentId || ''
    });
    setShowModal(true);
  };

  const handleAddClassToEstablishment = (establishmentId) => {
    setSelectedEstablishmentId(establishmentId);
    setFormData({ name: '', description: '', year: '', establishmentId });
    setShowModal(true);
  };

  const toggleEstablishment = (id) => {
    setExpandedEstablishments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getClassesByEstablishment = (establishmentId) => {
    return classes.filter(c => c.establishmentId === establishmentId);
  };

  const getOrphanClasses = () => {
    return classes.filter(c => !c.establishmentId);
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

  const renderClassCard = (classItem) => (
    <div key={classItem.id} style={{
      background: 'white',
      border: '1px solid var(--gray-200)',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{classItem.name}</h4>
      <p style={{ fontSize: '13px', color: 'var(--gray-600)', margin: '0 0 8px 0' }}>
        {classItem.description?.substring(0, 60)}{classItem.description?.length > 60 ? '...' : ''}
      </p>
      <p style={{ fontSize: '12px', color: 'var(--gray-500)', margin: '0 0 12px 0' }}>
        Année: {classItem.year}
      </p>
      
      <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
        <span className="badge badge-info" style={{ fontSize: '11px' }}>
          <Users size={10} style={{ display: 'inline', marginRight: '3px' }} />
          {getStudentCount(classItem.id)} étudiants
        </span>
        <span className="badge badge-success" style={{ fontSize: '11px' }}>
          <BookOpen size={10} style={{ display: 'inline', marginRight: '3px' }} />
          {getCourseCount(classItem.id)} cours
        </span>
      </div>

      <div className="flex gap-2">
        <Link to={`/teacher/class/${classItem.id}`} className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '12px' }}>
          <Eye size={14} />
        </Link>
        <button onClick={() => handleEdit(classItem)} className="btn btn-secondary" style={{ padding: '6px 10px' }}>
          <Edit size={14} />
        </button>
        <button onClick={() => handleDelete(classItem.id)} className="btn btn-danger" style={{ padding: '6px 10px' }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <Header role="teacher" />
      <div className="container">
        <div className="flex flex-between flex-center mb-4">
          <h2>
            <Building2 size={28} style={{ display: 'inline', marginRight: '10px' }} />
            Gestion des Classes
          </h2>
          <Link to="/teacher/establishments" className="btn btn-secondary">
            <Building2 size={18} />
            Gérer les établissements
          </Link>
        </div>

        {establishments.length === 0 && classes.length === 0 ? (
          <div className="card text-center">
            <Building2 size={60} color="var(--gray-300)" style={{ marginBottom: '16px' }} />
            <h3>Aucun établissement</h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: '20px' }}>
              Commencez par créer un établissement pour y ajouter vos classes.
            </p>
            <Link to="/teacher/establishments" className="btn btn-primary">
              <Plus size={18} />
              Créer un établissement
            </Link>
          </div>
        ) : (
          <>
            {/* Établissements avec leurs classes */}
            {establishments.map((establishment) => {
              const establishmentClasses = getClassesByEstablishment(establishment.id);
              const isExpanded = expandedEstablishments[establishment.id];
              
              return (
                <div key={establishment.id} style={{
                  background: 'var(--gray-50)',
                  border: '2px solid var(--gray-200)',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  overflow: 'hidden'
                }}>
                  {/* En-tête de l'établissement */}
                  <div 
                    onClick={() => toggleEstablishment(establishment.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <div className="flex flex-center gap-2">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      <Building2 size={24} />
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>{establishment.name}</h3>
                        {establishment.city && (
                          <span style={{ fontSize: '13px', opacity: 0.9 }}>📍 {establishment.city}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-center gap-2">
                      <span style={{ 
                        background: 'rgba(255,255,255,0.2)', 
                        padding: '4px 12px', 
                        borderRadius: '20px',
                        fontSize: '13px'
                      }}>
                        {establishmentClasses.length} classe{establishmentClasses.length > 1 ? 's' : ''}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAddClassToEstablishment(establishment.id); }}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          border: 'none',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '13px'
                        }}
                      >
                        <Plus size={16} />
                        Ajouter une classe
                      </button>
                    </div>
                  </div>

                  {/* Contenu : liste des classes */}
                  {isExpanded && (
                    <div style={{ padding: '20px' }}>
                      {establishmentClasses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--gray-600)' }}>
                          <p>Aucune classe dans cet établissement.</p>
                          <button 
                            onClick={() => handleAddClassToEstablishment(establishment.id)}
                            className="btn btn-primary mt-4"
                          >
                            <Plus size={16} />
                            Créer la première classe
                          </button>
                        </div>
                      ) : (
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '16px'
                        }}>
                          {establishmentClasses.map(renderClassCard)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Classes orphelines (sans établissement) */}
            {getOrphanClasses().length > 0 && (
              <div style={{
                background: 'var(--gray-100)',
                border: '2px dashed var(--gray-300)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h3 style={{ color: 'var(--gray-600)', marginBottom: '16px' }}>
                  Classes sans établissement
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  {getOrphanClasses().map(renderClassCard)}
                </div>
              </div>
            )}
          </>
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
                {!selectedEstablishmentId && (
                  <div className="input-group">
                    <label>Établissement *</label>
                    <select
                      value={formData.establishmentId}
                      onChange={(e) => setFormData({ ...formData, establishmentId: e.target.value })}
                      required
                    >
                      <option value="">-- Sélectionner un établissement --</option>
                      {establishments.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {selectedEstablishmentId && (
                  <div style={{ 
                    padding: '12px', 
                    background: 'var(--gray-50)', 
                    borderRadius: '8px', 
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Building2 size={18} color="var(--primary)" />
                    <span>
                      <strong>Établissement :</strong> {establishments.find(e => e.id === selectedEstablishmentId)?.name}
                    </span>
                  </div>
                )}
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
                  <button type="button" onClick={() => { setShowModal(false); setEditingClass(null); setSelectedEstablishmentId(''); }} className="btn btn-secondary">
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
