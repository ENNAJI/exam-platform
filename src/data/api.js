const API_URL = 'http://localhost:3001/api';

// Fonction utilitaire pour les requêtes
const fetchAPI = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

export const api = {
  // ==================== TEACHERS ====================
  getTeachers: () => fetchAPI('/teachers'),
  addTeacher: (teacher) => fetchAPI('/teachers', { method: 'POST', body: JSON.stringify(teacher) }),
  updateTeacher: (id, data) => fetchAPI(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getTeacherByEmail: (email) => fetchAPI(`/teachers/email/${encodeURIComponent(email)}`),

  // ==================== STUDENTS ====================
  getStudents: () => fetchAPI('/students'),
  addStudent: (student) => fetchAPI('/students', { method: 'POST', body: JSON.stringify(student) }),
  updateStudent: (id, data) => fetchAPI(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudent: (id) => fetchAPI(`/students/${id}`, { method: 'DELETE' }),
  getStudentByEmail: (email) => fetchAPI(`/students/email/${encodeURIComponent(email)}`),
  getStudentByToken: (token) => fetchAPI(`/students/token/${encodeURIComponent(token)}`),
  getStudentByLogin: (login) => fetchAPI(`/students/login/${encodeURIComponent(login)}`),

  // ==================== CLASSES ====================
  getClasses: () => fetchAPI('/classes'),
  addClass: (classData) => fetchAPI('/classes', { method: 'POST', body: JSON.stringify(classData) }),
  updateClass: (id, data) => fetchAPI(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClass: (id) => fetchAPI(`/classes/${id}`, { method: 'DELETE' }),

  // ==================== COURSES ====================
  getCourses: () => fetchAPI('/courses'),
  addCourse: (course) => fetchAPI('/courses', { method: 'POST', body: JSON.stringify(course) }),
  updateCourse: (id, data) => fetchAPI(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCourse: (id) => fetchAPI(`/courses/${id}`, { method: 'DELETE' }),

  // ==================== EXAMS ====================
  getExams: () => fetchAPI('/exams'),
  addExam: (exam) => fetchAPI('/exams', { method: 'POST', body: JSON.stringify(exam) }),
  updateExam: (id, data) => fetchAPI(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExam: (id) => fetchAPI(`/exams/${id}`, { method: 'DELETE' }),

  // ==================== ESTABLISHMENTS ====================
  getEstablishments: () => fetchAPI('/establishments'),
  addEstablishment: (establishment) => fetchAPI('/establishments', { method: 'POST', body: JSON.stringify(establishment) }),
  updateEstablishment: (id, data) => fetchAPI(`/establishments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEstablishment: (id) => fetchAPI(`/establishments/${id}`, { method: 'DELETE' }),

  // ==================== RESULTS ====================
  getResults: () => fetchAPI('/results'),
  addResult: (result) => fetchAPI('/results', { method: 'POST', body: JSON.stringify(result) }),
  updateResult: (id, data) => fetchAPI(`/results/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};
