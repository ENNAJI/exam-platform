import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Presentation, Link as LinkIcon, BookOpen } from 'lucide-react';
import { storage } from '../../data/storage';

export default function StudentCourseView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [student, setStudent] = useState(null);

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
      case 'presentation': return <Presentation size={20} color="var(--warning)" />;
      case 'link': return <LinkIcon size={20} color="var(--primary)" />;
      default: return <FileText size={20} color="var(--secondary)" />;
    }
  };

  if (!course || !student) return null;

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

        {/* Ressources */}
        <div className="card">
          <h3 className="mb-4">Ressources</h3>
          
          {(!course.resources || course.resources.length === 0) ? (
            <p style={{ color: 'var(--gray-600)' }}>Aucune ressource disponible pour ce cours.</p>
          ) : (
            <div>
              {course.resources.map((resource) => (
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
                      <strong>{resource.title}</strong>
                      {resource.description && (
                        <p style={{ fontSize: '12px', color: 'var(--gray-600)', margin: '4px 0 0' }}>
                          {resource.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {resource.url && (
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-primary"
                    >
                      <LinkIcon size={16} />
                      Ouvrir
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
