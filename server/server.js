import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Dossier pour les données
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Fichiers de données
const FILES = {
  teachers: path.join(DATA_DIR, 'teachers.json'),
  students: path.join(DATA_DIR, 'students.json'),
  classes: path.join(DATA_DIR, 'classes.json'),
  courses: path.join(DATA_DIR, 'courses.json'),
  exams: path.join(DATA_DIR, 'exams.json'),
  establishments: path.join(DATA_DIR, 'establishments.json'),
  results: path.join(DATA_DIR, 'results.json'),
  notes: path.join(DATA_DIR, 'notes.json')
};

// Initialiser les fichiers s'ils n'existent pas
Object.values(FILES).forEach(file => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, '[]', 'utf8');
  }
});

// Fonctions utilitaires
const readData = (file) => {
  try {
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeData = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
};

// ==================== ROUTE RACINE ====================
app.get('/', (req, res) => {
  res.json({
    name: 'Exam Platform API',
    version: '1.0',
    status: 'running',
    endpoints: {
      teachers: '/api/teachers',
      students: '/api/students',
      classes: '/api/classes',
      courses: '/api/courses',
      exams: '/api/exams',
      establishments: '/api/establishments',
      results: '/api/results',
      notes: '/api/notes',
      sync: {
        export: '/api/sync/export',
        import: '/api/sync/import'
      }
    }
  });
});

// ==================== ROUTES TEACHERS ====================
app.get('/api/teachers', (req, res) => {
  res.json(readData(FILES.teachers));
});

app.post('/api/teachers', (req, res) => {
  const teachers = readData(FILES.teachers);
  const newTeacher = {
    ...req.body,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  teachers.push(newTeacher);
  writeData(FILES.teachers, teachers);
  res.json(newTeacher);
});

app.put('/api/teachers/:id', (req, res) => {
  const teachers = readData(FILES.teachers);
  const index = teachers.findIndex(t => t.id === req.params.id);
  if (index !== -1) {
    teachers[index] = { ...teachers[index], ...req.body };
    writeData(FILES.teachers, teachers);
    res.json(teachers[index]);
  } else {
    res.status(404).json({ error: 'Teacher not found' });
  }
});

app.get('/api/teachers/email/:email', (req, res) => {
  const teachers = readData(FILES.teachers);
  const teacher = teachers.find(t => t.email.toLowerCase() === req.params.email.toLowerCase());
  res.json(teacher || null);
});

// ==================== ROUTES STUDENTS ====================
app.get('/api/students', (req, res) => {
  res.json(readData(FILES.students));
});

app.post('/api/students', (req, res) => {
  const students = readData(FILES.students);
  const token = Math.random().toString(36).substring(2, 15);
  const newStudent = {
    ...req.body,
    id: Date.now().toString(),
    token,
    createdAt: new Date().toISOString(),
    isActive: true
  };
  students.push(newStudent);
  writeData(FILES.students, students);
  res.json(newStudent);
});

app.put('/api/students/:id', (req, res) => {
  const students = readData(FILES.students);
  const index = students.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    students[index] = { ...students[index], ...req.body };
    writeData(FILES.students, students);
    res.json(students[index]);
  } else {
    res.status(404).json({ error: 'Student not found' });
  }
});

app.delete('/api/students/:id', (req, res) => {
  let students = readData(FILES.students);
  students = students.filter(s => s.id !== req.params.id);
  writeData(FILES.students, students);
  res.json({ success: true });
});

app.get('/api/students/email/:email', (req, res) => {
  const students = readData(FILES.students);
  const student = students.find(s => s.email.toLowerCase() === req.params.email.toLowerCase());
  res.json(student || null);
});

app.get('/api/students/token/:token', (req, res) => {
  const students = readData(FILES.students);
  const student = students.find(s => s.token === req.params.token);
  res.json(student || null);
});

app.get('/api/students/login/:login', (req, res) => {
  const students = readData(FILES.students);
  const normalizedLogin = req.params.login.toLowerCase().trim();
  const student = students.find(s => {
    const expectedLogin = `${s.firstName}.${s.lastName}`.toLowerCase().replace(/\s+/g, '');
    return expectedLogin === normalizedLogin;
  });
  res.json(student || null);
});

// ==================== ROUTES CLASSES ====================
app.get('/api/classes', (req, res) => {
  res.json(readData(FILES.classes));
});

app.post('/api/classes', (req, res) => {
  const classes = readData(FILES.classes);
  const newClass = {
    ...req.body,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  classes.push(newClass);
  writeData(FILES.classes, classes);
  res.json(newClass);
});

app.put('/api/classes/:id', (req, res) => {
  const classes = readData(FILES.classes);
  const index = classes.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    classes[index] = { ...classes[index], ...req.body };
    writeData(FILES.classes, classes);
    res.json(classes[index]);
  } else {
    res.status(404).json({ error: 'Class not found' });
  }
});

app.delete('/api/classes/:id', (req, res) => {
  let classes = readData(FILES.classes);
  classes = classes.filter(c => c.id !== req.params.id);
  writeData(FILES.classes, classes);
  res.json({ success: true });
});

// ==================== ROUTES COURSES ====================
app.get('/api/courses', (req, res) => {
  res.json(readData(FILES.courses));
});

app.post('/api/courses', (req, res) => {
  const courses = readData(FILES.courses);
  const newCourse = {
    ...req.body,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    resources: req.body.resources || []
  };
  courses.push(newCourse);
  writeData(FILES.courses, courses);
  res.json(newCourse);
});

app.put('/api/courses/:id', (req, res) => {
  const courses = readData(FILES.courses);
  const index = courses.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    courses[index] = { ...courses[index], ...req.body };
    writeData(FILES.courses, courses);
    res.json(courses[index]);
  } else {
    res.status(404).json({ error: 'Course not found' });
  }
});

app.delete('/api/courses/:id', (req, res) => {
  let courses = readData(FILES.courses);
  courses = courses.filter(c => c.id !== req.params.id);
  writeData(FILES.courses, courses);
  res.json({ success: true });
});

// ==================== ROUTES EXAMS ====================
app.get('/api/exams', (req, res) => {
  res.json(readData(FILES.exams));
});

app.post('/api/exams', (req, res) => {
  const exams = readData(FILES.exams);
  const newExam = {
    ...req.body,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  exams.push(newExam);
  writeData(FILES.exams, exams);
  res.json(newExam);
});

app.put('/api/exams/:id', (req, res) => {
  const exams = readData(FILES.exams);
  const index = exams.findIndex(e => e.id === req.params.id);
  if (index !== -1) {
    exams[index] = { ...exams[index], ...req.body };
    writeData(FILES.exams, exams);
    res.json(exams[index]);
  } else {
    res.status(404).json({ error: 'Exam not found' });
  }
});

app.delete('/api/exams/:id', (req, res) => {
  let exams = readData(FILES.exams);
  exams = exams.filter(e => e.id !== req.params.id);
  writeData(FILES.exams, exams);
  res.json({ success: true });
});

// ==================== ROUTES ESTABLISHMENTS ====================
app.get('/api/establishments', (req, res) => {
  res.json(readData(FILES.establishments));
});

app.post('/api/establishments', (req, res) => {
  const establishments = readData(FILES.establishments);
  const newEstablishment = {
    ...req.body,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  establishments.push(newEstablishment);
  writeData(FILES.establishments, establishments);
  res.json(newEstablishment);
});

app.put('/api/establishments/:id', (req, res) => {
  const establishments = readData(FILES.establishments);
  const index = establishments.findIndex(e => e.id === req.params.id);
  if (index !== -1) {
    establishments[index] = { ...establishments[index], ...req.body };
    writeData(FILES.establishments, establishments);
    res.json(establishments[index]);
  } else {
    res.status(404).json({ error: 'Establishment not found' });
  }
});

app.delete('/api/establishments/:id', (req, res) => {
  let establishments = readData(FILES.establishments);
  establishments = establishments.filter(e => e.id !== req.params.id);
  writeData(FILES.establishments, establishments);
  res.json({ success: true });
});

// ==================== ROUTES RESULTS ====================
app.get('/api/results', (req, res) => {
  res.json(readData(FILES.results));
});

app.post('/api/results', (req, res) => {
  const results = readData(FILES.results);
  const newResult = {
    ...req.body,
    id: Date.now().toString(),
    submittedAt: new Date().toISOString()
  };
  results.push(newResult);
  writeData(FILES.results, results);
  res.json(newResult);
});

app.put('/api/results/:id', (req, res) => {
  const results = readData(FILES.results);
  const index = results.findIndex(r => r.id === req.params.id);
  if (index !== -1) {
    results[index] = { ...results[index], ...req.body };
    writeData(FILES.results, results);
    res.json(results[index]);
  } else {
    res.status(404).json({ error: 'Result not found' });
  }
});

// ==================== ROUTES NOTES ====================
app.get('/api/notes', (req, res) => {
  res.json(readData(FILES.notes));
});

app.post('/api/notes', (req, res) => {
  const notes = readData(FILES.notes);
  const newNote = {
    ...req.body,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  notes.push(newNote);
  writeData(FILES.notes, notes);
  res.json(newNote);
});

app.put('/api/notes/:id', (req, res) => {
  const notes = readData(FILES.notes);
  const index = notes.findIndex(n => n.id === req.params.id);
  if (index !== -1) {
    notes[index] = { ...notes[index], ...req.body, updatedAt: new Date().toISOString() };
    writeData(FILES.notes, notes);
    res.json(notes[index]);
  } else {
    res.status(404).json({ error: 'Note not found' });
  }
});

app.delete('/api/notes/:id', (req, res) => {
  let notes = readData(FILES.notes);
  notes = notes.filter(n => n.id !== req.params.id);
  writeData(FILES.notes, notes);
  res.json({ success: true });
});

// ==================== ROUTES SYNC (pour importer/exporter toutes les données) ====================
app.get('/api/sync/export', (req, res) => {
  res.json({
    exportDate: new Date().toISOString(),
    teachers: readData(FILES.teachers),
    students: readData(FILES.students),
    classes: readData(FILES.classes),
    courses: readData(FILES.courses),
    exams: readData(FILES.exams),
    establishments: readData(FILES.establishments),
    results: readData(FILES.results),
    notes: readData(FILES.notes)
  });
});

app.post('/api/sync/import', (req, res) => {
  try {
    const data = req.body;
    if (data.teachers) writeData(FILES.teachers, data.teachers);
    if (data.students) writeData(FILES.students, data.students);
    if (data.classes) writeData(FILES.classes, data.classes);
    if (data.courses) writeData(FILES.courses, data.courses);
    if (data.exams) writeData(FILES.exams, data.exams);
    if (data.establishments) writeData(FILES.establishments, data.establishments);
    if (data.results) writeData(FILES.results, data.results);
    if (data.notes) writeData(FILES.notes, data.notes);
    res.json({ success: true, message: 'Données importées avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'importation' });
  }
});

// ==================== PRÉSENTATIONS EN TEMPS RÉEL ====================
// Stockage en mémoire des présentations actives
const activePresentations = {};

// Démarrer une présentation
app.post('/api/presentation/start', (req, res) => {
  const { teacherId, teacherName, resourceId, resourceName, courseId, classId, targetType, targetStudentIds } = req.body;
  const presentationId = 'pres_' + Date.now();
  
  activePresentations[presentationId] = {
    id: presentationId,
    teacherId,
    teacherName,
    resourceId,
    resourceName,
    courseId,
    classId,
    targetType, // 'class' ou 'students'
    targetStudentIds: targetStudentIds || [],
    currentSlide: 0,
    currentPage: 1,
    comments: [],
    annotations: [],
    isActive: true,
    startedAt: new Date().toISOString()
  };
  
  console.log(`📺 Présentation démarrée: ${presentationId} par ${teacherName}`);
  res.json({ success: true, presentationId, presentation: activePresentations[presentationId] });
});

// Mettre à jour l'état de la présentation (slide, page, etc.)
app.put('/api/presentation/:id/state', (req, res) => {
  const { id } = req.params;
  const { currentSlide, currentPage, scrollPosition } = req.body;
  
  if (!activePresentations[id]) {
    return res.status(404).json({ error: 'Présentation non trouvée' });
  }
  
  if (currentSlide !== undefined) activePresentations[id].currentSlide = currentSlide;
  if (currentPage !== undefined) activePresentations[id].currentPage = currentPage;
  if (scrollPosition !== undefined) activePresentations[id].scrollPosition = scrollPosition;
  activePresentations[id].updatedAt = new Date().toISOString();
  
  res.json({ success: true, presentation: activePresentations[id] });
});

// Ajouter un commentaire en temps réel
app.post('/api/presentation/:id/comment', (req, res) => {
  const { id } = req.params;
  const { authorId, authorName, authorType, content } = req.body;
  
  if (!activePresentations[id]) {
    return res.status(404).json({ error: 'Présentation non trouvée' });
  }
  
  const comment = {
    id: 'com_' + Date.now(),
    authorId,
    authorName,
    authorType,
    content,
    createdAt: new Date().toISOString()
  };
  
  activePresentations[id].comments.push(comment);
  res.json({ success: true, comment });
});

// Récupérer l'état actuel de la présentation (pour les étudiants - polling)
app.get('/api/presentation/:id', (req, res) => {
  const { id } = req.params;
  
  if (!activePresentations[id]) {
    return res.status(404).json({ error: 'Présentation non trouvée', isActive: false });
  }
  
  res.json(activePresentations[id]);
});

// Récupérer les présentations actives pour un étudiant
app.get('/api/presentations/active', (req, res) => {
  const { studentId, classId } = req.query;
  
  console.log('📺 Recherche présentations pour:', { studentId, classId });
  console.log('📺 Présentations actives:', Object.keys(activePresentations).length);
  
  const available = Object.values(activePresentations).filter(p => {
    console.log('📺 Vérification présentation:', { id: p.id, isActive: p.isActive, targetType: p.targetType, pClassId: p.classId, reqClassId: classId });
    if (!p.isActive) return false;
    if (p.targetType === 'class' && p.classId === classId) return true;
    if (p.targetType === 'students' && p.targetStudentIds.includes(studentId)) return true;
    return false;
  });
  
  console.log('📺 Présentations disponibles:', available.length);
  res.json(available);
});

// Récupérer TOUTES les présentations actives (pour le professeur)
app.get('/api/presentations/all', (req, res) => {
  const { teacherId } = req.query;
  const all = Object.values(activePresentations).filter(p => p.isActive);
  // Si teacherId fourni, filtrer par professeur
  if (teacherId) {
    res.json(all.filter(p => p.teacherId === teacherId));
  } else {
    res.json(all);
  }
});

// Terminer une présentation
app.delete('/api/presentation/:id', (req, res) => {
  const { id } = req.params;
  
  if (activePresentations[id]) {
    activePresentations[id].isActive = false;
    activePresentations[id].endedAt = new Date().toISOString();
    console.log(`📺 Présentation terminée: ${id}`);
    // Supprimer après 5 minutes
    setTimeout(() => {
      delete activePresentations[id];
    }, 5 * 60 * 1000);
  }
  
  res.json({ success: true });
});

// ==================== PARTAGE D'ÉCRAN ====================
const activeScreenShares = {};

// Démarrer une session de partage d'écran
app.post('/api/screenshare/start', (req, res) => {
  const { teacherId, teacherName, courseId, classId, targetType, targetStudentIds } = req.body;
  
  const sessionId = 'screen_' + Date.now();
  activeScreenShares[sessionId] = {
    id: sessionId,
    teacherId,
    teacherName,
    courseId,
    classId,
    targetType,
    targetStudentIds: targetStudentIds || [],
    isActive: true,
    currentFrame: null,
    startedAt: new Date().toISOString()
  };
  
  console.log(`🖥️ Partage d'écran démarré: ${sessionId} par ${teacherName}`);
  res.json({ success: true, sessionId });
});

// Envoyer une frame
app.post('/api/screenshare/:id/frame', (req, res) => {
  const { id } = req.params;
  const { frame } = req.body;
  
  if (activeScreenShares[id]) {
    activeScreenShares[id].currentFrame = frame;
    activeScreenShares[id].lastFrameAt = new Date().toISOString();
  }
  
  res.json({ success: true });
});

// Récupérer la frame actuelle (pour les étudiants)
app.get('/api/screenshare/:id/frame', (req, res) => {
  const { id } = req.params;
  
  if (activeScreenShares[id] && activeScreenShares[id].isActive) {
    res.json({ 
      success: true, 
      frame: activeScreenShares[id].currentFrame,
      teacherName: activeScreenShares[id].teacherName
    });
  } else {
    res.json({ success: false, isActive: false });
  }
});

// Récupérer les sessions de partage d'écran actives pour un étudiant
app.get('/api/screenshare/active', (req, res) => {
  const { studentId, classId } = req.query;
  
  const available = Object.values(activeScreenShares).filter(s => {
    if (!s.isActive) return false;
    if (s.targetType === 'class' && s.classId === classId) return true;
    if (s.targetType === 'students' && s.targetStudentIds.includes(studentId)) return true;
    return false;
  });
  
  res.json(available);
});

// Récupérer TOUS les partages d'écran actifs (pour le professeur)
app.get('/api/screenshare/all', (req, res) => {
  const { teacherId } = req.query;
  const all = Object.values(activeScreenShares).filter(s => s.isActive);
  if (teacherId) {
    res.json(all.filter(s => s.teacherId === teacherId));
  } else {
    res.json(all);
  }
});

// Arrêter une session de partage d'écran
app.post('/api/screenshare/:id/stop', (req, res) => {
  const { id } = req.params;
  
  if (activeScreenShares[id]) {
    activeScreenShares[id].isActive = false;
    activeScreenShares[id].endedAt = new Date().toISOString();
    console.log(`🖥️ Partage d'écran terminé: ${id}`);
    
    // Supprimer après 1 minute
    setTimeout(() => {
      delete activeScreenShares[id];
    }, 60 * 1000);
  }
  
  res.json({ success: true });
});

// ==================== PARTAGE AUDIO ====================
const activeAudioStreams = {};

// Démarrer/mettre à jour un stream audio pour une présentation
app.post('/api/presentation/:id/audio', (req, res) => {
  const { id } = req.params;
  const { audioData, timestamp } = req.body;
  
  if (!activePresentations[id]) {
    return res.status(404).json({ success: false, error: 'Présentation non trouvée' });
  }
  
  activeAudioStreams[id] = {
    audioData,
    timestamp: timestamp || Date.now(),
    presentationId: id
  };
  
  res.json({ success: true });
});

// Récupérer le dernier chunk audio d'une présentation
app.get('/api/presentation/:id/audio', (req, res) => {
  const { id } = req.params;
  const { lastTimestamp } = req.query;
  
  if (!activePresentations[id] || !activePresentations[id].isActive) {
    return res.json({ success: false, hasAudio: false });
  }
  
  const audioStream = activeAudioStreams[id];
  if (!audioStream) {
    return res.json({ success: true, hasAudio: false });
  }
  
  // Ne renvoyer que si c'est un nouveau chunk
  if (lastTimestamp && audioStream.timestamp <= parseInt(lastTimestamp)) {
    return res.json({ success: true, hasAudio: false });
  }
  
  res.json({ 
    success: true, 
    hasAudio: true,
    audioData: audioStream.audioData,
    timestamp: audioStream.timestamp
  });
});

// Activer/désactiver l'audio pour une présentation
app.post('/api/presentation/:id/audio/toggle', (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;
  
  if (activePresentations[id]) {
    activePresentations[id].audioEnabled = enabled;
    if (!enabled) {
      delete activeAudioStreams[id];
    }
    console.log(`🎤 Audio ${enabled ? 'activé' : 'désactivé'} pour présentation: ${id}`);
  }
  
  res.json({ success: true });
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur API démarré sur http://localhost:${PORT}`);
  console.log(`📁 Données stockées dans: ${DATA_DIR}`);
  console.log(`🌐 Accessible sur le réseau local`);
});
