import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, Download, Upload, FileSpreadsheet, Database, Settings, Shuffle, ChevronDown, ChevronRight } from 'lucide-react';
import Header from '../../components/Header';
import { storage } from '../../data/storage';

export default function EditExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const importFileRef = useRef(null);
  const questionBankRef = useRef(null);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [showRandomSettings, setShowRandomSettings] = useState(false);

  useEffect(() => {
    const found = storage.getExamById(id);
    if (found) {
      setExam(found);
    } else {
      navigate('/teacher');
    }
  }, [id, navigate]);

  if (!exam) return <div>Chargement...</div>;

  const addQuestion = (type = 'single') => {
    let newQuestion = {
      id: `q${Date.now()}`,
      text: '',
      type: type,
      points: 1
    };

    switch (type) {
      case 'single':
        newQuestion.options = ['', '', '', ''];
        newQuestion.correctAnswer = 0;
        break;
      case 'multiple':
        newQuestion.options = ['', '', '', ''];
        newQuestion.correctAnswers = [];
        break;
      case 'truefalse':
        newQuestion.options = ['Vrai', 'Faux'];
        newQuestion.correctAnswer = 0;
        break;
      case 'open':
        newQuestion.expectedAnswer = '';
        newQuestion.keywords = [];
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
      default: return 'QCM';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (exam.questions.length === 0) {
      alert('Veuillez ajouter au moins une question.');
      return;
    }
    storage.updateExam(id, exam);
    navigate('/teacher');
  };

  // Exporter le modèle CSV
  const exportTemplate = () => {
    const headers = ['type', 'question', 'option1', 'option2', 'option3', 'option4', 'correctAnswer', 'points'];
    const exampleRows = [
      ['single', 'Quelle est la capitale de la France ?', 'Paris', 'Lyon', 'Marseille', 'Bordeaux', '1', '1'],
      ['multiple', 'Quels sont des langages de programmation ?', 'Java', 'HTML', 'Python', 'CSS', '1;3', '2'],
      ['truefalse', 'Le soleil est une étoile', 'Vrai', 'Faux', '', '', '1', '1'],
      ['open', 'Expliquez le cycle de l\'eau', '', '', '', '', 'évaporation;condensation;précipitation', '3']
    ];
    
    const csvContent = [
      headers.join(';'),
      ...exampleRows.map(row => row.join(';'))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `modele_questions_${exam.title.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Exporter les questions existantes
  const exportQuestions = () => {
    if (exam.questions.length === 0) {
      alert('Aucune question à exporter');
      return;
    }
    
    const headers = ['type', 'question', 'option1', 'option2', 'option3', 'option4', 'correctAnswer', 'points'];
    const rows = exam.questions.map(q => {
      const options = q.options || [];
      let correctAnswer = '';
      
      if (q.type === 'single' || q.type === 'truefalse') {
        correctAnswer = String((q.correctAnswer || 0) + 1);
      } else if (q.type === 'multiple') {
        correctAnswer = (q.correctAnswers || []).map(i => i + 1).join(';');
      } else if (q.type === 'open') {
        correctAnswer = (q.keywords || []).join(';');
      }
      
      return [
        q.type || 'single',
        q.text || '',
        options[0] || '',
        options[1] || '',
        options[2] || '',
        options[3] || '',
        correctAnswer,
        String(q.points || 1)
      ].join(';');
    });
    
    const csvContent = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `questions_${exam.title.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Importer les questions depuis CSV
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          alert('Le fichier est vide ou invalide');
          return;
        }
        
        // Ignorer la ligne d'en-tête
        const dataLines = lines.slice(1);
        const importedQuestions = [];
        
        dataLines.forEach((line, index) => {
          const cols = line.split(';').map(c => c.trim());
          if (cols.length < 2) return;
          
          const type = cols[0]?.toLowerCase() || 'single';
          const text = cols[1] || '';
          const options = [cols[2], cols[3], cols[4], cols[5]].filter(o => o && o.trim());
          const correctAnswerStr = cols[6] || '1';
          const points = parseInt(cols[7]) || 1;
          
          let question = {
            id: `q${Date.now()}_${index}`,
            type: type,
            text: text,
            points: points
          };
          
          switch (type) {
            case 'single':
              question.options = options.length >= 2 ? options : ['Option 1', 'Option 2'];
              question.correctAnswer = Math.max(0, parseInt(correctAnswerStr) - 1) || 0;
              break;
            case 'multiple':
              question.options = options.length >= 2 ? options : ['Option 1', 'Option 2'];
              question.correctAnswers = correctAnswerStr.split(';')
                .map(s => parseInt(s.trim()) - 1)
                .filter(n => !isNaN(n) && n >= 0);
              break;
            case 'truefalse':
              question.options = ['Vrai', 'Faux'];
              question.correctAnswer = correctAnswerStr === '2' ? 1 : 0;
              break;
            case 'open':
              question.expectedAnswer = '';
              question.keywords = correctAnswerStr.split(';').map(k => k.trim()).filter(k => k);
              break;
            default:
              question.type = 'single';
              question.options = options.length >= 2 ? options : ['Option 1', 'Option 2'];
              question.correctAnswer = 0;
          }
          
          if (text.trim()) {
            importedQuestions.push(question);
          }
        });
        
        if (importedQuestions.length === 0) {
          alert('Aucune question valide trouvée dans le fichier');
          return;
        }
        
        const confirmReplace = exam.questions.length > 0 
          ? window.confirm(`${importedQuestions.length} questions trouvées. Voulez-vous remplacer les questions existantes ? (Annuler pour les ajouter)`)
          : false;
        
        if (confirmReplace) {
          setExam({ ...exam, questions: importedQuestions });
        } else {
          setExam({ ...exam, questions: [...exam.questions, ...importedQuestions] });
        }
        
        alert(`${importedQuestions.length} questions importées avec succès !`);
        
      } catch (error) {
        console.error('Erreur import:', error);
        alert('Erreur lors de l\'import du fichier');
      }
    };
    
    reader.readAsText(file);
    if (importFileRef.current) importFileRef.current.value = '';
  };

  // Importer une banque de questions
  const handleImportQuestionBank = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          alert('Le fichier est vide ou invalide');
          return;
        }
        
        const dataLines = lines.slice(1);
        const importedQuestions = [];
        
        dataLines.forEach((line, index) => {
          const cols = line.split(';').map(c => c.trim());
          if (cols.length < 2) return;
          
          const type = cols[0]?.toLowerCase() || 'single';
          const text = cols[1] || '';
          const options = [cols[2], cols[3], cols[4], cols[5]].filter(o => o && o.trim());
          const correctAnswerStr = cols[6] || '1';
          const points = parseInt(cols[7]) || 1;
          const category = cols[8] || 'Général';
          const difficulty = cols[9] || 'medium';
          
          let question = {
            id: `qb${Date.now()}_${index}`,
            type: type,
            text: text,
            points: points,
            category: category,
            difficulty: difficulty
          };
          
          switch (type) {
            case 'single':
              question.options = options.length >= 2 ? options : ['Option 1', 'Option 2'];
              question.correctAnswer = Math.max(0, parseInt(correctAnswerStr) - 1) || 0;
              break;
            case 'multiple':
              question.options = options.length >= 2 ? options : ['Option 1', 'Option 2'];
              question.correctAnswers = correctAnswerStr.split(';')
                .map(s => parseInt(s.trim()) - 1)
                .filter(n => !isNaN(n) && n >= 0);
              break;
            case 'truefalse':
              question.options = ['Vrai', 'Faux'];
              question.correctAnswer = correctAnswerStr === '2' ? 1 : 0;
              break;
            case 'open':
              question.expectedAnswer = '';
              question.keywords = correctAnswerStr.split(';').map(k => k.trim()).filter(k => k);
              break;
            default:
              question.type = 'single';
              question.options = options.length >= 2 ? options : ['Option 1', 'Option 2'];
              question.correctAnswer = 0;
          }
          
          if (text.trim()) {
            importedQuestions.push(question);
          }
        });
        
        if (importedQuestions.length === 0) {
          alert('Aucune question valide trouvée dans le fichier');
          return;
        }
        
        const currentBank = exam.questionBank || [];
        setExam({ ...exam, questionBank: [...currentBank, ...importedQuestions] });
        alert(`${importedQuestions.length} questions ajoutées à la banque !`);
        
      } catch (error) {
        console.error('Erreur import banque:', error);
        alert('Erreur lors de l\'import du fichier');
      }
    };
    
    reader.readAsText(file);
    if (questionBankRef.current) questionBankRef.current.value = '';
  };

  // Exporter le modèle de banque de questions
  const exportQuestionBankTemplate = () => {
    const headers = ['type', 'question', 'option1', 'option2', 'option3', 'option4', 'correctAnswer', 'points', 'category', 'difficulty'];
    const exampleRows = [
      ['single', 'Quelle est la capitale de la France ?', 'Paris', 'Lyon', 'Marseille', 'Bordeaux', '1', '1', 'Géographie', 'easy'],
      ['single', 'Quel est le plus grand océan ?', 'Atlantique', 'Pacifique', 'Indien', 'Arctique', '2', '1', 'Géographie', 'easy'],
      ['multiple', 'Quels sont des langages de programmation ?', 'Java', 'HTML', 'Python', 'CSS', '1;3', '2', 'Informatique', 'medium'],
      ['truefalse', 'Le soleil est une étoile', 'Vrai', 'Faux', '', '', '1', '1', 'Sciences', 'easy'],
      ['open', 'Expliquez le cycle de l\'eau', '', '', '', '', 'évaporation;condensation', '3', 'Sciences', 'hard']
    ];
    
    const csvContent = [
      headers.join(';'),
      ...exampleRows.map(row => row.join(';'))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `banque_questions_modele.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Supprimer une question de la banque
  const removeFromBank = (questionId) => {
    const updatedBank = (exam.questionBank || []).filter(q => q.id !== questionId);
    setExam({ ...exam, questionBank: updatedBank });
  };

  // Ajouter une question de la banque à l'examen
  const addFromBankToExam = (question) => {
    const newQuestion = { ...question, id: `q${Date.now()}` };
    setExam({ ...exam, questions: [...exam.questions, newQuestion] });
  };

  // Mettre à jour les paramètres de génération aléatoire
  const updateRandomSettings = (field, value) => {
    const currentSettings = exam.randomSettings || {
      enabled: false,
      questionsCount: 10,
      shuffleQuestions: true,
      shuffleOptions: true,
      byCategory: {},
      byDifficulty: { easy: 0, medium: 0, hard: 0 }
    };
    setExam({ ...exam, randomSettings: { ...currentSettings, [field]: value } });
  };

  // Obtenir les catégories uniques de la banque
  const getCategories = () => {
    const bank = exam.questionBank || [];
    return [...new Set(bank.map(q => q.category || 'Général'))];
  };

  // Obtenir le nombre de questions par difficulté
  const getQuestionsByDifficulty = (difficulty) => {
    return (exam.questionBank || []).filter(q => (q.difficulty || 'medium') === difficulty).length;
  };

  return (
    <div>
      <Header role="teacher" />
      <div className="container">
        <h2 className="mb-4">Modifier l'examen</h2>

        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="input-group">
              <label>Titre de l'examen</label>
              <input
                type="text"
                value={exam.title}
                onChange={(e) => setExam({ ...exam, title: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Description</label>
              <textarea
                value={exam.description}
                onChange={(e) => setExam({ ...exam, description: e.target.value })}
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
          </div>

          {/* Section Import/Export */}
          <div className="card" style={{ background: 'var(--gray-50)', marginBottom: '20px' }}>
            <div className="flex flex-between flex-center" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h4 style={{ marginBottom: '4px' }}><FileSpreadsheet size={18} style={{ display: 'inline', marginRight: '8px' }} />Import / Export CSV</h4>
                <p style={{ fontSize: '12px', color: 'var(--gray-600)', margin: 0 }}>
                  Importez ou exportez les questions au format CSV (compatible Excel)
                </p>
              </div>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                <button type="button" onClick={exportTemplate} className="btn btn-secondary" style={{ fontSize: '13px' }}>
                  <Download size={14} /> Télécharger modèle
                </button>
                <button type="button" onClick={exportQuestions} className="btn btn-secondary" style={{ fontSize: '13px' }} disabled={exam.questions.length === 0}>
                  <Download size={14} /> Exporter questions
                </button>
                <label className="btn btn-primary" style={{ fontSize: '13px', cursor: 'pointer', margin: 0 }}>
                  <Upload size={14} /> Importer CSV
                  <input 
                    ref={importFileRef}
                    type="file" 
                    accept=".csv,.txt"
                    onChange={handleImport}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
            <div style={{ marginTop: '12px', padding: '12px', background: 'white', borderRadius: '8px', fontSize: '12px' }}>
              <strong>Format du fichier CSV :</strong>
              <table style={{ width: '100%', marginTop: '8px', fontSize: '11px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--gray-100)' }}>
                    <th style={{ padding: '6px', border: '1px solid var(--gray-200)', textAlign: 'left' }}>Colonne</th>
                    <th style={{ padding: '6px', border: '1px solid var(--gray-200)', textAlign: 'left' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={{ padding: '4px 6px', border: '1px solid var(--gray-200)' }}>type</td><td style={{ padding: '4px 6px', border: '1px solid var(--gray-200)' }}>single, multiple, truefalse, open</td></tr>
                  <tr><td style={{ padding: '4px 6px', border: '1px solid var(--gray-200)' }}>question</td><td style={{ padding: '4px 6px', border: '1px solid var(--gray-200)' }}>Énoncé de la question</td></tr>
                  <tr><td style={{ padding: '4px 6px', border: '1px solid var(--gray-200)' }}>option1-4</td><td style={{ padding: '4px 6px', border: '1px solid var(--gray-200)' }}>Options de réponse</td></tr>
                  <tr><td style={{ padding: '4px 6px', border: '1px solid var(--gray-200)' }}>correctAnswer</td><td style={{ padding: '4px 6px', border: '1px solid var(--gray-200)' }}>N° réponse(s) correcte(s) : 1, 2, 3... ou 1;3 pour multiple</td></tr>
                  <tr><td style={{ padding: '4px 6px', border: '1px solid var(--gray-200)' }}>points</td><td style={{ padding: '4px 6px', border: '1px solid var(--gray-200)' }}>Nombre de points</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section Banque de Questions */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div 
              onClick={() => setShowQuestionBank(!showQuestionBank)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <div className="flex flex-center gap-2">
                {showQuestionBank ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <Database size={18} color="var(--primary)" />
                <h4 style={{ margin: 0 }}>Banque de Questions ({(exam.questionBank || []).length})</h4>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                Cliquez pour {showQuestionBank ? 'réduire' : 'développer'}
              </span>
            </div>
            
            {showQuestionBank && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: '12px' }}>
                  Importez une banque de questions pour générer des examens aléatoires. Chaque étudiant recevra un examen différent.
                </p>
                
                <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
                  <button type="button" onClick={exportQuestionBankTemplate} className="btn btn-secondary" style={{ fontSize: '13px' }}>
                    <Download size={14} /> Télécharger modèle banque
                  </button>
                  <label className="btn btn-primary" style={{ fontSize: '13px', cursor: 'pointer', margin: 0 }}>
                    <Upload size={14} /> Importer banque CSV
                    <input 
                      ref={questionBankRef}
                      type="file" 
                      accept=".csv,.txt"
                      onChange={handleImportQuestionBank}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {(exam.questionBank || []).length > 0 && (
                    <button type="button" onClick={() => setExam({ ...exam, questionBank: [] })} className="btn btn-danger" style={{ fontSize: '13px' }}>
                      <Trash2 size={14} /> Vider la banque
                    </button>
                  )}
                </div>

                {/* Liste des questions de la banque */}
                {(exam.questionBank || []).length > 0 && (
                  <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--gray-200)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--gray-100)', position: 'sticky', top: 0 }}>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>Question</th>
                          <th style={{ padding: '8px', textAlign: 'center', width: '80px', borderBottom: '1px solid var(--gray-200)' }}>Type</th>
                          <th style={{ padding: '8px', textAlign: 'center', width: '80px', borderBottom: '1px solid var(--gray-200)' }}>Catégorie</th>
                          <th style={{ padding: '8px', textAlign: 'center', width: '70px', borderBottom: '1px solid var(--gray-200)' }}>Difficulté</th>
                          <th style={{ padding: '8px', textAlign: 'center', width: '50px', borderBottom: '1px solid var(--gray-200)' }}>Pts</th>
                          <th style={{ padding: '8px', textAlign: 'center', width: '100px', borderBottom: '1px solid var(--gray-200)' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(exam.questionBank || []).map((q, idx) => (
                          <tr key={q.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                            <td style={{ padding: '8px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.text}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <span className={`badge badge-${q.type === 'open' ? 'warning' : 'info'}`} style={{ fontSize: '10px' }}>
                                {q.type === 'single' ? 'QCM' : q.type === 'multiple' ? 'Multi' : q.type === 'truefalse' ? 'V/F' : 'Ouv.'}
                              </span>
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center', fontSize: '11px' }}>{q.category || 'Général'}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <span style={{ 
                                padding: '2px 6px', 
                                borderRadius: '10px', 
                                fontSize: '10px',
                                background: q.difficulty === 'easy' ? 'var(--success-light)' : q.difficulty === 'hard' ? 'var(--danger-light)' : 'var(--warning-light)',
                                color: q.difficulty === 'easy' ? 'var(--success)' : q.difficulty === 'hard' ? 'var(--danger)' : 'var(--warning-dark)'
                              }}>
                                {q.difficulty === 'easy' ? 'Facile' : q.difficulty === 'hard' ? 'Difficile' : 'Moyen'}
                              </span>
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{q.points}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <button type="button" onClick={() => addFromBankToExam(q)} className="btn btn-primary" style={{ padding: '2px 6px', fontSize: '10px', marginRight: '4px' }}>
                                <Plus size={10} />
                              </button>
                              <button type="button" onClick={() => removeFromBank(q.id)} className="btn btn-danger" style={{ padding: '2px 6px', fontSize: '10px' }}>
                                <Trash2 size={10} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section Paramètres de Génération Aléatoire */}
          <div className="card" style={{ marginBottom: '20px', border: (exam.randomSettings?.enabled) ? '2px solid var(--primary)' : '1px solid var(--gray-200)' }}>
            <div 
              onClick={() => setShowRandomSettings(!showRandomSettings)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <div className="flex flex-center gap-2">
                {showRandomSettings ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <Shuffle size={18} color="var(--secondary)" />
                <h4 style={{ margin: 0 }}>Génération Aléatoire</h4>
                {exam.randomSettings?.enabled && (
                  <span className="badge badge-success" style={{ marginLeft: '8px' }}>Activé</span>
                )}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                Cliquez pour {showRandomSettings ? 'réduire' : 'configurer'}
              </span>
            </div>
            
            {showRandomSettings && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ background: 'var(--info-light)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--info-dark)' }}>
                    <Settings size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Quand activé, chaque étudiant recevra un examen généré aléatoirement à partir de la banque de questions.
                  </p>
                </div>

                <div className="input-group">
                  <label className="flex flex-center gap-2" style={{ cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={exam.randomSettings?.enabled || false}
                      onChange={(e) => updateRandomSettings('enabled', e.target.checked)}
                    />
                    <strong>Activer la génération aléatoire</strong>
                  </label>
                </div>

                {exam.randomSettings?.enabled && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                      <div className="input-group">
                        <label>Nombre de questions par examen</label>
                        <input 
                          type="number"
                          value={exam.randomSettings?.questionsCount || 10}
                          onChange={(e) => updateRandomSettings('questionsCount', parseInt(e.target.value) || 10)}
                          min={1}
                          max={(exam.questionBank || []).length || 100}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                          Max: {(exam.questionBank || []).length} questions disponibles
                        </span>
                      </div>

                      <div className="input-group">
                        <label>Options</label>
                        <label className="flex flex-center gap-2" style={{ cursor: 'pointer', marginBottom: '8px' }}>
                          <input 
                            type="checkbox"
                            checked={exam.randomSettings?.shuffleQuestions !== false}
                            onChange={(e) => updateRandomSettings('shuffleQuestions', e.target.checked)}
                          />
                          Mélanger l'ordre des questions
                        </label>
                        <label className="flex flex-center gap-2" style={{ cursor: 'pointer' }}>
                          <input 
                            type="checkbox"
                            checked={exam.randomSettings?.shuffleOptions !== false}
                            onChange={(e) => updateRandomSettings('shuffleOptions', e.target.checked)}
                          />
                          Mélanger l'ordre des options
                        </label>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Répartition par difficulté (optionnel)</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <div className="input-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '12px' }}>Facile ({getQuestionsByDifficulty('easy')} dispo.)</label>
                          <input 
                            type="number"
                            value={exam.randomSettings?.byDifficulty?.easy || 0}
                            onChange={(e) => updateRandomSettings('byDifficulty', { 
                              ...exam.randomSettings?.byDifficulty, 
                              easy: parseInt(e.target.value) || 0 
                            })}
                            min={0}
                            max={getQuestionsByDifficulty('easy')}
                          />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '12px' }}>Moyen ({getQuestionsByDifficulty('medium')} dispo.)</label>
                          <input 
                            type="number"
                            value={exam.randomSettings?.byDifficulty?.medium || 0}
                            onChange={(e) => updateRandomSettings('byDifficulty', { 
                              ...exam.randomSettings?.byDifficulty, 
                              medium: parseInt(e.target.value) || 0 
                            })}
                            min={0}
                            max={getQuestionsByDifficulty('medium')}
                          />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '12px' }}>Difficile ({getQuestionsByDifficulty('hard')} dispo.)</label>
                          <input 
                            type="number"
                            value={exam.randomSettings?.byDifficulty?.hard || 0}
                            onChange={(e) => updateRandomSettings('byDifficulty', { 
                              ...exam.randomSettings?.byDifficulty, 
                              hard: parseInt(e.target.value) || 0 
                            })}
                            min={0}
                            max={getQuestionsByDifficulty('hard')}
                          />
                        </div>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '4px' }}>
                        Laissez à 0 pour ignorer la difficulté et piocher aléatoirement.
                      </p>
                    </div>
                  </>
                )}
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
                      value={question.points || 1}
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
                  rows={2}
                  required
                />
              </div>

              {/* QCM Réponse unique */}
              {(question.type === 'single' || !question.type) && (
                <>
                  <label style={{ marginBottom: '10px', display: 'block', fontWeight: '600' }}>
                    Options de réponse (sélectionnez la bonne réponse)
                  </label>
                  {question.options?.map((option, oIndex) => (
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
                  {question.options?.map((option, oIndex) => (
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
                </>
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">
              <Save size={18} />
              Enregistrer les modifications
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
