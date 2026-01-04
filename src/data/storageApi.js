// Storage API - Utilise le serveur backend pour persister les données
const API_URL = 'http://localhost:3001/api';

// Cache local pour les performances
let cache = {
  teachers: null,
  students: null,
  classes: null,
  courses: null,
  exams: null,
  establishments: null,
  results: null,
  notes: null
};

// Fonction utilitaire pour les requêtes API
const fetchAPI = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

// Fonction pour invalider le cache
const invalidateCache = (key) => {
  if (key) {
    cache[key] = null;
  } else {
    Object.keys(cache).forEach(k => cache[k] = null);
  }
};

export const storageApi = {
  // ==================== TEACHERS ====================
  getTeachers: async () => {
    if (cache.teachers) return cache.teachers;
    const data = await fetchAPI('/teachers');
    cache.teachers = data || [];
    return cache.teachers;
  },

  saveTeachers: async (teachers) => {
    // Pour la compatibilité, on remplace toutes les données
    for (const teacher of teachers) {
      if (!teacher.id) {
        await fetchAPI('/teachers', { method: 'POST', body: JSON.stringify(teacher) });
      }
    }
    invalidateCache('teachers');
  },

  addTeacher: async (teacher) => {
    const result = await fetchAPI('/teachers', { method: 'POST', body: JSON.stringify(teacher) });
    invalidateCache('teachers');
    return result;
  },

  updateTeacher: async (id, data) => {
    const result = await fetchAPI(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    invalidateCache('teachers');
    return result;
  },

  getTeacherByEmail: async (email) => {
    return await fetchAPI(`/teachers/email/${encodeURIComponent(email)}`);
  },

  // ==================== STUDENTS ====================
  getStudents: async () => {
    if (cache.students) return cache.students;
    const data = await fetchAPI('/students');
    cache.students = data || [];
    return cache.students;
  },

  saveStudents: async (students) => {
    // Remplacer toutes les données - utiliser sync/import
    await fetchAPI('/sync/import', { method: 'POST', body: JSON.stringify({ students }) });
    invalidateCache('students');
  },

  addStudent: async (student) => {
    const result = await fetchAPI('/students', { method: 'POST', body: JSON.stringify(student) });
    invalidateCache('students');
    return result;
  },

  updateStudent: async (id, data) => {
    const result = await fetchAPI(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    invalidateCache('students');
    return result;
  },

  deleteStudent: async (id) => {
    await fetchAPI(`/students/${id}`, { method: 'DELETE' });
    invalidateCache('students');
  },

  getStudentById: async (id) => {
    const students = await storageApi.getStudents();
    return students.find(s => s.id === id);
  },

  getStudentByEmail: async (email) => {
    return await fetchAPI(`/students/email/${encodeURIComponent(email)}`);
  },

  getStudentByToken: async (token) => {
    return await fetchAPI(`/students/token/${encodeURIComponent(token)}`);
  },

  getStudentByLogin: async (login) => {
    return await fetchAPI(`/students/login/${encodeURIComponent(login)}`);
  },

  // ==================== CLASSES ====================
  getClasses: async () => {
    if (cache.classes) return cache.classes;
    const data = await fetchAPI('/classes');
    cache.classes = data || [];
    return cache.classes;
  },

  saveClasses: async (classes) => {
    await fetchAPI('/sync/import', { method: 'POST', body: JSON.stringify({ classes }) });
    invalidateCache('classes');
  },

  addClass: async (classData) => {
    const result = await fetchAPI('/classes', { method: 'POST', body: JSON.stringify(classData) });
    invalidateCache('classes');
    return result;
  },

  updateClass: async (id, data) => {
    const result = await fetchAPI(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    invalidateCache('classes');
    return result;
  },

  deleteClass: async (id) => {
    await fetchAPI(`/classes/${id}`, { method: 'DELETE' });
    invalidateCache('classes');
  },

  // ==================== COURSES ====================
  getCourses: async () => {
    if (cache.courses) return cache.courses;
    const data = await fetchAPI('/courses');
    cache.courses = data || [];
    return cache.courses;
  },

  saveCourses: async (courses) => {
    await fetchAPI('/sync/import', { method: 'POST', body: JSON.stringify({ courses }) });
    invalidateCache('courses');
  },

  addCourse: async (course) => {
    const result = await fetchAPI('/courses', { method: 'POST', body: JSON.stringify(course) });
    invalidateCache('courses');
    return result;
  },

  updateCourse: async (id, data) => {
    const result = await fetchAPI(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    invalidateCache('courses');
    return result;
  },

  deleteCourse: async (id) => {
    await fetchAPI(`/courses/${id}`, { method: 'DELETE' });
    invalidateCache('courses');
  },

  getCourseById: async (id) => {
    const courses = await storageApi.getCourses();
    return courses.find(c => c.id === id);
  },

  // ==================== EXAMS ====================
  getExams: async () => {
    if (cache.exams) return cache.exams;
    const data = await fetchAPI('/exams');
    cache.exams = data || [];
    return cache.exams;
  },

  saveExams: async (exams) => {
    await fetchAPI('/sync/import', { method: 'POST', body: JSON.stringify({ exams }) });
    invalidateCache('exams');
  },

  addExam: async (exam) => {
    const result = await fetchAPI('/exams', { method: 'POST', body: JSON.stringify(exam) });
    invalidateCache('exams');
    return result;
  },

  updateExam: async (id, data) => {
    const result = await fetchAPI(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    invalidateCache('exams');
    return result;
  },

  deleteExam: async (id) => {
    await fetchAPI(`/exams/${id}`, { method: 'DELETE' });
    invalidateCache('exams');
  },

  getExamById: async (id) => {
    const exams = await storageApi.getExams();
    return exams.find(e => e.id === id);
  },

  // ==================== ESTABLISHMENTS ====================
  getEstablishments: async () => {
    if (cache.establishments) return cache.establishments;
    const data = await fetchAPI('/establishments');
    cache.establishments = data || [];
    return cache.establishments;
  },

  saveEstablishments: async (establishments) => {
    await fetchAPI('/sync/import', { method: 'POST', body: JSON.stringify({ establishments }) });
    invalidateCache('establishments');
  },

  addEstablishment: async (establishment) => {
    const result = await fetchAPI('/establishments', { method: 'POST', body: JSON.stringify(establishment) });
    invalidateCache('establishments');
    return result;
  },

  updateEstablishment: async (id, data) => {
    const result = await fetchAPI(`/establishments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    invalidateCache('establishments');
    return result;
  },

  deleteEstablishment: async (id) => {
    await fetchAPI(`/establishments/${id}`, { method: 'DELETE' });
    invalidateCache('establishments');
  },

  // ==================== RESULTS ====================
  getResults: async () => {
    if (cache.results) return cache.results;
    const data = await fetchAPI('/results');
    cache.results = data || [];
    return cache.results;
  },

  saveResults: async (results) => {
    await fetchAPI('/sync/import', { method: 'POST', body: JSON.stringify({ results }) });
    invalidateCache('results');
  },

  addResult: async (result) => {
    const res = await fetchAPI('/results', { method: 'POST', body: JSON.stringify(result) });
    invalidateCache('results');
    return res;
  },

  // ==================== NOTES ====================
  getNotes: async () => {
    if (cache.notes) return cache.notes;
    const data = await fetchAPI('/notes');
    cache.notes = data || [];
    return cache.notes;
  },

  saveNotes: async (notes) => {
    await fetchAPI('/sync/import', { method: 'POST', body: JSON.stringify({ notes }) });
    invalidateCache('notes');
  },

  addNote: async (note) => {
    const result = await fetchAPI('/notes', { method: 'POST', body: JSON.stringify(note) });
    invalidateCache('notes');
    return result;
  },

  updateNote: async (id, data) => {
    const result = await fetchAPI(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    invalidateCache('notes');
    return result;
  },

  deleteNote: async (id) => {
    await fetchAPI(`/notes/${id}`, { method: 'DELETE' });
    invalidateCache('notes');
  },

  getStudentNotesForResource: async (resourceId, studentId) => {
    const notes = await storageApi.getNotes();
    return notes.filter(n => n.resourceId === resourceId && n.studentId === studentId && n.authorType === 'student');
  },

  getTeacherNotesForResource: async (resourceId) => {
    const notes = await storageApi.getNotes();
    return notes.filter(n => n.resourceId === resourceId && n.authorType === 'teacher');
  },

  getAllNotesForResource: async (resourceId) => {
    const notes = await storageApi.getNotes();
    return notes.filter(n => n.resourceId === resourceId);
  },

  // ==================== SESSION (reste en localStorage) ====================
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

  // ==================== SYNC ====================
  exportAllData: async () => {
    return await fetchAPI('/sync/export');
  },

  importAllData: async (data) => {
    return await fetchAPI('/sync/import', { method: 'POST', body: JSON.stringify(data) });
  },

  // Invalider tout le cache
  clearCache: () => {
    invalidateCache();
  }
};
