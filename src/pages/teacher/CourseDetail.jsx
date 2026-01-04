import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, FileText, Presentation, Link as LinkIcon, File, Edit, Save, X } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [classData, setClassData] = useState(null);
  const [exams, setExams] = useState([]);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [resourceForm, setResourceForm] = useState({ title: '', type: 'document', url: '', description: '' });
  const [content, setContent] = useState('');
  const [editingContent, setEditingContent] = useState(false);

  useEffect(() => {
    const foundCourse = storage.getCourseById(id);
    if (foundCourse) {
      setCourse(foundCourse);
      setClassData(storage.getClassById(foundCourse.classId));
      setExams(storage.getExamsByCourse(id));
      setContent(foundCourse.content || '');
    }
  }, [id]);

  const handleAddResource = (e) => {
    e.preventDefault();
    const resources = [...(course.resources || []), { ...resourceForm, id: Date.now().toString() }];
    storage.updateCourse(id, { resources });
    setCourse({ ...course, resources });
    setShowResourceModal(false);
    setResourceForm({ title: '', type: 'document', url: '', description: '' });
  };

  const handleDeleteResource = (resourceId) => {
    const resources = course.resources.filter(r => r.id !== resourceId);
    storage.updateCourse(id, { resources });
    setCourse({ ...course, resources });
  };

  const handleSaveContent = () => {
    storage.updateCourse(id, { content });
    setCourse({ ...course, content });
    setEditingContent(false);
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'presentation': return <Presentation size={20} color="var(--warning)" />;
      case 'link': return <LinkIcon size={20} color="var(--primary)" />;
      default: return <FileText size={20} color="var(--secondary)" />;
    }
  };

  if (!course) {
    return (
      <div>
        <Header role="teacher" />
        <div className="container"><p>Cours non trouvé.</p></div>
      </div>
    );
  }

  return (
    <div>
      <Header role="teacher" />
      <div className="container">
        <Link to={`/teacher/class/${course.classId}/courses`} className="btn btn-secondary mb-4">
          <ArrowLeft size={18} />
          Retour aux cours
        </Link>

        <div className="card mb-4">
          <h2>{course.title}</h2>
          <p>{course.description}</p>
          {course.objectives && (
            <div style={{ marginTop: '16px', padding: '16px', background: 'var(--gray-50)', borderRadius: '8px' }}>
              <strong>Objectifs pédagogiques :</strong>
              <p style={{ marginTop: '8px' }}>{course.objectives}</p>
            </div>
          )}
          <span className="badge badge-info mt-4">Classe: {classData?.name}</span>
        </div>

        {/* Contenu du cours */}
        <div className="card mb-4">
          <div className="flex flex-between flex-center mb-4">
            <h3>Contenu du cours</h3>
            {!editingContent ? (
              <button onClick={() => setEditingContent(true)} className="btn btn-secondary">
                <Edit size={16} />
                Modifier
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleSaveContent} className="btn btn-primary">
                  <Save size={16} />
                  Enregistrer
                </button>
                <button onClick={() => { setEditingContent(false); setContent(course.content || ''); }} className="btn btn-secondary">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          
          {editingContent ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Rédigez le contenu de votre cours ici... (Markdown supporté)"
              rows={15}
              style={{ width: '100%', padding: '12px', border: '1px solid var(--gray-300)', borderRadius: '8px', fontFamily: 'monospace' }}
            />
          ) : (
            <div style={{ 
              padding: '16px', 
              background: 'var(--gray-50)', 
              borderRadius: '8px',
              minHeight: '100px',
              whiteSpace: 'pre-wrap'
            }}>
              {course.content || <span style={{ color: 'var(--gray-600)' }}>Aucun contenu ajouté. Cliquez sur "Modifier" pour ajouter du contenu.</span>}
            </div>
          )}
        </div>

        {/* Ressources */}
        <div className="card mb-4">
          <div className="flex flex-between flex-center mb-4">
            <h3>Ressources</h3>
            <button onClick={() => setShowResourceModal(true)} className="btn btn-primary">
              <Plus size={16} />
              Ajouter une ressource
            </button>
          </div>

          {(!course.resources || course.resources.length === 0) ? (
            <p style={{ color: 'var(--gray-600)' }}>Aucune ressource ajoutée.</p>
          ) : (
            <div>
              {course.resources.map((resource) => (
                <div key={resource.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'var(--gray-50)',
                  borderRadius: '8px',
                  marginBottom: '8px'
                }}>
                  <div className="flex flex-center gap-2">
                    {getResourceIcon(resource.type)}
                    <div>
                      <strong>{resource.title}</strong>
                      {resource.description && <p style={{ fontSize: '12px', color: 'var(--gray-600)', margin: 0 }}>{resource.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {resource.url && (
                      <a href={resource.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '5px 10px' }}>
                        <LinkIcon size={14} />
                      </a>
                    )}
                    <button onClick={() => handleDeleteResource(resource.id)} className="btn btn-danger" style={{ padding: '5px 10px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Examens associés */}
        <div className="card">
          <div className="flex flex-between flex-center mb-4">
            <h3>Examens associés</h3>
            <Link to={`/teacher/course/${id}/create-exam`} className="btn btn-primary">
              <Plus size={16} />
              Créer un examen
            </Link>
          </div>

          {exams.length === 0 ? (
            <p style={{ color: 'var(--gray-600)' }}>Aucun examen créé pour ce cours.</p>
          ) : (
            <div className="grid">
              {exams.map((exam) => (
                <div key={exam.id} className="exam-card">
                  <h4>{exam.title}</h4>
                  <p>{exam.description}</p>
                  <div className="flex gap-2 mt-4">
                    <Link to={`/teacher/edit/${exam.id}`} className="btn btn-secondary">
                      <Edit size={14} />
                    </Link>
                    <Link to={`/teacher/schedule-exam/${exam.id}`} className="btn btn-primary">
                      Planifier
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showResourceModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
              <h3 className="mb-4">Ajouter une ressource</h3>
              <form onSubmit={handleAddResource}>
                <div className="input-group">
                  <label>Titre</label>
                  <input
                    type="text"
                    value={resourceForm.title}
                    onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                    placeholder="Titre de la ressource"
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Type</label>
                  <select
                    value={resourceForm.type}
                    onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                  >
                    <option value="document">Document</option>
                    <option value="presentation">Présentation</option>
                    <option value="link">Lien externe</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>URL / Lien</label>
                  <input
                    type="url"
                    value={resourceForm.url}
                    onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea
                    value={resourceForm.description}
                    onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                    placeholder="Description de la ressource..."
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">Ajouter</button>
                  <button type="button" onClick={() => setShowResourceModal(false)} className="btn btn-secondary">Annuler</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
