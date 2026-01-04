// Utilitaires de stockage localStorage

export const storage = {
  // ==================== CLASSES ====================
  getClasses: () => {
    const classes = localStorage.getItem('classes');
    return classes ? JSON.parse(classes) : [];
  },
  
  saveClasses: (classes) => {
    localStorage.setItem('classes', JSON.stringify(classes));
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
    const students = localStorage.getItem('students');
    return students ? JSON.parse(students) : [];
  },
  
  saveStudents: (students) => {
    localStorage.setItem('students', JSON.stringify(students));
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
  
  getStudentByToken: (token) => {
    return storage.getStudents().find(s => s.token === token);
  },
  
  getStudentsByClass: (classId) => {
    return storage.getStudents().filter(s => s.classId === classId);
  },

  // ==================== COURS ====================
  getCourses: () => {
    const courses = localStorage.getItem('courses');
    return courses ? JSON.parse(courses) : [];
  },
  
  saveCourses: (courses) => {
    localStorage.setItem('courses', JSON.stringify(courses));
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
    const exams = localStorage.getItem('exams');
    return exams ? JSON.parse(exams) : [];
  },
  
  saveExams: (exams) => {
    localStorage.setItem('exams', JSON.stringify(exams));
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
    return results;
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
  }
};

// Données de démonstration
export const initDemoData = () => {
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
