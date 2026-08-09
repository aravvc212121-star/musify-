import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { FiShare2, FiTwitter, FiInstagram, FiCopy, FiMessageCircle, FiMusic } from 'react-icons/fi';
import './LyricsShareCard.css';

const SWATCHES = [
  { name: 'Spotify Green', value: '#1DB954', text: 'dark', glow: 'rgba(29, 185, 84, 0.5)' },
  { name: 'Deep Teal', value: '#006466', text: 'light', glow: 'rgba(0, 100, 102, 0.5)' },
  { name: 'Cyan Blue', value: '#00d2ff', text: 'light', glow: 'rgba(0, 210, 255, 0.5)' },
  { name: 'Coral Flame', value: '#FF5E5B', text: 'light', glow: 'rgba(255, 94, 91, 0.5)' },
  { name: 'Amber Gold', value: '#FFB800', text: 'dark', glow: 'rgba(255, 184, 0, 0.5)' },
  { name: 'Midnight Navy', value: '#0A192F', text: 'light', glow: 'rgba(10, 25, 47, 0.5)' },
  { name: 'Rose Quartz', value: '#F4A261', text: 'dark', glow: 'rgba(244, 162, 97, 0.5)' },
  { name: 'Chalk White', value: '#F8F9FA', text: 'dark', glow: 'rgba(248, 249, 250, 0.5)' },
];

export default function LyricsShareCard({ song, lyrics, minimal }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLines, setSelectedLines] = useState([]);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const cardRef = useRef(null);
  const captureRef = useRef(null);

  // Handle defaults
  const activeColor = SWATCHES[selectedColorIdx];
  const allLyrics = lyrics && lyrics.length > 0 ? lyrics : [];
  
  // What to show on the card preview
  const displayLyrics = selectedLines.length > 0 
    ? selectedLines.map(idx => allLyrics[idx])
    : allLyrics.slice(0, 3); // Default preview
    
  const songTitle = song?.title || 'Unknown Song';
  const songArtist = song?.artist || 'Unknown Artist';
  const songArt = song?.thumbnail || 'https://picsum.photos/100/100';
  const songLink = `https://rhym.com/track/${song?.videoId || ''}`;

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setSelectedLines([]);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isExpanded]);

  useEffect(() => {
    const handleOpenShare = (e) => {
      // If it's the current song, we already have lyrics. 
      // If not, we might need to fetch them, but for now we assume it's for the current song or a placeholder.
      setIsExpanded(true);
    };
    window.addEventListener('open-lyrics-share', handleOpenShare);
    return () => window.removeEventListener('open-lyrics-share', handleOpenShare);
  }, []);

  const toggleLine = (idx) => {
    if (selectedLines.includes(idx)) {
      setSelectedLines(selectedLines.filter(i => i !== idx));
    } else if (selectedLines.length < 5) {
      setSelectedLines([...selectedLines, idx].sort());
    }
  };

  const handleShare = async (platform) => {
    if (selectedLines.length === 0) return;
    
    setIsCapturing(true);
    
    try {
      const canvas = await html2canvas(captureRef.current, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        width: 400,
        height: 500,
        onclone: (clonedDoc) => {
          // Force visibility on cloned element if needed
          const el = clonedDoc.querySelector('[ref="captureRef"]');
          if (el) el.style.visibility = 'visible';
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      if (platform === 'main' || platform === 'copy' || platform === 'whatsapp' || platform === 'twitter' || platform === 'instagram') {
        const res = await fetch(imgData);
        const blob = await res.blob();
        const fileName = `${songTitle.replace(/\s+/g, '_')}_Lyrics.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        // Try Web Share API for all platforms that support images
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Lyrics from ${songTitle}`
            });
            return;
          } catch (err) {
            console.error('Share failed', err);
          }
        }

        // Fallback for Copy
        if (platform === 'copy') {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            toast.success('Image copied to clipboard!');
            return;
          } catch (err) {
            console.error('Clipboard failed', err);
          }
        }

        // Final Fallback: Download
        const link = document.createElement('a');
        link.download = fileName;
        link.href = imgData;
        link.click();
        toast.success('Lyrics card downloaded!');
      }
    } catch (error) {
      console.error('Failed to capture lyrics', error);
      toast.error('Failed to generate image');
    } finally {
      setIsCapturing(false);
    }
  };

  if (!isExpanded) {
    if (minimal) {
      return (
        <button 
          className="lyric-capsule-trigger" 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
            border: 'none', borderRadius: '24px',
            padding: '8px 20px', color: '#fff', cursor: 'pointer',
            fontSize: '13px', fontWeight: 700, transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          <FiShare2 size={18} />
          <span>Share Lyrics</span>
        </button>
      );
    }
    return (
      <div className="lyric-mini-trigger" onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}>
        <FiMessageCircle size={16} />
        <span>Share Lyrics</span>
      </div>
    );
  }

  return (
    <div className="lyric-share-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="lyric-share-backdrop" onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }} />
      
      <div className="lyric-share-modal-container">
        <div 
          ref={captureRef}
          style={{ 
            position: 'absolute',
            top: '-10000px', // Even further away
            left: '-10000px',
            width: '400px', // Wider canvas for safety
            height: '500px', // Taller canvas for safety
            backgroundColor: activeColor.value,
            color: activeColor.text === 'light' ? '#ffffff' : '#000000',
            padding: '60px 40px', // Extra safety padding
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: -1000,
            pointerEvents: 'none'
          }}
        >
          <div className="lyric-noise-overlay"></div>
          <div className="lyric-card-header" style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src={songArt} alt={songTitle} className="lyric-card-art" style={{ width: '64px', height: '64px' }} crossOrigin="anonymous" />
            <div className="lyric-card-meta" style={{ flex: 1, overflow: 'visible' }}>
              <h4 className="lyric-card-title" style={{ fontSize: '20px', margin: 0, lineHeight: 1.2 }}>{songTitle}</h4>
              <p className="lyric-card-artist" style={{ fontSize: '15px', margin: '4px 0 0 0', opacity: 0.8, lineHeight: 1.2 }}>{songArtist}</p>
            </div>
          </div>
          <div className="lyric-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px', overflow: 'visible' }}>
            {displayLyrics.map((line, idx) => (
              <div key={idx} className="lyric-line" style={{ opacity: 1, transform: 'scale(1)', fontSize: displayLyrics.length > 3 ? '22px' : '28px' }}>
                {line.text}
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', bottom: '30px', left: '40px', opacity: 0.7, color: activeColor.text === 'light' ? '#fff' : '#000', zIndex: 10, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiMusic size={24} />
            <span style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '4px' }}>RHYM</span>
          </div>
        </div>

        {/* Visible UI Card Preview */}
        <div 
          className="lyric-share-card" 
          style={{ 
            backgroundColor: activeColor.value,
            boxShadow: `0 20px 50px ${activeColor.glow}`,
            color: activeColor.text === 'light' ? '#ffffff' : '#000000',
            height: '450px', 
            width: '360px'
          }}
        >
          <div className="lyric-noise-overlay"></div>
          <div className="lyric-card-header" style={{ marginTop: '-8px' }}>
            <img src={songArt} alt={songTitle} className="lyric-card-art" crossOrigin="anonymous" />
            <div className="lyric-card-meta">
              <h4 className="lyric-card-title truncate" style={{ fontSize: '14px' }}>{songTitle}</h4>
              <p className="lyric-card-artist truncate" style={{ fontSize: '11px' }}>{songArtist}</p>
            </div>
            <div className="lyric-card-eq">
              <div className="eq-bar" />
              <div className="eq-bar" style={{ animationDelay: '0.2s' }} />
              <div className="eq-bar" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>

          <div className="lyric-card-body hide-scrollbar" style={{ overflowY: 'auto', maxHeight: '100%', padding: '10px 0' }}>
            {allLyrics.length > 0 ? (
              allLyrics.map((line, idx) => {
                const isSelected = selectedLines.includes(idx);
                const isPicking = selectedLines.length > 0;
                
                const textStyle = isSelected 
                  ? { 
                      opacity: 1, 
                      transform: 'scale(1.03)',
                      color: activeColor.text === 'light' ? '#fff' : '#000',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '4px 8px'
                    } 
                  : { 
                      opacity: isPicking ? 0.3 : 0.6,
                      fontSize: '18px'
                    };
                
                return (
                  <div 
                    key={idx} 
                    className={`lyric-line ${isSelected ? 'selected' : ''}`}
                    style={{...textStyle, fontSize: isSelected ? '20px' : '18px', marginBottom: '8px' }}
                    onClick={(e) => { e.stopPropagation(); toggleLine(idx); }}
                  >
                    {line.text}
                  </div>
                );
              })
            ) : (
              <p style={{ textAlign: 'center', opacity: 0.5, fontSize: '14px' }}>No lyrics found</p>
            )}
          </div>

          <div style={{ position: 'absolute', bottom: '6px', left: '24px', opacity: 0.6, color: activeColor.text === 'light' ? '#fff' : '#000', zIndex: 10, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiMusic size={16} />
            <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '2px' }}>RHYM</span>
          </div>
        </div>

        {/* Controls (Hidden during capture) */}
        {!isCapturing && (
          <div className="lyric-share-controls">
            {/* Color Swatches */}
            <div className="lyric-color-picker">
              {SWATCHES.map((swatch, idx) => (
                <button
                  key={swatch.name}
                  className={`color-swatch ${selectedColorIdx === idx ? 'active' : ''}`}
                  style={{ backgroundColor: swatch.value }}
                  onClick={(e) => { e.stopPropagation(); setSelectedColorIdx(idx); }}
                  title={swatch.name}
                />
              ))}
            </div>

            {/* Main Share Action */}
            <button 
              className="lyric-share-btn-main"
              disabled={selectedLines.length === 0}
              onClick={(e) => { e.stopPropagation(); handleShare('main'); }}
            >
              {selectedLines.length > 0 ? (
                <>
                  <div className="shimmer-mask" />
                  <FiShare2 size={18} />
                  <span>Share Lyrics</span>
                </>
              ) : (
                <span>Select lyrics to share</span>
              )}
            </button>

            {/* Platform Share Icons */}
            <div className={`lyric-social-row ${selectedLines.length === 0 ? 'disabled' : ''}`}>
              <button className="social-btn whatsapp" onClick={() => handleShare('whatsapp')}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              </button>
              <button className="social-btn instagram" onClick={() => handleShare('instagram')}>
                <FiInstagram size={20} />
              </button>
              <button className="social-btn twitter" onClick={() => handleShare('twitter')}>
                <FiTwitter size={20} />
              </button>
              <button className="social-btn copy" onClick={() => handleShare('copy')}>
                <FiCopy size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
