import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, BookOpen, FileText, Plus } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function ClassDetail() {
  const { id } = useParams();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);

  useEffect(() => {
    const foundClass = storage.getClassById(id);
    setClassData(foundClass);
    setStudents(storage.getStudentsByClass(id));
    setCourses(storage.getCoursesByClass(id));
    setExams(storage.getExamsByClass(id));
  }, [id]);

  if (!classData) {
    return (
      <div>
        <Header role="teacher" />
        <div className="container">
          <p>Classe non trouvée.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header role="teacher" />
      <div className="container">
        <Link to="/teacher/classes" className="btn btn-secondary mb-4">
          <ArrowLeft size={18} />
          Retour aux classes
        </Link>

        <div className="card mb-4">
          <h2>{classData.name}</h2>
          <p>{classData.description}</p>
          <span className="badge badge-info">Année: {classData.year}</span>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '30px' }}>
          <div className="card text-center">
            <Users size={40} color="var(--primary)" style={{ marginBottom: '10px' }} />
            <h3 style={{ fontSize: '36px', color: 'var(--primary)' }}>{students.length}</h3>
            <p>Étudiants</p>
          </div>
          <div className="card text-center">
            <BookOpen size={40} color="var(--secondary)" style={{ marginBottom: '10px' }} />
            <h3 style={{ fontSize: '36px', color: 'var(--secondary)' }}>{courses.length}</h3>
            <p>Cours</p>
          </div>
          <div className="card text-center">
            <FileText size={40} color="var(--warning)" style={{ marginBottom: '10px' }} />
            <h3 style={{ fontSize: '36px', color: 'var(--warning)' }}>{exams.length}</h3>
            <p>Examens</p>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="card">
            <div className="flex flex-between flex-center mb-4">
              <h3>Étudiants</h3>
              <Link to={`/teacher/class/${id}/students`} className="btn btn-primary">
                <Plus size={16} />
                Gérer
              </Link>
            </div>
            {students.length === 0 ? (
              <p style={{ color: 'var(--gray-600)' }}>Aucun étudiant inscrit</p>
            ) : (
              <ul style={{ listStyle: 'none' }}>
                {students.slice(0, 5).map(s => (
                  <li key={s.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-200)' }}>
                    {s.firstName} {s.lastName} - {s.email}
                  </li>
                ))}
                {students.length > 5 && (
                  <li style={{ padding: '8px 0', color: 'var(--primary)' }}>
                    +{students.length - 5} autres étudiants...
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="card">
            <div className="flex flex-between flex-center mb-4">
              <h3>Cours</h3>
              <Link to={`/teacher/class/${id}/courses`} className="btn btn-primary">
                <Plus size={16} />
                Gérer
              </Link>
            </div>
            {courses.length === 0 ? (
              <p style={{ color: 'var(--gray-600)' }}>Aucun cours créé</p>
            ) : (
              <ul style={{ listStyle: 'none' }}>
                {courses.map(c => (
                  <li key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-200)' }}>
                    <Link to={`/teacher/course/${c.id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
