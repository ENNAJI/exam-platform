import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Clock, HelpCircle, Building2, Users, BookOpen, ChevronDown, ChevronRight, FileText, Calendar, Link2, FileUp, File, ExternalLink, ClipboardList, UserPlus, Upload, X, Check, Presentation, Maximize2, Minimize2, Download, Save, StickyNote, Image, Copy, RefreshCw, Play, Square, Send, Monitor, ScreenShare, StopCircle } from 'lucide-react';
import Header from '../../components/Header';
import { storage, fileStorage } from '../../data/storage';
import PPTXViewer from '../../components/PPTXViewer';

export default function TeacherDashboard() {
  const [exams, setExams] = useState([]);
  const [establishments, setEstablishments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [expandedEstablishments, setExpandedEstablishments] = useState({});
  const [expandedClasses, setExpandedClasses] = useState({});
  const [expandedCourses, setExpandedCourses] = useState({});
  
  // Modales de création
  const [showEstablishmentModal, setShowEstablishmentModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateCourse, setDuplicateCourse] = useState(null);
  const [selectedTargetClasses, setSelectedTargetClasses] = useState([]);
  const [viewingResource, setViewingResource] = useState(null);
  const [viewerSize, setViewerSize] = useState('normal'); // 'normal', 'maximized', 'minimized'
  const [resourceNotes, setResourceNotes] = useState('');
  const [teacherNotes, setTeacherNotes] = useState([]);
  const [studentNotesForResource, setStudentNotesForResource] = useState([]);
  const [newTeacherNote, setNewTeacherNote] = useState('');
  
  // Formulaires
  const [establishmentForm, setEstablishmentForm] = useState({ name: '', city: '', type: 'university' });
  const [classForm, setClassForm] = useState({ name: '', year: '', establishmentId: '' });
  const [courseForm, setCourseForm] = useState({ title: '', description: '', classId: '' });
  const [examForm, setExamForm] = useState({ title: '', description: '', duration: 30, courseId: '', examType: 'exam' });
  const [resourceForm, setResourceForm] = useState({ courseId: '', type: 'support', name: '', file: null });
  const [linkForm, setLinkForm] = useState({ courseId: '', title: '', url: '' });
  const [studentForm, setStudentForm] = useState({ firstName: '', lastName: '', email: '', code: '', password: '', courseId: '' });
  const [editStudentForm, setEditStudentForm] = useState({ id: '', firstName: '', lastName: '', email: '', code: '', password: '' });
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editEstablishmentForm, setEditEstablishmentForm] = useState({ id: '', name: '', city: '', type: 'university' });
  const [showEditEstablishmentModal, setShowEditEstablishmentModal] = useState(false);
  const [editClassForm, setEditClassForm] = useState({ id: '', name: '', year: '', establishmentId: '' });
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [editCourseForm, setEditCourseForm] = useState({ id: '', title: '', description: '', classId: '' });
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [importCourseId, setImportCourseId] = useState('');
  const [importData, setImportData] = useState('');
  
  // États pour le mode présentation
  const [showPresentationModal, setShowPresentationModal] = useState(false);
  const [presentationResource, setPresentationResource] = useState(null);
  const [presentationTargetType, setPresentationTargetType] = useState('class');
  const [presentationTargetStudents, setPresentationTargetStudents] = useState([]);
  const [activePresentation, setActivePresentation] = useState(null);
  const [presentationComments, setPresentationComments] = useState([]);
  const [newPresentationComment, setNewPresentationComment] = useState('');
  const [presentationCurrentSlide, setPresentationCurrentSlide] = useState(0);
  
  // États pour le partage d'écran
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [showScreenShareModal, setShowScreenShareModal] = useState(false);
  const [screenShareTargetType, setScreenShareTargetType] = useState('class');
  const [screenShareTargetStudents, setScreenShareTargetStudents] = useState([]);
  const screenVideoRef = useRef(null);
  const screenCaptureInterval = useRef(null);
  
  // États pour le tableau de bord des sessions actives
  const [allActivePresentations, setAllActivePresentations] = useState([]);
  const [allActiveScreenShares, setAllActiveScreenShares] = useState([]);
  const [showSessionsDashboard, setShowSessionsDashboard] = useState(false);
  
  // États pour le partage audio
  const [isAudioSharing, setIsAudioSharing] = useState(false);
  const [audioStream, setAudioStream] = useState(null);
  const audioContextRef = useRef(null);
  const audioProcessorRef = useRef(null);
  const audioIntervalRef = useRef(null);
  
  const fileInputRef = useRef(null);
  const importFileRef = useRef(null);
  const notesEditorRef = useRef(null);
  const presentationCommentsRef = useRef(null);

  useEffect(() => {
    const loadInitialData = async () => {
      // Charger les données depuis le serveur pour synchronisation
      await storage.loadFromServer();
      
      const teacher = storage.getCurrentTeacher();
      setExams(storage.getExams());
      setClasses(storage.getClasses());
      setCourses(storage.getCourses());
      if (teacher) {
        const teacherEstablishments = storage.getEstablishmentsByTeacher(teacher.id);
        setEstablishments(teacherEstablishments);
        // Expand all by default
        const expEst = {};
        const expClass = {};
        const expCourse = {};
        teacherEstablishments.forEach(e => { expEst[e.id] = true; });
        setExpandedEstablishments(expEst);
        setExpandedClasses(expClass);
        setExpandedCourses(expCourse);
      }
      setAllStudents(storage.getStudents());
    };
    
    loadInitialData();
    
    // Polling pour synchroniser les données toutes les 10 secondes
    const syncInterval = setInterval(async () => {
      await storage.loadFromServer();
      setExams(storage.getExams());
      setClasses(storage.getClasses());
      setCourses(storage.getCourses());
      setAllStudents(storage.getStudents());
      const teacher = storage.getCurrentTeacher();
      if (teacher) {
        setEstablishments(storage.getEstablishmentsByTeacher(teacher.id));
      }
    }, 10000);
    
    return () => clearInterval(syncInterval);
  }, []);

  const refreshData = async () => {
    await storage.loadFromServer();
    setExams(storage.getExams());
    setClasses(storage.getClasses());
    setCourses(storage.getCourses());
    setAllStudents(storage.getStudents());
    const teacher = storage.getCurrentTeacher();
    if (teacher) {
      setEstablishments(storage.getEstablishmentsByTeacher(teacher.id));
    }
  };

  const getStudentsByCourse = (courseId) => {
    const course = storage.getCourseById(courseId);
    if (!course) return [];
    const studentIds = course.studentIds || [];
    return allStudents.filter(s => studentIds.includes(s.id));
  };

  const handleAddStudentToCourse = (e) => {
    e.preventDefault();
    console.log('studentForm:', studentForm);
    const course = storage.getCourseById(studentForm.courseId);
    console.log('course found:', course);
    if (!course) {
      alert('Erreur: Cours non trouvé. Veuillez réessayer.');
      return;
    }
    
    // Créer l'étudiant s'il n'existe pas
    let student = storage.getStudentByEmail(studentForm.email);
    if (!student) {
      // Utiliser le mot de passe saisi ou en générer un
      const password = studentForm.password.trim() || Math.random().toString(36).substring(2, 10);
      storage.addStudent({
        firstName: studentForm.firstName,
        lastName: studentForm.lastName,
        email: studentForm.email,
        code: studentForm.code,
        password: password,
        classId: course.classId
      });
      student = storage.getStudentByEmail(studentForm.email);
      
      // Afficher le mot de passe si généré automatiquement
      if (!studentForm.password.trim()) {
        alert(`Étudiant créé avec le mot de passe généré : ${password}`);
      }
    } else {
      // Mettre à jour le classId de l'étudiant existant si nécessaire
      if (!student.classId || student.classId !== course.classId) {
        storage.updateStudent(student.id, { classId: course.classId });
        student = storage.getStudentByEmail(studentForm.email);
      }
    }
    
    // Associer l'étudiant au cours
    const studentIds = course.studentIds || [];
    if (!studentIds.includes(student.id)) {
      studentIds.push(student.id);
      storage.updateCourse(studentForm.courseId, { studentIds });
    }
    
    // Synchroniser avec le serveur pour que l'étudiant puisse se connecter depuis un autre navigateur
    storage.syncToServer();
    
    refreshData();
    setShowStudentModal(false);
    setStudentForm({ firstName: '', lastName: '', email: '', code: '', password: '', courseId: '' });
  };

  const handleRemoveStudentFromCourse = (courseId, studentId) => {
    const course = storage.getCourseById(courseId);
    if (!course) return;
    const studentIds = (course.studentIds || []).filter(id => id !== studentId);
    storage.updateCourse(courseId, { studentIds });
    refreshData();
  };

  const handleClearStudents = (courseId) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer tous les étudiants de ce cours ?')) return;
    storage.updateCourse(courseId, { studentIds: [] });
    refreshData();
  };

  const openEditStudentModal = (student) => {
    setEditStudentForm({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      code: student.code || '',
      password: ''
    });
    setShowEditStudentModal(true);
  };

  const handleEditStudent = (e) => {
    e.preventDefault();
    storage.updateStudent(editStudentForm.id, {
      firstName: editStudentForm.firstName,
      lastName: editStudentForm.lastName,
      email: editStudentForm.email,
      code: editStudentForm.code,
      ...(editStudentForm.password.trim() && { password: editStudentForm.password.trim() })
    });
    refreshData();
    setShowEditStudentModal(false);
    setEditStudentForm({ id: '', firstName: '', lastName: '', email: '', code: '', password: '' });
  };

  // Fonctions d'édition pour établissement
  const openEditEstablishmentModal = (establishment) => {
    setEditEstablishmentForm({
      id: establishment.id,
      name: establishment.name,
      city: establishment.city || '',
      type: establishment.type || 'university'
    });
    setShowEditEstablishmentModal(true);
  };

  const handleEditEstablishment = (e) => {
    e.preventDefault();
    storage.updateEstablishment(editEstablishmentForm.id, {
      name: editEstablishmentForm.name,
      city: editEstablishmentForm.city,
      type: editEstablishmentForm.type
    });
    refreshData();
    setShowEditEstablishmentModal(false);
    setEditEstablishmentForm({ id: '', name: '', city: '', type: 'university' });
  };

  // Fonctions d'édition pour classe
  const openEditClassModal = (classItem) => {
    setEditClassForm({
      id: classItem.id,
      name: classItem.name,
      year: classItem.year || '',
      establishmentId: classItem.establishmentId || ''
    });
    setShowEditClassModal(true);
  };

  const handleEditClass = (e) => {
    e.preventDefault();
    storage.updateClass(editClassForm.id, {
      name: editClassForm.name,
      year: editClassForm.year,
      establishmentId: editClassForm.establishmentId
    });
    refreshData();
    setShowEditClassModal(false);
    setEditClassForm({ id: '', name: '', year: '', establishmentId: '' });
  };

  // Fonctions d'édition pour cours
  const openEditCourseModal = (course) => {
    setEditCourseForm({
      id: course.id,
      title: course.title,
      description: course.description || '',
      classId: course.classId || ''
    });
    setShowEditCourseModal(true);
  };

  const handleEditCourse = (e) => {
    e.preventDefault();
    storage.updateCourse(editCourseForm.id, {
      title: editCourseForm.title,
      description: editCourseForm.description,
      classId: editCourseForm.classId
    });
    refreshData();
    setShowEditCourseModal(false);
    setEditCourseForm({ id: '', title: '', description: '', classId: '' });
  };

  // Fonctions de suppression
  const handleDeleteEstablishment = (establishment) => {
    if (!confirm(`Voulez-vous vraiment supprimer l'établissement "${establishment.name}" ?\n\n⚠️ Toutes les classes, cours et données associées seront également supprimés.`)) {
      return;
    }
    // Supprimer les classes associées
    const classesToDelete = classes.filter(c => c.establishmentId === establishment.id);
    classesToDelete.forEach(cls => {
      // Supprimer les cours de chaque classe
      const coursesToDelete = courses.filter(c => c.classId === cls.id);
      coursesToDelete.forEach(course => storage.deleteCourse(course.id));
      storage.deleteClass(cls.id);
    });
    storage.deleteEstablishment(establishment.id);
    refreshData();
  };

  const handleDeleteClass = (classItem) => {
    if (!confirm(`Voulez-vous vraiment supprimer la classe "${classItem.name}" ?\n\n⚠️ Tous les cours et données associées seront également supprimés.`)) {
      return;
    }
    // Supprimer les cours associés
    const coursesToDelete = courses.filter(c => c.classId === classItem.id);
    coursesToDelete.forEach(course => storage.deleteCourse(course.id));
    storage.deleteClass(classItem.id);
    refreshData();
  };

  const handleDeleteCourse = (course) => {
    if (!confirm(`Voulez-vous vraiment supprimer le cours "${course.title}" ?\n\n⚠️ Toutes les ressources et examens associés seront également supprimés.`)) {
      return;
    }
    storage.deleteCourse(course.id);
    refreshData();
  };

  const handleExportData = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      establishments: storage.getEstablishments(),
      classes: storage.getClasses(),
      courses: storage.getCourses(),
      students: storage.getStudents(),
      exams: storage.getExams(),
      teachers: storage.getTeachers(),
      results: storage.getResults()
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exam-platform-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSyncToServer = async () => {
    const result = await storage.syncToServer();
    if (result) {
      alert('✅ Données synchronisées avec le serveur !');
    } else {
      alert('❌ Erreur: Le serveur n\'est pas disponible. Vérifiez que le serveur est démarré sur http://localhost:3001');
    }
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        
        if (!confirm(`Voulez-vous importer ces données ?\n\n- ${importedData.establishments?.length || 0} établissement(s)\n- ${importedData.classes?.length || 0} classe(s)\n- ${importedData.courses?.length || 0} cours\n- ${importedData.students?.length || 0} étudiant(s)\n- ${importedData.exams?.length || 0} examen(s)\n\n⚠️ Les données existantes seront remplacées.`)) {
          return;
        }

        // Importer les données
        if (importedData.establishments) storage.saveEstablishments(importedData.establishments);
        if (importedData.classes) storage.saveClasses(importedData.classes);
        if (importedData.courses) storage.saveCourses(importedData.courses);
        if (importedData.students) storage.saveStudents(importedData.students);
        if (importedData.exams) storage.saveExams(importedData.exams);
        if (importedData.teachers) storage.saveTeachers(importedData.teachers);
        if (importedData.results) storage.saveResults(importedData.results);

        refreshData();
        alert('✅ Données importées avec succès !');
      } catch (error) {
        console.error('Erreur import:', error);
        alert('❌ Erreur lors de l\'importation. Vérifiez le format du fichier.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportStudents = (e) => {
    e.preventDefault();
    if (!importCourseId || !importData.trim()) return;
    
    const course = storage.getCourseById(importCourseId);
    if (!course) return;
    
    const lines = importData.trim().split('\n');
    const studentIds = course.studentIds || [];
    
    lines.forEach(line => {
      const parts = line.split(/[,;\t]/);
      if (parts.length >= 3) {
        const [firstName, lastName, email, code, passwordFromFile] = parts.map(p => p.trim());
        
        let student = storage.getStudentByEmail(email);
        if (!student) {
          // Utiliser le mot de passe du fichier ou en générer un
          const password = passwordFromFile || Math.random().toString(36).substring(2, 10);
          storage.addStudent({
            firstName,
            lastName,
            email,
            code: code || '',
            password,
            classId: course.classId
          });
          student = storage.getStudentByEmail(email);
        } else {
          // Mettre à jour le classId de l'étudiant existant
          if (!student.classId || student.classId !== course.classId) {
            storage.updateStudent(student.id, { classId: course.classId });
          }
        }
        
        if (student && !studentIds.includes(student.id)) {
          studentIds.push(student.id);
        }
      }
    });
    
    storage.updateCourse(importCourseId, { studentIds });
    refreshData();
    setShowImportModal(false);
    setImportCourseId('');
    setImportData('');
  };

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileName = file.name.toLowerCase();
    
    // Pour les fichiers Excel (xlsx, xls), utiliser la bibliothèque xlsx
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      try {
        const XLSX = await import('xlsx');
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            // Convertir en format CSV (ignorer la première ligne si c'est l'en-tête)
            const rows = jsonData.filter((row, index) => {
              // Ignorer les lignes vides et l'en-tête
              if (!row || row.length < 3) return false;
              if (index === 0 && (row[0]?.toString().toLowerCase().includes('prénom') || row[0]?.toString().toLowerCase().includes('prenom'))) return false;
              return true;
            });
            
            const csvContent = rows.map(row => row.join(';')).join('\n');
            setImportData(csvContent);
          } catch (err) {
            console.error('Erreur parsing Excel:', err);
            alert('Erreur lors de la lecture du fichier Excel. Veuillez vérifier le format du fichier.');
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        console.error('Erreur chargement XLSX:', err);
        alert('Erreur lors du chargement. Veuillez utiliser un fichier CSV à la place.');
      }
    } else {
      // Pour CSV et TXT, lire comme texte avec encodage UTF-8
      const reader = new FileReader();
      reader.onload = (event) => {
        let content = event.target.result;
        // Supprimer le BOM UTF-8 si présent
        if (content.charCodeAt(0) === 0xFEFF) {
          content = content.substring(1);
        }
        // Ignorer la première ligne si c'est l'en-tête
        const lines = content.split('\n');
        if (lines.length > 0 && (lines[0].toLowerCase().includes('prénom') || lines[0].toLowerCase().includes('prenom'))) {
          content = lines.slice(1).join('\n');
        }
        setImportData(content);
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  const openResourceViewer = async (resource) => {
    // Charger le fichier depuis IndexedDB si nécessaire
    let resourceWithData = { ...resource };
    if (resource.fileId && !resource.data) {
      const fileData = await fileStorage.getFile(resource.fileId);
      if (fileData) {
        resourceWithData.data = fileData;
      }
    }
    
    setViewingResource(resourceWithData);
    setResourceNotes(resource.notes || '');
    setViewerSize('normal');
    
    // Charger les notes du professeur et des étudiants pour cette ressource
    const profNotes = storage.getTeacherNotesForResource(resource.id);
    const studNotes = storage.getAllNotesForResource(resource.id).filter(n => n.authorType === 'student');
    setTeacherNotes(profNotes);
    setStudentNotesForResource(studNotes);
    setNewTeacherNote('');
    
    // Charger le contenu HTML dans l'éditeur après le rendu
    setTimeout(() => {
      if (notesEditorRef.current) {
        notesEditorRef.current.innerHTML = resource.notes || '';
      }
    }, 100);
  };

  const handleAddTeacherNote = () => {
    if (!newTeacherNote.trim() || !viewingResource) return;
    
    const newNote = storage.addNote({
      resourceId: viewingResource.id,
      courseId: viewingResource.courseId,
      authorType: 'teacher',
      content: newTeacherNote.trim()
    });
    
    setTeacherNotes([...teacherNotes, newNote]);
    setNewTeacherNote('');
  };

  const handleDeleteTeacherNote = (noteId) => {
    if (!confirm('Supprimer cette note ?')) return;
    storage.deleteNote(noteId);
    setTeacherNotes(teacherNotes.filter(n => n.id !== noteId));
  };

  const saveResourceNotes = () => {
    if (!viewingResource) return;
    
    const notesContent = notesEditorRef.current ? notesEditorRef.current.innerHTML : resourceNotes;
    
    const course = storage.getCourseById(viewingResource.courseId);
    if (!course) return;
    
    const resources = (course.resources || []).map(r => {
      if (r.id === viewingResource.id) {
        return { ...r, notes: notesContent };
      }
      return r;
    });
    
    storage.updateCourse(viewingResource.courseId, { resources });
    setViewingResource({ ...viewingResource, notes: notesContent });
    setResourceNotes(notesContent);
    refreshData();
    alert('Notes enregistrées !');
  };

  const handleNotesPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = document.createElement('img');
          img.src = event.target.result;
          img.style.maxWidth = '100%';
          img.style.borderRadius = '8px';
          img.style.margin = '8px 0';
          
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(img);
            range.setStartAfter(img);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          } else if (notesEditorRef.current) {
            notesEditorRef.current.appendChild(img);
          }
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  const handleNotesImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target.result;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '8px';
        img.style.margin = '8px 0';
        
        if (notesEditorRef.current) {
          notesEditorRef.current.appendChild(img);
          notesEditorRef.current.focus();
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet examen ?')) {
      const updated = storage.deleteExam(id);
      setExams(updated);
    }
  };

  const toggleActive = (id) => {
    const exam = storage.getExamById(id);
    const updated = storage.updateExam(id, { isActive: !exam.isActive });
    setExams(updated);
  };

  const toggleEstablishment = (id) => {
    setExpandedEstablishments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleClass = (id) => {
    setExpandedClasses(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCourse = (id) => {
    setExpandedCourses(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getClassesByEstablishment = (establishmentId) => {
    return classes.filter(c => c.establishmentId === establishmentId);
  };

  const getCoursesByClass = (classId) => {
    return courses.filter(c => c.classId === classId);
  };

  const getExamsByCourse = (courseId) => {
    return exams.filter(e => e.courseId === courseId);
  };

  const getOrphanExams = () => {
    return exams.filter(e => !e.courseId);
  };

  const handleCreateEstablishment = (e) => {
    e.preventDefault();
    storage.addEstablishment(establishmentForm);
    refreshData();
    setShowEstablishmentModal(false);
    setEstablishmentForm({ name: '', city: '', type: 'university' });
  };

  const handleCreateClass = (e) => {
    e.preventDefault();
    storage.addClass(classForm);
    refreshData();
    setShowClassModal(false);
    setClassForm({ name: '', year: '', establishmentId: '' });
  };

  const handleCreateCourse = (e) => {
    e.preventDefault();
    storage.addCourse(courseForm);
    refreshData();
    setShowCourseModal(false);
    setCourseForm({ title: '', description: '', classId: '' });
  };

  const handleCreateExam = (e) => {
    e.preventDefault();
    storage.addExam({ ...examForm, questions: [], isActive: true });
    refreshData();
    setShowExamModal(false);
    setExamForm({ title: '', description: '', duration: 30, courseId: '', examType: 'exam' });
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!resourceForm.file) {
      alert('Veuillez sélectionner un fichier');
      return;
    }
    
    // Limite à 10 Mo pour la synchronisation serveur
    const maxSize = 10 * 1024 * 1024; // 10 Mo
    if (resourceForm.file.size > maxSize) {
      alert('Le fichier est trop volumineux. Taille maximale : 10 Mo pour la synchronisation entre navigateurs.');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const fileData = event.target.result;
        
        const resource = {
          id: Date.now().toString(),
          courseId: resourceForm.courseId,
          type: resourceForm.type,
          name: resourceForm.name || resourceForm.file.name,
          fileName: resourceForm.file.name,
          fileType: resourceForm.file.type || 'application/octet-stream',
          fileSize: resourceForm.file.size,
          data: fileData, // Stocker directement le fichier en base64
          createdAt: new Date().toISOString()
        };
        
        const course = storage.getCourseById(resourceForm.courseId);
        if (course) {
          const resources = course.resources || [];
          resources.push(resource);
          storage.updateCourse(resourceForm.courseId, { resources });
          refreshData();
          
          // Synchroniser automatiquement avec le serveur
          storage.syncToServer();
          
          alert('Fichier ajouté avec succès ! Cliquez sur "Sync Serveur" pour partager avec les étudiants.');
        } else {
          alert('Erreur : cours non trouvé');
        }
        
        setShowResourceModal(false);
        setResourceForm({ courseId: '', type: 'support', name: '', file: null });
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        console.error('Erreur lors de l\'ajout du fichier:', error);
        alert('Erreur lors de l\'ajout du fichier: ' + error.message);
      }
    };
    
    reader.onerror = (error) => {
      console.error('Erreur de lecture du fichier:', error);
      alert('Erreur lors de la lecture du fichier');
    };
    
    reader.readAsDataURL(resourceForm.file);
  };

  const handleAddLink = (e) => {
    e.preventDefault();
    const link = {
      id: Date.now().toString(),
      courseId: linkForm.courseId,
      type: 'link',
      title: linkForm.title,
      url: linkForm.url,
      createdAt: new Date().toISOString()
    };
    
    const course = storage.getCourseById(linkForm.courseId);
    if (course) {
      const resources = course.resources || [];
      resources.push(link);
      storage.updateCourse(linkForm.courseId, { resources });
      refreshData();
    }
    
    setShowLinkModal(false);
    setLinkForm({ courseId: '', title: '', url: '' });
  };

  const handleDeleteResource = async (courseId, resourceId) => {
    if (window.confirm('Supprimer cette ressource ?')) {
      const course = storage.getCourseById(courseId);
      if (course) {
        // Trouver la ressource pour supprimer le fichier d'IndexedDB
        const resourceToDelete = (course.resources || []).find(r => r.id === resourceId);
        if (resourceToDelete?.fileId) {
          await fileStorage.deleteFile(resourceToDelete.fileId);
        }
        
        const resources = (course.resources || []).filter(r => r.id !== resourceId);
        storage.updateCourse(courseId, { resources });
        refreshData();
      }
    }
  };

  const getResourceIcon = (resource) => {
    if (resource.type === 'link') return <Link2 size={14} />;
    if (resource.type === 'revision') return <ClipboardList size={14} />;
    return <File size={14} />;
  };

  const openDuplicateModal = (course) => {
    setDuplicateCourse(course);
    setSelectedTargetClasses([]);
    setShowDuplicateModal(true);
  };

  const handleDuplicateCourse = async () => {
    if (!duplicateCourse || selectedTargetClasses.length === 0) {
      alert('Veuillez sélectionner au moins une formation cible');
      return;
    }

    try {
      for (const targetClassId of selectedTargetClasses) {
        // Créer une copie du cours
        const newCourse = {
          title: duplicateCourse.title,
          description: duplicateCourse.description,
          classId: targetClassId,
          resources: []
        };

        // Dupliquer les ressources (sans les fichiers pour éviter la duplication de données)
        if (duplicateCourse.resources && duplicateCourse.resources.length > 0) {
          for (const resource of duplicateCourse.resources) {
            const newResource = {
              ...resource,
              id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
              createdAt: new Date().toISOString()
            };

            // Si la ressource a un fichier dans IndexedDB, le dupliquer
            if (resource.fileId) {
              const fileData = await fileStorage.getFile(resource.fileId);
              if (fileData) {
                const newFileId = 'file_' + Date.now().toString() + Math.random().toString(36).substring(2, 5);
                await fileStorage.saveFile(newFileId, fileData);
                newResource.fileId = newFileId;
              }
            }

            newCourse.resources.push(newResource);
          }
        }

        storage.addCourse(newCourse);

        // Dupliquer les examens associés
        const courseExams = getExamsByCourse(duplicateCourse.id);
        const newCourseId = storage.getCourses().find(c => 
          c.title === newCourse.title && c.classId === targetClassId
        )?.id;

        if (newCourseId) {
          for (const exam of courseExams) {
            const newExam = {
              title: exam.title,
              description: exam.description,
              duration: exam.duration,
              courseId: newCourseId,
              examType: exam.examType,
              questions: exam.questions ? JSON.parse(JSON.stringify(exam.questions)) : [],
              isActive: false
            };
            storage.addExam(newExam);
          }
        }
      }

      refreshData();
      setShowDuplicateModal(false);
      setDuplicateCourse(null);
      setSelectedTargetClasses([]);
      alert(`Cours dupliqué vers ${selectedTargetClasses.length} formation(s) avec succès !`);
    } catch (error) {
      console.error('Erreur duplication:', error);
      alert('Erreur lors de la duplication du cours');
    }
  };

  const toggleTargetClass = (classId) => {
    setSelectedTargetClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const exportStudentTemplate = (courseTitle) => {
    const headers = ['Prénom', 'Nom', 'Email', 'Code étudiant', 'Mot de passe'];
    const exampleRows = [
      ['Jean', 'Dupont', 'jean.dupont@email.com', 'ETU001', 'motdepasse123'],
      ['Marie', 'Martin', 'marie.martin@email.com', 'ETU002', 'marie2024'],
      ['Pierre', 'Bernard', 'pierre.bernard@email.com', 'ETU003', 'pierre123']
    ];
    
    const csvContent = [
      headers.join(';'),
      ...exampleRows.map(row => row.join(';'))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `modele_etudiants_${courseTitle.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getResourceTypeLabel = (type) => {
    switch (type) {
      case 'support': return 'Support de cours';
      case 'revision': return 'Fiche de révision';
      case 'td': return 'Travaux Dirigés';
      case 'tp': return 'Travaux Pratiques';
      case 'link': return 'Lien';
      default: return 'Ressource';
    }
  };

  // ==================== FONCTIONS MODE PRÉSENTATION ====================
  const API_URL = `http://${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'localhost' : window.location.hostname}:3001/api`;

  const openPresentationModal = (resource, course) => {
    setPresentationResource({ ...resource, courseId: course.id, classId: course.classId, courseName: course.title });
    setPresentationTargetType('class');
    setPresentationTargetStudents([]);
    setShowPresentationModal(true);
  };

  const startPresentation = async () => {
    if (!presentationResource) return;
    
    const teacher = storage.getCurrentTeacher();
    const course = courses.find(c => c.id === presentationResource.courseId);
    
    // S'assurer que le classId est défini
    const classIdToUse = presentationResource.classId || course?.classId;
    
    console.log('Démarrage présentation:', {
      resourceId: presentationResource.id,
      courseId: presentationResource.courseId,
      classId: classIdToUse,
      targetType: presentationTargetType
    });
    
    try {
      const response = await fetch(`${API_URL}/presentation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacher?.id,
          teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Professeur',
          resourceId: presentationResource.id,
          resourceName: presentationResource.name,
          courseId: presentationResource.courseId,
          classId: classIdToUse,
          targetType: presentationTargetType,
          targetStudentIds: presentationTargetType === 'students' ? presentationTargetStudents : []
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setActivePresentation(data.presentation);
        setPresentationComments([]);
        setPresentationCurrentSlide(0);
        setShowPresentationModal(false);
      }
    } catch (error) {
      console.error('Erreur démarrage présentation:', error);
      alert('Erreur lors du démarrage de la présentation. Vérifiez que le serveur est démarré.');
    }
  };

  const stopPresentation = async () => {
    if (!activePresentation) return;
    
    try {
      await fetch(`${API_URL}/presentation/${activePresentation.id}`, {
        method: 'DELETE'
      });
      setActivePresentation(null);
      setPresentationComments([]);
      setPresentationResource(null);
    } catch (error) {
      console.error('Erreur arrêt présentation:', error);
    }
  };

  const updatePresentationSlide = async (slideIndex) => {
    if (!activePresentation) return;
    
    console.log('📺 Mise à jour slide:', slideIndex);
    setPresentationCurrentSlide(slideIndex);
    
    try {
      const response = await fetch(`${API_URL}/presentation/${activePresentation.id}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentSlide: slideIndex })
      });
      const data = await response.json();
      console.log('📺 Réponse serveur:', data);
    } catch (error) {
      console.error('Erreur mise à jour slide:', error);
    }
  };

  const sendPresentationComment = async () => {
    if (!activePresentation || !newPresentationComment.trim()) return;
    
    const teacher = storage.getCurrentTeacher();
    
    try {
      const response = await fetch(`${API_URL}/presentation/${activePresentation.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: teacher?.id,
          authorName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Professeur',
          authorType: 'teacher',
          content: newPresentationComment.trim()
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setPresentationComments([...presentationComments, data.comment]);
        setNewPresentationComment('');
        if (presentationCommentsRef.current) {
          presentationCommentsRef.current.scrollTop = presentationCommentsRef.current.scrollHeight;
        }
      }
    } catch (error) {
      console.error('Erreur envoi commentaire:', error);
    }
  };

  // Polling pour récupérer les nouveaux commentaires
  useEffect(() => {
    if (!activePresentation) return;
    
    const pollComments = async () => {
      try {
        const response = await fetch(`${API_URL}/presentation/${activePresentation.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.comments && data.comments.length > presentationComments.length) {
            setPresentationComments(data.comments);
          }
        }
      } catch (error) {
        console.error('Erreur polling:', error);
      }
    };
    
    const interval = setInterval(pollComments, 2000);
    return () => clearInterval(interval);
  }, [activePresentation, presentationComments.length]);

  // ==================== TABLEAU DE BORD SESSIONS ACTIVES ====================
  const loadActiveSessions = async () => {
    const teacher = storage.getCurrentTeacher();
    try {
      // Charger les présentations actives
      const presResponse = await fetch(`${API_URL}/presentations/all?teacherId=${teacher?.id || ''}`);
      if (presResponse.ok) {
        const presentations = await presResponse.json();
        setAllActivePresentations(presentations);
      }
      
      // Charger les partages d'écran actifs
      const screenResponse = await fetch(`${API_URL}/screenshare/all?teacherId=${teacher?.id || ''}`);
      if (screenResponse.ok) {
        const screenShares = await screenResponse.json();
        setAllActiveScreenShares(screenShares);
      }
    } catch (error) {
      console.error('Erreur chargement sessions:', error);
    }
  };

  // Polling pour le tableau de bord
  useEffect(() => {
    if (!showSessionsDashboard) return;
    
    loadActiveSessions();
    const interval = setInterval(loadActiveSessions, 3000);
    return () => clearInterval(interval);
  }, [showSessionsDashboard]);

  const rejoinPresentation = async (presentation) => {
    // Charger la ressource associée
    const course = courses.find(c => c.id === presentation.courseId);
    if (course) {
      const resource = (course.resources || []).find(r => r.id === presentation.resourceId);
      if (resource) {
        setPresentationResource({ ...resource, courseId: course.id, classId: course.classId, courseName: course.title });
        setActivePresentation(presentation);
        setPresentationComments(presentation.comments || []);
        setShowSessionsDashboard(false);
      }
    }
  };

  const closePresentation = async (presentationId) => {
    try {
      await fetch(`${API_URL}/presentation/${presentationId}`, { method: 'DELETE' });
      loadActiveSessions();
    } catch (error) {
      console.error('Erreur fermeture présentation:', error);
    }
  };

  const closeScreenShare = async (screenShareId) => {
    try {
      await fetch(`${API_URL}/screenshare/${screenShareId}/stop`, { method: 'POST' });
      loadActiveSessions();
    } catch (error) {
      console.error('Erreur fermeture partage écran:', error);
    }
  };

  // ==================== FONCTIONS PARTAGE D'ÉCRAN ====================
  const openScreenShareModal = (course) => {
    setScreenShareTargetType('class');
    setScreenShareTargetStudents([]);
    setShowScreenShareModal({ courseId: course.id, classId: course.classId, courseName: course.title });
  };

  const startScreenShare = async () => {
    if (!showScreenShareModal) return;
    
    try {
      // Demander l'accès au partage d'écran
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });
      
      setScreenStream(stream);
      setIsScreenSharing(true);
      
      // Connecter le stream à l'élément vidéo
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }
      
      const teacher = storage.getCurrentTeacher();
      
      // Démarrer la session de partage d'écran sur le serveur
      const response = await fetch(`${API_URL}/screenshare/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacher?.id,
          teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Professeur',
          courseId: showScreenShareModal.courseId,
          classId: showScreenShareModal.classId,
          targetType: screenShareTargetType,
          targetStudentIds: screenShareTargetType === 'students' ? screenShareTargetStudents : []
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Capturer et envoyer des frames régulièrement
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        screenCaptureInterval.current = setInterval(async () => {
          if (screenVideoRef.current && screenVideoRef.current.videoWidth > 0) {
            canvas.width = screenVideoRef.current.videoWidth;
            canvas.height = screenVideoRef.current.videoHeight;
            ctx.drawImage(screenVideoRef.current, 0, 0);
            
            // Compresser l'image en JPEG avec qualité réduite pour le transfert
            const frameData = canvas.toDataURL('image/jpeg', 0.5);
            
            // Envoyer la frame au serveur
            try {
              await fetch(`${API_URL}/screenshare/${data.sessionId}/frame`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ frame: frameData })
              });
            } catch (e) {
              console.log('Erreur envoi frame:', e);
            }
          }
        }, 500); // Envoyer une frame toutes les 500ms
        
        setShowScreenShareModal({ ...showScreenShareModal, sessionId: data.sessionId });
      }
      
      // Gérer l'arrêt du partage par l'utilisateur
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
      
    } catch (error) {
      console.error('Erreur partage écran:', error);
      alert('Impossible de démarrer le partage d\'écran. Vérifiez les permissions du navigateur.');
    }
  };

  const stopScreenShare = async () => {
    // Arrêter l'intervalle de capture
    if (screenCaptureInterval.current) {
      clearInterval(screenCaptureInterval.current);
      screenCaptureInterval.current = null;
    }
    
    // Arrêter le stream
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    
    // Notifier le serveur
    const sessionId = showScreenShareModal?.sessionId || activePresentation?.screenShareSessionId;
    if (sessionId) {
      try {
        await fetch(`${API_URL}/screenshare/${sessionId}/stop`, {
          method: 'POST'
        });
      } catch (e) {
        console.log('Erreur arrêt session:', e);
      }
    }
    
    // Mettre à jour la présentation active si elle existe
    if (activePresentation) {
      setActivePresentation(prev => ({ ...prev, screenShareSessionId: null }));
    }
    
    setIsScreenSharing(false);
    setShowScreenShareModal(false);
  };

  // ==================== FONCTIONS PARTAGE AUDIO ====================
  const startAudioSharing = async () => {
    if (!activePresentation) return;
    
    try {
      // Demander l'accès au microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setIsAudioSharing(true);
      
      // Créer le contexte audio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      audioProcessorRef.current = processor;
      
      // Buffer pour accumuler les données audio
      let audioBuffer = [];
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Convertir en tableau simple pour l'envoi
        const audioArray = Array.from(inputData);
        audioBuffer.push(...audioArray);
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      // Envoyer les données audio toutes les 500ms
      audioIntervalRef.current = setInterval(async () => {
        if (audioBuffer.length > 0 && activePresentation) {
          try {
            // Compresser les données audio (downsampling)
            const compressed = audioBuffer.filter((_, i) => i % 4 === 0);
            await fetch(`${API_URL}/presentation/${activePresentation.id}/audio`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                audioData: compressed,
                timestamp: Date.now()
              })
            });
          } catch (e) {
            console.log('Erreur envoi audio:', e);
          }
          audioBuffer = [];
        }
      }, 500);
      
      // Notifier le serveur que l'audio est activé
      await fetch(`${API_URL}/presentation/${activePresentation.id}/audio/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true })
      });
      
    } catch (error) {
      console.error('Erreur partage audio:', error);
      alert('Impossible d\'accéder au microphone. Vérifiez les permissions du navigateur.');
    }
  };

  const stopAudioSharing = async () => {
    // Arrêter l'intervalle d'envoi
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    
    // Déconnecter le processeur audio
    if (audioProcessorRef.current) {
      audioProcessorRef.current.disconnect();
      audioProcessorRef.current = null;
    }
    
    // Fermer le contexte audio
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Arrêter le stream
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    
    // Notifier le serveur
    if (activePresentation) {
      try {
        await fetch(`${API_URL}/presentation/${activePresentation.id}/audio/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: false })
        });
      } catch (e) {
        console.log('Erreur arrêt audio:', e);
      }
    }
    
    setIsAudioSharing(false);
  };

  // Démarrer le partage d'écran pendant une présentation
  const startScreenShareInPresentation = async () => {
    if (!activePresentation) return;
    
    try {
      // Demander l'accès au partage d'écran
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });
      
      setScreenStream(stream);
      setIsScreenSharing(true);
      
      // Connecter le stream à l'élément vidéo
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }
      
      const teacher = storage.getCurrentTeacher();
      
      // Démarrer la session de partage d'écran sur le serveur
      const response = await fetch(`${API_URL}/screenshare/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacher?.id,
          teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Professeur',
          courseId: activePresentation.courseId,
          classId: activePresentation.classId,
          targetType: activePresentation.targetType,
          targetStudentIds: activePresentation.targetStudentIds || [],
          presentationId: activePresentation.id
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Sauvegarder l'ID de session dans la présentation
        setActivePresentation(prev => ({ ...prev, screenShareSessionId: data.sessionId }));
        
        // Capturer et envoyer des frames régulièrement
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        screenCaptureInterval.current = setInterval(async () => {
          if (screenVideoRef.current && screenVideoRef.current.videoWidth > 0) {
            canvas.width = screenVideoRef.current.videoWidth;
            canvas.height = screenVideoRef.current.videoHeight;
            ctx.drawImage(screenVideoRef.current, 0, 0);
            
            // Compresser l'image en JPEG avec qualité réduite pour le transfert
            const frameData = canvas.toDataURL('image/jpeg', 0.5);
            
            // Envoyer la frame au serveur
            try {
              await fetch(`${API_URL}/screenshare/${data.sessionId}/frame`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ frame: frameData })
              });
            } catch (e) {
              console.log('Erreur envoi frame:', e);
            }
          }
        }, 500);
      }
      
      // Gérer l'arrêt du partage par l'utilisateur
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
      
    } catch (error) {
      console.error('Erreur partage écran:', error);
      alert('Impossible de démarrer le partage d\'écran. Vérifiez les permissions du navigateur.');
    }
  };

  const getExamCount = (establishmentId) => {
    let count = 0;
    const estClasses = getClassesByEstablishment(establishmentId);
    estClasses.forEach(cls => {
      const clsCourses = getCoursesByClass(cls.id);
      clsCourses.forEach(course => {
        count += getExamsByCourse(course.id).length;
      });
    });
    return count;
  };

  const renderExamCard = (exam) => (
    <div key={exam.id} style={{
      background: 'white',
      border: '1px solid var(--gray-200)',
      borderRadius: '8px',
      padding: '12px'
    }}>
      <div className="flex flex-between flex-center mb-2">
        <span className={`badge ${exam.isActive ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '10px' }}>
          {exam.isActive ? 'Actif' : 'Inactif'}
        </span>
        <button 
          onClick={() => toggleActive(exam.id)}
          className="btn btn-secondary"
          style={{ padding: '3px 8px', fontSize: '10px' }}
        >
          {exam.isActive ? 'Désactiver' : 'Activer'}
        </button>
      </div>
      <h5 style={{ margin: '0 0 6px 0', fontSize: '14px' }}>{exam.title}</h5>
      <div className="flex gap-2 mb-2" style={{ flexWrap: 'wrap' }}>
        <span className="badge badge-info" style={{ fontSize: '10px' }}>
          <Clock size={10} style={{ display: 'inline', marginRight: '3px' }} />
          {exam.duration} min
        </span>
        <span className="badge badge-info" style={{ fontSize: '10px' }}>
          <HelpCircle size={10} style={{ display: 'inline', marginRight: '3px' }} />
          {exam.questions?.length || 0} questions
        </span>
      </div>
      <div className="flex gap-2">
        <Link to={`/teacher/edit/${exam.id}`} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
          <Edit size={12} />
        </Link>
        <Link to={`/teacher/schedule-exam/${exam.id}`} className="btn btn-primary" style={{ padding: '4px 8px' }}>
          <Calendar size={12} />
        </Link>
        <Link to={`/teacher/results/${exam.id}`} className="btn btn-success" style={{ padding: '4px 8px' }}>
          <Eye size={12} />
        </Link>
        <button onClick={() => handleDelete(exam.id)} className="btn btn-danger" style={{ padding: '4px 8px' }}>
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );

  const renderCourseCard = (course) => {
    const courseExams = getExamsByCourse(course.id);
    const courseResources = course.resources || [];
    const supports = courseResources.filter(r => r.type === 'support');
    const revisions = courseResources.filter(r => r.type === 'revision');
    const tds = courseResources.filter(r => r.type === 'td');
    const tps = courseResources.filter(r => r.type === 'tp');
    const links = courseResources.filter(r => r.type === 'link');
    const isExpanded = expandedCourses[course.id];

    return (
      <div key={course.id} style={{
        background: 'var(--gray-50)',
        border: '1px solid var(--gray-200)',
        borderRadius: '8px',
        marginBottom: '8px',
        overflow: 'hidden'
      }}>
        <div 
          onClick={() => toggleCourse(course.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'var(--secondary)',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          <div className="flex flex-center gap-2">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <BookOpen size={16} />
            <span style={{ fontSize: '13px', fontWeight: '600' }}>{course.title}</span>
          </div>
          <div className="flex flex-center gap-2" style={{ flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', opacity: 0.8 }}>
              {supports.length} support{supports.length > 1 ? 's' : ''} • {tds.length} TD • {tps.length} TP • {revisions.length} fiche{revisions.length > 1 ? 's' : ''} • {links.length} lien{links.length > 1 ? 's' : ''} • {courseExams.length} exam{courseExams.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); openEditCourseModal(course); }}
              style={{ 
                background: 'rgba(255,255,255,0.2)', 
                border: 'none', 
                cursor: 'pointer', 
                color: 'white', 
                padding: '4px 8px', 
                borderRadius: '4px',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Modifier ce cours"
            >
              <Edit size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course); }}
              style={{ 
                background: 'rgba(239,68,68,0.8)', 
                border: 'none', 
                cursor: 'pointer', 
                color: 'white', 
                padding: '4px 8px', 
                borderRadius: '4px',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Supprimer ce cours"
            >
              <Trash2 size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); openDuplicateModal(course); }}
              style={{ 
                background: 'rgba(255,255,255,0.2)', 
                border: 'none', 
                cursor: 'pointer', 
                color: 'white', 
                padding: '4px 8px', 
                borderRadius: '4px',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Dupliquer ce cours vers d'autres formations"
            >
              <Copy size={12} /> Dupliquer
            </button>
          </div>
        </div>
        {isExpanded && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '12px' }}>
            {/* COLONNE GAUCHE : Ressources et Examens */}
            <div style={{ borderRight: '1px solid var(--gray-200)', paddingRight: '16px' }}>
              <h5 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: 'var(--gray-700)' }}>
                📚 Ressources & Évaluations
              </h5>
              
              {/* Boutons d'ajout */}
              <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setResourceForm({ ...resourceForm, courseId: course.id, type: 'support' }); setShowResourceModal(true); }}
                  className="btn"
                  style={{ padding: '5px 8px', fontSize: '10px', background: '#0891b2', color: 'white' }}
                >
                  <FileUp size={12} /> Support
                </button>
                <button
                  onClick={() => { setResourceForm({ ...resourceForm, courseId: course.id, type: 'revision' }); setShowResourceModal(true); }}
                  className="btn"
                  style={{ padding: '5px 8px', fontSize: '10px', background: '#059669', color: 'white' }}
                >
                  <ClipboardList size={12} /> Fiche
                </button>
                <button
                  onClick={() => { setResourceForm({ ...resourceForm, courseId: course.id, type: 'td' }); setShowResourceModal(true); }}
                  className="btn"
                  style={{ padding: '5px 8px', fontSize: '10px', background: '#2563eb', color: 'white' }}
                >
                  <FileText size={12} /> TD
                </button>
                <button
                  onClick={() => { setResourceForm({ ...resourceForm, courseId: course.id, type: 'tp' }); setShowResourceModal(true); }}
                  className="btn"
                  style={{ padding: '5px 8px', fontSize: '10px', background: '#9333ea', color: 'white' }}
                >
                  <FileText size={12} /> TP
                </button>
                <button
                  onClick={() => { setLinkForm({ ...linkForm, courseId: course.id }); setShowLinkModal(true); }}
                  className="btn"
                  style={{ padding: '5px 8px', fontSize: '10px', background: '#6366f1', color: 'white' }}
                >
                  <Link2 size={12} /> Lien
                </button>
                <button
                  onClick={() => { setExamForm({ ...examForm, courseId: course.id, examType: 'exam' }); setShowExamModal(true); }}
                  className="btn"
                  style={{ padding: '5px 8px', fontSize: '10px', background: '#dc2626', color: 'white' }}
                >
                  <FileText size={12} /> Examen
                </button>
                <button
                  onClick={() => { setExamForm({ ...examForm, courseId: course.id, examType: 'control' }); setShowExamModal(true); }}
                  className="btn"
                  style={{ padding: '5px 8px', fontSize: '10px', background: '#f59e0b', color: 'white' }}
                >
                  <ClipboardList size={12} /> Contrôle
                </button>
              </div>

              {/* Supports de cours */}
              {supports.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <h6 style={{ fontSize: '11px', color: 'var(--gray-600)', marginBottom: '6px' }}>Supports de cours</h6>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {supports.map(resource => (
                      <div key={resource.id} style={{ 
                        background: 'white', 
                        border: '1px solid var(--gray-200)', 
                        borderRadius: '4px', 
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px'
                      }}>
                        <File size={12} color="var(--primary)" />
                        <span style={{ color: 'var(--gray-700)' }}>{resource.name}</span>
                        <button onClick={() => openResourceViewer({ ...resource, courseId: course.id })} style={{ background: 'var(--primary)', border: 'none', cursor: 'pointer', color: 'white', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Eye size={10} /> View
                        </button>
                        <button onClick={() => openPresentationModal(resource, course)} style={{ background: '#8b5cf6', border: 'none', cursor: 'pointer', color: 'white', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '2px' }} title="Présenter en direct">
                          <Monitor size={10} />
                        </button>
                        <button onClick={() => handleDeleteResource(course.id, resource.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 0 }}>
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fiches de révision */}
              {revisions.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <h6 style={{ fontSize: '11px', color: 'var(--gray-600)', marginBottom: '6px' }}>Fiches de révision</h6>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {revisions.map(resource => (
                      <div key={resource.id} style={{ 
                        background: 'white', 
                        border: '1px solid var(--gray-200)', 
                        borderRadius: '4px', 
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px'
                      }}>
                        <ClipboardList size={12} color="var(--secondary)" />
                        <span style={{ color: 'var(--gray-700)' }}>{resource.name}</span>
                        <button onClick={() => openResourceViewer({ ...resource, courseId: course.id })} style={{ background: 'var(--secondary)', border: 'none', cursor: 'pointer', color: 'white', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Eye size={10} /> View
                        </button>
                        <button onClick={() => handleDeleteResource(course.id, resource.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 0 }}>
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Travaux Dirigés (TD) */}
              {tds.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <h6 style={{ fontSize: '11px', color: 'var(--gray-600)', marginBottom: '6px' }}>Travaux Dirigés (TD)</h6>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {tds.map(resource => (
                      <div key={resource.id} style={{ 
                        background: 'white', 
                        border: '1px solid var(--info)', 
                        borderRadius: '4px', 
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px'
                      }}>
                        <FileText size={12} color="var(--info)" />
                        <span style={{ color: 'var(--gray-700)' }}>{resource.name}</span>
                        <button onClick={() => openResourceViewer({ ...resource, courseId: course.id })} style={{ background: 'var(--info)', border: 'none', cursor: 'pointer', color: 'white', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Eye size={10} /> View
                        </button>
                        <button onClick={() => handleDeleteResource(course.id, resource.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 0 }}>
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Travaux Pratiques (TP) */}
              {tps.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <h6 style={{ fontSize: '11px', color: 'var(--gray-600)', marginBottom: '6px' }}>Travaux Pratiques (TP)</h6>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {tps.map(resource => (
                      <div key={resource.id} style={{ 
                        background: 'white', 
                        border: '1px solid var(--success)', 
                        borderRadius: '4px', 
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px'
                      }}>
                        <FileText size={12} color="var(--success)" />
                        <span style={{ color: 'var(--gray-700)' }}>{resource.name}</span>
                        <button onClick={() => openResourceViewer({ ...resource, courseId: course.id })} style={{ background: 'var(--success)', border: 'none', cursor: 'pointer', color: 'white', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Eye size={10} /> View
                        </button>
                        <button onClick={() => handleDeleteResource(course.id, resource.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 0 }}>
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Liens */}
              {links.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <h6 style={{ fontSize: '11px', color: 'var(--gray-600)', marginBottom: '6px' }}>Liens</h6>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {links.map(resource => (
                      <div key={resource.id} style={{ 
                        background: 'white', 
                        border: '1px solid var(--gray-200)', 
                        borderRadius: '4px', 
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px'
                      }}>
                        <ExternalLink size={12} color="var(--info)" />
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--info)', textDecoration: 'none' }}>
                          {resource.title}
                        </a>
                        <button onClick={() => handleDeleteResource(course.id, resource.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 0 }}>
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Examens et Contrôles */}
              {courseExams.length > 0 && (
                <div>
                  <h6 style={{ fontSize: '11px', color: 'var(--gray-600)', marginBottom: '6px' }}>Examens & Contrôles</h6>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {courseExams.map(renderExamCard)}
                  </div>
                </div>
              )}

              {courseExams.length === 0 && supports.length === 0 && revisions.length === 0 && links.length === 0 && (
                <p style={{ color: 'var(--gray-500)', fontSize: '11px', textAlign: 'center', margin: 0 }}>
                  Aucun contenu. Utilisez les boutons ci-dessus.
                </p>
              )}
            </div>

            {/* COLONNE DROITE : Gestion des étudiants */}
            <div>
              <h5 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: 'var(--gray-700)' }}>
                👥 Étudiants inscrits ({getStudentsByCourse(course.id).length})
              </h5>
              
              {/* Boutons d'ajout d'étudiants */}
              <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setStudentForm({ ...studentForm, courseId: course.id }); setShowStudentModal(true); }}
                  className="btn btn-secondary"
                  style={{ padding: '5px 8px', fontSize: '10px' }}
                >
                  <UserPlus size={12} /> Ajouter
                </button>
                <button
                  onClick={() => { setImportCourseId(course.id); setShowImportModal(true); }}
                  className="btn btn-secondary"
                  style={{ padding: '5px 8px', fontSize: '10px' }}
                >
                  <Upload size={12} /> Importer
                </button>
                <button
                  onClick={() => exportStudentTemplate(course.title)}
                  className="btn btn-secondary"
                  style={{ padding: '5px 8px', fontSize: '10px' }}
                  title="Télécharger un modèle Excel/CSV pour importer des étudiants"
                >
                  <Download size={12} /> Modèle
                </button>
                {getStudentsByCourse(course.id).length > 0 && (
                  <button
                    onClick={() => handleClearStudents(course.id)}
                    className="btn btn-danger"
                    style={{ padding: '5px 8px', fontSize: '10px' }}
                    title="Vider la liste des étudiants inscrits"
                  >
                    <Trash2 size={12} /> Vider
                  </button>
                )}
              </div>

              {/* Liste des étudiants */}
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {getStudentsByCourse(course.id).length === 0 ? (
                  <p style={{ color: 'var(--gray-500)', fontSize: '11px', textAlign: 'center' }}>
                    Aucun étudiant inscrit à ce cours.
                  </p>
                ) : (
                  getStudentsByCourse(course.id).map(student => (
                    <div key={student.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      background: 'white',
                      border: '1px solid var(--gray-200)',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      fontSize: '11px'
                    }}>
                      <div>
                        <strong>{student.firstName} {student.lastName}</strong>
                        {student.code && <span style={{ color: 'var(--gray-500)', marginLeft: '6px' }}>({student.code})</span>}
                        <div style={{ fontSize: '10px', color: 'var(--gray-600)' }}>{student.email}</div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => openEditStudentModal(student)}
                          style={{ background: 'var(--primary)', border: 'none', cursor: 'pointer', color: 'white', padding: '3px 6px', borderRadius: '3px' }}
                          title="Modifier l'étudiant"
                        >
                          <Edit size={12} />
                        </button>
                        <button 
                          onClick={() => handleRemoveStudentFromCourse(course.id, student.id)}
                          style={{ background: 'var(--danger)', border: 'none', cursor: 'pointer', color: 'white', padding: '3px 6px', borderRadius: '3px' }}
                          title="Retirer du cours"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderClassCard = (classItem) => {
    const classCourses = getCoursesByClass(classItem.id);
    const isExpanded = expandedClasses[classItem.id];

    return (
      <div key={classItem.id} style={{
        background: 'white',
        border: '1px solid var(--gray-300)',
        borderRadius: '10px',
        marginBottom: '12px',
        overflow: 'hidden'
      }}>
        <div 
          onClick={() => toggleClass(classItem.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'var(--info)',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          <div className="flex flex-center gap-2">
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            <Users size={18} />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>{classItem.name}</span>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>({classItem.year})</span>
          </div>
          <div className="flex flex-center gap-2">
            <span style={{ fontSize: '12px', opacity: 0.9 }}>
              {classCourses.length} cours
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); openEditClassModal(classItem); }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
              title="Modifier la classe"
            >
              <Edit size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteClass(classItem); }}
              style={{
                background: 'rgba(239,68,68,0.8)',
                border: 'none',
                color: 'white',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
              title="Supprimer la classe"
            >
              <Trash2 size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setCourseForm({ ...courseForm, classId: classItem.id }); setShowCourseModal(true); }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <Plus size={12} /> Cours
            </button>
          </div>
        </div>
        {isExpanded && (
          <div style={{ padding: '12px' }}>
            {classCourses.length === 0 ? (
              <p style={{ color: 'var(--gray-500)', fontSize: '13px', textAlign: 'center' }}>
                Aucun cours dans cette classe
              </p>
            ) : (
              classCourses.map(renderCourseCard)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <Header role="teacher" />
      <div className="container">
        <div className="flex flex-between flex-center mb-4">
          <h2>
            <FileText size={28} style={{ display: 'inline', marginRight: '10px' }} />
            Mes Examens
          </h2>
          <div className="flex gap-2">
            <button onClick={handleSyncToServer} className="btn" style={{ background: '#10b981', color: 'white' }} title="Synchroniser avec le serveur">
              <RefreshCw size={16} />
              Sync Serveur
            </button>
            <button onClick={handleExportData} className="btn btn-secondary">
              <Download size={16} />
              Exporter
            </button>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <Upload size={16} />
              Importer
              <input 
                type="file" 
                accept=".json"
                onChange={handleImportData}
                style={{ display: 'none' }}
              />
            </label>
            <button onClick={() => setShowEstablishmentModal(true)} className="btn btn-primary">
              <Plus size={16} />
              Nouvel établissement
            </button>
            <button 
              onClick={() => { setShowSessionsDashboard(true); loadActiveSessions(); }} 
              className="btn"
              style={{ background: '#8b5cf6', color: 'white' }}
            >
              <Monitor size={16} />
              Sessions en direct
            </button>
          </div>
        </div>

        {establishments.length === 0 && exams.length === 0 ? (
          <div className="card text-center">
            <Building2 size={60} color="var(--gray-300)" style={{ marginBottom: '16px' }} />
            <h3>Aucun examen</h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: '20px' }}>
              Créez d'abord un établissement, des classes et des cours pour organiser vos examens.
            </p>
            <Link to="/teacher/classes" className="btn btn-primary">
              <Plus size={18} />
              Gérer les classes
            </Link>
          </div>
        ) : (
          <>
            {/* Établissements avec leurs classes, cours et examens */}
            {establishments.map((establishment) => {
              const establishmentClasses = getClassesByEstablishment(establishment.id);
              const isExpanded = expandedEstablishments[establishment.id];
              const examCount = getExamCount(establishment.id);
              
              return (
                <div key={establishment.id} style={{
                  background: 'var(--gray-50)',
                  border: '2px solid var(--gray-200)',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  overflow: 'hidden'
                }}>
                  {/* En-tête de l'établissement */}
                  <div 
                    onClick={() => toggleEstablishment(establishment.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <div className="flex flex-center gap-2">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      <Building2 size={24} />
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>{establishment.name}</h3>
                        {establishment.city && (
                          <span style={{ fontSize: '13px', opacity: 0.9 }}>📍 {establishment.city}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-center gap-2">
                      <span style={{ 
                        background: 'rgba(255,255,255,0.2)', 
                        padding: '4px 12px', 
                        borderRadius: '20px',
                        fontSize: '13px'
                      }}>
                        {establishmentClasses.length} classe{establishmentClasses.length > 1 ? 's' : ''} • {examCount} examen{examCount > 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditEstablishmentModal(establishment); }}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          border: 'none',
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Modifier l'établissement"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteEstablishment(establishment); }}
                        style={{
                          background: 'rgba(239,68,68,0.8)',
                          border: 'none',
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Supprimer l'établissement"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setClassForm({ ...classForm, establishmentId: establishment.id }); setShowClassModal(true); }}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          border: 'none',
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Plus size={14} /> Classe
                      </button>
                    </div>
                  </div>

                  {/* Contenu : liste des classes */}
                  {isExpanded && (
                    <div style={{ padding: '16px' }}>
                      {establishmentClasses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--gray-600)' }}>
                          <p>Aucune classe dans cet établissement.</p>
                        </div>
                      ) : (
                        establishmentClasses.map(renderClassCard)
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Examens orphelins (sans cours) */}
            {getOrphanExams().length > 0 && (
              <div style={{
                background: 'var(--gray-100)',
                border: '2px dashed var(--gray-300)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h3 style={{ color: 'var(--gray-600)', marginBottom: '16px' }}>
                  <FileText size={20} style={{ display: 'inline', marginRight: '8px' }} />
                  Examens sans cours associé
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {getOrphanExams().map(renderExamCard)}
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal Établissement */}
        {showEstablishmentModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
              <h3 className="mb-4"><Building2 size={24} style={{ display: 'inline', marginRight: '8px' }} />Nouvel établissement</h3>
              <form onSubmit={handleCreateEstablishment}>
                <div className="input-group">
                  <label>Nom *</label>
                  <input type="text" value={establishmentForm.name} onChange={(e) => setEstablishmentForm({ ...establishmentForm, name: e.target.value })} placeholder="Ex: Université Mohammed V" required />
                </div>
                <div className="input-group">
                  <label>Type</label>
                  <select value={establishmentForm.type} onChange={(e) => setEstablishmentForm({ ...establishmentForm, type: e.target.value })}>
                    <option value="university">Université</option>
                    <option value="school">École</option>
                    <option value="highschool">Lycée</option>
                    <option value="training">Centre de formation</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Ville</label>
                  <input type="text" value={establishmentForm.city} onChange={(e) => setEstablishmentForm({ ...establishmentForm, city: e.target.value })} placeholder="Ex: Rabat" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">Créer</button>
                  <button type="button" onClick={() => setShowEstablishmentModal(false)} className="btn btn-secondary">Annuler</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Classe */}
        {showClassModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
              <h3 className="mb-4"><Users size={24} style={{ display: 'inline', marginRight: '8px' }} />Nouvelle classe</h3>
              <form onSubmit={handleCreateClass}>
                <div className="input-group">
                  <label>Établissement *</label>
                  <select value={classForm.establishmentId} onChange={(e) => setClassForm({ ...classForm, establishmentId: e.target.value })} required>
                    <option value="">-- Sélectionner --</option>
                    {establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Nom *</label>
                  <input type="text" value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} placeholder="Ex: Licence 3 Informatique" required />
                </div>
                <div className="input-group">
                  <label>Année *</label>
                  <input type="text" value={classForm.year} onChange={(e) => setClassForm({ ...classForm, year: e.target.value })} placeholder="Ex: 2025-2026" required />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">Créer</button>
                  <button type="button" onClick={() => setShowClassModal(false)} className="btn btn-secondary">Annuler</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Cours */}
        {showCourseModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
              <h3 className="mb-4"><BookOpen size={24} style={{ display: 'inline', marginRight: '8px' }} />Nouveau cours</h3>
              <form onSubmit={handleCreateCourse}>
                <div className="input-group">
                  <label>Classe *</label>
                  <select value={courseForm.classId} onChange={(e) => setCourseForm({ ...courseForm, classId: e.target.value })} required>
                    <option value="">-- Sélectionner --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Titre *</label>
                  <input type="text" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} placeholder="Ex: Programmation Java" required />
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} placeholder="Description du cours..." rows={2} />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">Créer</button>
                  <button type="button" onClick={() => setShowCourseModal(false)} className="btn btn-secondary">Annuler</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Examen */}
        {showExamModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
              <h3 className="mb-4">
                {examForm.examType === 'control' ? <ClipboardList size={24} style={{ display: 'inline', marginRight: '8px' }} /> : <FileText size={24} style={{ display: 'inline', marginRight: '8px' }} />}
                {examForm.examType === 'control' ? 'Nouveau contrôle' : 'Nouvel examen'}
              </h3>
              <form onSubmit={handleCreateExam}>
                <div className="input-group">
                  <label>Type</label>
                  <select value={examForm.examType} onChange={(e) => setExamForm({ ...examForm, examType: e.target.value })}>
                    <option value="exam">Examen</option>
                    <option value="control">Contrôle</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Cours *</label>
                  <select value={examForm.courseId} onChange={(e) => setExamForm({ ...examForm, courseId: e.target.value })} required>
                    <option value="">-- Sélectionner --</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Titre *</label>
                  <input type="text" value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} placeholder={examForm.examType === 'control' ? 'Ex: Contrôle continu 1' : 'Ex: Examen final Java'} required />
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea value={examForm.description} onChange={(e) => setExamForm({ ...examForm, description: e.target.value })} placeholder="Description..." rows={2} />
                </div>
                <div className="input-group">
                  <label>Durée (minutes) *</label>
                  <input type="number" value={examForm.duration} onChange={(e) => setExamForm({ ...examForm, duration: parseInt(e.target.value) })} min={5} required />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">Créer</button>
                  <button type="button" onClick={() => setShowExamModal(false)} className="btn btn-secondary">Annuler</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Ressource (Support/Fiche) */}
        {showResourceModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
              <h3 className="mb-4">
                {resourceForm.type === 'revision' ? <ClipboardList size={24} style={{ display: 'inline', marginRight: '8px' }} /> : 
                 resourceForm.type === 'td' ? <FileText size={24} style={{ display: 'inline', marginRight: '8px', color: 'var(--info)' }} /> :
                 resourceForm.type === 'tp' ? <FileText size={24} style={{ display: 'inline', marginRight: '8px', color: 'var(--success)' }} /> :
                 <FileUp size={24} style={{ display: 'inline', marginRight: '8px' }} />}
                {resourceForm.type === 'revision' ? 'Ajouter une fiche de révision' : 
                 resourceForm.type === 'td' ? 'Ajouter un TD (Travaux Dirigés)' :
                 resourceForm.type === 'tp' ? 'Ajouter un TP (Travaux Pratiques)' :
                 'Ajouter un support de cours'}
              </h3>
              <form onSubmit={handleAddResource}>
                <div className="input-group">
                  <label>Nom du document</label>
                  <input type="text" value={resourceForm.name} onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })} placeholder="Ex: Chapitre 1 - Introduction" />
                </div>
                <div className="input-group">
                  <label>Fichier * (PDF, PPT, PPTX, DOC, DOCX)</label>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".pdf,.ppt,.pptx,.doc,.docx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        console.log('Fichier sélectionné:', file.name, file.type, file.size);
                        setResourceForm({ ...resourceForm, file: file });
                      }
                    }}
                    required
                  />
                </div>
                {resourceForm.file && (
                  <p style={{ fontSize: '12px', color: 'var(--success)', marginBottom: '8px' }}>
                    ✓ Fichier sélectionné : {resourceForm.file.name} ({(resourceForm.file.size / 1024).toFixed(1)} Ko)
                  </p>
                )}
                <p style={{ fontSize: '12px', color: 'var(--gray-600)', marginBottom: '16px' }}>
                  Formats acceptés : PDF, PowerPoint (PPT, PPTX), Word (DOC, DOCX)
                </p>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">Ajouter</button>
                  <button type="button" onClick={() => { setShowResourceModal(false); setResourceForm({ courseId: '', type: 'support', name: '', file: null }); }} className="btn btn-secondary">Annuler</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Lien */}
        {showLinkModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
              <h3 className="mb-4"><Link2 size={24} style={{ display: 'inline', marginRight: '8px' }} />Ajouter un lien</h3>
              <form onSubmit={handleAddLink}>
                <div className="input-group">
                  <label>Titre du lien *</label>
                  <input type="text" value={linkForm.title} onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })} placeholder="Ex: Vidéo YouTube - Cours complet" required />
                </div>
                <div className="input-group">
                  <label>URL *</label>
                  <input type="url" value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} placeholder="https://..." required />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">Ajouter</button>
                  <button type="button" onClick={() => { setShowLinkModal(false); setLinkForm({ courseId: '', title: '', url: '' }); }} className="btn btn-secondary">Annuler</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Éditer Établissement */}
        {showEditEstablishmentModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
              <h3 className="mb-4"><Building2 size={24} style={{ display: 'inline', marginRight: '8px' }} />Modifier l'établissement</h3>
              <form onSubmit={handleEditEstablishment}>
                <div className="input-group">
                  <label>Nom de l'établissement *</label>
                  <input type="text" value={editEstablishmentForm.name} onChange={(e) => setEditEstablishmentForm({ ...editEstablishmentForm, name: e.target.value })} placeholder="Ex: ENSAM Casablanca" required />
                </div>
                <div className="input-group">
                  <label>Ville</label>
                  <input type="text" value={editEstablishmentForm.city} onChange={(e) => setEditEstablishmentForm({ ...editEstablishmentForm, city: e.target.value })} placeholder="Ex: Casablanca" />
                </div>
                <div className="input-group">
                  <label>Type</label>
                  <select value={editEstablishmentForm.type} onChange={(e) => setEditEstablishmentForm({ ...editEstablishmentForm, type: e.target.value })}>
                    <option value="university">Université</option>
                    <option value="school">École</option>
                    <option value="institute">Institut</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">Enregistrer</button>
                  <button type="button" onClick={() => { setShowEditEstablishmentModal(false); setEditEstablishmentForm({ id: '', name: '', city: '', type: 'university' }); }} className="btn btn-secondary">Annuler</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Éditer Classe */}
        {showEditClassModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
              <h3 className="mb-4"><Users size={24} style={{ display: 'inline', marginRight: '8px' }} />Modifier la classe</h3>
              <form onSubmit={handleEditClass}>
                <div className="input-group">
                  <label>Nom de la classe *</label>
                  <input type="text" value={editClassForm.name} onChange={(e) => setEditClassForm({ ...editClassForm, name: e.target.value })} placeholder="Ex: Master IT" required />
                </div>
                <div className="input-group">
                  <label>Année scolaire</label>
                  <input type="text" value={editClassForm.year} onChange={(e) => setEditClassForm({ ...editClassForm, year: e.target.value })} placeholder="Ex: 2025-2026" />
                </div>
                <div className="input-group">
                  <label>Établissement</label>
                  <select value={editClassForm.establishmentId} onChange={(e) => setEditClassForm({ ...editClassForm, establishmentId: e.target.value })}>
                    <option value="">-- Sélectionner --</option>
                    {establishments.map(est => (
                      <option key={est.id} value={est.id}>{est.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">Enregistrer</button>
                  <button type="button" onClick={() => { setShowEditClassModal(false); setEditClassForm({ id: '', name: '', year: '', establishmentId: '' }); }} className="btn btn-secondary">Annuler</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Éditer Cours */}
        {showEditCourseModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
              <h3 className="mb-4"><BookOpen size={24} style={{ display: 'inline', marginRight: '8px' }} />Modifier le cours</h3>
              <form onSubmit={handleEditCourse}>
                <div className="input-group">
                  <label>Titre du cours *</label>
                  <input type="text" value={editCourseForm.title} onChange={(e) => setEditCourseForm({ ...editCourseForm, title: e.target.value })} placeholder="Ex: Introduction aux Bases de Données" required />
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea value={editCourseForm.description} onChange={(e) => setEditCourseForm({ ...editCourseForm, description: e.target.value })} placeholder="Description du cours" rows={3} />
                </div>
                <div className="input-group">
                  <label>Classe</label>
                  <select value={editCourseForm.classId} onChange={(e) => setEditCourseForm({ ...editCourseForm, classId: e.target.value })}>
                    <option value="">-- Sélectionner --</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">Enregistrer</button>
                  <button type="button" onClick={() => { setShowEditCourseModal(false); setEditCourseForm({ id: '', title: '', description: '', classId: '' }); }} className="btn btn-secondary">Annuler</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Éditer Étudiant */}
        {showEditStudentModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
              <h3 className="mb-4"><Edit size={24} style={{ display: 'inline', marginRight: '8px' }} />Modifier l'étudiant</h3>
              <form onSubmit={handleEditStudent}>
                <div className="input-group">
                  <label>Prénom *</label>
                  <input type="text" value={editStudentForm.firstName} onChange={(e) => setEditStudentForm({ ...editStudentForm, firstName: e.target.value })} placeholder="Prénom" required />
                </div>
                <div className="input-group">
                  <label>Nom *</label>
                  <input type="text" value={editStudentForm.lastName} onChange={(e) => setEditStudentForm({ ...editStudentForm, lastName: e.target.value })} placeholder="Nom" required />
                </div>
                <div className="input-group">
                  <label>Email *</label>
                  <input type="email" value={editStudentForm.email} onChange={(e) => setEditStudentForm({ ...editStudentForm, email: e.target.value })} placeholder="email@exemple.com" required />
                </div>
                <div className="input-group">
                  <label>Code étudiant</label>
                  <input type="text" value={editStudentForm.code} onChange={(e) => setEditStudentForm({ ...editStudentForm, code: e.target.value })} placeholder="Ex: ETU2024001" />
                </div>
                <div className="input-group">
                  <label>Nouveau mot de passe</label>
                  <input type="text" value={editStudentForm.password} onChange={(e) => setEditStudentForm({ ...editStudentForm, password: e.target.value })} placeholder="Laisser vide pour conserver l'actuel" />
                  <p style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '4px' }}>
                    Laissez vide pour conserver le mot de passe actuel.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">Enregistrer</button>
                  <button type="button" onClick={() => { setShowEditStudentModal(false); setEditStudentForm({ id: '', firstName: '', lastName: '', email: '', code: '', password: '' }); }} className="btn btn-secondary">Annuler</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Ajouter Étudiant */}
        {showStudentModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
              <h3 className="mb-4"><UserPlus size={24} style={{ display: 'inline', marginRight: '8px' }} />Ajouter un étudiant</h3>
              <form onSubmit={handleAddStudentToCourse}>
                <div className="input-group">
                  <label>Prénom *</label>
                  <input type="text" value={studentForm.firstName} onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })} placeholder="Prénom" required />
                </div>
                <div className="input-group">
                  <label>Nom *</label>
                  <input type="text" value={studentForm.lastName} onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })} placeholder="Nom" required />
                </div>
                <div className="input-group">
                  <label>Email *</label>
                  <input type="email" value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} placeholder="email@exemple.com" required />
                </div>
                <div className="input-group">
                  <label>Code étudiant (optionnel)</label>
                  <input type="text" value={studentForm.code} onChange={(e) => setStudentForm({ ...studentForm, code: e.target.value })} placeholder="Ex: ETU2024001" />
                </div>
                <div className="input-group">
                  <label>Mot de passe</label>
                  <input type="text" value={studentForm.password} onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })} placeholder="Laisser vide pour générer automatiquement" />
                  <p style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '4px' }}>
                    Si laissé vide, un mot de passe sera généré automatiquement et affiché.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">Ajouter</button>
                  <button type="button" onClick={() => { setShowStudentModal(false); setStudentForm({ firstName: '', lastName: '', email: '', code: '', password: '', courseId: '' }); }} className="btn btn-secondary">Annuler</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Import Étudiants */}
        {showImportModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '600px', maxWidth: '90%' }}>
              <h3 className="mb-4"><Upload size={24} style={{ display: 'inline', marginRight: '8px' }} />Importer des étudiants</h3>
              <form onSubmit={handleImportStudents}>
                <div className="input-group">
                  <label>Fichier CSV/Excel</label>
                  <input 
                    ref={importFileRef}
                    type="file" 
                    accept=".csv,.xls,.xlsx,.txt"
                    onChange={handleFileImport}
                  />
                  <p style={{ fontSize: '11px', color: 'var(--gray-600)', marginTop: '4px' }}>
                    Formats acceptés : CSV, XLS, XLSX, TXT
                  </p>
                </div>
                <div className="input-group">
                  <label>Ou coller les données (Prénom, Nom, Email, Code, Mot de passe)</label>
                  <textarea 
                    value={importData} 
                    onChange={(e) => setImportData(e.target.value)} 
                    placeholder="Jean;Dupont;jean.dupont@email.com;ETU001;motdepasse123&#10;Marie;Martin;marie.martin@email.com;ETU002;marie2024&#10;..."
                    rows={6}
                    style={{ fontFamily: 'monospace', fontSize: '12px' }}
                  />
                </div>
                <div style={{ background: 'var(--gray-50)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                  <strong style={{ fontSize: '12px' }}>Format attendu :</strong>
                  <p style={{ fontSize: '11px', color: 'var(--gray-600)', margin: '4px 0 0' }}>
                    Chaque ligne : <code>Prénom; Nom; Email; Code; Mot de passe</code><br/>
                    Séparateurs acceptés : virgule (,), point-virgule (;), tabulation<br/>
                    <em>Note : Si le mot de passe est vide, il sera généré automatiquement.</em>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={!importData.trim()}>
                    <Check size={16} /> Importer
                  </button>
                  <button type="button" onClick={() => { setShowImportModal(false); setImportCourseId(''); setImportData(''); }} className="btn btn-secondary">Annuler</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Duplication de Cours */}
        {showDuplicateModal && duplicateCourse && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '600px', maxWidth: '90%', maxHeight: '80vh', overflow: 'auto' }}>
              <h3 className="mb-4"><Copy size={24} style={{ display: 'inline', marginRight: '8px' }} />Dupliquer le cours</h3>
              
              <div style={{ background: 'var(--gray-50)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  <strong>Cours à dupliquer :</strong> {duplicateCourse.title}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--gray-600)' }}>
                  {(duplicateCourse.resources || []).length} ressource(s) • {getExamsByCourse(duplicateCourse.id).length} examen(s)
                </p>
              </div>

              <div className="input-group">
                <label style={{ fontWeight: '600' }}>Sélectionnez les formations cibles</label>
                <p style={{ fontSize: '12px', color: 'var(--gray-600)', marginBottom: '12px' }}>
                  Le cours sera dupliqué avec toutes ses ressources et examens vers les formations sélectionnées.
                </p>
                
                <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid var(--gray-200)', borderRadius: '8px' }}>
                  {establishments.map(est => {
                    const estClasses = getClassesByEstablishment(est.id);
                    if (estClasses.length === 0) return null;
                    
                    return (
                      <div key={est.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                        <div style={{ padding: '10px 12px', background: 'var(--gray-100)', fontWeight: '600', fontSize: '13px' }}>
                          <Building2 size={14} style={{ display: 'inline', marginRight: '6px' }} />
                          {est.name}
                        </div>
                        {estClasses.map(cls => {
                          const isCurrentClass = cls.id === duplicateCourse.classId;
                          const isSelected = selectedTargetClasses.includes(cls.id);
                          
                          return (
                            <label 
                              key={cls.id}
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                padding: '10px 12px 10px 20px',
                                cursor: isCurrentClass ? 'not-allowed' : 'pointer',
                                background: isSelected ? 'var(--primary-light)' : 'white',
                                opacity: isCurrentClass ? 0.5 : 1
                              }}
                            >
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => !isCurrentClass && toggleTargetClass(cls.id)}
                                disabled={isCurrentClass}
                                style={{ width: '16px', height: '16px', flexShrink: 0 }}
                              />
                              <Users size={14} style={{ flexShrink: 0 }} />
                              <span style={{ flex: 1, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cls.name}</span>
                              {isCurrentClass && (
                                <span style={{ fontSize: '10px', color: 'var(--gray-500)', flexShrink: 0 }}>(actuel)</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedTargetClasses.length > 0 && (
                <div style={{ background: 'var(--success-light)', padding: '10px 12px', borderRadius: '8px', marginTop: '12px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--success-dark)' }}>
                    <Check size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    {selectedTargetClasses.length} formation(s) sélectionnée(s)
                  </p>
                </div>
              )}

              <div className="flex gap-2" style={{ marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={handleDuplicateCourse} 
                  className="btn btn-primary"
                  disabled={selectedTargetClasses.length === 0}
                >
                  <Copy size={16} /> Dupliquer vers {selectedTargetClasses.length} formation(s)
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowDuplicateModal(false); setDuplicateCourse(null); setSelectedTargetClasses([]); }} 
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Visionneuse de document - Carte flottante avec Notes */}
        {viewingResource && (
          <div style={{
            position: 'fixed',
            top: viewerSize === 'maximized' ? '0' : viewerSize === 'minimized' ? 'auto' : '30px',
            left: viewerSize === 'maximized' ? '0' : viewerSize === 'minimized' ? 'auto' : '30px',
            right: viewerSize === 'maximized' ? '0' : viewerSize === 'minimized' ? '20px' : '30px',
            bottom: viewerSize === 'maximized' ? '0' : viewerSize === 'minimized' ? '20px' : '30px',
            width: viewerSize === 'minimized' ? '350px' : 'auto',
            height: viewerSize === 'minimized' ? '50px' : 'auto',
            background: 'white',
            borderRadius: viewerSize === 'maximized' ? '0' : '12px',
            boxShadow: '0 10px 50px rgba(0,0,0,0.4)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Barre de titre */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 16px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              color: 'white'
            }}>
              <div className="flex flex-center gap-2" style={{ flex: 1, overflow: 'hidden' }}>
                {viewingResource.fileName?.toLowerCase().endsWith('.pdf') ? (
                  <File size={18} />
                ) : viewingResource.fileName?.toLowerCase().match(/\.(ppt|pptx)$/) ? (
                  <Presentation size={18} />
                ) : (
                  <FileText size={18} />
                )}
                <span style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {viewingResource.name || viewingResource.fileName}
                </span>
                <span style={{ opacity: 0.7, fontSize: '11px', marginLeft: '4px' }}>
                  ({viewingResource.fileName?.split('.').pop()?.toUpperCase()})
                </span>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => setViewerSize(viewerSize === 'minimized' ? 'normal' : 'minimized')}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: 'white', padding: '5px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                  title={viewerSize === 'minimized' ? 'Restaurer' : 'Réduire'}
                >
                  <Minimize2 size={14} />
                </button>
                <button 
                  onClick={() => setViewerSize(viewerSize === 'maximized' ? 'normal' : 'maximized')}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: 'white', padding: '5px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                  title={viewerSize === 'maximized' ? 'Restaurer' : 'Agrandir'}
                >
                  <Maximize2 size={14} />
                </button>
                <a 
                  href={viewingResource.data} 
                  download={viewingResource.fileName}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: 'white', padding: '5px', borderRadius: '4px', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                  title="Télécharger"
                >
                  <Download size={14} />
                </a>
                <button 
                  onClick={() => { setViewingResource(null); setViewerSize('normal'); setResourceNotes(''); }}
                  style={{ background: 'var(--danger)', border: 'none', cursor: 'pointer', color: 'white', padding: '5px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                  title="Fermer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Contenu : Notes à gauche, Document à droite */}
            {viewerSize !== 'minimized' && (
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr', overflow: 'hidden' }}>
                {/* COLONNE GAUCHE : Zone de notes avec support images */}
                <div style={{ 
                  background: 'var(--gray-50)', 
                  borderRight: '1px solid var(--gray-200)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    padding: '10px 16px', 
                    borderBottom: '1px solid var(--gray-200)',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div className="flex flex-center gap-2">
                      <StickyNote size={18} color="var(--warning)" />
                      <strong style={{ fontSize: '14px' }}>Notes</strong>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={handleNotesImageUpload}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '10px' }}
                        title="Ajouter une image"
                      >
                        <Image size={12} />
                      </button>
                      <button 
                        onClick={saveResourceNotes}
                        className="btn btn-primary"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        <Save size={12} /> Enregistrer
                      </button>
                    </div>
                  </div>
                  <div style={{ flex: 1, padding: '12px', overflow: 'auto' }}>
                    <div
                      ref={notesEditorRef}
                      contentEditable
                      onPaste={handleNotesPaste}
                      style={{
                        width: '100%',
                        minHeight: '100%',
                        border: '1px solid var(--gray-200)',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '13px',
                        lineHeight: '1.6',
                        fontFamily: 'inherit',
                        background: 'white',
                        outline: 'none',
                        overflowY: 'auto'
                      }}
                      suppressContentEditableWarning={true}
                    />
                  </div>
                  <div style={{ 
                    padding: '8px 16px', 
                    borderTop: '1px solid var(--gray-200)',
                    background: 'white',
                    fontSize: '11px',
                    color: 'var(--gray-500)'
                  }}>
                    <Image size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    Collez des images (Ctrl+V) ou cliquez sur l'icône image • Notes enregistrées avec le support
                  </div>

                  {/* Section Notes partagées */}
                  <div style={{ borderTop: '2px solid var(--primary)', marginTop: '8px' }}>
                    <div style={{ padding: '10px 16px', background: 'var(--primary)', color: 'white' }}>
                      <h5 style={{ margin: 0, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <StickyNote size={14} /> Notes partagées avec les étudiants
                      </h5>
                    </div>
                    <div style={{ padding: '10px', maxHeight: '150px', overflow: 'auto' }}>
                      {teacherNotes.length === 0 ? (
                        <p style={{ fontSize: '11px', color: 'var(--gray-500)', margin: 0 }}>Aucune note partagée.</p>
                      ) : (
                        teacherNotes.map(note => (
                          <div key={note.id} style={{ background: 'rgba(59,130,246,0.1)', padding: '8px', borderRadius: '4px', marginBottom: '6px', fontSize: '11px' }}>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{note.content}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                              <span style={{ fontSize: '10px', color: 'var(--gray-500)' }}>{new Date(note.createdAt).toLocaleDateString('fr-FR')}</span>
                              <button onClick={() => handleDeleteTeacherNote(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0' }}>
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div style={{ padding: '8px', borderTop: '1px solid var(--gray-200)' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          value={newTeacherNote}
                          onChange={(e) => setNewTeacherNote(e.target.value)}
                          placeholder="Ajouter une note visible par tous les étudiants..."
                          style={{ flex: 1, padding: '6px 10px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--gray-300)' }}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddTeacherNote()}
                        />
                        <button onClick={handleAddTeacherNote} className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '10px' }}>
                          <Save size={10} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Section Notes des étudiants - Groupées par étudiant */}
                  {studentNotesForResource.length > 0 && (
                    <div style={{ borderTop: '2px solid var(--secondary)', marginTop: '8px' }}>
                      <div style={{ padding: '10px 16px', background: 'var(--secondary)', color: 'white' }}>
                        <h5 style={{ margin: 0, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={14} /> Notes des étudiants ({studentNotesForResource.length})
                        </h5>
                      </div>
                      <div style={{ padding: '10px', maxHeight: '250px', overflow: 'auto' }}>
                        {(() => {
                          const grouped = {};
                          studentNotesForResource.forEach(note => {
                            if (!grouped[note.studentId]) {
                              grouped[note.studentId] = { studentName: note.studentName, notes: [] };
                            }
                            grouped[note.studentId].notes.push(note);
                          });
                          return Object.entries(grouped).map(([studentId, data]) => (
                            <div key={studentId} style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '600', color: 'var(--secondary)', fontSize: '12px', marginBottom: '6px', padding: '4px 8px', background: 'rgba(16,185,129,0.2)', borderRadius: '4px' }}>
                                👤 {data.studentName} ({data.notes.length} note{data.notes.length > 1 ? 's' : ''})
                              </div>
                              {data.notes.map(note => (
                                <div key={note.id} style={{ background: 'rgba(16,185,129,0.1)', padding: '8px', borderRadius: '4px', marginBottom: '6px', fontSize: '11px', marginLeft: '10px', borderLeft: '3px solid var(--secondary)' }}>
                                  <div style={{ marginBottom: '4px' }}>
                                    {note.shareType === 'class' && <span style={{ background: '#f59e0b', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '9px', marginRight: '4px' }}>🌐 Classe</span>}
                                    {note.shareType === 'student' && <span style={{ background: '#8b5cf6', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '9px', marginRight: '4px' }}>👤 {note.sharedWithStudentName?.split(' ')[0]}</span>}
                                    {(!note.shareType || note.shareType === 'private') && <span style={{ background: 'var(--gray-400)', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '9px' }}>🔒 Privée</span>}
                                  </div>
                                  <div dangerouslySetInnerHTML={{ __html: note.content }} />
                                  <div style={{ fontSize: '10px', color: 'var(--gray-500)', marginTop: '4px' }}>
                                    {new Date(note.createdAt).toLocaleDateString('fr-FR')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* COLONNE DROITE : Affichage du document */}
                <div style={{ flex: 1, overflow: 'auto', background: 'var(--gray-100)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '16px' }}>
                  {viewingResource.fileName?.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={viewingResource.data}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        borderRadius: '8px',
                        background: 'white',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                      }}
                      title={viewingResource.name}
                    />
                  ) : viewingResource.fileName?.toLowerCase().match(/\.(ppt|pptx)$/) ? (
                    <div style={{ width: '100%', height: '100%' }}>
                      <PPTXViewer data={viewingResource.data} fileName={viewingResource.fileName} />
                    </div>
                  ) : viewingResource.fileName?.toLowerCase().match(/\.(doc|docx)$/) ? (
                    <div style={{ 
                      background: 'white', 
                      padding: '40px', 
                      borderRadius: '12px', 
                      textAlign: 'center',
                      maxWidth: '500px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}>
                      <FileText size={60} color="var(--info)" />
                      <h3 style={{ marginTop: '16px' }}>Document Word</h3>
                      <p style={{ color: 'var(--gray-600)', marginTop: '8px', fontSize: '14px' }}>
                        {viewingResource.name}
                      </p>
                      <p style={{ color: 'var(--gray-500)', marginTop: '8px', fontSize: '13px' }}>
                        Téléchargez le fichier pour le visualiser dans Word.
                      </p>
                      <a href={viewingResource.data} download={viewingResource.fileName} className="btn btn-primary" style={{ marginTop: '16px' }}>
                        <Download size={16} /> Télécharger
                      </a>
                    </div>
                  ) : (
                    <div style={{ 
                      background: 'white', 
                      padding: '40px', 
                      borderRadius: '12px', 
                      textAlign: 'center',
                      maxWidth: '400px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}>
                      <File size={50} color="var(--gray-400)" />
                      <h3 style={{ marginTop: '12px' }}>Aperçu non disponible</h3>
                      <a href={viewingResource.data} download={viewingResource.fileName} className="btn btn-primary" style={{ marginTop: '12px' }}>
                        <Download size={16} /> Télécharger
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal de démarrage de présentation */}
        {showPresentationModal && presentationResource && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
              <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Monitor size={24} color="#8b5cf6" /> Démarrer une présentation
              </h3>
              
              <div style={{ background: 'var(--gray-100)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                <p style={{ margin: 0, fontSize: '14px' }}><strong>Document :</strong> {presentationResource.name}</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--gray-600)' }}>Cours : {presentationResource.courseName}</p>
              </div>

              <div className="input-group">
                <label>Diffuser à</label>
                <select 
                  value={presentationTargetType} 
                  onChange={(e) => setPresentationTargetType(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--gray-300)' }}
                >
                  <option value="class">🌐 Toute la classe</option>
                  <option value="students">👥 Étudiants sélectionnés</option>
                </select>
              </div>

              {presentationTargetType === 'students' && (
                <div className="input-group">
                  <label>Sélectionner les étudiants</label>
                  <div style={{ maxHeight: '150px', overflow: 'auto', border: '1px solid var(--gray-300)', borderRadius: '6px', padding: '8px' }}>
                    {allStudents.filter(s => {
                      const course = courses.find(c => c.id === presentationResource.courseId);
                      return course && (s.classId === course.classId || (course.studentIds || []).includes(s.id));
                    }).map(student => (
                      <label key={student.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={presentationTargetStudents.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPresentationTargetStudents([...presentationTargetStudents, student.id]);
                            } else {
                              setPresentationTargetStudents(presentationTargetStudents.filter(id => id !== student.id));
                            }
                          }}
                        />
                        {student.firstName} {student.lastName}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  onClick={startPresentation}
                  className="btn"
                  style={{ flex: 1, background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Play size={16} /> Démarrer la présentation
                </button>
                <button 
                  onClick={() => { setShowPresentationModal(false); setPresentationResource(null); }}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interface de présentation active */}
        {activePresentation && presentationResource && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#1a1a2e', zIndex: 4000, display: 'flex', flexDirection: 'column' }}>
            {/* Barre de contrôle */}
            <div style={{ padding: '10px 20px', background: '#16213e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #0f3460' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#e94560', padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', animation: 'pulse 2s infinite' }}>
                  <span style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%' }}></span>
                  <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>EN DIRECT</span>
                </div>
                <span style={{ color: 'white', fontSize: '14px' }}>{presentationResource.name}</span>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                  {activePresentation.targetType === 'class' ? '🌐 Toute la classe' : `👥 ${activePresentation.targetStudentIds?.length || 0} étudiant(s)`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {/* Bouton partage audio */}
                {!isAudioSharing ? (
                  <button 
                    onClick={startAudioSharing}
                    style={{ background: '#8b5cf6', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Partager votre voix avec les étudiants"
                  >
                    🎤 Activer le micro
                  </button>
                ) : (
                  <button 
                    onClick={stopAudioSharing}
                    style={{ background: '#a855f7', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', animation: 'pulse 2s infinite' }}
                    title="Arrêter le partage audio"
                  >
                    🎤 Micro actif
                  </button>
                )}
                {/* Bouton partage écran */}
                {!isScreenSharing ? (
                  <button 
                    onClick={startScreenShareInPresentation}
                    style={{ background: '#059669', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ScreenShare size={14} /> Partager mon écran
                  </button>
                ) : (
                  <button 
                    onClick={stopScreenShare}
                    style={{ background: '#f59e0b', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', animation: 'pulse 2s infinite' }}
                  >
                    <StopCircle size={14} /> Arrêter le partage d'écran
                  </button>
                )}
                <button 
                  onClick={stopPresentation}
                  style={{ background: '#e94560', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Square size={14} /> Arrêter la présentation
                </button>
              </div>
            </div>

            {/* Contenu principal */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Zone de présentation - affiche l'écran partagé ou le document */}
              <div style={{ flex: 1, padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto' }}>
                {isScreenSharing ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ 
                      background: '#000', 
                      borderRadius: '12px', 
                      overflow: 'hidden',
                      boxShadow: '0 0 30px rgba(5, 150, 105, 0.3)',
                      maxWidth: '100%',
                      maxHeight: '70vh'
                    }}>
                      <video 
                        ref={screenVideoRef}
                        autoPlay 
                        muted 
                        style={{ maxWidth: '100%', maxHeight: '65vh', display: 'block' }}
                      />
                    </div>
                    <p style={{ color: '#059669', marginTop: '10px', fontSize: '13px' }}>
                      🖥️ Votre écran est partagé en direct avec les étudiants
                    </p>
                  </div>
                ) : presentationResource.fileName?.toLowerCase().match(/\.(ppt|pptx)$/) ? (
                  <div style={{ width: '100%', height: '100%' }}>
                    <PPTXViewer 
                      data={presentationResource.data} 
                      fileName={presentationResource.fileName}
                      onSlideChange={updatePresentationSlide}
                    />
                  </div>
                ) : presentationResource.fileName?.toLowerCase().endsWith('.pdf') ? (
                  <iframe 
                    src={presentationResource.data} 
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
                    title={presentationResource.name}
                  />
                ) : (
                  <div style={{ background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
                    <FileText size={60} color="var(--gray-400)" />
                    <h3 style={{ marginTop: '16px' }}>{presentationResource.name}</h3>
                    <p style={{ color: 'var(--gray-600)' }}>Aperçu du document en cours de diffusion</p>
                  </div>
                )}
              </div>

              {/* Panneau de commentaires */}
              <div style={{ width: '350px', background: '#16213e', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #0f3460' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #0f3460' }}>
                  <h4 style={{ margin: 0, color: 'white', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    💬 Commentaires en direct ({presentationComments.length})
                  </h4>
                </div>
                
                <div 
                  ref={presentationCommentsRef}
                  style={{ flex: 1, overflow: 'auto', padding: '12px' }}
                >
                  {presentationComments.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
                      Aucun commentaire pour le moment.<br/>Les commentaires des étudiants apparaîtront ici.
                    </p>
                  ) : (
                    presentationComments.map(comment => (
                      <div key={comment.id} style={{ 
                        background: comment.authorType === 'teacher' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.1)', 
                        padding: '10px', 
                        borderRadius: '8px', 
                        marginBottom: '8px',
                        borderLeft: comment.authorType === 'teacher' ? '3px solid #8b5cf6' : '3px solid #10b981'
                      }}>
                        <div style={{ fontSize: '11px', color: comment.authorType === 'teacher' ? '#a78bfa' : '#6ee7b7', fontWeight: '600', marginBottom: '4px' }}>
                          {comment.authorName} {comment.authorType === 'teacher' && '(Professeur)'}
                        </div>
                        <div style={{ color: 'white', fontSize: '13px' }}>{comment.content}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                          {new Date(comment.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ padding: '12px', borderTop: '1px solid #0f3460' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text"
                      value={newPresentationComment}
                      onChange={(e) => setNewPresentationComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendPresentationComment()}
                      placeholder="Envoyer un commentaire..."
                      style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: '#0f3460', color: 'white', fontSize: '13px' }}
                    />
                    <button 
                      onClick={sendPresentationComment}
                      style={{ background: '#8b5cf6', border: 'none', color: 'white', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
              }
            `}</style>
          </div>
        )}

        {/* Tableau de bord des sessions actives */}
        {showSessionsDashboard && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
            <div className="card" style={{ width: '800px', maxWidth: '95%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Monitor size={24} color="#8b5cf6" />
                  Sessions en direct
                </h2>
                <button onClick={() => setShowSessionsDashboard(false)} className="btn btn-secondary">
                  <X size={16} /> Fermer
                </button>
              </div>

              <div style={{ flex: 1, overflow: 'auto' }}>
                {/* Présentations actives */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Presentation size={18} color="#e94560" />
                    Présentations en cours ({allActivePresentations.length})
                  </h3>
                  
                  {allActivePresentations.length === 0 ? (
                    <p style={{ color: 'var(--gray-500)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                      Aucune présentation en cours
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {allActivePresentations.map(pres => (
                        <div key={pres.id} style={{ 
                          background: 'var(--gray-50)', 
                          border: '1px solid var(--gray-200)', 
                          borderRadius: '8px', 
                          padding: '14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <span style={{ background: '#e94560', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600' }}>EN DIRECT</span>
                              <span style={{ fontWeight: '600' }}>{pres.resourceName}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                              Par {pres.teacherName} • {pres.targetType === 'class' ? 'Toute la classe' : `${pres.targetStudentIds?.length || 0} étudiant(s)`}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '4px' }}>
                              Démarré à {new Date(pres.startedAt).toLocaleTimeString('fr-FR')} • Slide {(pres.currentSlide || 0) + 1}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => rejoinPresentation(pres)}
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              <Eye size={14} /> Rejoindre
                            </button>
                            <button 
                              onClick={() => closePresentation(pres.id)}
                              className="btn btn-danger"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              <X size={14} /> Fermer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Partages d'écran actifs */}
                <div>
                  <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ScreenShare size={18} color="#059669" />
                    Partages d'écran en cours ({allActiveScreenShares.length})
                  </h3>
                  
                  {allActiveScreenShares.length === 0 ? (
                    <p style={{ color: 'var(--gray-500)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                      Aucun partage d'écran en cours
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {allActiveScreenShares.map(share => (
                        <div key={share.id} style={{ 
                          background: 'var(--gray-50)', 
                          border: '1px solid var(--gray-200)', 
                          borderRadius: '8px', 
                          padding: '14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <span style={{ background: '#059669', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600' }}>ÉCRAN</span>
                              <span style={{ fontWeight: '600' }}>Partage d'écran</span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                              Par {share.teacherName} • {share.targetType === 'class' ? 'Toute la classe' : `${share.targetStudentIds?.length || 0} étudiant(s)`}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '4px' }}>
                              Démarré à {new Date(share.startedAt).toLocaleTimeString('fr-FR')}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => closeScreenShare(share.id)}
                              className="btn btn-danger"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              <StopCircle size={14} /> Arrêter
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--gray-200)', textAlign: 'center' }}>
                <button onClick={loadActiveSessions} className="btn btn-secondary">
                  <RefreshCw size={14} /> Actualiser
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
