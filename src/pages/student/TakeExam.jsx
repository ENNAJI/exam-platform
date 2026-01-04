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

    // Si répartition par difficulté est définie
    const byDifficulty = settings.byDifficulty || {};
    const hasDistribution = (byDifficulty.easy || 0) + (byDifficulty.medium || 0) + (byDifficulty.hard || 0) > 0;

    if (hasDistribution) {
      // Sélectionner par difficulté
      ['easy', 'medium', 'hard'].forEach(difficulty => {
        const count = byDifficulty[difficulty] || 0;
        if (count > 0) {
          const questionsOfDifficulty = bank.filter(q => (q.difficulty || 'medium') === difficulty);
          const shuffled = shuffleArray(questionsOfDifficulty);
          selectedQuestions.push(...shuffled.slice(0, count));
        }
      });
    } else {
      // Sélection aléatoire simple
      const shuffled = shuffleArray(bank);
      selectedQuestions = shuffled.slice(0, Math.min(questionsCount, bank.length));
    }

    // Mélanger l'ordre des questions si activé
    if (settings.shuffleQuestions !== false) {
      selectedQuestions = shuffleArray(selectedQuestions);
    }

    // Mélanger les options de chaque question si activé
    if (settings.shuffleOptions !== false) {
      selectedQuestions = selectedQuestions.map(q => {
        if (q.options && q.options.length > 0 && q.type !== 'truefalse') {
          const optionsWithIndex = q.options.map((opt, idx) => ({ opt, idx }));
          const shuffledOptions = shuffleArray(optionsWithIndex);
          
          // Mettre à jour les réponses correctes
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

    // Assigner de nouveaux IDs pour éviter les conflits
    return selectedQuestions.map((q, idx) => ({
      ...q,
      id: `gen_${Date.now()}_${idx}`
    }));
  };

  useEffect(() => {
    const found = storage.getExamById(id);
    if (found && found.isActive) {
      // Vérifier si génération aléatoire est activée
      if (found.randomSettings?.enabled && found.questionBank?.length > 0) {
        const generatedQuestions = generateRandomExam(found);
        setExam({ ...found, questions: generatedQuestions });
      } else {
        setExam(found);
      }
      setTimeLeft(found.duration * 60);
    } else {
      navigate('/student');
    }
  }, [id, navigate]);

  const submitExam = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);

    let totalPoints = 0;
    let earnedPoints = 0;
    const questionResults = [];

    exam.questions.forEach((q, index) => {
      const questionPoints = q.points || 1;
      totalPoints += questionPoints;
      let isCorrect = false;
      let partialScore = 0;

      switch (q.type) {
        case 'single':
        case 'truefalse':
        default:
          isCorrect = answers[index] === q.correctAnswer;
          if (isCorrect) earnedPoints += questionPoints;
          break;

        case 'multiple':
          const studentAnswers = answers[index] || [];
          const correctAnswersList = q.correctAnswers || [];
          if (correctAnswersList.length > 0) {
            const correctSelected = studentAnswers.filter(a => correctAnswersList.includes(a)).length;
            const incorrectSelected = studentAnswers.filter(a => !correctAnswersList.includes(a)).length;
            partialScore = Math.max(0, (correctSelected - incorrectSelected) / correctAnswersList.length);
            earnedPoints += questionPoints * partialScore;
            isCorrect = partialScore === 1;
          }
          break;

        case 'open':
          const studentAnswer = (answers[index] || '').toLowerCase().trim();
          const keywords = q.keywords || [];
          if (keywords.length > 0) {
            const matchedKeywords = keywords.filter(kw => 
              studentAnswer.includes(kw.toLowerCase())
            ).length;
            partialScore = matchedKeywords / keywords.length;
            earnedPoints += questionPoints * partialScore;
            isCorrect = partialScore >= 0.5;
          } else {
            // Sans mots-clés, la question nécessite une correction manuelle
            questionResults.push({ questionId: q.id, needsManualReview: true, studentAnswer });
          }
          break;
      }

      questionResults.push({
        questionId: q.id,
        type: q.type || 'single',
        studentAnswer: answers[index],
        isCorrect,
        partialScore,
        points: questionPoints
      });
    });

    const score = Math.round((earnedPoints / totalPoints) * 100);

    storage.saveResult({
      examId: exam.id,
      studentName,
      score,
      earnedPoints,
      totalPoints,
      totalQuestions: exam.questions.length,
      answers,
      questionResults
    });

    navigate(`/student/result/${exam.id}`, {
      state: { score, earnedPoints, totalPoints, totalQuestions: exam.questions.length }
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

  const handleMultipleAnswer = (optionIndex) => {
    const current = answers[currentQuestion] || [];
    if (current.includes(optionIndex)) {
      setAnswers({ ...answers, [currentQuestion]: current.filter(i => i !== optionIndex) });
    } else {
      setAnswers({ ...answers, [currentQuestion]: [...current, optionIndex] });
    }
  };

  const handleOpenAnswer = (text) => {
    setAnswers({ ...answers, [currentQuestion]: text });
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

          {/* QCM Réponse unique ou Vrai/Faux */}
          {(question.type === 'single' || question.type === 'truefalse' || !question.type) && (
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
          )}

          {/* QCM Réponses multiples */}
          {question.type === 'multiple' && (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: '12px' }}>
                Plusieurs réponses possibles
              </p>
              {question.options.map((option, index) => (
                <div
                  key={index}
                  className={`option-item ${(answers[currentQuestion] || []).includes(index) ? 'selected' : ''}`}
                  onClick={() => handleMultipleAnswer(index)}
                >
                  <input
                    type="checkbox"
                    checked={(answers[currentQuestion] || []).includes(index)}
                    onChange={() => handleMultipleAnswer(index)}
                  />
                  <span>{option}</span>
                </div>
              ))}
            </div>
          )}

          {/* Question ouverte */}
          {question.type === 'open' && (
            <div>
              <textarea
                value={answers[currentQuestion] || ''}
                onChange={(e) => handleOpenAnswer(e.target.value)}
                placeholder="Écrivez votre réponse ici..."
                rows={6}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--gray-300)', fontSize: '15px' }}
              />
            </div>
          )}
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
