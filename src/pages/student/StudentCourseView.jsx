import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Presentation, Link as LinkIcon, BookOpen, Eye, Download, X, File, ClipboardList, ExternalLink } from 'lucide-react';
import { storage } from '../../data/storage';

export default function StudentCourseView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [student, setStudent] = useState(null);
  const [viewingResource, setViewingResource] = useState(null);

  useEffect(() => {
    const currentStudent = storage.getCurrentStudent();
    if (!currentStudent) {
      navigate('/login');
      return;
    }
    setStudent(currentStudent);
    
    const foundCourse = storage.getCourseById(id);
    if (foundCourse) {
      setCourse(foundCourse);
    }
  }, [id, navigate]);

  const getResourceIcon = (type) => {
    switch (type) {
      case 'presentation': 
      case 'support': return <File size={20} color="var(--primary)" />;
      case 'revision': return <ClipboardList size={20} color="var(--secondary)" />;
      case 'link': return <ExternalLink size={20} color="var(--info)" />;
      default: return <FileText size={20} color="var(--secondary)" />;
    }
  };

  const getResourceTypeLabel = (type) => {
    switch (type) {
      case 'support': return 'Support de cours';
      case 'revision': return 'Fiche de révision';
      case 'link': return 'Lien externe';
      default: return 'Ressource';
    }
  };

  const canPreview = (resource) => {
    if (resource.type === 'link') return false;
    const fileName = resource.fileName?.toLowerCase() || '';
    return fileName.endsWith('.pdf');
  };

  const openViewer = (resource) => {
    setViewingResource(resource);
  };

  const closeViewer = () => {
    setViewingResource(null);
  };

  if (!course || !student) return null;

  const supports = (course.resources || []).filter(r => r.type === 'support');
  const revisions = (course.resources || []).filter(r => r.type === 'revision');
  const links = (course.resources || []).filter(r => r.type === 'link');

  return (
    <div>
      <header className="header">
        <div className="container">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={32} />
            {course.title}
          </h1>
        </div>
      </header>

      <div className="container">
        <Link to="/student/dashboard" className="btn btn-secondary mb-4">
          <ArrowLeft size={18} />
          Retour au tableau de bord
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
        </div>

        {/* Contenu du cours */}
        {course.content && (
          <div className="card mb-4">
            <h3 className="mb-4">Contenu du cours</h3>
            <div style={{ 
              padding: '16px', 
              background: 'var(--gray-50)', 
              borderRadius: '8px',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.8'
            }}>
              {course.content}
            </div>
          </div>
        )}

        {/* Supports de cours */}
        {supports.length > 0 && (
          <div className="card mb-4">
            <h3 className="mb-4">📚 Supports de cours</h3>
            <div>
              {supports.map((resource) => (
                <div key={resource.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'var(--gray-50)',
                  borderRadius: '8px',
                  marginBottom: '8px'
                }}>
                  <div className="flex flex-center gap-2">
                    {getResourceIcon(resource.type)}
                    <div>
                      <strong>{resource.name || resource.title}</strong>
                      <p style={{ fontSize: '12px', color: 'var(--gray-600)', margin: '4px 0 0' }}>
                        {resource.fileName}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {canPreview(resource) && (
                      <button onClick={() => openViewer(resource)} className="btn btn-primary" style={{ padding: '8px 12px' }}>
                        <Eye size={16} /> Consulter
                      </button>
                    )}
                    <a href={resource.data} download={resource.fileName} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
                      <Download size={16} /> Télécharger
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fiches de révision */}
        {revisions.length > 0 && (
          <div className="card mb-4">
            <h3 className="mb-4">📝 Fiches de révision</h3>
            <div>
              {revisions.map((resource) => (
                <div key={resource.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'var(--gray-50)',
                  borderRadius: '8px',
                  marginBottom: '8px'
                }}>
                  <div className="flex flex-center gap-2">
                    {getResourceIcon(resource.type)}
                    <div>
                      <strong>{resource.name || resource.title}</strong>
                      <p style={{ fontSize: '12px', color: 'var(--gray-600)', margin: '4px 0 0' }}>
                        {resource.fileName}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {canPreview(resource) && (
                      <button onClick={() => openViewer(resource)} className="btn btn-primary" style={{ padding: '8px 12px' }}>
                        <Eye size={16} /> Consulter
                      </button>
                    )}
                    <a href={resource.data} download={resource.fileName} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
                      <Download size={16} /> Télécharger
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liens */}
        {links.length > 0 && (
          <div className="card mb-4">
            <h3 className="mb-4">🔗 Liens utiles</h3>
            <div>
              {links.map((resource) => (
                <div key={resource.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'var(--gray-50)',
                  borderRadius: '8px',
                  marginBottom: '8px'
                }}>
                  <div className="flex flex-center gap-2">
                    {getResourceIcon(resource.type)}
                    <strong>{resource.title}</strong>
                  </div>
                  <a href={resource.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '8px 12px' }}>
                    <ExternalLink size={16} /> Ouvrir
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {supports.length === 0 && revisions.length === 0 && links.length === 0 && (
          <div className="card">
            <p style={{ color: 'var(--gray-600)', textAlign: 'center' }}>Aucune ressource disponible pour ce cours.</p>
          </div>
        )}
      </div>

      {/* Visionneuse de document */}
      {viewingResource && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Barre d'outils */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            background: 'var(--gray-800)',
            color: 'white'
          }}>
            <div className="flex flex-center gap-2">
              <File size={20} />
              <span style={{ fontWeight: '600' }}>{viewingResource.name || viewingResource.fileName}</span>
              <span style={{ opacity: 0.7, fontSize: '14px' }}>({getResourceTypeLabel(viewingResource.type)})</span>
            </div>
            <div className="flex gap-2">
              <a href={viewingResource.data} download={viewingResource.fileName} className="btn btn-secondary" style={{ padding: '6px 12px' }}>
                <Download size={16} /> Télécharger
              </a>
              <button onClick={closeViewer} className="btn btn-danger" style={{ padding: '6px 12px' }}>
                <X size={16} /> Fermer
              </button>
            </div>
          </div>

          {/* Contenu du document */}
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px' }}>
            {viewingResource.fileName?.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={viewingResource.data}
                style={{
                  width: '100%',
                  maxWidth: '900px',
                  height: '100%',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'white'
                }}
                title={viewingResource.name}
              />
            ) : (
              <div style={{ 
                background: 'white', 
                padding: '40px', 
                borderRadius: '12px', 
                textAlign: 'center',
                maxWidth: '500px'
              }}>
                <File size={60} color="var(--gray-400)" />
                <h3 style={{ marginTop: '16px' }}>Aperçu non disponible</h3>
                <p style={{ color: 'var(--gray-600)', marginTop: '8px' }}>
                  Ce type de fichier ({viewingResource.fileName?.split('.').pop()?.toUpperCase()}) ne peut pas être affiché directement dans le navigateur.
                </p>
                <a href={viewingResource.data} download={viewingResource.fileName} className="btn btn-primary" style={{ marginTop: '16px' }}>
                  <Download size={18} /> Télécharger le fichier
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
