import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { storage } from '../../data/storage';

export default function TakeScheduledExam() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [exam, setExam] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Fonction pour mélanger un tableau (Fisher-Yates)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Générer un examen aléatoire à partir de la banque de questions
  const generateRandomExam = (examData) => {
    const settings = examData.randomSettings;
    const bank = examData.questionBank || [];
    
    if (!settings?.enabled || bank.length === 0) {
      return examData.questions || [];
    }

    let selectedQuestions = [];
    const questionsCount = settings.questionsCount || 10;

    const byDifficulty = settings.byDifficulty || {};
    const hasDistribution = (byDifficulty.easy || 0) + (byDifficulty.medium || 0) + (byDifficulty.hard || 0) > 0;

    if (hasDistribution) {
      ['easy', 'medium', 'hard'].forEach(difficulty => {
        const count = byDifficulty[difficulty] || 0;
        if (count > 0) {
          const questionsOfDifficulty = bank.filter(q => (q.difficulty || 'medium') === difficulty);
          const shuffled = shuffleArray(questionsOfDifficulty);
          selectedQuestions.push(...shuffled.slice(0, count));
        }
      });
    } else {
      const shuffled = shuffleArray(bank);
      selectedQuestions = shuffled.slice(0, Math.min(questionsCount, bank.length));
    }

    if (settings.shuffleQuestions !== false) {
      selectedQuestions = shuffleArray(selectedQuestions);
    }

    if (settings.shuffleOptions !== false) {
      selectedQuestions = selectedQuestions.map(q => {
        if (q.options && q.options.length > 0 && q.type !== 'truefalse') {
          const optionsWithIndex = q.options.map((opt, idx) => ({ opt, idx }));
          const shuffledOptions = shuffleArray(optionsWithIndex);
          
          let newCorrectAnswer = q.correctAnswer;
          let newCorrectAnswers = q.correctAnswers;
          
          if (q.type === 'single') {
            newCorrectAnswer = shuffledOptions.findIndex(o => o.idx === q.correctAnswer);
          } else if (q.type === 'multiple' && q.correctAnswers) {
            newCorrectAnswers = q.correctAnswers.map(ca => 
              shuffledOptions.findIndex(o => o.idx === ca)
            );
          }
          
          return {
            ...q,
            options: shuffledOptions.map(o => o.opt),
            correctAnswer: newCorrectAnswer,
            correctAnswers: newCorrectAnswers
          };
        }
        return q;
      });
    }

    return selectedQuestions.map((q, idx) => ({
      ...q,
      id: `gen_${Date.now()}_${idx}`
    }));
  };

  useEffect(() => {
    const currentStudent = storage.getCurrentStudent();
    if (!currentStudent) {
      navigate('/login');
      return;
    }
    setStudent(currentStudent);

    const foundSchedule = storage.getScheduledExamById(scheduleId);
    if (!foundSchedule) {
      navigate('/student/dashboard');
      return;
    }
    setSchedule(foundSchedule);

    const foundExam = storage.getExamById(foundSchedule.examId);
    if (!foundExam) {
      navigate('/student/dashboard');
      return;
    }
    
    // Vérifier si génération aléatoire est activée
    if (foundExam.randomSettings?.enabled && foundExam.questionBank?.length > 0) {
      const generatedQuestions = generateRandomExam(foundExam);
      setExam({ ...foundExam, questions: generatedQuestions });
    } else {
      setExam(foundExam);
    }
    setTimeLeft(foundExam.duration * 60);
  }, [scheduleId, navigate]);

  const submitExam = useCallback(() => {
    if (submitted || !exam || !student) return;
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
      scheduleId: schedule.id,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      score,
      correctAnswers,
      totalQuestions: exam.questions.length,
      answers
    });

    navigate('/student/dashboard');
  }, [submitted, exam, student, schedule, answers, navigate]);

  useEffect(() => {
    if (submitted || !exam) return;

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
  }, [submitted, exam, submitExam]);

  if (!exam || !student || !schedule) return <div className="container"><p>Chargement...</p></div>;

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

  const question = exam.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / exam.questions.length) * 100;

  return (
    <div>
      <header className="header">
        <div className="container">
          <h1>{exam.title}</h1>
          <div className={getTimerClass()}>
            <Clock size={20} />
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      <div className="container">
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

        <div className="flex flex-between mt-4">
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
              Soumettre
            </button>
          )}
        </div>

        <div className="card mt-4">
          <p style={{ marginBottom: '10px', fontWeight: '600' }}>Navigation :</p>
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
