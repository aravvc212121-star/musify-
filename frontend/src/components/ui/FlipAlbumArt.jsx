import React, { useState, useEffect, useRef } from 'react';
import { fetchLyrics } from '../../utils/lyricsApi.js';
import { FiMusic } from 'react-icons/fi';

export function FlipAlbumArt({ song, currentTime, duration, isPlaying, onExpandLyrics, albumRef }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [lyrics, setLyrics] = useState(null);
  const [lines, setLines] = useState([]);
  const [activeLineIdx, setActiveLineIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const flipRef = useRef(false); // To prevent double triggers

  const thumb = song?.thumbnail?.replace('mqdefault', 'hqdefault') || '';

  // Fetch lyrics when song changes
  useEffect(() => {
    if (!song) return;
    let isMounted = true;
    setLyrics(null);
    setLines([]);
    setError(null);
    setActiveLineIdx(-1);

    const load = async () => {
      setLoading(true);
      try {
        const text = await fetchLyrics(song.artist || song.channelTitle, song.title);
        if (!isMounted) return;
        if (text) {
          setLyrics(text);
          setLines(text.split('\n').map(l => l.trim()).filter(l => l.length > 0));
        } else {
          setError('Lyrics not available');
        }
      } catch (e) {
        if (isMounted) setError('Lyrics not available');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [song]);

  // Progressive Sync
  useEffect(() => {
    if (lines.length === 0 || !duration) return;
    const timePerLine = duration / lines.length;
    let newIdx = Math.floor(currentTime / timePerLine);
    if (newIdx >= lines.length) newIdx = lines.length - 1;
    if (newIdx < 0) newIdx = 0;

    if (newIdx !== activeLineIdx) {
      setActiveLineIdx(newIdx);
    }
  }, [currentTime, duration, lines.length, activeLineIdx]);

  const handleFlip = (e) => {
    e.stopPropagation();
    if (flipRef.current) return;
    flipRef.current = true;
    setIsFlipped(!isFlipped);
    // use onTransitionEnd instead
  };

  const handleTransitionEnd = (e) => {
    if (e.target === e.currentTarget) {
      flipRef.current = false;
    }
  };

  // Calculate font size — bigger & bolder for aesthetic
  let fontSize = 18;
  if (lines.length > 5 && lines.length <= 10) fontSize = 16;
  if (lines.length > 10 && lines.length <= 15) fontSize = 14;
  if (lines.length > 15) fontSize = 12;

  // Derive visible lines (current + 2 before + 2 after)
  const visibleLines = [];
  for (let i = -2; i <= 2; i++) {
    const idx = activeLineIdx + i;
    if (idx >= 0 && idx < lines.length) {
      visibleLines.push({ text: lines[idx], idx, isCurrent: i === 0 });
    } else {
      visibleLines.push({ text: '', idx: `empty-${i}`, isCurrent: false });
    }
  }

  return (
    <div 
      style={{ 
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', 
        padding: '16px 0', perspective: 1000 
      }}
    >
      <div 
        ref={albumRef}
        onTransitionEnd={handleTransitionEnd}
        style={{
          width: '80vw', maxWidth: 300, height: '80vw', maxHeight: 300, position: 'relative',
          transformStyle: 'preserve-3d', transition: 'transform 500ms cubic-bezier(0.34,1.10,0.64,1)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          borderRadius: 8, boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
          willChange: flipRef.current ? 'transform' : 'auto',
          cursor: 'pointer'
        }}
        onClick={handleFlip}
      >
        {/* Front Face: Album Art */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          borderRadius: 8, overflow: 'hidden'
        }}>
          <img src={thumb} alt={song?.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
        </div>

        {/* Back Face: Lyrics Card */}
        <div 
          style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
            borderRadius: 8, transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}
        >
          {/* Top Zone 14% */}
          <div style={{ height: '14%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', gap: 6, borderBottom: 'none' }}>
            <FiMusic size={12} color="rgba(255,255,255,0.8)" />
            <div style={{ minWidth: 0, flex: 1, textAlign: 'center' }}>
              <p style={{ color: '#fff', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song?.title}</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song?.artist || song?.channelTitle}</p>
            </div>
          </div>

          {/* Middle Zone 72% */}
          <div style={{ height: '72%', padding: '16px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {loading ? (
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', animation: 'pulse 1.5s infinite' }}>Loading lyrics...</p>
            ) : error ? (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center' }}>{error}</p>
            ) : lines.length > 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 8,
                transform: `translateY(calc(50% - ${(activeLineIdx * (fontSize * 1.5 + 8)) + ((fontSize * 1.5) / 2)}px))`,
                transition: 'transform 400ms ease',
                position: 'absolute', top: 0, bottom: 0, left: 16, right: 16
              }}>
                {visibleLines.map(({ text, idx, isCurrent }) => {
                  if (text === '') {
                    return (
                      <p key={idx} style={{ margin: 0, minHeight: fontSize * 1.4, opacity: 0, pointerEvents: 'none' }} />
                    )
                  }
                  
                  return (
                    <p key={idx} style={{
                      textAlign: 'center', fontWeight: isCurrent ? 900 : 700, lineHeight: 1.4,
                      fontSize: isCurrent ? fontSize + 2 : fontSize,
                      color: isCurrent ? '#fff' : 'rgba(255,255,255,0.4)',
                      opacity: 1,
                      transition: 'color 400ms ease, font-size 400ms ease, opacity 400ms ease',
                      margin: 0, minHeight: fontSize * 1.4,
                      letterSpacing: isCurrent ? '-0.3px' : '0',
                      textShadow: isCurrent ? '0 0 20px rgba(255,255,255,0.3)' : 'none',
                      pointerEvents: 'auto'
                    }}>
                      {text}
                    </p>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Bottom Zone 14% */}
          <div style={{ height: '14%', borderTop: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 600, letterSpacing: 1 }}>TAP TO EXPAND</p>
          </div>
        </div>
      </div>
    </div>
  );
}
