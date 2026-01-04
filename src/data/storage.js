// Utilitaires de stockage avec API serveur et fallback localStorage
// Configuration: mettre USE_SERVER_API à true pour utiliser le serveur backend

// Déterminer l'URL de l'API dynamiquement basée sur l'hôte actuel
const getApiUrl = () => {
  const hostname = window.location.hostname;
  // Si on accède via localhost, utiliser localhost, sinon utiliser l'IP du serveur
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }
  // Utiliser la même IP que le frontend pour l'API
  return `http://${hostname}:3001/api`;
};

const API_URL = getApiUrl();
let USE_SERVER_API = true; // Activer l'API serveur par défaut
let serverAvailable = null; // null = pas encore testé, true/false = résultat du test

// Vérifier si le serveur est disponible
const checkServerAvailability = async () => {
  if (serverAvailable !== null) return serverAvailable;
  try {
    const response = await fetch(`${API_URL}/teachers`, { method: 'GET', signal: AbortSignal.timeout(2000) });
    serverAvailable = response.ok;
  } catch {
    serverAvailable = false;
  }
  if (!serverAvailable) {
    console.warn('⚠️ Serveur API non disponible, utilisation du localStorage');
  } else {
    console.log('✅ Serveur API connecté');
  }
  return serverAvailable;
};

// Fonction utilitaire pour les requêtes API
const fetchAPI = async (endpoint, options = {}) => {
  if (!USE_SERVER_API) return null;
  await checkServerAvailability();
  if (!serverAvailable) return null;
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

// ==================== IndexedDB pour fichiers ====================
const DB_NAME = 'ExamPlatformFiles';
const DB_VERSION = 1;
const STORE_NAME = 'files';

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const fileStorage = {
  saveFile: async (id, data) => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ id, data, savedAt: new Date().toISOString() });
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Erreur IndexedDB saveFile:', error);
      return false;
    }
  },
  
  getFile: async (id) => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result?.data || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Erreur IndexedDB getFile:', error);
      return null;
    }
  },
  
  deleteFile: async (id) => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Erreur IndexedDB deleteFile:', error);
      return false;
    }
  }
};

// Fonction pour synchroniser avec le serveur en arrière-plan
const syncToServer = async (endpoint, data) => {
  if (!USE_SERVER_API || !serverAvailable) return;
  try {
    await fetchAPI(endpoint, { method: 'POST', body: JSON.stringify(data) });
  } catch (e) {
    console.warn('Sync failed:', e);
  }
};

// Fonction pour charger les données du serveur au démarrage
const loadFromServer = async (endpoint, localKey) => {
  const serverData = await fetchAPI(endpoint);
  if (serverData && Array.isArray(serverData) && serverData.length > 0) {
    try {
      localStorage.setItem(localKey, JSON.stringify(serverData));
    } catch (e) {
      console.log(`localStorage plein pour ${localKey}, données chargées depuis le serveur uniquement`);
      // Pour les cours, stocker une version allégée
      if (localKey === 'courses') {
        try {
          const lightData = serverData.map(c => ({
            ...c,
            resources: (c.resources || []).map(r => ({
              ...r,
              data: r.data && r.data.length > 10000 ? '[STORED_ON_SERVER]' : r.data
            }))
          }));
          localStorage.setItem(localKey, JSON.stringify(lightData));
        } catch (e2) {
          console.log('Impossible de sauvegarder même la version allégée');
        }
      }
    }
    return serverData;
  }
  return null;
};

export const storage = {
  // Caches serveur pour synchronisation entre machines
  _serverData: {
    teachers: null,
    students: null,
    classes: null,
    exams: null,
    establishments: null,
    results: null,
    notes: null
  },
  
  // ==================== PROFESSEURS ====================
  getTeachers: () => {
    if (storage._serverData.teachers) return storage._serverData.teachers;
    const teachers = localStorage.getItem('teachers');
    return teachers ? JSON.parse(teachers) : [];
  },
  
  saveTeachers: (teachers) => {
    localStorage.setItem('teachers', JSON.stringify(teachers));
    // Sync avec serveur
    fetchAPI('/sync/import', { method: 'POST', body: JSON.stringify({ teachers }) });
  },
  
  addTeacher: (teacher) => {
    const teachers = storage.getTeachers();
    const newTeacher = { 
      ...teacher, 
      id: Date.now().toString(), 
      createdAt: new Date().toISOString() 
    };
    teachers.push(newTeacher);
    storage.saveTeachers(teachers);
    // Sync avec serveur
    fetchAPI('/teachers', { method: 'POST', body: JSON.stringify(newTeacher) });
    return teachers;
  },
  
  getTeacherByEmail: (email) => {
    return storage.getTeachers().find(t => t.email.toLowerCase() === email.toLowerCase());
  },
  
  getTeacherById: (id) => {
    return storage.getTeachers().find(t => t.id === id);
  },
  
  setCurrentTeacher: (teacher) => {
    localStorage.setItem('currentTeacher', JSON.stringify(teacher));
  },
  
  getCurrentTeacher: () => {
    const teacher = localStorage.getItem('currentTeacher');
    return teacher ? JSON.parse(teacher) : null;
  },
  
  logoutTeacher: () => {
    localStorage.removeItem('currentTeacher');
  },

  // ==================== ÉTABLISSEMENTS ====================
  getEstablishments: () => {
    if (storage._serverData.establishments) return storage._serverData.establishments;
    const establishments = localStorage.getItem('establishments');
    return establishments ? JSON.parse(establishments) : [];
  },
  
  saveEstablishments: (establishments) => {
    localStorage.setItem('establishments', JSON.stringify(establishments));
    fetchAPI('/sync/import', { method: 'POST', body: JSON.stringify({ establishments }) });
  },
  
  addEstablishment: (establishment) => {
    const establishments = storage.getEstablishments();
    const teacher = storage.getCurrentTeacher();
    const newEst = { 
      ...establishment, 
      id: Date.now().toString(), 
      teacherId: teacher?.id,
      createdAt: new Date().toISOString() 
    };
    establishments.push(newEst);
    storage.saveEstablishments(establishments);
    return establishments;
  },
  
  updateEstablishment: (id, updatedEstablishment) => {
    const establishments = storage.getEstablishments();
    const index = establishments.findIndex(e => e.id === id);
    if (index !== -1) {
      establishments[index] = { ...establishments[index], ...updatedEstablishment };
      storage.saveEstablishments(establishments);
    }
    return establishments;
  },
  
  deleteEstablishment: (id) => {
    const establishments = storage.getEstablishments().filter(e => e.id !== id);
    storage.saveEstablishments(establishments);
    fetchAPI(`/establishments/${id}`, { method: 'DELETE' });
    return establishments;
  },
  
  getEstablishmentById: (id) => {
    return storage.getEstablishments().find(e => e.id === id);
  },
  
  getEstablishmentsByTeacher: (teacherId) => {
    return storage.getEstablishments().filter(e => e.teacherId === teacherId);
  },

  // ==================== CLASSES ====================
  getClasses: () => {
    if (storage._serverData.classes) return storage._serverData.classes;
    const classes = localStorage.getItem('classes');
    return classes ? JSON.parse(classes) : [];
  },
  
  saveClasses: (classes) => {
    localStorage.setItem('classes', JSON.stringify(classes));
    fetchAPI('/sync/import', { method: 'POST', body: JSON.stringify({ classes }) });
  },
  
  addClass: (classData) => {
    const classes = storage.getClasses();
    classes.push({ ...classData, id: Date.now().toString(), createdAt: new Date().toISOString() });
    storage.saveClasses(classes);
    return classes;
  },
  
  updateClass: (id, updatedClass) => {
    const classes = storage.getClasses();
    const index = classes.findIndex(c => c.id === id);
    if (index !== -1) {
      classes[index] = { ...classes[index], ...updatedClass };
      storage.saveClasses(classes);
    }
    return classes;
  },
  
  deleteClass: (id) => {
    const classes = storage.getClasses().filter(c => c.id !== id);
    storage.saveClasses(classes);
    return classes;
  },
  
  getClassById: (id) => {
    return storage.getClasses().find(c => c.id === id);
  },

  // ==================== ÉTUDIANTS ====================
  getStudents: () => {
    if (storage._serverData.students) return storage._serverData.students;
    const students = localStorage.getItem('students');
    return students ? JSON.parse(students) : [];
  },
  
  saveStudents: (students) => {
    localStorage.setItem('students', JSON.stringify(students));
    fetchAPI('/sync/import', { method: 'POST', body: JSON.stringify({ students }) });
  },
  
  addStudent: (student) => {
    const students = storage.getStudents();
    const token = Math.random().toString(36).substring(2, 15);
    students.push({ 
      ...student, 
      id: Date.now().toString(), 
      token,
      createdAt: new Date().toISOString(),
      isActive: true
    });
    storage.saveStudents(students);
    return students;
  },
  
  addStudentsBulk: (studentsList, classId) => {
    const students = storage.getStudents();
    studentsList.forEach(s => {
      const token = Math.random().toString(36).substring(2, 15);
      students.push({
        ...s,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        classId,
        token,
        createdAt: new Date().toISOString(),
        isActive: true
      });
    });
    storage.saveStudents(students);
    return students;
  },
  
  updateStudent: (id, updatedStudent) => {
    const students = storage.getStudents();
    const index = students.findIndex(s => s.id === id);
    if (index !== -1) {
      students[index] = { ...students[index], ...updatedStudent };
      storage.saveStudents(students);
    }
    return students;
  },
  
  deleteStudent: (id) => {
    const students = storage.getStudents().filter(s => s.id !== id);
    storage.saveStudents(students);
    return students;
  },
  
  getStudentById: (id) => {
    return storage.getStudents().find(s => s.id === id);
  },
  
  getStudentByEmail: (email) => {
    return storage.getStudents().find(s => s.email.toLowerCase() === email.toLowerCase());
  },
  
  getStudentByLogin: (login) => {
    const normalizedLogin = login.toLowerCase().trim();
    return storage.getStudents().find(s => {
      // Format: prenom.nom
      const expectedLogin = `${s.firstName}.${s.lastName}`.toLowerCase().replace(/\s+/g, '');
      return expectedLogin === normalizedLogin;
    });
  },
  
  getStudentByToken: (token) => {
    return storage.getStudents().find(s => s.token === token);
  },
  
  getStudentsByClass: (classId) => {
    return storage.getStudents().filter(s => s.classId === classId);
  },

  // ==================== COURS ====================
  // Variable pour stocker les cours chargés depuis le serveur
  _serverCourses: null,
  
  getCourses: () => {
    // Si on a des cours chargés depuis le serveur, les utiliser
    if (storage._serverCourses) {
      return storage._serverCourses;
    }
    const courses = localStorage.getItem('courses');
    return courses ? JSON.parse(courses) : [];
  },
  
  setServerCourses: (courses) => {
    storage._serverCourses = courses;
  },
  
  saveCourses: async (courses) => {
    // Mettre à jour le cache en mémoire
    storage._serverCourses = courses;
    
    // Envoyer d'abord au serveur (priorité pour les fichiers volumineux)
    try {
      await fetchAPI('/sync/import', { method: 'POST', body: JSON.stringify({ courses }) });
    } catch (e) {
      console.log('Erreur sync serveur:', e);
    }
    
    // Essayer de sauvegarder dans localStorage (peut échouer si trop volumineux)
    try {
      localStorage.setItem('courses', JSON.stringify(courses));
    } catch (e) {
      console.log('📦 localStorage plein, données stockées sur le serveur uniquement');
      // Stocker une version allégée sans les données de fichiers
      try {
        const lightCourses = courses.map(c => ({
          ...c,
          resources: (c.resources || []).map(r => ({
            ...r,
            data: r.data && r.data.length > 10000 ? '[STORED_ON_SERVER]' : r.data
          }))
        }));
        localStorage.setItem('courses', JSON.stringify(lightCourses));
      } catch (e2) {
        console.log('Impossible de sauvegarder même la version allégée');
      }
    }
  },
  
  addCourse: (course) => {
    const courses = storage.getCourses();
    courses.push({ 
      ...course, 
      id: Date.now().toString(), 
      createdAt: new Date().toISOString(),
      resources: course.resources || []
    });
    storage.saveCourses(courses);
    return courses;
  },
  
  updateCourse: (id, updatedCourse) => {
    const courses = storage.getCourses();
    const index = courses.findIndex(c => c.id === id);
    if (index !== -1) {
      courses[index] = { ...courses[index], ...updatedCourse };
      storage.saveCourses(courses);
    }
    return courses;
  },
  
  deleteCourse: (id) => {
    const courses = storage.getCourses().filter(c => c.id !== id);
    storage.saveCourses(courses);
    return courses;
  },
  
  getCourseById: (id) => {
    return storage.getCourses().find(c => c.id === id);
  },
  
  getCoursesByClass: (classId) => {
    return storage.getCourses().filter(c => c.classId === classId);
  },

  // ==================== EXAMENS ====================
  getExams: () => {
    if (storage._serverData.exams) return storage._serverData.exams;
    const exams = localStorage.getItem('exams');
    return exams ? JSON.parse(exams) : [];
  },
  
  saveExams: (exams) => {
    localStorage.setItem('exams', JSON.stringify(exams));
    fetchAPI('/sync/import', { method: 'POST', body: JSON.stringify({ exams }) });
  },
  
  addExam: (exam) => {
    const exams = storage.getExams();
    exams.push({ ...exam, id: Date.now().toString(), createdAt: new Date().toISOString() });
    storage.saveExams(exams);
    return exams;
  },
  
  updateExam: (id, updatedExam) => {
    const exams = storage.getExams();
    const index = exams.findIndex(e => e.id === id);
    if (index !== -1) {
      exams[index] = { ...exams[index], ...updatedExam };
      storage.saveExams(exams);
    }
    return exams;
  },
  
  deleteExam: (id) => {
    const exams = storage.getExams().filter(e => e.id !== id);
    storage.saveExams(exams);
    return exams;
  },
  
  getExamById: (id) => {
    return storage.getExams().find(e => e.id === id);
  },
  
  getExamsByCourse: (courseId) => {
    return storage.getExams().filter(e => e.courseId === courseId);
  },
  
  getExamsByClass: (classId) => {
    return storage.getExams().filter(e => e.classId === classId);
  },

  // ==================== PLANIFICATION D'EXAMENS ====================
  getScheduledExams: () => {
    const scheduled = localStorage.getItem('scheduledExams');
    return scheduled ? JSON.parse(scheduled) : [];
  },
  
  saveScheduledExams: (scheduled) => {
    localStorage.setItem('scheduledExams', JSON.stringify(scheduled));
    fetchAPI('/sync/import', { method: 'POST', body: JSON.stringify({ scheduledExams: scheduled }) });
  },
  
  scheduleExam: (schedule) => {
    const scheduled = storage.getScheduledExams();
    scheduled.push({ 
      ...schedule, 
      id: Date.now().toString(), 
      createdAt: new Date().toISOString(),
      invitationsSent: false
    });
    storage.saveScheduledExams(scheduled);
    return scheduled;
  },
  
  updateScheduledExam: (id, updatedSchedule) => {
    const scheduled = storage.getScheduledExams();
    const index = scheduled.findIndex(s => s.id === id);
    if (index !== -1) {
      scheduled[index] = { ...scheduled[index], ...updatedSchedule };
      storage.saveScheduledExams(scheduled);
    }
    return scheduled;
  },
  
  deleteScheduledExam: (id) => {
    const scheduled = storage.getScheduledExams().filter(s => s.id !== id);
    storage.saveScheduledExams(scheduled);
    return scheduled;
  },
  
  getScheduledExamById: (id) => {
    return storage.getScheduledExams().find(s => s.id === id);
  },
  
  getScheduledExamsForStudent: (studentId) => {
    const scheduled = storage.getScheduledExams();
    const student = storage.getStudentById(studentId);
    if (!student) return [];
    return scheduled.filter(s => s.classId === student.classId);
  },

  // ==================== RÉSULTATS ====================
  getResults: () => {
    const results = localStorage.getItem('examResults');
    return results ? JSON.parse(results) : [];
  },
  
  saveResult: (result) => {
    const results = storage.getResults();
    results.push({ ...result, id: Date.now().toString(), submittedAt: new Date().toISOString() });
    localStorage.setItem('examResults', JSON.stringify(results));
    fetchAPI('/sync/import', { method: 'POST', body: JSON.stringify({ results }) });
    return results;
  },

  saveResults: (results) => {
    localStorage.setItem('examResults', JSON.stringify(results));
    fetchAPI('/sync/import', { method: 'POST', body: JSON.stringify({ results }) });
  },
  
  getResultsByExam: (examId) => {
    return storage.getResults().filter(r => r.examId === examId);
  },
  
  getResultsByStudent: (studentId) => {
    return storage.getResults().filter(r => r.studentId === studentId);
  },
  
  getResultsByStudentName: (studentName) => {
    return storage.getResults().filter(r => r.studentName.toLowerCase() === studentName.toLowerCase());
  },

  // ==================== INVITATIONS EMAIL ====================
  getEmailInvitations: () => {
    const invitations = localStorage.getItem('emailInvitations');
    return invitations ? JSON.parse(invitations) : [];
  },
  
  saveEmailInvitation: (invitation) => {
    const invitations = storage.getEmailInvitations();
    invitations.push({ 
      ...invitation, 
      id: Date.now().toString(), 
      sentAt: new Date().toISOString() 
    });
    localStorage.setItem('emailInvitations', JSON.stringify(invitations));
    return invitations;
  },

  // ==================== SESSION ÉTUDIANT ====================
  setCurrentStudent: (student) => {
    localStorage.setItem('currentStudent', JSON.stringify(student));
  },
  
  getCurrentStudent: () => {
    const student = localStorage.getItem('currentStudent');
    return student ? JSON.parse(student) : null;
  },
  
  logoutStudent: () => {
    localStorage.removeItem('currentStudent');
  },

  // ==================== NOTES ====================
  getNotes: () => {
    const notes = localStorage.getItem('notes');
    return notes ? JSON.parse(notes) : [];
  },

  saveNotes: (notes) => {
    localStorage.setItem('notes', JSON.stringify(notes));
    fetchAPI('/sync/import', { method: 'POST', body: JSON.stringify({ notes }) });
  },

  addNote: (note) => {
    const notes = storage.getNotes();
    const newNote = {
      ...note,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    notes.push(newNote);
    storage.saveNotes(notes);
    return newNote;
  },

  updateNote: (id, data) => {
    const notes = storage.getNotes();
    const index = notes.findIndex(n => n.id === id);
    if (index !== -1) {
      notes[index] = { ...notes[index], ...data, updatedAt: new Date().toISOString() };
      storage.saveNotes(notes);
    }
    return notes;
  },

  deleteNote: (id) => {
    const notes = storage.getNotes().filter(n => n.id !== id);
    storage.saveNotes(notes);
    return notes;
  },

  // Récupérer les notes personnelles d'un étudiant pour une ressource
  getStudentNotesForResource: (resourceId, studentId) => {
    return storage.getNotes().filter(n => 
      n.resourceId === resourceId && n.studentId === studentId && n.authorType === 'student'
    );
  },

  // Récupérer les notes du professeur pour une ressource (visibles par tous les étudiants)
  getTeacherNotesForResource: (resourceId) => {
    return storage.getNotes().filter(n => 
      n.resourceId === resourceId && n.authorType === 'teacher'
    );
  },

  // Récupérer toutes les notes d'une ressource pour le professeur (ses notes + celles des étudiants)
  getAllNotesForResource: (resourceId) => {
    return storage.getNotes().filter(n => n.resourceId === resourceId);
  },

  // Récupérer les notes partagées avec un étudiant spécifique
  getSharedNotesForStudent: (resourceId, studentId, classId) => {
    return storage.getNotes().filter(n => {
      if (n.resourceId !== resourceId) return false;
      if (n.authorType !== 'student') return false;
      if (n.studentId === studentId) return false; // Exclure ses propres notes
      
      // Note partagée avec toute la classe
      if (n.shareType === 'class' && n.classId === classId) return true;
      
      // Note partagée avec cet étudiant spécifiquement
      if (n.shareType === 'student' && n.sharedWithStudentId === studentId) return true;
      
      return false;
    });
  },

  // Récupérer les notes d'un étudiant spécifique pour le professeur
  getStudentNotesByStudentId: (resourceId, studentId) => {
    return storage.getNotes().filter(n => 
      n.resourceId === resourceId && n.studentId === studentId && n.authorType === 'student'
    );
  },

  // Récupérer toutes les notes des étudiants groupées par étudiant
  getAllStudentNotesGrouped: (resourceId) => {
    const notes = storage.getNotes().filter(n => 
      n.resourceId === resourceId && n.authorType === 'student'
    );
    
    // Grouper par étudiant
    const grouped = {};
    notes.forEach(note => {
      if (!grouped[note.studentId]) {
        grouped[note.studentId] = {
          studentId: note.studentId,
          studentName: note.studentName,
          notes: []
        };
      }
      grouped[note.studentId].notes.push(note);
    });
    
    return Object.values(grouped);
  },

  // ==================== SYNCHRONISATION SERVEUR ====================
  // Charger les données du serveur au démarrage
  loadFromServer: async () => {
    // Forcer la vérification du serveur à chaque appel
    serverAvailable = null;
    const isAvailable = await checkServerAvailability();
    if (!isAvailable) {
      console.log('📦 Mode hors-ligne: utilisation du localStorage');
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/sync/export`, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) return false;
      const serverData = await response.json();
      
      if (serverData) {
        // Mettre à jour les caches serveur pour synchronisation entre machines
        storage._serverData.teachers = serverData.teachers || [];
        storage._serverData.students = serverData.students || [];
        storage._serverData.classes = serverData.classes || [];
        storage._serverData.exams = serverData.exams || [];
        storage._serverData.establishments = serverData.establishments || [];
        storage._serverData.results = serverData.results || [];
        storage._serverData.notes = serverData.notes || [];
        
        // Charger les données du serveur dans le localStorage (backup)
        localStorage.setItem('teachers', JSON.stringify(serverData.teachers || []));
        localStorage.setItem('students', JSON.stringify(serverData.students || []));
        localStorage.setItem('classes', JSON.stringify(serverData.classes || []));
        localStorage.setItem('exams', JSON.stringify(serverData.exams || []));
        localStorage.setItem('establishments', JSON.stringify(serverData.establishments || []));
        localStorage.setItem('examResults', JSON.stringify(serverData.results || []));
        localStorage.setItem('notes', JSON.stringify(serverData.notes || []));
        
        // Pour les cours (potentiellement volumineux), stocker en mémoire
        storage._serverCourses = serverData.courses || [];
        
        // Essayer de sauvegarder les cours dans localStorage, sinon version allégée
        try {
          localStorage.setItem('courses', JSON.stringify(serverData.courses || []));
        } catch (e) {
          console.log('📦 Cours trop volumineux pour localStorage, stockés en mémoire');
          // Stocker une version allégée
          try {
            const lightCourses = (serverData.courses || []).map(c => ({
              ...c,
              resources: (c.resources || []).map(r => ({
                ...r,
                data: r.data && r.data.length > 10000 ? '[STORED_ON_SERVER]' : r.data
              }))
            }));
            localStorage.setItem('courses', JSON.stringify(lightCourses));
          } catch (e2) {
            console.log('Impossible de sauvegarder même la version allégée');
          }
        }
        
        console.log('✅ Données rechargées depuis le serveur');
        return true;
      }
    } catch (error) {
      console.error('Erreur chargement serveur:', error);
    }
    return false;
  },

  // Exporter toutes les données vers le serveur
  syncToServer: async () => {
    const isAvailable = await checkServerAvailability();
    if (!isAvailable) return false;

    const data = {
      teachers: storage.getTeachers(),
      students: storage.getStudents(),
      classes: storage.getClasses(),
      courses: storage.getCourses(),
      exams: storage.getExams(),
      establishments: storage.getEstablishments(),
      results: storage.getResults(),
      notes: storage.getNotes()
    };

    const result = await fetchAPI('/sync/import', { method: 'POST', body: JSON.stringify(data) });
    if (result?.success) {
      console.log('✅ Données synchronisées avec le serveur');
      return true;
    }
    return false;
  }
};

// Données de démonstration
export const initDemoData = () => {
  // Créer le compte professeur par défaut
  if (storage.getTeachers().length === 0) {
    const teachers = [{
      id: '1',
      firstName: 'Mohammed',
      lastName: 'ENNAJI',
      email: 'ennaji.moh@gmail.com',
      password: 'pro123',
      createdAt: new Date().toISOString()
    }];
    storage.saveTeachers(teachers);
  }

  // Créer les établissements
  if (storage.getEstablishments().length === 0) {
    storage.addEstablishment({
      name: 'ENSAM Casablanca',
      city: 'Casablanca',
      type: 'university'
    });
    storage.addEstablishment({
      name: 'EMSI Casablanca',
      city: 'Casablanca',
      type: 'university'
    });
  }

  // Créer une classe de démo
  const establishments = storage.getEstablishments();
  if (storage.getClasses().length === 0 && establishments.length > 0) {
    storage.addClass({
      name: 'Master IT - 2025/2026',
      year: '2025-2026',
      establishmentId: establishments[0].id
    });
  }

  // Créer des étudiants de démo
  if (storage.getStudents().length === 0) {
    const classes = storage.getClasses();
    const classId = classes.length > 0 ? classes[0].id : null;

    storage.addStudent({
      firstName: 'Malak',
      lastName: 'Ennaji',
      email: 'malak.ennaji@demo.com',
      password: 'demo123',
      code: 'ETU001',
      classId: classId
    });

    storage.addStudent({
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@demo.com',
      password: 'demo123',
      code: 'ETU002',
      classId: classId
    });

    storage.addStudent({
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@demo.com',
      password: 'demo123',
      code: 'ETU003',
      classId: classId
    });

    console.log('✅ Étudiants de démonstration créés:');
    console.log('   - malak.ennaji@demo.com / demo123 (ou Malak.Ennaji)');
    console.log('   - jean.dupont@demo.com / demo123 (ou Jean.Dupont)');
    console.log('   - marie.martin@demo.com / demo123 (ou Marie.Martin)');
  }

  // Créer un cours de démo
  if (storage.getCourses().length === 0) {
    const classes = storage.getClasses();
    if (classes.length > 0) {
      const students = storage.getStudents();
      storage.addCourse({
        title: 'Introduction aux Bases de Données',
        description: 'Cours sur les fondamentaux des bases de données relationnelles',
        classId: classes[0].id,
        studentIds: students.map(s => s.id),
        resources: []
      });
    }
  }

  if (storage.getExams().length === 0) {
    const demoExams = [
      {
        id: '1',
        title: 'Introduction à la Programmation',
        description: 'Examen sur les bases de la programmation : variables, boucles, conditions.',
        duration: 30,
        createdAt: new Date().toISOString(),
        isActive: true,
        questions: [
          {
            id: 'q1',
            text: 'Quel mot-clé est utilisé pour déclarer une variable en JavaScript ?',
            options: ['var', 'variable', 'declare', 'def'],
            correctAnswer: 0
          },
          {
            id: 'q2',
            text: 'Quelle boucle est utilisée pour itérer un nombre défini de fois ?',
            options: ['while', 'do-while', 'for', 'foreach'],
            correctAnswer: 2
          },
          {
            id: 'q3',
            text: 'Quel opérateur est utilisé pour comparer l\'égalité stricte ?',
            options: ['=', '==', '===', '!='],
            correctAnswer: 2
          }
        ]
      },
      {
        id: '2',
        title: 'Bases de Données SQL',
        description: 'Examen sur les requêtes SQL fondamentales.',
        duration: 45,
        createdAt: new Date().toISOString(),
        isActive: true,
        questions: [
          {
            id: 'q1',
            text: 'Quelle commande SQL est utilisée pour récupérer des données ?',
            options: ['GET', 'FETCH', 'SELECT', 'RETRIEVE'],
            correctAnswer: 2
          },
          {
            id: 'q2',
            text: 'Quelle clause est utilisée pour filtrer les résultats ?',
            options: ['FILTER', 'WHERE', 'HAVING', 'CONDITION'],
            correctAnswer: 1
          }
        ]
      }
    ];
    storage.saveExams(demoExams);
  }
};
