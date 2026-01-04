import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function CreateExam() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [exam, setExam] = useState({
    title: '',
    description: '',
    duration: 30,
    isActive: true,
    classId: '',
    courseId: courseId || '',
    questions: []
  });

  useEffect(() => {
    setClasses(storage.getClasses());
    setCourses(storage.getCourses());
    
    if (courseId) {
      const foundCourse = storage.getCourseById(courseId);
      if (foundCourse) {
        setCourse(foundCourse);
        setExam(prev => ({ ...prev, courseId, classId: foundCourse.classId }));
      }
    }
  }, [courseId]);

  const addQuestion = () => {
    setExam({
      ...exam,
      questions: [
        ...exam.questions,
        {
          id: `q${Date.now()}`,
          text: '',
          options: ['', '', '', ''],
          correctAnswer: 0
        }
      ]
    });
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...exam.questions];
    updated[index] = { ...updated[index], [field]: value };
    setExam({ ...exam, questions: updated });
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...exam.questions];
    updated[qIndex].options[oIndex] = value;
    setExam({ ...exam, questions: updated });
  };

  const removeQuestion = (index) => {
    const updated = exam.questions.filter((_, i) => i !== index);
    setExam({ ...exam, questions: updated });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (exam.questions.length === 0) {
      alert('Veuillez ajouter au moins une question.');
      return;
    }
    storage.addExam(exam);
    
    if (courseId) {
      navigate(`/teacher/course/${courseId}`);
    } else {
      navigate('/teacher');
    }
  };

  return (
    <div>
      <Header role="teacher" />
      <div className="container">
        <h2 className="mb-4">Créer un nouvel examen</h2>

        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="input-group">
              <label>Titre de l'examen</label>
              <input
                type="text"
                value={exam.title}
                onChange={(e) => setExam({ ...exam, title: e.target.value })}
                placeholder="Ex: Examen de Mathématiques"
                required
              />
            </div>

            <div className="input-group">
              <label>Description</label>
              <textarea
                value={exam.description}
                onChange={(e) => setExam({ ...exam, description: e.target.value })}
                placeholder="Description de l'examen..."
                rows={3}
              />
            </div>

            <div className="input-group">
              <label>Durée (en minutes)</label>
              <input
                type="number"
                value={exam.duration}
                onChange={(e) => setExam({ ...exam, duration: parseInt(e.target.value) })}
                min={5}
                max={180}
                required
              />
            </div>

            {!courseId && (
              <>
                <div className="input-group">
                  <label>Classe (optionnel)</label>
                  <select
                    value={exam.classId}
                    onChange={(e) => setExam({ ...exam, classId: e.target.value, courseId: '' })}
                  >
                    <option value="">-- Sélectionner une classe --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {exam.classId && (
                  <div className="input-group">
                    <label>Cours associé (optionnel)</label>
                    <select
                      value={exam.courseId}
                      onChange={(e) => setExam({ ...exam, courseId: e.target.value })}
                    >
                      <option value="">-- Sélectionner un cours --</option>
                      {courses.filter(c => c.classId === exam.classId).map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {course && (
              <div style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                <strong>Cours :</strong> {course.title}
              </div>
            )}
          </div>

          <div className="flex flex-between flex-center mb-4">
            <h3>Questions ({exam.questions.length})</h3>
            <button type="button" onClick={addQuestion} className="btn btn-secondary">
              <Plus size={18} />
              Ajouter une question
            </button>
          </div>

          {exam.questions.map((question, qIndex) => (
            <div key={question.id} className="card">
              <div className="flex flex-between flex-center mb-4">
                <h4>Question {qIndex + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="btn btn-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="input-group">
                <label>Énoncé de la question</label>
                <textarea
                  value={question.text}
                  onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                  placeholder="Entrez la question..."
                  rows={2}
                  required
                />
              </div>

              <label style={{ marginBottom: '10px', display: 'block', fontWeight: '600' }}>
                Options de réponse
              </label>
              {question.options.map((option, oIndex) => (
                <div key={oIndex} className="flex gap-2 flex-center" style={{ marginBottom: '8px' }}>
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={question.correctAnswer === oIndex}
                    onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    placeholder={`Option ${oIndex + 1}`}
                    style={{ flex: 1 }}
                    required
                  />
                  {question.correctAnswer === oIndex && (
                    <span className="badge badge-success">Correcte</span>
                  )}
                </div>
              ))}
            </div>
          ))}

          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">
              <Save size={18} />
              Enregistrer l'examen
            </button>
            <button type="button" onClick={() => navigate('/teacher')} className="btn btn-secondary">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
