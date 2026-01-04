import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Eye, BookOpen } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function CoursesManager() {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', objectives: '' });

  useEffect(() => {
    setClassData(storage.getClassById(classId));
    setCourses(storage.getCoursesByClass(classId));
  }, [classId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCourse) {
      storage.updateCourse(editingCourse.id, formData);
    } else {
      storage.addCourse({ ...formData, classId });
    }
    setCourses(storage.getCoursesByClass(classId));
    setShowModal(false);
    setEditingCourse(null);
    setFormData({ title: '', description: '', objectives: '' });
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({ title: course.title, description: course.description, objectives: course.objectives || '' });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      storage.deleteCourse(id);
      setCourses(storage.getCoursesByClass(classId));
    }
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
          <h2>Cours - {classData.name}</h2>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={18} />
            Nouveau cours
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="card text-center">
            <p>Aucun cours créé pour cette classe.</p>
          </div>
        ) : (
          <div className="grid">
            {courses.map((course) => (
              <div key={course.id} className="exam-card">
                <div className="flex flex-center gap-2 mb-4">
                  <BookOpen size={24} color="var(--primary)" />
                  <h3 style={{ margin: 0 }}>{course.title}</h3>
                </div>
                <p>{course.description}</p>
                <div className="flex gap-2 mt-4">
                  <Link to={`/teacher/course/${course.id}`} className="btn btn-primary">
                    <Eye size={16} />
                    Voir
                  </Link>
                  <button onClick={() => handleEdit(course)} className="btn btn-secondary">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(course.id)} className="btn btn-danger">
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
            <div className="card" style={{ width: '600px', maxWidth: '90%' }}>
              <h3 className="mb-4">{editingCourse ? 'Modifier le cours' : 'Nouveau cours'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <label>Titre du cours</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Introduction à l'algorithmique"
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description du cours..."
                    rows={3}
                  />
                </div>
                <div className="input-group">
                  <label>Objectifs pédagogiques</label>
                  <textarea
                    value={formData.objectives}
                    onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                    placeholder="Les objectifs d'apprentissage..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    {editingCourse ? 'Modifier' : 'Créer'}
                  </button>
                  <button type="button" onClick={() => { setShowModal(false); setEditingCourse(null); }} className="btn btn-secondary">
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
