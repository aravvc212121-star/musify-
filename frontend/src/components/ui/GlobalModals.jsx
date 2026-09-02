import React, { useState, useEffect, useRef } from 'react'
import { usePlayer } from '../../context/PlayerContext.jsx'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { shareSong } from '../../utils/share.js'
import { FiMoreHorizontal, FiTrash2, FiPlay, FiPlus, FiLink, FiSliders, FiX, FiClock, FiSearch } from 'react-icons/fi'
import { searchSongs } from '../../utils/api.js'

export default function GlobalModals() {
  const { 
    userPlaylists, setEqBands, eqBands, playSong, addToQueue, 
    removeSongFromPlaylist, toggleSavedSong, deletePlaylist, updatePlaylist, removeFromQueue,
    startSleepTimer, cancelSleepTimer, sleepTimer
  } = usePlayer()

  // Context Menu State
  const [cmState, setCmState] = useState({ isOpen: false, x: 0, y: 0, song: null, playlistName: null, type: 'song', fromQueue: false })
  const [showSubMenu, setShowSubMenu] = useState(null) // null, 'playlist', 'timer'
  const [confirmItem, setConfirmItem] = useState(null) // for 'Remove from Playlist'
  
  // Playlist Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, playlistName: null })

  // Equalizer Modal State
  const [eqOpen, setEqOpen] = useState(false)
  const [localEq, setLocalEq] = useState([0,0,0,0,0])

  // --- NEW: Global Playlist Modal State ---
  const [playlistModal, setPlaylistModal] = useState({
    isOpen: false,
    editingName: null, // null for create, string for edit
    name: '',
    songs: [],
    searchQuery: ''
  })

  // Add Songs Modal State
  const [addSongsModal, setAddSongsModal] = useState({
    isOpen: false,
    playlistName: null,
    searchQuery: '',
    results: [],
    isLoading: false
  })

  const { masterPlaylistData, setUserPlaylists, addSongToPlaylist } = usePlayer()
  const navigate = useNavigate()

  // Context Menu logic
  useEffect(() => {
    const handleOpen = (e) => {
      setCmState({ 
        isOpen: true, 
        x: e.detail.x, 
        y: e.detail.y, 
        song: e.detail.song, 
        playlistName: e.detail.playlistName,
        type: e.detail.type || 'song',
        fromQueue: e.detail.fromQueue || false
      })
      setShowSubMenu(null)
      setConfirmItem(null)
    }
    const handleClose = () => {
      setCmState(prev => ({ ...prev, isOpen: false }))
    }
    
    window.addEventListener('open-context-menu', handleOpen)
    window.addEventListener('click', handleClose)
    window.addEventListener('scroll', handleClose, { capture: true, passive: true })

    return () => {
      window.removeEventListener('open-context-menu', handleOpen)
      window.removeEventListener('click', handleClose)
      window.removeEventListener('scroll', handleClose, { capture: true })
    }
  }, [])

  // Eq Modal listener
  useEffect(() => {
    const handleOpenEq = () => {
      setLocalEq([...eqBands])
      setEqOpen(true)
    }
    window.addEventListener('open-eq-modal', handleOpenEq)

    // Playlist Modal listeners
    const handleOpenCreate = () => {
      setPlaylistModal({
        isOpen: true,
        editingName: null,
        name: `My Playlist #${userPlaylists.length + 1}`,
        songs: [],
        searchQuery: ''
      })
    }
    const handleOpenEdit = (e) => {
      const pl = userPlaylists.find(p => p.name === e.detail.playlistName)
      if (!pl) return
      setPlaylistModal({
        isOpen: true,
        editingName: e.detail.playlistName,
        name: pl.name,
        songs: pl.songs || [],
        searchQuery: ''
      })
    }

    window.addEventListener('open-create-playlist', handleOpenCreate)
    window.addEventListener('open-edit-playlist', handleOpenEdit)

    return () => {
      window.removeEventListener('open-eq-modal', handleOpenEq)
      window.removeEventListener('open-create-playlist', handleOpenCreate)
      window.removeEventListener('open-edit-playlist', handleOpenEdit)
    }
  }, [eqBands, userPlaylists])

  // Handle Search for Add Songs Modal
  useEffect(() => {
    if (!addSongsModal.isOpen) return
    
    const delayDebounceFn = setTimeout(async () => {
      if (addSongsModal.searchQuery.trim().length < 2) {
        setAddSongsModal(p => ({ ...p, results: masterPlaylistData.slice(0, 10), isLoading: false }))
        return
      }
      
      setAddSongsModal(p => ({ ...p, isLoading: true }))
      try {
        const results = await searchSongs(addSongsModal.searchQuery)
        setAddSongsModal(p => ({ ...p, results, isLoading: false }))
      } catch (err) {
        setAddSongsModal(p => ({ ...p, isLoading: false }))
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [addSongsModal.searchQuery, addSongsModal.isOpen, masterPlaylistData])

  const handleSavePlaylist = () => {
    const finalName = playlistModal.name.trim() || `My Playlist #${userPlaylists.length + 1}`
    
    if (playlistModal.editingName) {
      updatePlaylist(playlistModal.editingName, { name: finalName, songs: playlistModal.songs })
      if (playlistModal.editingName !== finalName) {
        navigate(`/playlist/${encodeURIComponent(finalName)}`)
      }
    } else {
      const neonGradients = [
        'linear-gradient(135deg, #FF00FF, #7000FF)',
        'linear-gradient(135deg, #00FF00, #00FF99)',
        'linear-gradient(135deg, #00FFFF, #0077FF)',
        'linear-gradient(135deg, #FF3131, #FF914D)',
        'linear-gradient(135deg, #FFBD59, #FF914D)',
        'linear-gradient(135deg, #8C52FF, #5CE1E6)',
        'linear-gradient(135deg, #FFDE59, #FF66C4)'
      ]
      const randomGradient = neonGradients[Math.floor(Math.random() * neonGradients.length)]

      const newPlaylistObj = { 
        name: finalName, 
        songs: playlistModal.songs, 
        cover: '🎵', 
        color: randomGradient
      }
      setUserPlaylists(prev => [newPlaylistObj, ...prev])
      toast.success(`Playlist '${finalName}' created!`)
      navigate(`/playlist/${encodeURIComponent(finalName)}`)
    }
    setPlaylistModal(prev => ({ ...prev, isOpen: false }))
  }

  const handleCmClick = (e) => {
    e.stopPropagation()
  }

  // Positioning logic
  let menuX = cmState.x
  let menuY = cmState.y
  const menuWidth = 220
  const menuHeight = cmState.fromQueue ? 100 : (cmState.type === 'song' ? 280 : 200)

  // Horizontal check
  if (menuX + menuWidth > window.innerWidth) menuX = window.innerWidth - menuWidth - 20
  if (menuX < 0) menuX = 20

  // Vertical check: Upward if in bottom half
  const isBottomHalf = menuY > window.innerHeight / 2
  if (isBottomHalf) {
    menuY = menuY - menuHeight - 10
  } else {
    // Already set to menuY (downward)
  }
  
  // Vertical overflow check
  if (menuY + menuHeight > window.innerHeight) menuY = window.innerHeight - menuHeight - 20
  if (menuY < 0) menuY = 20

  const handleRemove = () => {
    if (cmState.playlistName === 'Liked Songs') {
      toggleSavedSong(cmState.song)
    } else {
      removeSongFromPlaylist(cmState.playlistName, cmState.song.videoId)
    }
    setCmState({ isOpen: false })
  }

  return (
    <>
      {/* ─── CONTEXT MENU ─── */}
      {cmState.isOpen && (
        <div 
          onClick={handleCmClick}
          style={{
            position: 'fixed',
            top: menuY,
            left: menuX,
            zIndex: 10000,
            transformOrigin: isBottomHalf ? 'bottom left' : 'top left'
          }}
          className="glass-box context-menu-box"
        >
          <style>{`
            @keyframes menuAppear {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
            .context-menu-box {
              border-radius: 12px;
              padding: 8px 0;
              min-width: 220px;
              animation: menuAppear 0.2s ease;
            }
            .cm-item {
              height: 40px;
              padding: 0 16px;
              display: flex;
              align-items: center;
              gap: 12px;
              color: #fff;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              background: transparent;
              border: none;
              width: 100%;
              text-align: left;
              transition: background 0.2s;
            }
            .cm-item:hover {
              background: rgba(255, 255, 255, 0.1);
            }
            .cm-item.red { color: #ef4444; }
            .cm-item.red:hover { background: rgba(239, 68, 68, 0.1); }
            .divider { height: 1px; background: #3a3a3a; margin: 4px 0; }
            
            .confirm-row {
              padding: 8px 16px;
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .confirm-btns {
              display: flex;
              gap: 8px;
            }
            .confirm-btn {
              flex: 1;
              padding: 6px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 700;
              cursor: pointer;
              border: none;
            }
          `}</style>

          {cmState.type === 'song' ? (
            !showSubMenu ? (
              <>
                {cmState.fromQueue ? (
                  <>
                    <button className="cm-item" onClick={() => { playSong(cmState.song); setCmState({ isOpen: false }) }}>
                      <FiPlay size={16} /> Play Now
                    </button>
                    <div className="divider" />
                    <button className="cm-item red" onClick={() => { removeFromQueue(cmState.song.videoId); setCmState({ isOpen: false }) }}>
                      <FiTrash2 size={16} /> Remove from Queue
                    </button>
                  </>
                ) : (
                  <>
                    <button className="cm-item" onClick={() => { playSong(cmState.song); setCmState({ isOpen: false }) }}>
                      <FiPlay size={16} /> Play Now
                    </button>
                    <button className="cm-item" onClick={() => { addToQueue(cmState.song); setCmState({ isOpen: false }) }}>
                      <FiPlus size={16} /> Add to Queue
                    </button>
                    <button className="cm-item" onClick={(e) => { e.stopPropagation(); setShowSubMenu('playlist') }}>
                      <FiPlus size={16} /> Add to Playlist <span style={{ marginLeft: 'auto' }}>❯</span>
                    </button>
                    <button className="cm-item" onClick={(e) => { e.stopPropagation(); setShowSubMenu('timer') }}>
                      <FiClock size={16} /> Sleep Timer <span style={{ marginLeft: 'auto' }}>❯</span>
                    </button>
                    <button className="cm-item" onClick={() => { shareSong(cmState.song); setCmState({ isOpen: false }) }}>
                      <FiLink size={16} /> Share
                    </button>
                    <button className="cm-item" onClick={() => { window.dispatchEvent(new CustomEvent('open-eq-modal')); setCmState({ isOpen: false }) }}>
                      <FiSliders size={16} /> Equalizer
                    </button>
                    
                    {cmState.playlistName && (
                      <>
                        <div className="divider" />
                        {confirmItem === 'remove' ? (
                          <div className="confirm-row">
                            <p style={{ color: '#b3b3b3', fontSize: '12px', margin: 0 }}>Remove '{cmState.song.title}'?</p>
                            <div className="confirm-btns">
                              <button className="confirm-btn" style={{ background: '#3a3a3a', color: '#fff' }} onClick={() => setConfirmItem(null)}>Cancel</button>
                              <button className="confirm-btn" style={{ background: '#ef4444', color: '#fff' }} onClick={handleRemove}>Remove</button>
                            </div>
                          </div>
                        ) : (
                          <button className="cm-item red" onClick={(e) => { e.stopPropagation(); setConfirmItem('remove') }}>
                            <FiTrash2 size={16} /> {cmState.playlistName === 'Liked Songs' ? 'Unlike Song' : 'Remove from this Playlist'}
                          </button>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            ) : showSubMenu === 'playlist' ? (
              <>
                <div style={{ padding: '4px 16px 8px', borderBottom: '1px solid #3a3a3a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={(e) => { e.stopPropagation(); setShowSubMenu(null) }} style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: 4 }}>❮</button>
                  <span style={{ color: '#b3b3b3', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Add to playlist</span>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }} className="hide-scrollbar">
                  <button className="cm-item" style={{ color: 'var(--accent)', fontWeight: 700 }} onClick={() => { 
                    window.dispatchEvent(new CustomEvent('open-create-playlist'));
                    setCmState({ isOpen: false });
                  }}>
                    <FiPlus size={16} /> Create new playlist
                  </button>
                  <div className="divider" style={{ margin: '4px 0' }} />
                  {userPlaylists.filter(p => p.name !== 'Liked Songs').map(pl => (
                    <button key={pl.name} className="cm-item" onClick={() => { 
                      addSongToPlaylist(pl.name, cmState.song);
                      setCmState({ isOpen: false });
                    }}>
                      {pl.name}
                    </button>
                  ))}
                </div>
              </>
            ) : showSubMenu === 'timer' ? (
              <>
                <div style={{ padding: '4px 16px 8px', borderBottom: '1px solid #3a3a3a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={(e) => { e.stopPropagation(); setShowSubMenu(null) }} style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: 4 }}>❮</button>
                  <span style={{ color: '#b3b3b3', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Sleep Timer</span>
                </div>
                <div>
                  {[15, 30, 45, 60].map(mins => (
                    <button key={mins} className="cm-item" onClick={() => { startSleepTimer(mins); setCmState({ isOpen: false }); }}>
                      {mins} minutes
                    </button>
                  ))}
                  <button className="cm-item" onClick={() => { startSleepTimer('track'); setCmState({ isOpen: false }); }}>
                    End of track
                  </button>
                  {sleepTimer.active && (
                    <button className="cm-item red" onClick={() => { cancelSleepTimer(); setCmState({ isOpen: false }); }}>
                      Turn off timer
                    </button>
                  )}
                </div>
              </>
            ) : null
          ) : cmState.type === 'playlist' ? (
            <>
              <button className="cm-item" onClick={() => { 
                window.dispatchEvent(new CustomEvent('open-edit-playlist', { detail: { playlistName: cmState.playlistName } }));
                setCmState({ isOpen: false });
              }}>
                <span style={{ fontSize: 16 }}>✏</span> Edit playlist details
              </button>
              <button className="cm-item" onClick={() => { 
                setAddSongsModal({ 
                  isOpen: true, 
                  playlistName: cmState.playlistName, 
                  searchQuery: '', 
                  results: masterPlaylistData.slice(0, 10), 
                  isLoading: false 
                });
                setCmState({ isOpen: false });
              }}>
                <FiPlus size={16} /> Add songs
              </button>
              <button className="cm-item" onClick={() => { toast.success("Playlist link copied"); setCmState({ isOpen: false }) }}>
                <FiLink size={16} /> Share playlist
              </button>
              <div className="divider" />
              <button className="cm-item red" onClick={() => { setDeleteModal({ isOpen: true, playlistName: cmState.playlistName }); setCmState({ isOpen: false }) }}>
                <FiTrash2 size={16} /> Delete playlist
              </button>
            </>
          ) : null}
        </div>
      )}

      {/* ─── DELETE PLAYLIST MODAL ─── */}
      {deleteModal.isOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div 
            className="glass-box"
            style={{
              borderRadius: '12px', padding: '28px', width: '380px',
              animation: 'modalScaleIn 0.2s ease'
            }}
          >
            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0' }}>Delete playlist?</h3>
            <p style={{ color: '#b3b3b3', fontSize: '14px', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              This will delete '{deleteModal.playlistName}' from Your Library. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setDeleteModal({ isOpen: false, playlistName: null })}
                style={{ background: 'none', border: '1px solid #535353', color: '#fff', padding: '10px 24px', borderRadius: '24px', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  deletePlaylist(deleteModal.playlistName);
                  setDeleteModal({ isOpen: false, playlistName: null });
                  window.dispatchEvent(new CustomEvent('playlist-deleted', { detail: { name: deleteModal.playlistName } }));
                }}
                style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: '24px', fontWeight: 700, cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EQUALIZER MODAL (Redesigned for Premium Look) */}
      {eqOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
          zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.3s ease'
        }} onMouseDown={() => setEqOpen(false)}>
          <div 
            className="glass-box eq-modal-container"
            style={{
              borderRadius: '24px', padding: '32px', width: '420px',
              animation: 'modalScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              border: 'none'
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Audio Equalizer</h2>
              <button onClick={() => setEqOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiX size={18} />
              </button>
            </div>

            {/* EQ Sliders Grid */}
            <div style={{ display: 'flex', justifyContent: 'space-between', height: '220px', marginBottom: '32px', padding: '0 10px', position: 'relative' }}>
              {/* Background Guide Lines */}
              <div style={{ position: 'absolute', inset: '0 10px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', opacity: 0.1 }}>
                {[...Array(5)].map((_, i) => <div key={i} style={{ width: '100%', height: '1px', background: '#fff' }} />)}
              </div>

              {['60Hz', '230Hz', '910Hz', '3.6kHz', '14kHz'].map((label, i) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', zIndex: 1 }}>
                  <div style={{ position: 'relative', height: '160px', width: '30px', display: 'flex', justifyContent: 'center' }}>
                    <input 
                      type="range" min="-12" max="12" step="1"
                      value={localEq[i]} 
                      onChange={(e) => { const n=[...localEq]; n[i]=Number(e.target.value); setLocalEq(n); }}
                      className="eq-slider-vertical"
                      style={{ 
                        writingMode: 'vertical-lr', 
                        direction: 'rtl', 
                        appearance: 'slider-vertical', 
                        width: '6px', 
                        height: '160px',
                        cursor: 'ns-resize'
                      }} 
                    />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#fff', fontSize: '11px', fontWeight: 700, margin: 0 }}>{label}</p>
                    <p style={{ color: localEq[i] > 0 ? 'var(--accent)' : localEq[i] < 0 ? '#ef4444' : '#b3b3b3', fontSize: '10px', fontWeight: 800, margin: '2px 0 0 0' }}>
                      {localEq[i] > 0 ? `+${localEq[i]}` : localEq[i]}dB
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Presets Grid */}
            <div style={{ marginBottom: '32px' }}>
              <p style={{ color: '#b3b3b3', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Presets</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { name: 'Flat', vals: [0, 0, 0, 0, 0] },
                  { name: 'Bass', vals: [6, 4, 0, -2, -4] },
                  { name: 'Pop', vals: [-1, 2, 4, 2, -1] },
                  { name: 'Rock', vals: [4, 2, -1, 1, 3] },
                  { name: 'Soft', vals: [0, 1, 2, 1, 0] },
                  { name: 'Electronic', vals: [5, 3, 0, 3, 5] }
                ].map(p => (
                  <button 
                    key={p.name}
                    onClick={() => setLocalEq(p.vals)}
                    style={{
                      background: JSON.stringify(localEq) === JSON.stringify(p.vals) ? 'rgba(0, 210, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                      border: JSON.stringify(localEq) === JSON.stringify(p.vals) ? '1px solid var(--accent)' : 'none',
                      color: JSON.stringify(localEq) === JSON.stringify(p.vals) ? '#fff' : '#b3b3b3',
                      borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setLocalEq([0,0,0,0,0])} 
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                Reset
              </button>
              <button 
                onClick={() => { setEqBands(localEq); toast.success('Equalizer profile applied'); setEqOpen(false); }} 
                style={{ flex: 1, background: '#fff', border: 'none', color: '#000', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(0, 210, 255, 0.3)', transition: 'transform 0.2s' }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                Apply Changes
              </button>
            </div>
          </div>
          <style>{`
            .eq-slider-vertical {
              accent-color: var(--accent);
            }
            .eq-slider-vertical::-webkit-slider-runnable-track {
              background: rgba(255,255,255,0.1);
              border-radius: 10px;
            }
            .eq-slider-vertical::-webkit-slider-thumb {
              box-shadow: 0 0 15px rgba(0, 210, 255, 0.5);
            }
          `}</style>
        </div>
      )}

      {/* ─── CREATE/EDIT PLAYLIST MODAL ─── */}
      {playlistModal.isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10005,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.25s ease'
        }} onMouseDown={() => setPlaylistModal(p => ({ ...p, isOpen: false }))}>
          
          <div 
            className="glass-box hide-scrollbar"
            style={{
              borderRadius: '16px', width: '90%', maxWidth: '520px', 
              maxHeight: '85vh', overflowY: 'auto', padding: 0, position: 'relative',
              animation: 'modalScaleIn 0.25s ease'
            }} 
            onMouseDown={e => e.stopPropagation()}
          >
            
            <button onClick={() => setPlaylistModal(p => ({ ...p, isOpen: false }))} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', zIndex: 10, width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiX size={20} />
            </button>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '32px 24px 24px', display: 'flex', flexDirection: window.innerWidth < 480 ? 'column' : 'row', gap: '24px', alignItems: 'center' }}>
                <div style={{ width: '160px', height: '160px', background: '#282828', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                  <span style={{ fontSize: '64px' }}>🎵</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#b3b3b3', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Playlist Details</p>
                  <input type="text" value={playlistModal.name} onChange={e => setPlaylistModal(p => ({ ...p, name: e.target.value }))}
                    placeholder="Playlist Name"
                    style={{ background: 'transparent', border: 'none', borderBottom: '2px solid #333', color: '#fff', fontSize: '24px', fontWeight: 800, outline: 'none', paddingBottom: '8px', marginBottom: '20px', width: '100%' }} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSavePlaylist} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '24px', padding: '12px 36px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', transition: 'transform 0.2s' }} onMouseDown={e=>e.currentTarget.style.transform='scale(0.95)'} onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>
                      {playlistModal.editingName ? 'Save Changes' : 'Create Playlist'}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #282828', padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: 0 }}>Add songs to your playlist</h4>
                  <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 800, background: 'rgba(0, 210, 255, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>{playlistModal.songs.length} SELECTED</span>
                </div>
                
                <div style={{ position: 'relative', marginBottom: '20px' }}>
                  <FiPlus size={18} color="#b3b3b3" style={{ position: 'absolute', top: '12px', left: '12px', transform: 'rotate(45deg)' }} />
                  <input 
                    type="text" 
                    placeholder="Search from your history or library" 
                    value={playlistModal.searchQuery} 
                    onChange={e => setPlaylistModal(p => ({ ...p, searchQuery: e.target.value }))} 
                    style={{ width: '100%', background: '#242424', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '14px', padding: '12px 12px 12px 40px', outline: 'none', transition: 'border-color 0.2s' }} 
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.currentTarget.style.borderColor = '#333'}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '300px', overflowY: 'auto' }} className="hide-scrollbar">
                  {masterPlaylistData
                    .filter(s => s.title.toLowerCase().includes(playlistModal.searchQuery.toLowerCase()) || s.artist.toLowerCase().includes(playlistModal.searchQuery.toLowerCase()))
                    .slice(0, 15)
                    .map((song, i) => {
                    const isAdded = playlistModal.songs.some(s => s.videoId === song.videoId)
                    return (
                      <div key={song.videoId || i} style={{ display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '8px', background: isAdded ? 'rgba(0, 210, 255, 0.05)' : 'transparent', transition: 'background 0.2s' }}>
                        <img src={song.thumbnail} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', marginRight: '12px', objectFit: 'cover' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="truncate" style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>{song.title}</p>
                          <p className="truncate" style={{ color: '#b3b3b3', fontSize: '12px', margin: 0 }}>{song.artist}</p>
                        </div>
                        <button 
                          onClick={() => { 
                            if(!isAdded) setPlaylistModal(p => ({ ...p, songs: [song, ...p.songs] })); 
                            else setPlaylistModal(p => ({ ...p, songs: p.songs.filter(s => s.videoId !== song.videoId) }));
                          }}
                          style={{ 
                            background: isAdded ? 'var(--accent)' : 'transparent', 
                            border: isAdded ? 'none' : '1px solid #535353', 
                            borderRadius: '24px', color: isAdded ? '#fff' : '#fff', 
                            padding: '6px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', minWidth: '80px' 
                          }}>
                          {isAdded ? 'Added' : 'Add'}
                        </button>
                      </div>
                    )
                  })}
                  {masterPlaylistData.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#b3b3b3', fontSize: '13px', padding: '20px' }}>Listen to some songs first to add them here!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD SONGS TO PLAYLIST MODAL ─── */}
      {addSongsModal.isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10006,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease'
        }} onMouseDown={() => setAddSongsModal(p => ({ ...p, isOpen: false }))}>
          
          <div 
            className="glass-box"
            style={{
              borderRadius: '16px', width: '90%', maxWidth: '440px', 
              maxHeight: '70vh', display: 'flex', flexDirection: 'column',
              animation: 'modalScaleIn 0.2s ease', overflow: 'hidden'
            }} 
            onMouseDown={e => e.stopPropagation()}
          >
            
            <div style={{ padding: '20px 24px', borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: 0 }}>Add to {addSongsModal.playlistName}</h3>
              <button onClick={() => setAddSongsModal(p => ({ ...p, isOpen: false }))} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiX size={18} />
              </button>
            </div>

            <div style={{ padding: '16px 24px' }}>
              <div style={{ position: 'relative' }}>
                <FiSearch size={16} color="#b3b3b3" style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)' }} />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search for more songs" 
                  value={addSongsModal.searchQuery} 
                  onChange={e => setAddSongsModal(p => ({ ...p, searchQuery: e.target.value }))} 
                  style={{ width: '100%', background: '#282828', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '14px', padding: '10px 12px 10px 36px', outline: 'none' }} 
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 16px' }} className="hide-scrollbar">
              {addSongsModal.isLoading ? (
                <p style={{ textAlign: 'center', color: '#b3b3b3', fontSize: '13px', padding: '40px' }}>Searching...</p>
              ) : (
                <>
                  {addSongsModal.results.map((song, i) => {
                    const pl = userPlaylists.find(p => p.name === addSongsModal.playlistName)
                    const isAdded = pl?.songs.some(s => s.videoId === song.videoId)
                    
                    return (
                      <div key={song.videoId || i} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderRadius: '8px', transition: 'background 0.2s' }} className="hover-bg-card">
                        <img src={song.thumbnail} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', marginRight: '12px', objectFit: 'cover' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="truncate" style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>{song.title}</p>
                          <p className="truncate" style={{ color: '#b3b3b3', fontSize: '12px', margin: 0 }}>{song.artist}</p>
                        </div>
                        <button 
                          onClick={() => { 
                            if(!isAdded) addSongToPlaylist(addSongsModal.playlistName, song);
                          }}
                          style={{ 
                            background: isAdded ? 'rgba(255,255,255,0.1)' : '#fff', 
                            border: 'none', 
                            borderRadius: '24px', color: isAdded ? '#b3b3b3' : '#000', 
                            padding: '6px 16px', fontSize: '12px', fontWeight: 700, cursor: isAdded ? 'default' : 'pointer', minWidth: '70px' 
                          }}>
                          {isAdded ? 'Added' : 'Add'}
                        </button>
                      </div>
                    )
                  })}
                  {addSongsModal.results.length === 0 && addSongsModal.searchQuery && (
                    <p style={{ textAlign: 'center', color: '#b3b3b3', fontSize: '13px', padding: '40px' }}>No songs found.</p>
                  )}
                  {addSongsModal.results.length === 0 && !addSongsModal.searchQuery && (
                    <p style={{ textAlign: 'center', color: '#b3b3b3', fontSize: '13px', padding: '40px' }}>Type to search for songs to add!</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
