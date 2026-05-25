import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipForward, SkipBack, Minimize2, Maximize2, 
  Volume2, VolumeX, X, Music, Radio, Sparkles, Pin, PinOff, 
  Shuffle, Repeat, Link as LinkIcon, AlertCircle, HelpCircle
} from 'lucide-react';
import { useMusic } from '@/context/MusicContext';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export function FloatingMusicPlayer() {
  const {
    playlists,
    activePlaylistId,
    currentTrackIndex,
    currentTrack,
    isPlaying,
    isMuted,
    volume,
    progress,
    duration,
    currentTime,
    isShuffle,
    isLoop,
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    toggleMute,
    setVolume,
    seek,
    toggleShuffle,
    toggleLoop,
    setYoutubePlayer
  } = useMusic();

  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('studyvibe_music_open');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('studyvibe_music_minimized');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('studyvibe_music_position');
    return saved !== null ? JSON.parse(saved) : { x: 740, y: 150 };
  });

  const [isPinned, setIsPinned] = useState(() => {
    const saved = localStorage.getItem('studyvibe_music_pinned');
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    const clampPosition = () => {
      setPosition(prev => {
        const maxX = window.innerWidth - 300;
        const maxY = window.innerHeight - 320;
        let newX = prev.x;
        let newY = prev.y;

        if (newX > maxX || newX < 10) {
          newX = Math.max(10, Math.min(newX, Math.max(10, maxX)));
        }
        if (newY > maxY || newY < 10) {
          newY = Math.max(10, Math.min(newY, Math.max(10, maxY)));
        }
        return { x: newX, y: newY };
      });
    };

    clampPosition();
    window.addEventListener('resize', clampPosition);
    return () => window.removeEventListener('resize', clampPosition);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);

  // Listen to mobile stage centerpiece controller custom events
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen(prev => !prev);
    };
    window.addEventListener('toggle-music-widget', handleToggle);
    return () => {
      window.removeEventListener('toggle-music-widget', handleToggle);
    };
  }, []);

  // Store window states
  useEffect(() => {
    localStorage.setItem('studyvibe_music_open', JSON.stringify(isOpen));
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem('studyvibe_music_minimized', JSON.stringify(isMinimized));
  }, [isMinimized]);

  useEffect(() => {
    localStorage.setItem('studyvibe_music_pinned', JSON.stringify(isPinned));
  }, [isPinned]);

  const createYTPlayer = () => {
    if (!ytContainerRef.current) return;
    
    try {
      // Destroy existing elements inside
      ytContainerRef.current.innerHTML = '<div id="youtube-player-element"></div>';

      const player = new window.YT.Player('youtube-player-element', {
        height: '200',
        width: '200',
        videoId: currentTrack?.source === 'youtube' ? currentTrack.url : '',
        playerVars: {
          autoplay: isPlaying ? 1 : 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0
        },
        events: {
          onReady: (event: any) => {
            setYoutubePlayer(event.target);
            if (currentTrack?.source === 'youtube' && isPlaying) {
              const id = currentTrack.url;
              if (id.startsWith('PL') || currentTrack.duration === 'Playlist') {
                if (typeof event.target.loadPlaylist === 'function') {
                  event.target.loadPlaylist({ list: id, listType: 'playlist' });
                }
              } else {
                if (typeof event.target.loadVideoById === 'function') {
                  event.target.loadVideoById(id);
                }
              }
              if (typeof event.target.playVideo === 'function') {
                event.target.playVideo();
              }
            }
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              nextTrack();
            }
          }
        }
      });
    } catch (err) {
      console.error("YouTube Player setup exception:", err);
    }
  };

  // Loading YT API safe-preloader
  useEffect(() => {
    const initYoutubeAPI = () => {
      if (!window.YT) {
        if (!document.getElementById('youtube-iframe-api-script')) {
          const tag = document.createElement('script');
          tag.id = 'youtube-iframe-api-script';
          tag.src = "https://www.youtube.com/iframe_api";
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        window.onYouTubeIframeAPIReady = () => {
          createYTPlayer();
        };
      } else {
        createYTPlayer();
      }
    };

    initYoutubeAPI();
  }, []);

  // Monitor track updates to ensure player existence when choosing YouTube stream
  useEffect(() => {
    if (currentTrack?.source === 'youtube') {
      if (window.YT && window.YT.Player) {
        const textNode = document.getElementById('youtube-player-element');
        if (!textNode) {
          createYTPlayer();
        }
      }
    }
  }, [currentTrack]);

  // Handle position bounding to client limits
  const handleDragEnd = () => {
    const element = containerRef.current;
    if (element) {
      const rect = element.getBoundingClientRect();
      const updatedPos = { x: rect.left, y: rect.top };
      setPosition(updatedPos);
      localStorage.setItem('studyvibe_music_position', JSON.stringify(updatedPos));
    }
  };

  const dragProps = isPinned ? {} : {
    drag: true,
    dragMomentum: false,
    dragElastic: 0.1,
    onDragEnd: handleDragEnd
  };

  // Safe duration parser format
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === Infinity) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  let width = 300;
  let height = 320;
  if (!isOpen) {
    width = 160;
    height = 45;
  } else if (isMinimized) {
    width = 250;
    height = 50;
  }
  const dynamicDragConstraints = {
    left: -position.x + 10,
    right: Math.max(10, window.innerWidth - position.x - width - 10),
    top: -position.y + 10,
    bottom: Math.max(10, window.innerHeight - position.y - height - 10)
  };

  // Determine cover visuals
  const trackEmoji = currentTrack?.cover || '🎵';
  const isSpotify = currentTrack?.source === 'spotify';

  return (
    <motion.div
      ref={containerRef}
      style={{ left: position.x, top: position.y, x: 0, y: 0 }}
      {...dragProps}
      dragConstraints={dynamicDragConstraints}
      className="fixed z-[100] select-none"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Hidden YouTube rendering engine node */}
      <div ref={ytContainerRef} className="fixed bottom-4 right-4 w-[1px] h-[1px] opacity-0 pointer-events-none overflow-hidden select-none z-[-50]" />

      <AnimatePresence mode="wait">
        {!isOpen ? (
          // Mini Launcher Button when completely closed
          <motion.button
            key="music-closed"
            layoutId="music-player-widget"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 bg-black/85 backdrop-blur-3xl border border-white/10 px-4 py-3 rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.8)] hover:border-indigo-500/30 font-mono text-white cursor-pointer"
          >
            <Music className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span className="text-[9px] uppercase font-bold tracking-widest leading-none pr-1">Ambient Audio</span>
          </motion.button>
        ) : isMinimized ? (
          // Mini Compact Player Pod
          <motion.div
            key="music-minimized"
            layoutId="music-player-widget"
            className="flex items-center gap-3 bg-black/85 backdrop-blur-3xl border border-white/10 px-4 py-3 rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.8)] group hover:border-indigo-500/30 cursor-grab active:cursor-grabbing font-mono border-solid"
            style={{ touchAction: 'none' }}
          >
            {/* Visualizer disc icon */}
            <div className={`w-8 h-8 rounded-full bg-indigo-500/10 border border-white/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden`}>
              {isPlaying ? (
                <div className="flex items-end gap-0.5 h-3">
                  {[10, 14, 7, 12].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [h, 3, h] }}
                      transition={{ duration: 0.6 + (i * 0.1), repeat: Infinity, ease: 'easeInOut' }}
                      className="w-0.5 bg-brand-indigo"
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>
              ) : (
                <span className="text-xs">{trackEmoji}</span>
              )}
            </div>

            <div className="flex flex-col select-none pr-1 w-28 overflow-hidden">
              <span className="text-[8px] text-indigo-400 capitalize truncate leading-none tracking-widest font-bold">FOCUS MODULE</span>
              <span className="text-[11px] font-semibold text-white truncate mt-1">{currentTrack?.title || 'No active track'}</span>
            </div>

            <div className="flex items-center gap-1.5 border-l border-white/5 pl-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={togglePlay}
                disabled={isSpotify}
                className={`p-1 rounded-full hover:bg-white/5 text-white transition-colors ${isSpotify ? 'opacity-30 cursor-not-allowed' : ''}`}
                title={isSpotify ? "Control directly via Spotify Embed card" : (isPlaying ? "Pause" : "Play")}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />}
              </button>
              
              <button 
                onClick={() => setIsMinimized(false)}
                className="p-1 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                title="Expand Deck"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ) : (
          // Expanded Cinematic sound deck Widget
          <motion.div
            key="music-expanded"
            layoutId="music-player-widget"
            className="w-80 glass-panel bg-neutral-950/90 backdrop-blur-3xl border border-white/15 rounded-3xl p-5.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] group hover:border-brand-primary/20 text-white font-sans flex flex-col cursor-grab active:cursor-grabbing relative overflow-hidden"
            style={{ touchAction: 'none' }}
          >
            {/* Visual Aura Spotlight */}
            <div className="absolute top-0 right-0 w-28 h-28 bg-brand-indigo/15 rounded-full blur-2xl pointer-events-none" />

            {/* Title Bar layout */}
            <header className="flex items-center justify-between pb-3.5 border-b border-white/5 mb-4 select-none">
              <div className="flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span className="font-serif italic text-xs text-gray-300">Scholar Sound System</span>
              </div>

              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setIsPinned(!isPinned)}
                  className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors ${isPinned ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
                  title={isPinned ? 'Allow Moving' : 'Lock Widget Dragging'}
                >
                  {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                  title="Minimize View"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-rose-400 transition-colors"
                  title="Close System Player"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </header>

            {/* active track detail block */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4.5 mb-4.5 text-center relative overflow-hidden select-none" onClick={(e) => e.stopPropagation()}>
              <span className="text-[7.5px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded uppercase tracking-widest absolute top-3 left-3 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> {currentTrack?.source?.toUpperCase() || 'SYNTH'} ACTIVE
              </span>

              {/* Cover visuals/details */}
              <div className="py-4 flex flex-col items-center">
                <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl mb-3 shadow-[0_0_15px_rgba(255,255,255,0.02)]">
                  {trackEmoji}
                </div>
                <span className="text-sm font-medium text-white truncate w-full block px-2 leading-tight">{currentTrack?.title || 'StudyVibe Sync'}</span>
                <span className="text-[10px] text-gray-500 font-mono mt-1 w-full block truncate">{currentTrack?.artist || 'Idle Focus'}</span>
              </div>

              {/* Kinematics Equalizer lines */}
              <div className="flex justify-center items-end gap-1 h-5 overflow-hidden border-t border-white/5 pt-2">
                {Array.from({ length: 18 }).map((_, i) => {
                  const h = 2 + (i % 4) * 3 + ((i * 3) % 4) * 2;
                  return (
                    <motion.div
                      key={i}
                      animate={{
                        height: isPlaying && !isSpotify
                          ? [h, Math.floor(h / 4), h + 4, h]
                          : [h, h]
                      }}
                      transition={{
                        duration: 0.8 + (i % 3) * 0.15,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                      className="w-0.5 rounded-full bg-indigo-500/60"
                      style={{ height: `${h}px` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Spotify Widget card rendering trigger */}
            {isSpotify && currentTrack && (
              <div className="mb-4 select-none" onClick={(e) => e.stopPropagation()}>
                <iframe
                  src={`https://open.spotify.com/embed/${currentTrack.url.replace('spotify:', '').replace(/:/g, '/')}`}
                  width="100%"
                  height="80"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-xl border border-white/10 bg-neutral-900"
                />
                <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl mt-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[8.5px] font-mono text-emerald-400">Play/pause controls are managed inside the Spotify iframe card directly.</span>
                </div>
              </div>
            )}

            {/* Audio Timeline progress slider */}
            {!isSpotify && (
              <div className="space-y-1 mb-4 select-none font-mono" onClick={(e) => e.stopPropagation()}>
                <div 
                  className="w-full h-1 bg-white/10 hover:bg-white/15 rounded-full overflow-hidden cursor-pointer relative"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = ((e.clientX - rect.left) / rect.width) * 100;
                    seek(percent);
                  }}
                >
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between items-center text-[9px] text-gray-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{currentTrack?.source === 'builtin' ? '∞' : formatTime(duration)}</span>
                </div>
              </div>
            )}

            {/* Core player controls */}
            {!isSpotify && (
              <div className="flex items-center justify-between border-t border-b border-white/5 py-3 mb-4 select-none" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={toggleShuffle}
                  className={`p-1.5 rounded-xl hover:bg-white/5 transition-all ${isShuffle ? 'text-indigo-400' : 'text-gray-500 hover:text-white'}`}
                  title="Shuffle List"
                >
                  <Shuffle className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={prevTrack}
                    className="p-1.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                    title="Previous Track"
                  >
                    <SkipBack className="w-4.5 h-4.5" />
                  </button>

                  <button 
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.25)]"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4.5 h-4.5 fill-black" /> : <Play className="w-4.5 h-4.5 fill-black translate-x-0.5" />}
                  </button>

                  <button 
                    onClick={nextTrack}
                    className="p-1.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                    title="Next Track"
                  >
                    <SkipForward className="w-4.5 h-4.5" />
                  </button>
                </div>

                <button
                  onClick={toggleLoop}
                  className={`p-1.5 rounded-xl hover:bg-white/5 transition-all ${isLoop ? 'text-indigo-400' : 'text-gray-500 hover:text-white'}`}
                  title="Loop Active Track"
                >
                  <Repeat className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Volume feedback loop */}
            <div className="flex items-center gap-3 select-none" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={toggleMute}
                className="text-indigo-400 hover:text-white transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input 
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="flex-1 accent-indigo-500 bg-white/10 rounded-lg appearance-auto cursor-pointer h-1"
                title="Symmetry Volume Level"
              />
              <span className="text-[10px] font-mono text-gray-500 w-8 text-right select-all">{volume}%</span>
            </div>

            <p className="text-[8px] font-mono text-gray-500 text-center mt-3 uppercase tracking-widest leading-relaxed">Acoustic System Sync Live</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
