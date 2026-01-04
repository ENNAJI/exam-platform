import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const found = storage.getExamById(id);
    if (found && found.isActive) {
      setExam(found);
      setTimeLeft(found.duration * 60);
    } else {
      navigate('/student');
    }
  }, [id, navigate]);

  const submitExam = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);

    let correctAnswers = 0;
    exam.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / exam.questions.length) * 100);

    storage.saveResult({
      examId: exam.id,
      studentName,
      score,
      correctAnswers,
      totalQuestions: exam.questions.length,
      answers
    });

    navigate(`/student/result/${exam.id}`, {
      state: { score, correctAnswers, totalQuestions: exam.questions.length }
    });
  }, [submitted, exam, answers, studentName, navigate]);

  useEffect(() => {
    if (!started || submitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, submitted, submitExam]);

  if (!exam) return <div>Chargement...</div>;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerClass = () => {
    if (timeLeft <= 60) return 'timer danger';
    if (timeLeft <= 300) return 'timer warning';
    return 'timer';
  };

  const handleAnswer = (optionIndex) => {
    setAnswers({ ...answers, [currentQuestion]: optionIndex });
  };

  const startExam = (e) => {
    e.preventDefault();
    if (studentName.trim()) {
      setStarted(true);
    }
  };

  if (!started) {
    return (
      <div>
        <Header role="student" />
        <div className="container">
          <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h2 className="mb-4">{exam.title}</h2>
            <p className="mb-4">{exam.description}</p>
            
            <div className="flex gap-4 mb-4">
              <span className="badge badge-info">
                <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {exam.duration} minutes
              </span>
              <span className="badge badge-info">
                {exam.questions.length} questions
              </span>
            </div>

            <form onSubmit={startExam}>
              <div className="input-group">
                <label>Votre nom complet</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Entrez votre nom..."
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Commencer l'examen
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const question = exam.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / exam.questions.length) * 100;

  return (
    <div>
      <Header role="student" />
      <div className="container">
        <div className="flex flex-between flex-center mb-4">
          <h2>{exam.title}</h2>
          <div className={getTimerClass()}>
            <Clock size={20} />
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="card">
          <div className="flex flex-between flex-center mb-4">
            <span className="badge badge-info">
              Question {currentQuestion + 1} / {exam.questions.length}
            </span>
          </div>

          <h3 className="mb-4">{question.text}</h3>

          <div>
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`option-item ${answers[currentQuestion] === index ? 'selected' : ''}`}
                onClick={() => handleAnswer(index)}
              >
                <input
                  type="radio"
                  checked={answers[currentQuestion] === index}
                  onChange={() => handleAnswer(index)}
                />
                <span>{option}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-between">
          <button
            onClick={() => setCurrentQuestion(prev => prev - 1)}
            disabled={currentQuestion === 0}
            className="btn btn-secondary"
          >
            <ChevronLeft size={18} />
            Précédent
          </button>

          {currentQuestion < exam.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion(prev => prev + 1)}
              className="btn btn-primary"
            >
              Suivant
              <ChevronRight size={18} />
            </button>
          ) : (
            <button onClick={submitExam} className="btn btn-success">
              <Send size={18} />
              Soumettre l'examen
            </button>
          )}
        </div>

        <div className="card mt-4">
          <p style={{ marginBottom: '10px', fontWeight: '600' }}>Navigation rapide :</p>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            {exam.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className="btn"
                style={{
                  padding: '8px 12px',
                  background: answers[index] !== undefined 
                    ? 'var(--secondary)' 
                    : currentQuestion === index 
                      ? 'var(--primary)' 
                      : 'var(--gray-200)',
                  color: answers[index] !== undefined || currentQuestion === index 
                    ? 'white' 
                    : 'var(--gray-700)'
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
