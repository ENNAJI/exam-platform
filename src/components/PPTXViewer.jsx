import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { ChevronLeft, ChevronRight, Loader, AlertCircle } from 'lucide-react';

export default function PPTXViewer({ data, fileName, onSlideChange, controlledSlide, controlled }) {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mediaFiles, setMediaFiles] = useState({});

  // Synchroniser avec la slide contrôlée (mode présentation étudiant)
  useEffect(() => {
    if (controlled && controlledSlide !== undefined && controlledSlide !== currentSlide) {
      setCurrentSlide(controlledSlide);
    }
  }, [controlledSlide, controlled]);

  useEffect(() => {
    if (data) {
      extractSlides(data);
    }
  }, [data]);

  const extractSlides = async (base64Data) => {
    try {
      setLoading(true);
      setError(null);
      
      // Convertir base64 en ArrayBuffer
      const base64Content = base64Data.split(',')[1];
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const zip = await JSZip.loadAsync(bytes);
      
      // 1. Extraire tous les fichiers média (images)
      const media = {};
      const mediaPromises = [];
      
      zip.forEach((relativePath, file) => {
        if (relativePath.startsWith('ppt/media/') && !file.dir) {
          const ext = relativePath.split('.').pop().toLowerCase();
          if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ext)) {
            mediaPromises.push(
              file.async('base64').then(content => {
                let mimeType = 'image/png';
                if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
                else if (ext === 'gif') mimeType = 'image/gif';
                const fileName = relativePath.split('/').pop();
                media[fileName] = `data:${mimeType};base64,${content}`;
              })
            );
          }
        }
      });
      
      await Promise.all(mediaPromises);
      setMediaFiles(media);
      
      // 2. Extraire les relations des slides pour mapper les images
      const relsMap = {};
      const relsPromises = [];
      
      zip.forEach((relativePath, file) => {
        if (relativePath.match(/ppt\/slides\/_rels\/slide\d+\.xml\.rels$/)) {
          const slideNum = relativePath.match(/slide(\d+)/)[1];
          relsPromises.push(
            file.async('text').then(content => {
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(content, 'text/xml');
              const relationships = xmlDoc.getElementsByTagName('Relationship');
              const rels = {};
              for (let rel of relationships) {
                const id = rel.getAttribute('Id');
                const target = rel.getAttribute('Target');
                if (target) {
                  rels[id] = target.split('/').pop();
                }
              }
              relsMap[slideNum] = rels;
            })
          );
        }
      });
      
      await Promise.all(relsPromises);
      
      // 3. Extraire le contenu des slides
      const slideFiles = [];
      zip.forEach((relativePath, file) => {
        if (relativePath.match(/ppt\/slides\/slide\d+\.xml$/)) {
          const slideNum = parseInt(relativePath.match(/slide(\d+)/)[1]);
          slideFiles.push({ path: relativePath, file, slideNum });
        }
      });
      
      slideFiles.sort((a, b) => a.slideNum - b.slideNum);
      
      const extractedSlides = [];
      
      for (const { file, slideNum } of slideFiles) {
        const content = await file.async('text');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');
        
        // Extraire les textes
        const texts = [];
        const textElements = xmlDoc.getElementsByTagName('a:t');
        for (let t of textElements) {
          if (t.textContent && t.textContent.trim()) {
            texts.push(t.textContent);
          }
        }
        
        // Extraire les références d'images
        const images = [];
        const blipElements = xmlDoc.getElementsByTagName('a:blip');
        const rels = relsMap[slideNum] || {};
        
        for (let blip of blipElements) {
          const embedId = blip.getAttribute('r:embed');
          if (embedId && rels[embedId]) {
            const mediaFileName = rels[embedId];
            if (media[mediaFileName]) {
              images.push(media[mediaFileName]);
            }
          }
        }
        
        extractedSlides.push({
          id: `slide-${slideNum}`,
          slideNumber: slideNum,
          texts: texts,
          images: images
        });
      }
      
      if (extractedSlides.length === 0) {
        setError('Aucune slide trouvée dans la présentation');
      } else {
        setSlides(extractedSlides);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur extraction PPTX:', err);
      setError('Impossible de lire le fichier PowerPoint: ' + err.message);
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      const newSlide = currentSlide + 1;
      setCurrentSlide(newSlide);
      if (onSlideChange) onSlideChange(newSlide);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      const newSlide = currentSlide - 1;
      setCurrentSlide(newSlide);
      if (onSlideChange) onSlideChange(newSlide);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '40px',
        background: 'white',
        borderRadius: '12px',
        gap: '16px'
      }}>
        <Loader size={40} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--gray-600)' }}>Chargement de la présentation...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '40px',
        background: 'white',
        borderRadius: '12px',
        gap: '16px',
        maxWidth: '500px'
      }}>
        <AlertCircle size={50} color="var(--warning)" />
        <h3>Aperçu limité</h3>
        <p style={{ color: 'var(--gray-600)', textAlign: 'center', fontSize: '14px' }}>
          {error}
        </p>
        <p style={{ color: 'var(--gray-500)', textAlign: 'center', fontSize: '13px' }}>
          Pour une visualisation complète, téléchargez le fichier et ouvrez-le avec PowerPoint.
        </p>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '40px',
        background: 'white',
        borderRadius: '12px',
        gap: '16px'
      }}>
        <AlertCircle size={50} color="var(--gray-400)" />
        <p style={{ color: 'var(--gray-600)' }}>Aucune slide trouvée</p>
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      width: '100%',
      height: '100%',
      gap: '16px'
    }}>
      {/* Zone d'affichage de la slide */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        background: '#1a1a1a',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Affichage du contenu de la slide */}
        <div style={{ 
          background: 'white', 
          width: '90%', 
          maxWidth: '900px',
          aspectRatio: '16/9',
          borderRadius: '4px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto'
        }}>
          {/* Numéro de slide */}
          <div style={{ 
            position: 'absolute', 
            top: '8px', 
            right: '8px', 
            background: 'var(--primary)', 
            color: 'white', 
            padding: '4px 10px', 
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            Slide {currentSlideData.slideNumber}
          </div>
          
          {/* Images de la slide */}
          {currentSlideData.images && currentSlideData.images.length > 0 && (
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '12px', 
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              {currentSlideData.images.map((img, idx) => (
                <img 
                  key={idx}
                  src={img} 
                  alt={`Image ${idx + 1}`}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '200px', 
                    objectFit: 'contain',
                    borderRadius: '4px'
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Textes de la slide */}
          {currentSlideData.texts && currentSlideData.texts.length > 0 && (
            <div style={{ flex: 1 }}>
              {currentSlideData.texts.map((text, idx) => (
                <p key={idx} style={{ 
                  margin: '8px 0', 
                  fontSize: idx === 0 ? '20px' : '14px',
                  fontWeight: idx === 0 ? '600' : '400',
                  color: idx === 0 ? 'var(--gray-800)' : 'var(--gray-600)',
                  lineHeight: '1.5'
                }}>
                  {text}
                </p>
              ))}
            </div>
          )}
          
          {/* Si pas de contenu */}
          {(!currentSlideData.texts || currentSlideData.texts.length === 0) && 
           (!currentSlideData.images || currentSlideData.images.length === 0) && (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--gray-400)'
            }}>
              <span style={{ fontSize: '24px' }}>Slide {currentSlideData.slideNumber}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Contrôles de navigation */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px',
        padding: '8px 16px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <button 
          onClick={prevSlide} 
          disabled={currentSlide === 0}
          style={{ 
            background: currentSlide === 0 ? 'var(--gray-200)' : 'var(--primary)',
            color: currentSlide === 0 ? 'var(--gray-400)' : 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 12px',
            cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <ChevronLeft size={18} /> Précédent
        </button>
        
        <span style={{ 
          padding: '0 16px', 
          fontWeight: '600',
          color: 'var(--gray-700)'
        }}>
          {currentSlide + 1} / {slides.length}
        </span>
        
        <button 
          onClick={nextSlide} 
          disabled={currentSlide === slides.length - 1}
          style={{ 
            background: currentSlide === slides.length - 1 ? 'var(--gray-200)' : 'var(--primary)',
            color: currentSlide === slides.length - 1 ? 'var(--gray-400)' : 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 12px',
            cursor: currentSlide === slides.length - 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          Suivant <ChevronRight size={18} />
        </button>
      </div>
      
      {/* Miniatures des slides */}
      {slides.length > 1 && (
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          overflowX: 'auto',
          padding: '8px',
          background: 'white',
          borderRadius: '8px',
          maxWidth: '100%'
        }}>
          {slides.map((slide, index) => (
            <div 
              key={slide.id}
              onClick={() => { setCurrentSlide(index); if (onSlideChange) onSlideChange(index); }}
              style={{ 
                width: '100px',
                height: '56px',
                borderRadius: '4px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: index === currentSlide ? '2px solid var(--primary)' : '2px solid var(--gray-300)',
                background: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                padding: '4px',
                position: 'relative'
              }}
            >
              <span style={{ 
                position: 'absolute', 
                top: '2px', 
                left: '4px', 
                fontSize: '8px', 
                color: 'var(--gray-500)',
                fontWeight: '600'
              }}>
                {slide.slideNumber}
              </span>
              {slide.images && slide.images.length > 0 ? (
                <img 
                  src={slide.images[0]} 
                  alt={`Miniature ${index + 1}`}
                  style={{ maxWidth: '90%', maxHeight: '35px', objectFit: 'contain' }}
                />
              ) : slide.texts && slide.texts.length > 0 ? (
                <span style={{ 
                  fontSize: '7px', 
                  color: 'var(--gray-600)', 
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: '1.2'
                }}>
                  {slide.texts[0]}
                </span>
              ) : (
                <span style={{ fontSize: '10px', color: 'var(--gray-400)' }}>—</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
