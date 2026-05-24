import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, X, Minimize2, Maximize2, Coffee, Sparkles, Pin, PinOff } from 'lucide-react';

export function FloatingPomodoro() {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('studyvibe_pomodoro_open');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('studyvibe_pomodoro_minimized');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('studyvibe_pomodoro_position');
    return saved !== null ? JSON.parse(saved) : { x: 100, y: 150 };
  });

  const [isPinned, setIsPinned] = useState(() => {
    const saved = localStorage.getItem('studyvibe_pomodoro_pinned');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Pomodoro States
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem('studyvibe_pomodoro_timeleft');
    return saved !== null ? JSON.parse(saved) : 25 * 60;
  });
  const [isActive, setIsActive] = useState(false);
  const [currentMode, setCurrentMode] = useState<'study' | 'shortBreak' | 'longBreak'>('study');
  const [completedSessions, setCompletedSessions] = useState(() => {
    const saved = localStorage.getItem('studyvibe_pomodoro_sessions');
    return saved !== null ? JSON.parse(saved) : 0;
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('studyvibe_pomodoro_open', JSON.stringify(isOpen));
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem('studyvibe_pomodoro_minimized', JSON.stringify(isMinimized));
  }, [isMinimized]);

  useEffect(() => {
    localStorage.setItem('studyvibe_pomodoro_pinned', JSON.stringify(isPinned));
  }, [isPinned]);

  useEffect(() => {
    localStorage.setItem('studyvibe_pomodoro_sessions', JSON.stringify(completedSessions));
  }, [completedSessions]);

  useEffect(() => {
    localStorage.setItem('studyvibe_pomodoro_timeleft', JSON.stringify(timeLeft));
  }, [timeLeft]);

  // Pomodoro countdown effect
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time: number) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      // Play a visual alert or notify
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleSessionComplete = () => {
    if (currentMode === 'study') {
      const nextSessions = completedSessions + 1;
      setCompletedSessions(nextSessions);
      // Automatically toggle to break
      if (nextSessions % 4 === 0) {
        setMode('longBreak');
      } else {
        setMode('shortBreak');
      }
    } else {
      setMode('study');
    }
    // Simple modern sound synthesis trigger (unobtrusive, beautiful browser synthesizer)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      oscillator.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.3); // G5
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio Context failed', e);
    }
  };

  const setMode = (mode: 'study' | 'shortBreak' | 'longBreak') => {
    setCurrentMode(mode);
    setIsActive(false);
    if (mode === 'study') {
      setTimeLeft(25 * 60);
    } else if (mode === 'shortBreak') {
      setTimeLeft(5 * 60);
    } else {
      setTimeLeft(15 * 60);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setMode(currentMode);
  };

  const handleDragEnd = (_: any, info: any) => {
    // Save computed end coordinate relative to layout bounds
    const element = containerRef.current;
    if (element) {
      const rect = element.getBoundingClientRect();
      const updatedPos = { x: rect.left, y: rect.top };
      setPosition(updatedPos);
      localStorage.setItem('studyvibe_pomodoro_position', JSON.stringify(updatedPos));
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const activeModeLabel = () => {
    switch (currentMode) {
      case 'study': return 'Study Mode';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
    }
  };

  const getPercentageLeft = () => {
    const max = currentMode === 'study' ? 25 * 60 : currentMode === 'shortBreak' ? 5 * 60 : 15 * 60;
    return (timeLeft / max) * 100;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 md:right-32 z-[80] glass-panel p-3.5 rounded-2xl bg-brand-purple/25 border border-brand-purple/40 text-white cursor-pointer hover:bg-brand-purple/45 shadow-[0_0_30px_rgba(139,92,246,0.35)] transition-all flex items-center gap-2 hover:scale-[1.05] active:scale-95 duration-200"
      >
        <Coffee className="w-4 h-4 text-brand-purple animate-pulse" />
        <span className="font-mono text-[10px] uppercase font-bold tracking-widest">Focus Deck</span>
      </button>
    );
  }

  const dragProps = isPinned ? {} : {
    drag: true,
    dragMomentum: false,
    dragElastic: 0.1,
    onDragEnd: handleDragEnd
  };

  return (
    <motion.div
      ref={containerRef}
      style={{ left: position.x, top: position.y }}
      {...dragProps}
      className="fixed z-[80] select-none"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <AnimatePresence mode="wait">
        {isMinimized ? (
          // Minimized Compact Capsule UI
          <motion.div
            key="minimized"
            layoutId="pomodoro-widget"
            className="flex items-center gap-3 bg-black/75 backdrop-blur-2xl border border-white/10 px-4 py-2.5 rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.6)] group hover:border-brand-purple/40 cursor-grab active:cursor-grabbing transition-colors max-w-xs font-mono"
            style={{ touchAction: 'none' }}
          >
            {/* Play progress arc */}
            <div className="relative w-8 h-8 flex items-center justify-center flex-shrink-0">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="16" cy="16" r="14" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" fill="transparent" />
                <circle 
                  cx="16" cy="16" r="14" 
                  stroke={currentMode === 'study' ? '#8b5cf6' : '#10b981'} 
                  strokeWidth="2.5" 
                  fill="transparent" 
                  strokeDasharray={2 * Math.PI * 14}
                  strokeDashoffset={2 * Math.PI * 14 - (getPercentageLeft() / 100) * (2 * Math.PI * 14)}
                  strokeLinecap="round"
                />
              </svg>
              {isActive ? (
                <Pause className="w-3.5 h-3.5 text-white absolute cursor-pointer hover:text-brand-purple transition-colors" onClick={toggleTimer} />
              ) : (
                <Play className="w-3.5 h-3.5 text-white translate-x-0.5 absolute cursor-pointer hover:text-brand-purple transition-colors" onClick={toggleTimer} />
              )}
            </div>

            <div className="flex flex-col select-none pr-1">
              <span className="text-[10px] text-gray-400 capitalize truncate w-14 leading-none">{currentMode === 'study' ? 'focusing' : 'break'}</span>
              <span className="text-sm font-semibold text-white tracking-widest tabular-nums mt-0.5">{formatTime(timeLeft)}</span>
            </div>

            <div className="flex items-center gap-1.5 border-l border-white/10 pl-2">
              <button 
                onClick={() => setIsMinimized(false)}
                className="p-1 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                title="Expand Controls"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ) : (
          // Expanded Immersive Glass Pomodoro
          <motion.div
            key="expanded"
            layoutId="pomodoro-widget"
            className="w-80 glass-panel bg-black/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.7)] group hover:border-brand-purple/30 text-white font-sans flex flex-col cursor-grab active:cursor-grabbing relative overflow-hidden"
            style={{ touchAction: 'none' }}
          >
            {/* Visual Cinematic Highlight Backdrop */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/10 rounded-full blur-2xl pointer-events-none" />
            
            {/* Drag Handle & Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4 select-none">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="font-serif italic text-sm text-gray-200">Focus Core</span>
              </div>

              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation() /* stop drag on click */}>
                <button
                  onClick={() => setIsPinned(!isPinned)}
                  className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors ${isPinned ? 'text-brand-purple' : 'text-gray-400 hover:text-white'}`}
                  title={isPinned ? 'Unlock Dragging' : 'Lock Widget Dragging'}
                >
                  {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                  title="Minimize Widget"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-rose-400 transition-colors"
                  title="Close Widget"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Timer Modes */}
            <div className="flex gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/5 mb-5 select-none" onClick={(e) => e.stopPropagation()}>
              {(['study', 'shortBreak', 'longBreak'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded-xl transition-all font-mono ${
                    currentMode === m
                      ? 'bg-brand-purple text-white shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {m === 'study' ? 'focus' : m === 'shortBreak' ? 'short' : 'long'}
                </button>
              ))}
            </div>

            {/* Circular countdown visualization */}
            <div className="relative w-40 h-40 mx-auto mb-5 flex items-center justify-center select-none" onClick={(e) => e.stopPropagation()}>
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="74" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="4.5" fill="transparent" />
                <circle 
                  cx="80" cy="80" r="74" 
                  stroke="url(#widgetPurpleGlowGrad)" 
                  strokeWidth="5" 
                  fill="transparent" 
                  strokeDasharray={2 * Math.PI * 74}
                  strokeDashoffset={2 * Math.PI * 74 - (getPercentageLeft() / 100) * (2 * Math.PI * 74)}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-out"
                />
                <defs>
                  <linearGradient id="widgetPurpleGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="flex flex-col items-center justify-center">
                <span className="text-3xl font-mono font-light tracking-tight tabular-nums text-white">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">
                  {activeModeLabel()}
                </span>
              </div>
            </div>

            {/* Dynamic session metadata */}
            <div className="text-center mb-5 px-4 select-none">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400 bg-white/5 border border-white/5 py-2 px-3.5 rounded-xl">
                <span>Completed Rounds</span>
                <span className="text-brand-purple font-medium text-sm font-semibold">{completedSessions}</span>
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex gap-3 justify-center select-none" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={resetTimer}
                className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button 
                onClick={toggleTimer}
                className="flex-1 py-3 px-5 rounded-2xl bg-brand-purple hover:bg-brand-purple/90 text-white font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(139,92,246,0.3)] active:scale-[0.98]"
              >
                {isActive ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-white" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" /> Start Stream
                  </>
                )}
              </button>
            </div>
            
            <p className="text-[8px] font-mono text-gray-500 text-center mt-4 uppercase tracking-widest">Studying at studyvibe.co</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
