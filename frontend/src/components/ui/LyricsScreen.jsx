import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FiArrowLeft, FiDownload, FiInstagram, FiTwitter, FiSend } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { fetchLyrics } from '../../utils/lyricsApi.js';
import html2canvas from 'html2canvas';

function Spinner() {
  return (
    <div style={{ width: 24, height: 24, border: '2px solid transparent', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
  );
}

export function LyricsScreen({ isOpen, onClose, currentSong, currentTime, duration, isPlaying }) {
  const [lyrics, setLyrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lines, setLines] = useState([]);
  
  const [activeLineIdx, setActiveLineIdx] = useState(-1);
  const [selectedLines, setSelectedLines] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const [showShareCard, setShowShareCard] = useState(false);

  const containerRef = useRef(null);
  const longPressTimer = useRef(null);
  const touchStartY = useRef(0);
  const scrollDebounce = useRef(null);

  // Fetch lyrics
  useEffect(() => {
    if (!isOpen || !currentSong) return;
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      setLyrics(null);
      setLines([]);
      setSelectedLines(new Set());
      setIsSelectionMode(false);
      
      try {
        const text = await fetchLyrics(currentSong.artist || currentSong.channelTitle, currentSong.title);
        if (!isMounted) return;
        if (!text) {
          setError('No lyrics found for this song');
        } else {
          setLyrics(text);
          const splitLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          setLines(splitLines);
        }
      } catch (e) {
        if (!isMounted) return;
        setError('Could not load lyrics. Try again');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [isOpen, currentSong]);

  // Progressive Highlighting Logic
  useEffect(() => {
    if (!isOpen || lines.length === 0 || !duration) return;
    
    // Estimated time per line
    const timePerLine = duration / lines.length;
    let newIdx = Math.floor(currentTime / timePerLine);
    if (newIdx >= lines.length) newIdx = lines.length - 1;
    if (newIdx < 0) newIdx = 0;

    if (newIdx !== activeLineIdx) {
      setActiveLineIdx(newIdx);
      
      // Auto-scroll
      if (containerRef.current && !isSelectionMode) {
        if (scrollDebounce.current) cancelAnimationFrame(scrollDebounce.current);
        scrollDebounce.current = requestAnimationFrame(() => {
          const activeEl = containerRef.current.querySelector(`[data-idx="${newIdx}"]`);
          if (activeEl) {
            activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      }
    }
  }, [currentTime, duration, lines.length, isOpen, activeLineIdx, isSelectionMode]);

  // Swipe down to dismiss
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY > 120 && containerRef.current && containerRef.current.scrollTop === 0) {
      onClose();
    }
  };

  // Selection Logic
  const handleLineTouchStart = (idx, e) => {
    if (isSelectionMode) return; // Already in selection mode
    longPressTimer.current = setTimeout(() => {
      setIsSelectionMode(true);
      setSelectedLines(new Set([idx]));
      navigator.vibrate?.(50);
    }, 400);
  };

  const handleLineTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleLineClick = (idx) => {
    if (!isSelectionMode) return;

    const newSet = new Set(selectedLines);
    if (newSet.has(idx)) {
      newSet.delete(idx);
      if (newSet.size === 0) setIsSelectionMode(false);
      setSelectedLines(newSet);
    } else {
      if (newSet.size >= 5) {
        showToast('Maximum 5 lines');
        return;
      }
      
      // Check consecutive
      const arr = Array.from(newSet).sort((a,b) => a-b);
      if (arr.length > 0) {
        const min = arr[0];
        const max = arr[arr.length - 1];
        if (idx < min - 1 || idx > max + 1) {
          // Reset if non-consecutive
          setSelectedLines(new Set([idx]));
          return;
        }
      }
      newSet.add(idx);
      setSelectedLines(newSet);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 1500);
  };

  if (!isOpen && !showShareCard) return null;

  return (
    <>
      <div 
        style={{
          position: 'fixed', inset: 0, zIndex: 120,
          background: 'transparent',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 320ms cubic-bezier(0.32,0.72,0,1)',
          display: 'flex', flexDirection: 'column',
          willChange: 'transform'
        }}
      >
        {/* Background handled by NowPlaying blur, we just need the content layer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
        >
          {/* Header */}
          <div style={{ padding: '16px 16px 8px', textAlign: 'center', flexShrink: 0 }}>
            <div style={{ width: 32, height: 3, background: 'rgba(255,255,255,0.25)', borderRadius: 2, margin: '0 auto 16px' }} />
            <h2 className="truncate" style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{currentSong?.title}</h2>
            <p className="truncate" style={{ fontSize: 13, color: '#B3B3B3', marginTop: 2 }}>{currentSong?.artist || currentSong?.channelTitle}</p>
          </div>

          {/* Selection indicator */}
          <div style={{ height: 24, textAlign: 'center', flexShrink: 0 }}>
            {isSelectionMode ? (
              <span style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>
                Select up to 5 lines ({selectedLines.size}/5)
              </span>
            ) : null}
          </div>

          {/* Toast */}
          <div style={{
            position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)', padding: '8px 16px', borderRadius: 20,
            fontSize: 13, color: '#fff', zIndex: 130, pointerEvents: 'none',
            opacity: toastMsg ? 1 : 0, transition: 'opacity 150ms',
          }}>
            {toastMsg}
          </div>

          {/* Lyrics Container */}
          <div 
            ref={containerRef}
            style={{ 
              flex: 1, overflowY: 'auto', padding: '16px 24px',
              overscrollBehavior: 'contain', paddingBottom: 100
            }}
            className="hide-scrollbar"
          >
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 60 }}>
                <Spinner />
              </div>
            )}
            
            {error && (
              <div style={{ textAlign: 'center', marginTop: 60 }}>
                <p style={{ color: '#B3B3B3', fontSize: 14, marginBottom: 16 }}>{error}</p>
                <button onClick={() => setLyrics(null)} style={{ color: 'var(--accent)', background: 'none', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Try again</button>
              </div>
            )}

            {!loading && !error && lines.map((line, idx) => {
              const isPlayed = idx < activeLineIdx;
              const isActive = idx === activeLineIdx;
              const isSelected = selectedLines.has(idx);

              let color = 'rgba(255,255,255,0.35)';
              if (isActive) color = '#fff';
              else if (isPlayed) color = 'rgba(255,255,255,0.5)';

              return (
                <p
                  key={idx}
                  data-idx={idx}
                  onTouchStart={(e) => handleLineTouchStart(idx, e)}
                  onTouchEnd={handleLineTouchEnd}
                  onClick={() => handleLineClick(idx)}
                  style={{
                    fontSize: isActive ? 24 : 22,
                    fontWeight: 700,
                    lineHeight: 1.5,
                    color: color,
                    margin: '0 0 16px 0',
                    transition: 'color 300ms, font-size 200ms, transform 150ms, background 150ms',
                    cursor: isSelectionMode ? 'pointer' : 'default',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    background: isSelected ? 'rgba(0,210,255,0.08)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
                    paddingLeft: isSelected ? 12 : 0,
                    marginLeft: isSelected ? -15 : 0,
                    paddingTop: isSelected ? 4 : 0,
                    paddingBottom: isSelected ? 4 : 0,
                    borderRadius: '0 4px 4px 0',
                    transformOrigin: 'left center'
                  }}
                >
                  {line}
                </p>
              );
            })}
          </div>
        </div>

        {/* Share Button Overlay */}
        <div style={{
          position: 'absolute', bottom: 32, left: 16, right: 16,
          transform: isSelectionMode ? 'translateY(0)' : 'translateY(0)', // Always show, but maybe styled differently
          transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          zIndex: 130
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isSelectionMode) {
                // Open the main LyricsShareCard UI
                window.dispatchEvent(new CustomEvent('open-lyrics-share', { detail: { song: currentSong } }));
                setIsSelectionMode(false); // Close selection mode here as the new UI handles it
              } else {
                setIsSelectionMode(true);
              }
            }}
            style={{
              width: '100%', height: 48, background: 'var(--accent)', borderRadius: 500,
              color: '#000', fontSize: 15, fontWeight: 700, border: 'none',
              cursor: 'pointer', touchAction: 'manipulation',
              boxShadow: '0 4px 12px rgba(0,210,255,0.3)'
            }}
          >
            {isSelectionMode ? `Share ${selectedLines.size} Line${selectedLines.size !== 1 ? 's' : ''}` : 'Share Lyrics Card'}
          </button>
        </div>
      </div>

      <LyricsCardPreview
        isOpen={showShareCard}
        onClose={() => { setShowShareCard(false); setIsSelectionMode(false); setSelectedLines(new Set()); }}
        song={currentSong}
        lines={Array.from(selectedLines).sort((a,b) => a-b).map(idx => lines[idx])}
      />
    </>
  );
}

function LyricsCardPreview({ isOpen, onClose, song, lines }) {
  const [variant, setVariant] = useState('Gradient');
  const cardRef = useRef(null);

  if (!isOpen) return null;

  const bgStyles = {
    'Gradient': { background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' },
    'Dark': { background: '#121212', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '4px 4px' },
    'Blur': { background: `url(${song?.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(20px) brightness(0.5)' },
    'Neon': { background: '#0a0a0f', border: '1px solid rgba(0,210,255,0.6)', boxShadow: '0 0 24px rgba(0,210,255,0.25)' }
  };

  const handleShare = async (platform) => {
    if (platform === 'Download') {
      try {
        const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null });
        const link = document.createElement('a');
        link.download = `${song.title}-lyrics.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (e) {
        console.error('Download error', e);
      }
      return;
    }

    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'lyrics.png', { type: 'image/png' });
        const shareData = {
          title: song.title,
          text: `"${lines[0]}..." - ${song.title}`,
        };
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          shareData.files = [file];
          shareData.url = `https://rhym.com/track/${song?.videoId || ''}`;
          await navigator.share(shareData);
        } else {
          shareData.text = `${shareData.text}\n\nListen here: https://rhym.com/track/${song?.videoId || ''}`;
          await navigator.share(shareData); // Fallback text only
        }
      });
    } catch (e) {
      console.log('Share canceled or failed', e);
    }
  };

  let fontSize = 22;
  if (lines.length === 2) fontSize = 19;
  if (lines.length === 3) fontSize = 16;
  if (lines.length === 4) fontSize = 14;
  if (lines.length === 5) fontSize = 12;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 140, background: '#121212',
      display: 'flex', flexDirection: 'column',
      animation: 'slideUp 320ms cubic-bezier(0.32,0.72,0,1)'
    }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: 16 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#B3B3B3', padding: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <FiArrowLeft size={20} /> Back
        </button>
        <button onClick={() => handleShare('Download')} style={{ background: 'none', border: 'none', color: '#B3B3B3', padding: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <FiDownload size={20} /> Download
        </button>
      </div>

      {/* Card Preview */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div 
          ref={cardRef}
          style={{
            width: 300, height: 300, borderRadius: 16,
            padding: 24, display: 'flex', flexDirection: 'column', position: 'relative',
            transition: 'opacity 200ms', overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, ...bgStyles[variant] }} />
          
          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <img src={song?.thumbnail} alt="" width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover' }} crossOrigin="anonymous" />
              <div>
                <p style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{song?.title}</p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{song?.artist || song?.channelTitle}</p>
              </div>
            </div>

            {/* Lyrics Centered */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              {lines.map((l, i) => (
                <p key={i} style={{ color: '#fff', fontSize, fontWeight: 700, lineHeight: 1.6, textAlign: 'center', margin: 0 }}>
                  {l}
                </p>
              ))}
            </div>

            {/* Watermark */}
            <div style={{ position: 'absolute', bottom: -8, right: -4, color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700 }}>
              RHYM
            </div>
          </div>
        </div>
      </div>

      {/* Style Variants */}
      <div className="h-scroll" style={{ padding: '0 16px', marginBottom: 24, justifyContent: 'center' }}>
        {Object.keys(bgStyles).map(k => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => setVariant(k)}
              style={{
                width: 56, height: 56, borderRadius: 8, flexShrink: 0,
                border: variant === k ? '2px solid var(--accent)' : '2px solid transparent',
                position: 'relative', overflow: 'hidden'
              }}
            >
              <div style={{ position: 'absolute', inset: 0, ...bgStyles[k] }} />
            </button>
            <span style={{ fontSize: 10, color: '#B3B3B3' }}>{k}</span>
          </div>
        ))}
      </div>

      {/* Share Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, paddingBottom: 'max(24px, var(--safe-bottom))' }}>
        <ShareBtn icon={<FiInstagram size={24} color="#fff" />} label="Instagram" bg="linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" onClick={() => handleShare('Instagram')} />
        <ShareBtn icon={<FaWhatsapp size={24} color="#fff" />} label="WhatsApp" bg="#25D366" onClick={() => handleShare('WhatsApp')} />
        <ShareBtn icon={<FiTwitter size={24} color="#fff" />} label="X" bg="#1DA1F2" onClick={() => handleShare('Twitter')} />
        <ShareBtn icon={<FiSend size={24} color="#fff" />} label="Telegram" bg="#0088CC" onClick={() => handleShare('Telegram')} />
        <ShareBtn icon={<FiDownload size={24} color="#fff" />} label="Download" bg="#333333" onClick={() => handleShare('Download')} />
      </div>
    </div>
  );
}

function ShareBtn({ icon, label, bg, onClick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <button
        onClick={onClick}
        style={{
          width: 52, height: 52, borderRadius: '50%', background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer', touchAction: 'manipulation'
        }}
      >
        {icon}
      </button>
      <span style={{ color: '#B3B3B3', fontSize: 10 }}>{label}</span>
    </div>
  );
}
