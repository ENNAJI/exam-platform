import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Clock, HelpCircle, Play, BookOpen, FileText, File, ClipboardList, ChevronDown, ChevronRight, Download, Eye, X, ExternalLink, Calendar, Lock, Building2, Users, StickyNote, Save, Trash2, Maximize2, Minimize2, RefreshCw, Image, Share2, Globe, User, Monitor, Send, Square } from 'lucide-react';
import Header from '../../components/Header';
import { storage, fileStorage } from '../../data/storage';
import PPTXViewer from '../../components/PPTXViewer';

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [establishmentInfo, setEstablishmentInfo] = useState(null);
  const [allResources, setAllResources] = useState({ supports: [], tds: [], tps: [], revisions: [], links: [] });
  const [allExams, setAllExams] = useState({ exams: [], controls: [] });
  const [viewingResource, setViewingResource] = useState(null);
  const [viewerSize, setViewerSize] = useState('normal');
  const [studentNotes, setStudentNotes] = useState([]);
  const [teacherNotes, setTeacherNotes] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [shareType, setShareType] = useState('private'); // private, class, student
  const [shareWithStudentId, setShareWithStudentId] = useState('');
  const [classStudents, setClassStudents] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [noteToShare, setNoteToShare] = useState(null);
  const notesEditorRef = useRef(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // États pour les présentations en direct
  const [activePresentations, setActivePresentations] = useState([]);
  const [watchingPresentation, setWatchingPresentation] = useState(null);
  const [presentationComments, setPresentationComments] = useState([]);
  const [newPresentationComment, setNewPresentationComment] = useState('');
  const presentationCommentsRef = useRef(null);
  
  // États pour le partage d'écran
  const [activeScreenShares, setActiveScreenShares] = useState([]);
  const [watchingScreenShare, setWatchingScreenShare] = useState(null);
  const [screenShareFrame, setScreenShareFrame] = useState(null);
  
  // États pour la réception audio
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [lastAudioTimestamp, setLastAudioTimestamp] = useState(0);
  const audioContextRef = useRef(null);

  // Fonction pour charger les données
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      // Recharger depuis le serveur si disponible
      await storage.loadFromServer();
    } catch (e) {
      console.log('Erreur chargement serveur:', e);
    }
    
    const sessionStudent = storage.getCurrentStudent();
    
    if (sessionStudent) {
      // Recharger les données fraîches de l'étudiant depuis le storage
      const freshStudent = storage.getStudentById(sessionStudent.id);
      const currentStudent = freshStudent || sessionStudent;
      setStudent(currentStudent);
      
      // Récupérer tous les cours et examens
      const coursesData = storage.getCourses();
      const examsData = storage.getExams();
      
      // Trouver les cours où l'étudiant est inscrit (via studentIds) ou de sa classe
      let studentCourses = coursesData.filter(course => {
        const isEnrolled = (course.studentIds || []).includes(currentStudent.id);
        const isInClass = currentStudent.classId && course.classId === currentStudent.classId;
        return isEnrolled || isInClass;
      });
      
      // Si pas de cours trouvés, chercher via les inscriptions
      if (studentCourses.length === 0) {
        studentCourses = coursesData.filter(c => (c.studentIds || []).includes(currentStudent.id));
        // Mettre à jour le classId si nécessaire
        if (studentCourses.length > 0 && studentCourses[0].classId && !currentStudent.classId) {
          storage.updateStudent(currentStudent.id, { classId: studentCourses[0].classId });
        }
      }
      
      setCourses(studentCourses);
      
      // Récupérer les infos de classe et établissement
      if (currentStudent.classId) {
        const classData = storage.getClasses().find(c => c.id === currentStudent.classId);
        if (classData) {
          setClassInfo(classData);
          if (classData.establishmentId) {
            const estData = storage.getEstablishments().find(e => e.id === classData.establishmentId);
            setEstablishmentInfo(estData);
          }
        }
        // Charger les autres étudiants de la classe (pour le partage)
        const allStudentsData = storage.getStudents();
        const classmates = allStudentsData.filter(s => s.classId === currentStudent.classId && s.id !== currentStudent.id);
        setClassStudents(classmates);
      }
      
      // Collecter TOUTES les ressources de tous les cours
      const supports = [];
      const tds = [];
      const tps = [];
      const revisions = [];
      const links = [];
      
      studentCourses.forEach(course => {
        const resources = course.resources || [];
        resources.forEach(r => {
          const resourceWithCourse = { ...r, courseName: course.title, courseId: course.id };
          switch (r.type) {
            case 'support': supports.push(resourceWithCourse); break;
            case 'td': tds.push(resourceWithCourse); break;
            case 'tp': tps.push(resourceWithCourse); break;
            case 'revision': revisions.push(resourceWithCourse); break;
            case 'link': links.push(resourceWithCourse); break;
          }
        });
      });
      
      setAllResources({ supports, tds, tps, revisions, links });
      
      // Collecter tous les examens et contrôles
      const courseIds = studentCourses.map(c => c.id);
      const studentExamsData = examsData.filter(e => courseIds.includes(e.courseId));
      
      const examsList = studentExamsData.filter(e => e.examType === 'exam' || !e.examType).map(e => {
        const course = studentCourses.find(c => c.id === e.courseId);
        return { ...e, courseName: course?.title || '' };
      });
      const controlsList = studentExamsData.filter(e => e.examType === 'control').map(e => {
        const course = studentCourses.find(c => c.id === e.courseId);
        return { ...e, courseName: course?.title || '' };
      });
      
      setAllExams({ exams: examsList, controls: controlsList });
    } else {
      setStudent(null);
    }
    setIsRefreshing(false);
  };

  // Charger les données au démarrage et rafraîchir périodiquement
  useEffect(() => {
    loadData();
    
    // Rafraîchir les données toutes les 10 secondes
    const interval = setInterval(() => {
      loadData();
      setLastRefresh(Date.now());
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // ==================== FONCTIONS PRÉSENTATIONS EN DIRECT ====================
  const API_URL = `http://${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'localhost' : window.location.hostname}:3001/api`;

  // Vérifier les présentations actives
  useEffect(() => {
    if (!student) return;
    
    const checkPresentations = async () => {
      try {
        // Utiliser le classId de l'étudiant ou celui du premier cours
        let classIdToUse = student.classId;
        if (!classIdToUse && courses.length > 0) {
          classIdToUse = courses[0].classId;
        }
        
        console.log('Vérification présentations pour:', { studentId: student.id, classId: classIdToUse });
        
        const response = await fetch(`${API_URL}/presentations/active?studentId=${student.id}&classId=${classIdToUse || ''}`);
        if (response.ok) {
          const presentations = await response.json();
          console.log('Présentations actives:', presentations);
          setActivePresentations(presentations);
        }
      } catch (error) {
        console.log('Erreur vérification présentations:', error);
      }
    };
    
    checkPresentations();
    const interval = setInterval(checkPresentations, 3000); // Vérifier toutes les 3 secondes
    return () => clearInterval(interval);
  }, [student, courses]);

  // Polling pour la présentation en cours - synchronisation rapide
  useEffect(() => {
    if (!watchingPresentation) return;
    
    const pollPresentation = async () => {
      try {
        const response = await fetch(`${API_URL}/presentation/${watchingPresentation.id}`);
        if (response.ok) {
          const data = await response.json();
          if (!data.isActive) {
            setWatchingPresentation(null);
            setPresentationComments([]);
            alert('La présentation a été terminée par le professeur.');
            return;
          }
          
          // Log pour déboguer la synchronisation
          console.log('📺 Sync slide - Serveur:', data.currentSlide, '| Local:', watchingPresentation.currentSlide);
          
          // Préserver la ressource locale lors de la mise à jour
          setWatchingPresentation(prev => ({
            ...data,
            resource: prev?.resource // Garder la ressource chargée localement
          }));
          setPresentationComments(data.comments || []);
        }
      } catch (error) {
        console.log('Erreur polling présentation:', error);
      }
    };
    
    // Polling rapide pour une synchronisation fluide (500ms)
    pollPresentation(); // Appel immédiat
    const interval = setInterval(pollPresentation, 500);
    return () => clearInterval(interval);
  }, [watchingPresentation?.id]);

  // Vérifier les partages d'écran actifs
  useEffect(() => {
    if (!student) return;
    
    const checkScreenShares = async () => {
      try {
        let classIdToUse = student.classId;
        if (!classIdToUse && courses.length > 0) {
          classIdToUse = courses[0].classId;
        }
        
        const response = await fetch(`${API_URL}/screenshare/active?studentId=${student.id}&classId=${classIdToUse || ''}`);
        if (response.ok) {
          const shares = await response.json();
          setActiveScreenShares(shares);
        }
      } catch (error) {
        console.log('Erreur vérification partages écran:', error);
      }
    };
    
    checkScreenShares();
    const interval = setInterval(checkScreenShares, 3000);
    return () => clearInterval(interval);
  }, [student, courses]);

  // Polling pour le partage d'écran pendant une présentation
  useEffect(() => {
    if (!watchingPresentation) {
      setScreenShareFrame(null);
      return;
    }
    
    const pollScreenShareForPresentation = async () => {
      try {
        // Vérifier s'il y a un partage d'écran actif pour cette présentation
        let classIdToUse = student?.classId;
        if (!classIdToUse && courses.length > 0) {
          classIdToUse = courses[0].classId;
        }
        
        const response = await fetch(`${API_URL}/screenshare/active?studentId=${student?.id}&classId=${classIdToUse || ''}`);
        if (response.ok) {
          const shares = await response.json();
          // Trouver un partage d'écran lié à la présentation en cours
          const activeShare = shares.find(s => s.presentationId === watchingPresentation.id) || shares[0];
          
          if (activeShare) {
            // Récupérer la frame
            const frameResponse = await fetch(`${API_URL}/screenshare/${activeShare.id}/frame`);
            if (frameResponse.ok) {
              const frameData = await frameResponse.json();
              if (frameData.success && frameData.frame) {
                setScreenShareFrame(frameData.frame);
              } else {
                setScreenShareFrame(null);
              }
            }
          } else {
            setScreenShareFrame(null);
          }
        }
      } catch (error) {
        console.log('Erreur polling partage écran:', error);
      }
    };
    
    pollScreenShareForPresentation();
    const interval = setInterval(pollScreenShareForPresentation, 500);
    return () => clearInterval(interval);
  }, [watchingPresentation?.id, student, courses]);

  // Polling pour la réception audio pendant une présentation
  useEffect(() => {
    if (!watchingPresentation) {
      // Arrêter l'audio si on quitte la présentation
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setIsAudioPlaying(false);
      setLastAudioTimestamp(0);
      return;
    }
    
    const pollAudio = async () => {
      try {
        const response = await fetch(`${API_URL}/presentation/${watchingPresentation.id}/audio?lastTimestamp=${lastAudioTimestamp}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.hasAudio && data.audioData) {
            setLastAudioTimestamp(data.timestamp);
            setIsAudioPlaying(true);
            
            // Jouer l'audio reçu
            playAudioData(data.audioData);
          }
        }
      } catch (error) {
        console.log('Erreur polling audio:', error);
      }
    };
    
    const interval = setInterval(pollAudio, 500);
    return () => clearInterval(interval);
  }, [watchingPresentation?.id, lastAudioTimestamp]);

  // Fonction pour jouer les données audio reçues
  const playAudioData = (audioData) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      const sampleRate = audioContext.sampleRate;
      
      // Créer un buffer audio à partir des données reçues
      // Les données sont compressées (downsampled x4), donc on les étend
      const expandedData = [];
      for (let i = 0; i < audioData.length; i++) {
        for (let j = 0; j < 4; j++) {
          expandedData.push(audioData[i]);
        }
      }
      
      const buffer = audioContext.createBuffer(1, expandedData.length, sampleRate);
      const channelData = buffer.getChannelData(0);
      
      for (let i = 0; i < expandedData.length; i++) {
        channelData[i] = expandedData[i];
      }
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (error) {
      console.log('Erreur lecture audio:', error);
    }
  };

  const joinScreenShare = (screenShare) => {
    setWatchingScreenShare(screenShare);
    setScreenShareFrame(null);
  };

  const leaveScreenShare = () => {
    setWatchingScreenShare(null);
    setScreenShareFrame(null);
  };

  const joinPresentation = async (presentation) => {
    console.log('Rejoindre présentation:', presentation);
    console.log('Cours disponibles:', courses.map(c => ({ id: c.id, title: c.title })));
    
    // Charger la ressource associée
    const course = courses.find(c => c.id === presentation.courseId);
    console.log('Cours trouvé:', course?.title);
    
    if (course) {
      const resource = (course.resources || []).find(r => r.id === presentation.resourceId);
      console.log('Ressource trouvée:', resource?.name);
      
      if (resource) {
        setWatchingPresentation({ ...presentation, resource });
        setPresentationComments(presentation.comments || []);
      } else {
        alert('Ressource non trouvée. Veuillez actualiser la page.');
      }
    } else {
      alert('Cours non trouvé. Veuillez actualiser la page.');
    }
  };

  const leavePresentation = () => {
    setWatchingPresentation(null);
    setPresentationComments([]);
  };

  const sendPresentationComment = async () => {
    if (!watchingPresentation || !newPresentationComment.trim() || !student) return;
    
    try {
      const response = await fetch(`${API_URL}/presentation/${watchingPresentation.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: student.id,
          authorName: `${student.firstName} ${student.lastName}`,
          authorType: 'student',
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

  const openResourceViewer = async (resource) => {
    let resourceWithData = { ...resource };
    // Les fichiers sont maintenant stockés directement dans resource.data
    // Fallback vers IndexedDB pour les anciens fichiers
    if (resource.fileId && !resource.data) {
      try {
        const fileData = await fileStorage.getFile(resource.fileId);
        if (fileData) {
          resourceWithData.data = fileData;
        }
      } catch (e) {
        console.log('Fichier non trouvé dans IndexedDB');
      }
    }
    setViewingResource(resourceWithData);
    setViewerSize('normal');
    
    // Charger les notes de l'étudiant, du professeur et les notes partagées
    if (student) {
      const myNotes = storage.getStudentNotesForResource(resource.id, student.id);
      const profNotes = storage.getTeacherNotesForResource(resource.id);
      const shared = storage.getSharedNotesForStudent(resource.id, student.id, student.classId);
      setStudentNotes(myNotes);
      setTeacherNotes(profNotes);
      setSharedNotes(shared);
    }
    setNewNoteContent('');
    setEditingNoteId(null);
    setShareType('private');
    setShareWithStudentId('');
  };

  const closeResourceViewer = () => {
    setViewingResource(null);
    setViewerSize('normal');
    setStudentNotes([]);
    setTeacherNotes([]);
    setSharedNotes([]);
    setNewNoteContent('');
    setEditingNoteId(null);
    setShareType('private');
    setShareWithStudentId('');
    setShowShareModal(false);
    setNoteToShare(null);
  };

  const handleAddNote = () => {
    const content = notesEditorRef.current ? notesEditorRef.current.innerHTML : newNoteContent;
    if (!content.trim() || content === '<br>' || !student || !viewingResource) return;
    
    const noteData = {
      resourceId: viewingResource.id,
      courseId: viewingResource.courseId,
      classId: student.classId,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      authorType: 'student',
      content: content.trim(),
      shareType: 'private' // Par défaut, note privée
    };
    
    const newNote = storage.addNote(noteData);
    
    setStudentNotes([...studentNotes, newNote]);
    if (notesEditorRef.current) {
      notesEditorRef.current.innerHTML = '';
    }
    setNewNoteContent('');
  };

  // Partager une note
  const handleShareNote = (note) => {
    setNoteToShare(note);
    setShareType(note.shareType || 'private');
    setShareWithStudentId(note.sharedWithStudentId || '');
    setShowShareModal(true);
  };

  // Confirmer le partage
  const confirmShareNote = () => {
    if (!noteToShare) return;
    
    const updateData = {
      shareType: shareType,
      sharedWithStudentId: shareType === 'student' ? shareWithStudentId : null,
      sharedWithStudentName: shareType === 'student' ? classStudents.find(s => s.id === shareWithStudentId)?.firstName + ' ' + classStudents.find(s => s.id === shareWithStudentId)?.lastName : null
    };
    
    storage.updateNote(noteToShare.id, updateData);
    setStudentNotes(studentNotes.map(n => n.id === noteToShare.id ? { ...n, ...updateData } : n));
    setShowShareModal(false);
    setNoteToShare(null);
    setShareType('private');
    setShareWithStudentId('');
  };

  // Gestion du collage d'images dans l'éditeur
  const handleNotesPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
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

  // Ajouter une image depuis un fichier
  const handleAddImage = () => {
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

  const handleUpdateNote = (noteId, content) => {
    storage.updateNote(noteId, { content });
    setStudentNotes(studentNotes.map(n => n.id === noteId ? { ...n, content } : n));
    setEditingNoteId(null);
  };

  const handleDeleteNote = (noteId) => {
    if (!confirm('Supprimer cette note ?')) return;
    storage.deleteNote(noteId);
    setStudentNotes(studentNotes.filter(n => n.id !== noteId));
  };

  const totalResources = allResources.supports.length + allResources.tds.length + allResources.tps.length + allResources.revisions.length;
  const totalExams = allExams.exams.length + allExams.controls.length;

  return (
    <div>
      <Header role="student" />
      <div className="container">
        {student && (
          <div style={{ marginBottom: '20px', padding: '20px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: '12px', color: 'white' }}>
            <h2 style={{ margin: 0 }}>Bienvenue, {student.firstName} {student.lastName}</h2>
            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '14px', opacity: 0.95 }}>
              {establishmentInfo && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={16} /> {establishmentInfo.name}
                </span>
              )}
              {classInfo && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} /> {classInfo.name} {classInfo.year && `(${classInfo.year})`}
                </span>
              )}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '13px' }}>
                📚 {courses.length} cours
              </span>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '13px' }}>
                📄 {totalResources} ressource(s)
              </span>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '13px' }}>
                🎯 {totalExams} évaluation(s)
              </span>
              <button 
                onClick={() => { loadData(); setLastRefresh(Date.now()); }}
                disabled={isRefreshing}
                style={{ background: isRefreshing ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)', border: 'none', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', color: 'white', cursor: isRefreshing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Rafraîchir les données"
              >
                <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} /> {isRefreshing ? 'Chargement...' : 'Actualiser'}
              </button>
            </div>
          </div>
        )}

        {!student && (
          <div className="card text-center mb-4">
            <p style={{ color: 'var(--gray-600)' }}>Veuillez vous connecter pour accéder à vos cours.</p>
            <Link to="/student/login" className="btn btn-primary">Se connecter</Link>
          </div>
        )}

        {student && (
          <>
            {/* Section Supports de cours */}
            <div className="card" style={{ marginBottom: '16px' }}>
              <h3 style={{ marginBottom: '16px', color: 'var(--primary)' }}>
                <File size={22} style={{ display: 'inline', marginRight: '10px' }} />
                📚 Supports de cours ({allResources.supports.length})
              </h3>
              {allResources.supports.length === 0 ? (
                <p style={{ color: 'var(--gray-500)' }}>Aucun support de cours disponible.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {allResources.supports.map(resource => (
                    <div key={resource.id} style={{ 
                      background: 'var(--gray-50)', 
                      padding: '12px', 
                      borderRadius: '8px',
                      border: '1px solid var(--gray-200)'
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>{resource.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginBottom: '8px' }}>📖 {resource.courseName}</div>
                      <button onClick={() => openResourceViewer(resource)} className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '11px' }}>
                        <Eye size={12} /> Voir le document
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section TD */}
            <div className="card" style={{ marginBottom: '16px', borderLeft: '4px solid var(--info)' }}>
              <h3 style={{ marginBottom: '16px', color: 'var(--info)' }}>
                <FileText size={22} style={{ display: 'inline', marginRight: '10px' }} />
                📝 Travaux Dirigés - TD ({allResources.tds.length})
              </h3>
              {allResources.tds.length === 0 ? (
                <p style={{ color: 'var(--gray-500)' }}>Aucun TD disponible.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {allResources.tds.map(resource => (
                    <div key={resource.id} style={{ 
                      background: 'rgba(59, 130, 246, 0.05)', 
                      padding: '12px', 
                      borderRadius: '8px',
                      border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>{resource.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginBottom: '8px' }}>📖 {resource.courseName}</div>
                      <button onClick={() => openResourceViewer(resource)} className="btn" style={{ padding: '5px 12px', fontSize: '11px', background: 'var(--info)', color: 'white' }}>
                        <Eye size={12} /> Voir le TD
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section TP */}
            <div className="card" style={{ marginBottom: '16px', borderLeft: '4px solid var(--success)' }}>
              <h3 style={{ marginBottom: '16px', color: 'var(--success)' }}>
                <FileText size={22} style={{ display: 'inline', marginRight: '10px' }} />
                🔬 Travaux Pratiques - TP ({allResources.tps.length})
              </h3>
              {allResources.tps.length === 0 ? (
                <p style={{ color: 'var(--gray-500)' }}>Aucun TP disponible.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {allResources.tps.map(resource => (
                    <div key={resource.id} style={{ 
                      background: 'rgba(34, 197, 94, 0.05)', 
                      padding: '12px', 
                      borderRadius: '8px',
                      border: '1px solid rgba(34, 197, 94, 0.2)'
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>{resource.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginBottom: '8px' }}>📖 {resource.courseName}</div>
                      <button onClick={() => openResourceViewer(resource)} className="btn" style={{ padding: '5px 12px', fontSize: '11px', background: 'var(--success)', color: 'white' }}>
                        <Eye size={12} /> Voir le TP
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section Examens & Contrôles */}
            <div className="card" style={{ marginBottom: '16px', borderLeft: '4px solid var(--danger)' }}>
              <h3 style={{ marginBottom: '16px', color: 'var(--danger)' }}>
                <ClipboardList size={22} style={{ display: 'inline', marginRight: '10px' }} />
                🎯 Examens & Contrôles ({totalExams})
              </h3>
              
              {totalExams === 0 ? (
                <p style={{ color: 'var(--gray-500)' }}>Aucun examen ou contrôle disponible.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                  {allExams.exams.map(exam => {
                    const now = new Date();
                    const scheduledDate = exam.scheduledDate ? new Date(exam.scheduledDate) : null;
                    const endDate = exam.endDate ? new Date(exam.endDate) : null;
                    const isScheduled = scheduledDate && scheduledDate > now;
                    const isExpired = endDate && endDate < now;
                    const isAvailable = !isScheduled && !isExpired;
                    
                    return (
                      <div key={exam.id} style={{ 
                        background: isAvailable ? 'rgba(239, 68, 68, 0.05)' : 'rgba(156, 163, 175, 0.1)', 
                        padding: '14px', 
                        borderRadius: '8px',
                        border: isAvailable ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(156, 163, 175, 0.3)',
                        opacity: isExpired ? 0.6 : 1
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span className="badge" style={{ background: '#dc2626', color: 'white' }}>Examen</span>
                          <span style={{ fontWeight: '600', flex: 1 }}>{exam.title}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '4px' }}>📖 {exam.courseName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginBottom: '6px' }}>
                          ⏱️ {exam.duration} min • {exam.questions?.length || 0} questions
                        </div>
                        {scheduledDate && (
                          <div style={{ fontSize: '11px', color: isScheduled ? 'var(--info)' : 'var(--success)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} />
                            {isScheduled ? `Disponible le ${scheduledDate.toLocaleDateString('fr-FR')} à ${scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'Disponible maintenant'}
                          </div>
                        )}
                        {isExpired ? (
                          <div style={{ fontSize: '12px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Lock size={12} /> Examen terminé
                          </div>
                        ) : isScheduled ? (
                          <button disabled className="btn" style={{ padding: '6px 14px', fontSize: '11px', background: 'var(--gray-300)', color: 'var(--gray-600)', cursor: 'not-allowed' }}>
                            <Lock size={12} /> Non disponible
                          </button>
                        ) : (
                          <Link to={`/student/exam/${exam.id}`} className="btn" style={{ padding: '6px 14px', fontSize: '11px', background: '#dc2626', color: 'white' }}>
                            <Play size={12} /> Commencer l'examen
                          </Link>
                        )}
                      </div>
                    );
                  })}
                  {allExams.controls.map(exam => {
                    const now = new Date();
                    const scheduledDate = exam.scheduledDate ? new Date(exam.scheduledDate) : null;
                    const endDate = exam.endDate ? new Date(exam.endDate) : null;
                    const isScheduled = scheduledDate && scheduledDate > now;
                    const isExpired = endDate && endDate < now;
                    const isAvailable = !isScheduled && !isExpired;
                    
                    return (
                      <div key={exam.id} style={{ 
                        background: isAvailable ? 'rgba(245, 158, 11, 0.05)' : 'rgba(156, 163, 175, 0.1)', 
                        padding: '14px', 
                        borderRadius: '8px',
                        border: isAvailable ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(156, 163, 175, 0.3)',
                        opacity: isExpired ? 0.6 : 1
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span className="badge" style={{ background: '#f59e0b', color: 'white' }}>Contrôle</span>
                          <span style={{ fontWeight: '600', flex: 1 }}>{exam.title}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '4px' }}>📖 {exam.courseName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginBottom: '6px' }}>
                          ⏱️ {exam.duration} min • {exam.questions?.length || 0} questions
                        </div>
                        {scheduledDate && (
                          <div style={{ fontSize: '11px', color: isScheduled ? 'var(--info)' : 'var(--success)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} />
                            {isScheduled ? `Disponible le ${scheduledDate.toLocaleDateString('fr-FR')} à ${scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'Disponible maintenant'}
                          </div>
                        )}
                        {isExpired ? (
                          <div style={{ fontSize: '12px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Lock size={12} /> Contrôle terminé
                          </div>
                        ) : isScheduled ? (
                          <button disabled className="btn" style={{ padding: '6px 14px', fontSize: '11px', background: 'var(--gray-300)', color: 'var(--gray-600)', cursor: 'not-allowed' }}>
                            <Lock size={12} /> Non disponible
                          </button>
                        ) : (
                          <Link to={`/student/exam/${exam.id}`} className="btn" style={{ padding: '6px 14px', fontSize: '11px', background: '#f59e0b', color: 'white' }}>
                            <Play size={12} /> Commencer le contrôle
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section Fiches de révision */}
            {allResources.revisions.length > 0 && (
              <div className="card" style={{ marginBottom: '16px', borderLeft: '4px solid var(--warning)' }}>
                <h3 style={{ marginBottom: '16px', color: 'var(--warning-dark)' }}>
                  <ClipboardList size={22} style={{ display: 'inline', marginRight: '10px' }} />
                  📋 Fiches de révision ({allResources.revisions.length})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {allResources.revisions.map(resource => (
                    <div key={resource.id} style={{ 
                      background: 'rgba(245, 158, 11, 0.05)', 
                      padding: '12px', 
                      borderRadius: '8px',
                      border: '1px solid rgba(245, 158, 11, 0.2)'
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>{resource.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginBottom: '8px' }}>📖 {resource.courseName}</div>
                      <button onClick={() => openResourceViewer(resource)} className="btn" style={{ padding: '5px 12px', fontSize: '11px', background: 'var(--warning)', color: 'white' }}>
                        <Eye size={12} /> Voir la fiche
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section Liens utiles */}
            {allResources.links.length > 0 && (
              <div className="card" style={{ marginBottom: '16px' }}>
                <h3 style={{ marginBottom: '16px' }}>
                  🔗 Liens utiles ({allResources.links.length})
                </h3>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {allResources.links.map(link => (
                    <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                      <ExternalLink size={14} /> {link.title} <span style={{ fontSize: '10px', opacity: 0.7 }}>({link.courseName})</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Visionneuse de document avec notes */}
        {viewingResource && (
          <div style={{
            position: 'fixed',
            top: viewerSize === 'maximized' ? '0' : '20px',
            left: viewerSize === 'maximized' ? '0' : '20px',
            right: viewerSize === 'maximized' ? '0' : '20px',
            bottom: viewerSize === 'maximized' ? '0' : '20px',
            background: 'white',
            borderRadius: viewerSize === 'maximized' ? '0' : '12px',
            boxShadow: '0 10px 50px rgba(0,0,0,0.4)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* En-tête */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              background: 'var(--primary)',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: '600' }}>{viewingResource.name}</span>
                <span style={{ fontSize: '11px', opacity: 0.8 }}>({viewingResource.courseName})</span>
              </div>
              <div className="flex gap-2">
                {viewingResource.data && (
                  <a href={viewingResource.data} download={viewingResource.fileName} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: 'white', padding: '5px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '12px' }}>
                    <Download size={14} />
                  </a>
                )}
                <button 
                  onClick={() => setViewerSize(viewerSize === 'maximized' ? 'normal' : 'maximized')}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: 'white', padding: '5px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                  title={viewerSize === 'maximized' ? 'Réduire' : 'Agrandir'}
                >
                  {viewerSize === 'maximized' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button 
                  onClick={closeResourceViewer}
                  style={{ background: 'var(--danger)', border: 'none', cursor: 'pointer', color: 'white', padding: '5px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                  title="Fermer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Contenu principal */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Zone de visualisation du document */}
              <div style={{ flex: 1, overflow: 'auto', padding: '16px', background: 'var(--gray-100)' }}>
                {viewingResource.fileName?.toLowerCase().endsWith('.pdf') && viewingResource.data ? (
                  <iframe 
                    src={viewingResource.data} 
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px', background: 'white' }}
                    title={viewingResource.name}
                  />
                ) : viewingResource.fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) && viewingResource.data ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <img src={viewingResource.data} alt={viewingResource.name} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }} />
                  </div>
                ) : viewingResource.fileName?.toLowerCase().match(/\.(pptx?|ppt)$/) && viewingResource.data ? (
                  <PPTXViewer data={viewingResource.data} fileName={viewingResource.fileName} />
                ) : viewingResource.fileName?.toLowerCase().match(/\.(docx?|doc)$/) && viewingResource.data ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'white', borderRadius: '8px', padding: '40px' }}>
                    <FileText size={80} color="var(--primary)" />
                    <h3 style={{ marginTop: '20px', color: 'var(--gray-800)' }}>{viewingResource.name}</h3>
                    <p style={{ color: 'var(--gray-600)', marginTop: '12px', textAlign: 'center', maxWidth: '400px' }}>
                      Les fichiers Word ne peuvent pas être visualisés directement dans le navigateur.
                      Téléchargez le fichier pour l'ouvrir avec Microsoft Word ou LibreOffice.
                    </p>
                    <a href={viewingResource.data} download={viewingResource.fileName} className="btn btn-primary" style={{ marginTop: '20px', padding: '12px 24px' }}>
                      <Download size={18} /> Télécharger le document
                    </a>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <FileText size={60} color="var(--gray-400)" />
                    <h3 style={{ marginTop: '16px' }}>{viewingResource.name}</h3>
                    <p style={{ color: 'var(--gray-600)', marginTop: '8px' }}>
                      Téléchargez le fichier pour le visualiser.
                    </p>
                    {viewingResource.data && (
                      <a href={viewingResource.data} download={viewingResource.fileName} className="btn btn-primary" style={{ marginTop: '16px' }}>
                        <Download size={16} /> Télécharger
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Panneau des notes - Éditeur riche */}
              <div style={{ width: '350px', borderLeft: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column', background: 'white' }}>
                {/* En-tête avec boutons */}
                <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--gray-200)', background: 'var(--secondary)', color: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <StickyNote size={14} /> Mes Notes
                    </h4>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={handleAddImage}
                        style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Ajouter une image"
                      >
                        <Image size={12} />
                      </button>
                      <button
                        onClick={handleAddNote}
                        className="btn btn-primary"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        <Save size={12} /> Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Éditeur de notes riche */}
                <div style={{ flex: 1, padding: '12px', overflow: 'auto' }}>
                  <div
                    ref={notesEditorRef}
                    contentEditable
                    onPaste={handleNotesPaste}
                    style={{
                      width: '100%',
                      minHeight: '150px',
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
                  Collez des images (Ctrl+V) ou cliquez sur l'icône image
                </div>

                {/* Notes du professeur */}
                {teacherNotes.length > 0 && (
                  <div style={{ borderTop: '2px solid var(--primary)' }}>
                    <div style={{ padding: '10px 16px', background: 'var(--primary)', color: 'white' }}>
                      <h5 style={{ margin: 0, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📚 Notes du professeur ({teacherNotes.length})
                      </h5>
                    </div>
                    <div style={{ padding: '10px', maxHeight: '150px', overflow: 'auto' }}>
                      {teacherNotes.map(note => (
                        <div key={note.id} style={{ 
                          background: 'rgba(59, 130, 246, 0.1)', 
                          padding: '10px', 
                          borderRadius: '6px', 
                          marginBottom: '8px',
                          border: '1px solid rgba(59, 130, 246, 0.2)'
                        }}>
                          <div style={{ fontSize: '12px' }} dangerouslySetInnerHTML={{ __html: note.content }} />
                          <div style={{ fontSize: '10px', color: 'var(--gray-500)', marginTop: '6px' }}>
                            {new Date(note.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes partagées par d'autres étudiants */}
                {sharedNotes.length > 0 && (
                  <div style={{ borderTop: '2px solid #f59e0b' }}>
                    <div style={{ padding: '10px 16px', background: '#f59e0b', color: 'white' }}>
                      <h5 style={{ margin: 0, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Share2 size={14} /> Notes partagées ({sharedNotes.length})
                      </h5>
                    </div>
                    <div style={{ padding: '10px', maxHeight: '150px', overflow: 'auto' }}>
                      {sharedNotes.map(note => (
                        <div key={note.id} style={{ 
                          background: 'rgba(245, 158, 11, 0.1)', 
                          padding: '10px', 
                          borderRadius: '6px', 
                          marginBottom: '8px',
                          border: '1px solid rgba(245, 158, 11, 0.2)'
                        }}>
                          <div style={{ fontSize: '10px', color: '#b45309', marginBottom: '4px', fontWeight: '600' }}>
                            {note.studentName} {note.shareType === 'class' ? '(partagé avec la classe)' : '(partagé avec vous)'}
                          </div>
                          <div style={{ fontSize: '12px' }} dangerouslySetInnerHTML={{ __html: note.content }} />
                          <div style={{ fontSize: '10px', color: 'var(--gray-500)', marginTop: '6px' }}>
                            {new Date(note.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mes notes enregistrées */}
                {studentNotes.length > 0 && (
                  <div style={{ borderTop: '2px solid var(--secondary)' }}>
                    <div style={{ padding: '10px 16px', background: 'var(--secondary)', color: 'white' }}>
                      <h5 style={{ margin: 0, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ✏️ Mes notes ({studentNotes.length})
                      </h5>
                    </div>
                    <div style={{ padding: '10px', maxHeight: '200px', overflow: 'auto' }}>
                      {studentNotes.map(note => (
                        <div key={note.id} style={{ 
                          background: 'rgba(16, 185, 129, 0.1)', 
                          padding: '10px', 
                          borderRadius: '6px', 
                          marginBottom: '8px',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          position: 'relative'
                        }}>
                          {/* Badge de partage */}
                          {note.shareType && note.shareType !== 'private' && (
                            <div style={{ 
                              position: 'absolute', 
                              top: '4px', 
                              right: '4px', 
                              background: note.shareType === 'class' ? '#f59e0b' : '#8b5cf6',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontSize: '9px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              {note.shareType === 'class' ? <Globe size={10} /> : <User size={10} />}
                              {note.shareType === 'class' ? 'Classe' : note.sharedWithStudentName?.split(' ')[0]}
                            </div>
                          )}
                          <div style={{ fontSize: '12px', paddingRight: note.shareType !== 'private' ? '60px' : '0' }} dangerouslySetInnerHTML={{ __html: note.content }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--gray-500)' }}>
                              {new Date(note.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button 
                                onClick={() => handleShareNote(note)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', padding: '2px' }}
                                title="Partager"
                              >
                                <Share2 size={12} />
                              </button>
                              <button 
                                onClick={() => handleDeleteNote(note.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '2px' }}
                                title="Supprimer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de partage */}
        {showShareModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
            <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
              <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={20} /> Partager cette note
              </h3>
              
              <div className="input-group">
                <label>Type de partage</label>
                <select 
                  value={shareType} 
                  onChange={(e) => setShareType(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--gray-300)' }}
                >
                  <option value="private">🔒 Privée (visible uniquement par moi et le professeur)</option>
                  <option value="class">🌐 Partager avec toute la classe</option>
                  <option value="student">👤 Partager avec un étudiant spécifique</option>
                </select>
              </div>

              {shareType === 'student' && (
                <div className="input-group">
                  <label>Sélectionner un étudiant</label>
                  <select 
                    value={shareWithStudentId} 
                    onChange={(e) => setShareWithStudentId(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--gray-300)' }}
                  >
                    <option value="">-- Choisir un étudiant --</option>
                    {classStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  onClick={confirmShareNote}
                  disabled={shareType === 'student' && !shareWithStudentId}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Confirmer
                </button>
                <button 
                  onClick={() => { setShowShareModal(false); setNoteToShare(null); }}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification de présentation en direct */}
        {activePresentations.length > 0 && !watchingPresentation && (
          <div style={{ 
            position: 'fixed', 
            bottom: '20px', 
            right: '20px', 
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', 
            padding: '16px 20px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
            zIndex: 9999,
            maxWidth: '350px',
            animation: 'slideIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ background: '#e94560', padding: '4px 10px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '4px', animation: 'pulse 2s infinite' }}>
                <span style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%' }}></span>
                <span style={{ color: 'white', fontSize: '10px', fontWeight: '600' }}>EN DIRECT</span>
              </div>
              <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>Présentation disponible</span>
            </div>
            {activePresentations.map(pres => (
              <div key={pres.id} style={{ background: 'rgba(255,255,255,0.15)', padding: '10px', borderRadius: '8px', marginBottom: '8px' }}>
                <p style={{ color: 'white', margin: 0, fontSize: '13px', fontWeight: '500' }}>{pres.resourceName}</p>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0 8px', fontSize: '11px' }}>Par {pres.teacherName}</p>
                <button 
                  onClick={() => joinPresentation(pres)}
                  style={{ background: 'white', border: 'none', color: '#8b5cf6', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Play size={12} /> Rejoindre
                </button>
              </div>
            ))}
            <style>{`
              @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
              @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
            `}</style>
          </div>
        )}

        {/* Interface de visualisation de présentation */}
        {watchingPresentation && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#1a1a2e', zIndex: 4000, display: 'flex', flexDirection: 'column' }}>
            {/* Barre supérieure */}
            <div style={{ padding: '10px 20px', background: '#16213e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #0f3460' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#e94560', padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', animation: 'pulse 2s infinite' }}>
                  <span style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%' }}></span>
                  <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>EN DIRECT</span>
                </div>
                {isAudioPlaying && (
                  <div style={{ background: '#8b5cf6', padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', animation: 'pulse 2s infinite' }}>
                    <span style={{ fontSize: '12px' }}>🎤</span>
                    <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>AUDIO</span>
                  </div>
                )}
                <span style={{ color: 'white', fontSize: '14px' }}>{watchingPresentation.resourceName}</span>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>par {watchingPresentation.teacherName}</span>
              </div>
              <button 
                onClick={leavePresentation}
                style={{ background: '#64748b', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <X size={14} /> Quitter
              </button>
            </div>

            {/* Contenu */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Zone de présentation - affiche l'écran partagé si disponible */}
              <div style={{ flex: 1, padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto' }}>
                {screenShareFrame ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ 
                      background: 'rgba(5, 150, 105, 0.1)', 
                      padding: '6px 14px', 
                      borderRadius: '20px', 
                      marginBottom: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ width: '8px', height: '8px', background: '#059669', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
                      <span style={{ color: '#059669', fontSize: '12px', fontWeight: '600' }}>ÉCRAN DU PROFESSEUR EN DIRECT</span>
                    </div>
                    <img 
                      src={screenShareFrame} 
                      alt="Écran partagé"
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '70vh', 
                        borderRadius: '8px',
                        boxShadow: '0 0 30px rgba(5, 150, 105, 0.3)'
                      }}
                    />
                  </div>
                ) : watchingPresentation.resource?.fileName?.toLowerCase().match(/\.(ppt|pptx)$/) ? (
                  <div style={{ width: '100%', height: '100%' }}>
                    <PPTXViewer 
                      data={watchingPresentation.resource.data} 
                      fileName={watchingPresentation.resource.fileName}
                      controlledSlide={watchingPresentation.currentSlide || 0}
                      controlled={true}
                    />
                  </div>
                ) : watchingPresentation.resource?.fileName?.toLowerCase().endsWith('.pdf') ? (
                  <iframe 
                    src={watchingPresentation.resource.data} 
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
                    title={watchingPresentation.resourceName}
                  />
                ) : (
                  <div style={{ background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
                    <Monitor size={60} color="#8b5cf6" />
                    <h3 style={{ marginTop: '16px' }}>{watchingPresentation.resourceName}</h3>
                    <p style={{ color: 'var(--gray-600)' }}>Présentation en cours...</p>
                    <p style={{ color: 'var(--gray-500)', fontSize: '13px' }}>Slide actuelle : {(watchingPresentation.currentSlide || 0) + 1}</p>
                  </div>
                )}
              </div>

              {/* Panneau de commentaires */}
              <div style={{ width: '320px', background: '#16213e', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #0f3460' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #0f3460' }}>
                  <h4 style={{ margin: 0, color: 'white', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    💬 Chat en direct ({presentationComments.length})
                  </h4>
                </div>
                
                <div 
                  ref={presentationCommentsRef}
                  style={{ flex: 1, overflow: 'auto', padding: '12px' }}
                >
                  {presentationComments.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
                      Aucun message.<br/>Posez vos questions ici !
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
                      placeholder="Poser une question..."
                      style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: '#0f3460', color: 'white', fontSize: '13px' }}
                    />
                    <button 
                      onClick={sendPresentationComment}
                      style={{ background: '#10b981', border: 'none', color: 'white', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer' }}
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
      </div>
    </div>
  );
}
