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

  const addQuestion = (type = 'single') => {
    let newQuestion = {
      id: `q${Date.now()}`,
      text: '',
      type: type,
      points: 1
    };

    switch (type) {
      case 'single': // QCM réponse unique
        newQuestion.options = ['', '', '', ''];
        newQuestion.correctAnswer = 0;
        break;
      case 'multiple': // QCM réponses multiples
        newQuestion.options = ['', '', '', ''];
        newQuestion.correctAnswers = [];
        break;
      case 'truefalse': // Vrai/Faux
        newQuestion.options = ['Vrai', 'Faux'];
        newQuestion.correctAnswer = 0;
        break;
      case 'open': // Question ouverte
        newQuestion.expectedAnswer = '';
        newQuestion.keywords = [];
        break;
      case 'fill': // Texte à trous
        newQuestion.blanks = [''];
        break;
      default:
        newQuestion.options = ['', '', '', ''];
        newQuestion.correctAnswer = 0;
    }

    setExam({
      ...exam,
      questions: [...exam.questions, newQuestion]
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

  const addOption = (qIndex) => {
    const updated = [...exam.questions];
    updated[qIndex].options.push('');
    setExam({ ...exam, questions: updated });
  };

  const removeOption = (qIndex, oIndex) => {
    const updated = [...exam.questions];
    if (updated[qIndex].options.length > 2) {
      updated[qIndex].options.splice(oIndex, 1);
      if (updated[qIndex].type === 'single' && updated[qIndex].correctAnswer >= oIndex) {
        updated[qIndex].correctAnswer = Math.max(0, updated[qIndex].correctAnswer - 1);
      }
      if (updated[qIndex].type === 'multiple') {
        updated[qIndex].correctAnswers = updated[qIndex].correctAnswers
          .filter(i => i !== oIndex)
          .map(i => i > oIndex ? i - 1 : i);
      }
      setExam({ ...exam, questions: updated });
    }
  };

  const toggleCorrectAnswer = (qIndex, oIndex) => {
    const updated = [...exam.questions];
    const q = updated[qIndex];
    if (q.type === 'multiple') {
      if (q.correctAnswers.includes(oIndex)) {
        q.correctAnswers = q.correctAnswers.filter(i => i !== oIndex);
      } else {
        q.correctAnswers.push(oIndex);
      }
      setExam({ ...exam, questions: updated });
    }
  };

  const addKeyword = (qIndex) => {
    const updated = [...exam.questions];
    updated[qIndex].keywords.push('');
    setExam({ ...exam, questions: updated });
  };

  const updateKeyword = (qIndex, kIndex, value) => {
    const updated = [...exam.questions];
    updated[qIndex].keywords[kIndex] = value;
    setExam({ ...exam, questions: updated });
  };

  const removeKeyword = (qIndex, kIndex) => {
    const updated = [...exam.questions];
    updated[qIndex].keywords.splice(kIndex, 1);
    setExam({ ...exam, questions: updated });
  };

  const removeQuestion = (index) => {
    const updated = exam.questions.filter((_, i) => i !== index);
    setExam({ ...exam, questions: updated });
  };

  const getQuestionTypeLabel = (type) => {
    switch (type) {
      case 'single': return 'QCM (réponse unique)';
      case 'multiple': return 'QCM (réponses multiples)';
      case 'truefalse': return 'Vrai / Faux';
      case 'open': return 'Question ouverte';
      case 'fill': return 'Texte à trous';
      default: return 'QCM';
    }
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
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              <button type="button" onClick={() => addQuestion('single')} className="btn btn-secondary">
                <Plus size={16} /> QCM unique
              </button>
              <button type="button" onClick={() => addQuestion('multiple')} className="btn btn-secondary">
                <Plus size={16} /> QCM multiple
              </button>
              <button type="button" onClick={() => addQuestion('truefalse')} className="btn btn-secondary">
                <Plus size={16} /> Vrai/Faux
              </button>
              <button type="button" onClick={() => addQuestion('open')} className="btn btn-secondary">
                <Plus size={16} /> Question ouverte
              </button>
            </div>
          </div>

          {exam.questions.map((question, qIndex) => (
            <div key={question.id} className="card">
              <div className="flex flex-between flex-center mb-4">
                <div className="flex flex-center gap-2">
                  <h4>Question {qIndex + 1}</h4>
                  <span className="badge badge-info">{getQuestionTypeLabel(question.type)}</span>
                </div>
                <div className="flex gap-2">
                  <div className="input-group" style={{ margin: 0, width: '80px' }}>
                    <input
                      type="number"
                      value={question.points}
                      onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 1)}
                      min={1}
                      style={{ padding: '4px 8px', textAlign: 'center' }}
                      title="Points"
                    />
                  </div>
                  <span style={{ alignSelf: 'center', fontSize: '12px', color: 'var(--gray-600)' }}>pts</span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="btn btn-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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

              {/* QCM Réponse unique */}
              {question.type === 'single' && (
                <>
                  <label style={{ marginBottom: '10px', display: 'block', fontWeight: '600' }}>
                    Options de réponse (sélectionnez la bonne réponse)
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
                      {question.options.length > 2 && (
                        <button type="button" onClick={() => removeOption(qIndex, oIndex)} className="btn btn-danger" style={{ padding: '4px 8px' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => addOption(qIndex)} className="btn btn-secondary" style={{ marginTop: '8px' }}>
                    <Plus size={14} /> Ajouter une option
                  </button>
                </>
              )}

              {/* QCM Réponses multiples */}
              {question.type === 'multiple' && (
                <>
                  <label style={{ marginBottom: '10px', display: 'block', fontWeight: '600' }}>
                    Options de réponse (cochez toutes les bonnes réponses)
                  </label>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex gap-2 flex-center" style={{ marginBottom: '8px' }}>
                      <input
                        type="checkbox"
                        checked={question.correctAnswers?.includes(oIndex)}
                        onChange={() => toggleCorrectAnswer(qIndex, oIndex)}
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                        style={{ flex: 1 }}
                        required
                      />
                      {question.correctAnswers?.includes(oIndex) && (
                        <span className="badge badge-success">Correcte</span>
                      )}
                      {question.options.length > 2 && (
                        <button type="button" onClick={() => removeOption(qIndex, oIndex)} className="btn btn-danger" style={{ padding: '4px 8px' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => addOption(qIndex)} className="btn btn-secondary" style={{ marginTop: '8px' }}>
                    <Plus size={14} /> Ajouter une option
                  </button>
                </>
              )}

              {/* Vrai/Faux */}
              {question.type === 'truefalse' && (
                <>
                  <label style={{ marginBottom: '10px', display: 'block', fontWeight: '600' }}>
                    Sélectionnez la bonne réponse
                  </label>
                  <div className="flex gap-4">
                    <label className="flex flex-center gap-2" style={{ cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={`tf-${qIndex}`}
                        checked={question.correctAnswer === 0}
                        onChange={() => updateQuestion(qIndex, 'correctAnswer', 0)}
                      />
                      <span style={{ fontSize: '16px', fontWeight: question.correctAnswer === 0 ? '600' : '400' }}>Vrai</span>
                    </label>
                    <label className="flex flex-center gap-2" style={{ cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={`tf-${qIndex}`}
                        checked={question.correctAnswer === 1}
                        onChange={() => updateQuestion(qIndex, 'correctAnswer', 1)}
                      />
                      <span style={{ fontSize: '16px', fontWeight: question.correctAnswer === 1 ? '600' : '400' }}>Faux</span>
                    </label>
                  </div>
                </>
              )}

              {/* Question ouverte */}
              {question.type === 'open' && (
                <>
                  <div className="input-group">
                    <label>Réponse attendue (pour référence du correcteur)</label>
                    <textarea
                      value={question.expectedAnswer || ''}
                      onChange={(e) => updateQuestion(qIndex, 'expectedAnswer', e.target.value)}
                      placeholder="Réponse modèle..."
                      rows={3}
                    />
                  </div>
                  <label style={{ marginBottom: '10px', display: 'block', fontWeight: '600' }}>
                    Mots-clés pour correction automatique (optionnel)
                  </label>
                  {question.keywords?.map((keyword, kIndex) => (
                    <div key={kIndex} className="flex gap-2 flex-center" style={{ marginBottom: '8px' }}>
                      <input
                        type="text"
                        value={keyword}
                        onChange={(e) => updateKeyword(qIndex, kIndex, e.target.value)}
                        placeholder={`Mot-clé ${kIndex + 1}`}
                        style={{ flex: 1 }}
                      />
                      <button type="button" onClick={() => removeKeyword(qIndex, kIndex)} className="btn btn-danger" style={{ padding: '4px 8px' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addKeyword(qIndex)} className="btn btn-secondary" style={{ marginTop: '8px' }}>
                    <Plus size={14} /> Ajouter un mot-clé
                  </button>
                  <p style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '8px' }}>
                    Les mots-clés permettent une correction semi-automatique. La réponse de l'étudiant sera vérifiée pour la présence de ces mots.
                  </p>
                </>
              )}
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
