import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '@/components/GlassCard';
import { GlowButton } from '@/components/GlowButton';
import { Link } from '@tanstack/react-router';
import { useAuth } from '@/context/AuthContext';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Wind, Flame, Compass, 
  Activity, Star, Award, History, Clock, ChevronDown, CheckCircle2,
  List, Trash2, Sliders, ShieldCheck, Heart, Sparkles, Pin, LayoutGrid, AlertCircle
} from 'lucide-react';

/* ==========================================================================
   FOCUS ENVIRONMENT CONFIGURATIONS & INTERFACES
   ========================================================================== */

interface FocusMode {
  id: string;
  name: string;
  duration: number; // Duration in seconds
  description: string;
  gradient: string; // Tailwind gradient colors
  glowColor: string; // Shadow styling color
  textColor: string;
  accentColor: string;
  badgeBg: string;
}

const FOCUS_MODES: FocusMode[] = [
  {
    id: 'pomodoro',
    name: 'Pomodoro',
    duration: 25 * 60,
    description: 'Interval tracking logic for standard study routines.',
    gradient: 'from-violet-500 via-indigo-500 to-indigo-700',
    glowColor: 'rgba(139, 92, 246, 0.45)',
    textColor: 'text-indigo-400',
    accentColor: '#8b5cf6',
    badgeBg: 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400',
  },
  {
    id: 'deep_work',
    name: 'Deep Work',
    duration: 50 * 60,
    description: 'Uninterrupted extended research for flow-state convergence.',
    gradient: 'from-amber-500 via-orange-500 to-rose-600',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    textColor: 'text-amber-400',
    accentColor: '#f59e0b',
    badgeBg: 'bg-amber-500/10 border-amber-500/25 text-amber-400',
  },
  {
    id: 'quick_focus',
    name: 'Quick Focus',
    duration: 15 * 60,
    description: 'Fast, high-fidelity micro slots for memory consolidation.',
    gradient: 'from-cyan-500 via-blue-500 to-sky-600',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    textColor: 'text-cyan-400',
    accentColor: '#06b6d4',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/25 text-cyan-400',
  },
  {
    id: 'long_sprint',
    name: 'Long Sprint',
    duration: 90 * 60,
    description: 'Deep work session for multi-hour projects.',
    gradient: 'from-emerald-500 via-teal-500 to-teal-700',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    textColor: 'text-emerald-400',
    accentColor: '#10b881',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
  },
  {
    id: 'short_break',
    name: 'Short Break',
    duration: 5 * 60,
    description: 'Serene intermission to recharge neural synapse pathways.',
    gradient: 'from-pink-500 via-rose-500 to-red-600',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    textColor: 'text-pink-400',
    accentColor: '#ec4899',
    badgeBg: 'bg-pink-500/10 border-pink-500/25 text-pink-400',
  },
  {
    id: 'long_break',
    name: 'Long Break',
    duration: 15 * 60,
    description: 'Extended reflection pause before secondary compiling cycles.',
    gradient: 'from-fuchsia-500 via-purple-500 to-purple-800',
    glowColor: 'rgba(217, 70, 239, 0.45)',
    textColor: 'text-fuchsia-400',
    accentColor: '#d946ef',
    badgeBg: 'bg-fuchsia-500/10 border-fuchsia-500/25 text-fuchsia-400',
  }
];

interface SessionLog {
  id: string;
  modeId: string;
  modeName: string;
  durationSeconds: number;
  completedAt: string;
}

interface FocusModeStats {
  [modeId: string]: {
    completedCount: number;
    totalSecondsFocused: number;
  };
}

/* ==========================================================================
   WEB AUDIO API GENERATIVE SOUNDSCAPES SYNTH ENGINE
   ========================================================================== */

let audioCtx: AudioContext | null = null;
let synthGain: GainNode | null = null;
let randNoiseSource: AudioBufferSourceNode | null = null;
let randFilter: BiquadFilterNode | null = null;
let harmonicDroneNodes: OscillatorNode[] = [];
let droneFilter: BiquadFilterNode | null = null;

export function Focus() {
  const { user, guestUser } = useAuth();
  const currentUserId = user?.id || guestUser?.id || 'guest_default';
  const logsKey = `studyvibe_focus_sessions_logs_${currentUserId}`;

  // Local storage state keys prefixed uniquely with 'studyvibe_focus_'
  const [selectedModeId, setSelectedModeId] = useState<string>('pomodoro');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<SessionLog[]>([]);
  
  // Custom interactive state parameters
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [playbackSound, setPlaybackSound] = useState<'muted' | 'rain' | 'brown' | 'cosmos'>('muted');
  const [synthVol, setSynthVol] = useState<number>(0.35);
  const [showFloatingWidget, setShowFloatingWidget] = useState<boolean>(false);

  const selectedMode = FOCUS_MODES.find(m => m.id === selectedModeId) || FOCUS_MODES[0];

  /* ==========================================================================
     LOCAL STORAGE SYNC & ACCURATE RESTORATION ENGINE
     ========================================================================== */

  // On initial mount, restore complete structure from local storage standard sets
  useEffect(() => {
    // 1. Restore completed session logs
    const savedLogs = localStorage.getItem(logsKey);
    if (savedLogs) {
      try {
        setCompletedSessions(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Failed to parse logs", e);
      }
    } else {
      setCompletedSessions([]);
    }

    // 2. Restore mode selection
    const savedMode = localStorage.getItem('studyvibe_focus_active_mode');
    let targetMode = 'pomodoro';
    if (savedMode && FOCUS_MODES.some(m => m.id === savedMode)) {
      setSelectedModeId(savedMode);
      targetMode = savedMode;
    }

    // 3. Check active state and running countdown offset accurately
    const savedIsActive = localStorage.getItem('studyvibe_focus_is_active') === 'true';
    const savedTimeLeftStr = localStorage.getItem('studyvibe_focus_time_left');
    const savedTimestampStr = localStorage.getItem('studyvibe_focus_saved_timestamp');

    const configMode = FOCUS_MODES.find(m => m.id === targetMode) || FOCUS_MODES[0];
    let calculatedTimeLeft = configMode.duration;

    if (savedTimeLeftStr) {
      const parsedTimeLeft = parseInt(savedTimeLeftStr, 10);
      if (!isNaN(parsedTimeLeft)) {
        calculatedTimeLeft = parsedTimeLeft;
      }
    }

    if (savedIsActive && savedTimestampStr) {
      const savedTimestamp = parseInt(savedTimestampStr, 10);
      if (!isNaN(savedTimestamp)) {
        const timeElapsedSinceSave = Math.floor((Date.now() - savedTimestamp) / 1000);
        const actualTimeRemaining = calculatedTimeLeft - timeElapsedSinceSave;

        if (actualTimeRemaining <= 0) {
          // Completed while app was offline/closed!
          setTimeLeft(0);
          setIsActive(false);
          // Auto-accumulate the finished session retrospectively
          logCompletedSessionRetrospectively(configMode, savedTimestamp, calculatedTimeLeft);
        } else {
          // Keep running correctly
          setTimeLeft(actualTimeRemaining);
          setIsActive(true);
        }
        return;
      }
    }

    // Fallback if not active previously
    setTimeLeft(calculatedTimeLeft);
    setIsActive(false);
  }, [currentUserId, logsKey]);

  // Synchronize timer in real-time when focus state fields are updated in storage
  useEffect(() => {
    const syncFromStorage = () => {
      const savedMode = localStorage.getItem('studyvibe_focus_active_mode');
      const savedTimeLeftStr = localStorage.getItem('studyvibe_focus_time_left');
      const savedIsActive = localStorage.getItem('studyvibe_focus_is_active') === 'true';
      const savedTimestampStr = localStorage.getItem('studyvibe_focus_saved_timestamp');

      if (savedMode && FOCUS_MODES.some(m => m.id === savedMode)) {
        setSelectedModeId(savedMode);
      }
      if (savedTimeLeftStr) {
        const parsedTimeLeft = parseInt(savedTimeLeftStr, 10);
        if (!isNaN(parsedTimeLeft)) {
          if (savedIsActive && savedTimestampStr) {
            const savedTimestamp = parseInt(savedTimestampStr, 10);
            if (!isNaN(savedTimestamp)) {
              const timeElapsed = Math.floor((Date.now() - savedTimestamp) / 1000);
              const remainingVal = Math.max(0, parsedTimeLeft - timeElapsed);
              setTimeLeft(remainingVal);
              setIsActive(remainingVal > 0 ? savedIsActive : false);
              return;
            }
          }
          setTimeLeft(parsedTimeLeft);
          setIsActive(false);
        }
      }
    };

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('focus', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('focus', syncFromStorage);
    };
  }, []);

  // Save changes block persistently to local storage on timer ticks & status adjustments
  useEffect(() => {
    localStorage.setItem('studyvibe_focus_active_mode', selectedModeId);
    localStorage.setItem('studyvibe_focus_time_left', timeLeft.toString());
    localStorage.setItem('studyvibe_focus_is_active', isActive.toString());
    localStorage.setItem('studyvibe_focus_saved_timestamp', Date.now().toString());
  }, [selectedModeId, timeLeft, isActive]);

  /* ==========================================================================
     BACKGROUND SOUND GENERATOR SYNTH LOGIC
     ========================================================================== */

  const initAudioContext = () => {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  };

  const stopActiveSynthSounds = () => {
    // Stop random white/brown noise buffers if running
    if (randNoiseSource) {
      try {
        randNoiseSource.stop();
      } catch (e) {}
      randNoiseSource = null;
    }
    // Stop generative harmonic drone oscillators
    if (harmonicDroneNodes.length > 0) {
      harmonicDroneNodes.forEach(node => {
        try {
          node.stop();
        } catch (e) {}
      });
      harmonicDroneNodes = [];
    }
  };

  const playGenerativeAtmosphere = (type: 'muted' | 'rain' | 'brown' | 'cosmos', volValue: number) => {
    try {
      initAudioContext();
      stopActiveSynthSounds();

      if (!audioCtx) return;

      if (type === 'muted') {
        return;
      }

      // Configure general gain volume nodes
      synthGain = audioCtx.createGain();
      synthGain.gain.setValueAtTime(volValue, audioCtx.currentTime);

      if (type === 'rain' || type === 'brown') {
        const bufferSize = 3 * audioCtx.sampleRate;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const channelData = noiseBuffer.getChannelData(0);
        let temporaryOut = 0.0;

        for (let i = 0; i < bufferSize; i++) {
          const whiteRandom = Math.random() * 2 - 1;
          if (type === 'brown') {
            // Apply brown noise low-frequency integration algorithm
            temporaryOut = (temporaryOut + (0.022 * whiteRandom)) / 1.025;
            channelData[i] = temporaryOut * 4.2; 
          } else {
            // Rain/Pink noise spectrum integration
            temporaryOut = (temporaryOut + (0.12 * whiteRandom)) / 1.05;
            channelData[i] = temporaryOut * 1.8;
          }
        }

        randNoiseSource = audioCtx.createBufferSource();
        randNoiseSource.buffer = noiseBuffer;
        randNoiseSource.loop = true;

        randFilter = audioCtx.createBiquadFilter();
        randFilter.type = 'lowpass';
        if (type === 'rain') {
          randFilter.frequency.setValueAtTime(1400, audioCtx.currentTime); 
        } else {
          randFilter.frequency.setValueAtTime(320, audioCtx.currentTime);
        }

        randNoiseSource.connect(randFilter);
        randFilter.connect(synthGain);
        synthGain.connect(audioCtx.destination);
        randNoiseSource.start();

      } else if (type === 'cosmos') {
        // Deep resonance cosmos drone using modulated frequency oscillators
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const oscSweep = audioCtx.createOscillator();
        const sweetGain = audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(65.41, audioCtx.currentTime); // Low fundamental C2

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(130.81, audioCtx.currentTime); // Harmonic C3

        droneFilter = audioCtx.createBiquadFilter();
        droneFilter.type = 'lowpass';
        droneFilter.frequency.setValueAtTime(180, audioCtx.currentTime);
        droneFilter.Q.setValueAtTime(6, audioCtx.currentTime);

        oscSweep.type = 'sine';
        oscSweep.frequency.setValueAtTime(0.08, audioCtx.currentTime); // Slow 12-second wave sweep duration
        sweetGain.gain.setValueAtTime(70, audioCtx.currentTime);

        oscSweep.connect(sweetGain);
        sweetGain.connect(droneFilter.frequency);

        osc1.connect(droneFilter);
        osc2.connect(droneFilter);
        droneFilter.connect(synthGain);
        synthGain.connect(audioCtx.destination);

        oscSweep.start();
        osc1.start();
        osc2.start();

        harmonicDroneNodes = [osc1, osc2, oscSweep];
      }
    } catch (err) {
      console.warn("Generative Web Audio Synthesis state exception minimized:", err);
    }
  };

  const handleSoundscapeChange = (sound: 'muted' | 'rain' | 'brown' | 'cosmos') => {
    setPlaybackSound(sound);
    if (sound === 'muted') {
      setIsMuted(true);
      stopActiveSynthSounds();
    } else {
      setIsMuted(false);
      playGenerativeAtmosphere(sound, synthVol);
    }
  };

  const handleVolumeSlide = (newVal: number) => {
    setSynthVol(newVal);
    if (synthGain && audioCtx) {
      synthGain.gain.setValueAtTime(newVal, audioCtx.currentTime);
    }
  };

  /* ==========================================================================
     COMPLETION & RETROSPECTIVE LOGGING ALGORITHMS
     ========================================================================== */

  const logCompletedSessionRetrospectively = (mode: FocusMode, startTimestamp: number, duration: number) => {
    const freshLog: SessionLog = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      modeId: mode.id,
      modeName: mode.name,
      durationSeconds: duration,
      completedAt: new Date(startTimestamp + duration * 1000).toISOString()
    };
    setCompletedSessions((prev) => {
      const nextLogs = [freshLog, ...prev];
      localStorage.setItem(logsKey, JSON.stringify(nextLogs));
      return nextLogs;
    });
  };

  const triggerCompletionChime = () => {
    // Generate organic synthesis notification audio bell
    try {
      initAudioContext();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const chimeGain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Clean harmonic concert pitch A5
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.15); // Slide upward gracefully to E6

      chimeGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      chimeGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.85); // Smooth organic decay curve

      osc.connect(chimeGain);
      chimeGain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      console.warn("Chime generation issue:", e);
    }
  };

  const completeCurrentSession = () => {
    triggerCompletionChime();
    setIsActive(false);

    const freshLog: SessionLog = {
      id: `session_live_${Date.now()}`,
      modeId: selectedMode.id,
      modeName: selectedMode.name,
      durationSeconds: selectedMode.duration,
      completedAt: new Date().toISOString()
    };

    const nextLogs = [freshLog, ...completedSessions];
    setCompletedSessions(nextLogs);
    localStorage.setItem(logsKey, JSON.stringify(nextLogs));

    // Reset remaining count to default mode bounds
    setTimeLeft(selectedMode.duration);
  };

  /* ==========================================================================
     TIMER PLAY / PAUSE / MODE SWITCHING INTERACTION ENGINE
     ========================================================================== */

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Must execute completion on next tick cycle safely
            setTimeout(completeCurrentSession, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, selectedModeId]);

  const toggleTimerState = () => {
    if (!isActive) {
      initAudioContext();
      // If a soundscape is active, resume or play it
      if (playbackSound !== 'muted') {
        playGenerativeAtmosphere(playbackSound, synthVol);
      }
    }
    setIsActive(!isActive);
  };

  const resetTimerCounter = () => {
    setIsActive(false);
    setTimeLeft(selectedMode.duration);
    stopActiveSynthSounds();
    setPlaybackSound('muted');
    setIsMuted(true);
  };

  const selectFocusMode = (modeId: string) => {
    setIsActive(false);
    setSelectedModeId(modeId);
    stopActiveSynthSounds();
    setPlaybackSound('muted');
    setIsMuted(true);
    const target = FOCUS_MODES.find(m => m.id === modeId) || FOCUS_MODES[0];
    setTimeLeft(target.duration);
  };

  const clearSessionHistory = () => {
    if (window.confirm("Do you want to wipe all stored focus stats & timeline histories securely?")) {
      setCompletedSessions([]);
      localStorage.removeItem(logsKey);
    }
  };

  /* ==========================================================================
     METRIC COMPILING FORMULAS
     ========================================================================== */

  const aggregatedMinutes = useMemo(() => {
    const totalSecs = completedSessions.reduce((sum, item) => sum + item.durationSeconds, 0);
    return Math.round(totalSecs / 60);
  }, [completedSessions]);

  const modeAggregation = useMemo(() => {
    const record: { [key: string]: number } = {};
    FOCUS_MODES.forEach(m => { record[m.id] = 0; });
    completedSessions.forEach(log => {
      if (record[log.modeId] !== undefined) {
        record[log.modeId]++;
      } else {
        record[log.modeId] = 1;
      }
    });
    return record;
  }, [completedSessions]);

  const highestModeName = useMemo(() => {
    let max = 0;
    let chosenId = 'pomodoro';
    Object.keys(modeAggregation).forEach(key => {
      if (modeAggregation[key] > max) {
        max = modeAggregation[key];
        chosenId = key;
      }
    });
    return FOCUS_MODES.find(m => m.id === chosenId)?.name || 'None';
  }, [modeAggregation]);

  /* ==========================================================================
     UI PRESENTATION PARAMETERS & VISUAL RING CALCULATORS
     ========================================================================== */

  const formatHoursMinutes = (minutesCount: number) => {
    if (minutesCount < 60) return `${minutesCount}m`;
    const hrs = Math.floor(minutesCount / 60);
    const mins = minutesCount % 60;
    return `${hrs}h ${mins}m`;
  };

  const formatCountdownTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // SVG parameters for progress ring render
  const ringRadius = 120;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const progressRatio = timeLeft / selectedMode.duration;
  const ringOffset = ringCircumference - (progressRatio * ringCircumference);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 min-h-screen pb-16 relative overflow-x-hidden">
      
      {/* Real-time Document/Tab Title Sync for cognitive session focus */}
      <TabTitleSync remainingSecs={timeLeft} isActive={isActive} modeName={selectedMode.name} />

      {/* Cinematic pulsing background matching active state and dynamic select color gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] rounded-full blur-[140px] opacity-[0.08] transition-all duration-1000 bg-gradient-to-tr ${selectedMode.gradient}`} />
        {isActive && (
          <motion.div
            animate={{ 
              scale: [1, 1.15, 0.95, 1],
              opacity: [0.12, 0.22, 0.15, 0.12] 
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full blur-[160px] bg-gradient-to-br ${selectedMode.gradient}`}
          />
        )}
      </div>

      {/* Primary Layout Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-white/5 relative z-10 gap-4">
        <div>
           <h1 className="text-4xl text-white mb-1 serif-title tracking-tight flex items-center gap-2">
             Study Focus Timer
             <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-brand-purple/15 text-brand-purple border border-brand-purple/20 font-mono text-[9px] uppercase tracking-wider gap-0.5">
               <Flame className="w-3 h-3" /> Focus Session
             </span>
           </h1>
           <p className="text-gray-450 text-xs">Customize your focus intervals and ambient soundscapes to build deep study habits.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/study"
            className="px-4 py-1.5 rounded-xl border border-brand-purple/20 bg-brand-purple/15 text-white hover:bg-brand-purple/25 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all z-10 font-bold hover:shadow-[0_0_15px_rgba(139,92,206,0.25)] cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" /> Cinematic Study Mode
          </Link>
        </div>
      </header>

      {/* Primary Focus Workbench Column Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Left Side: Dynamic Workspace Control Dashboard (Cols 1-8) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Bento-flex horizontal responsive pill layout */}
          <GlassCard className="p-3 border-white/5 bg-white/[0.02]">
             <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {FOCUS_MODES.map((mode) => {
                  const isCur = mode.id === selectedModeId;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => selectFocusMode(mode.id)}
                      className={`relative p-2.5 rounded-xl border text-center transition-all duration-300 ${
                        isCur 
                          ? `bg-gradient-to-br ${mode.gradient} border-transparent text-white shadow-xl scale-102`
                          : 'bg-white/[0.01] border-white/5 text-gray-400 hover:text-gray-250 hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider">{mode.name}</h4>
                      <p className="text-[9px] opacity-75 mt-0.5 font-mono">{(mode.duration / 60)}m</p>
                      {isCur && (
                        <motion.div 
                          layoutId="activeModeBorderIndicator" 
                          className="absolute -bottom-[2px] left-1/4 right-1/4 h-[3px] bg-white rounded-full"
                        />
                      )}
                    </button>
                  );
                })}
             </div>
          </GlassCard>

          {/* Central Circular Neon Ring Timer Frame */}
          <GlassCard className="p-10 md:p-14 border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center overflow-hidden relative min-h-[480px]">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className={`absolute bottom-0 right-0 w-48 h-48 rounded-full blur-[100px] pointer-events-none transition-all duration-1000`} style={{ backgroundColor: selectedMode.glowColor }} />

            <div className="absolute top-4 left-6 flex items-center gap-1.5">
               <span className={`inline-block w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
               <h4 className="font-mono text-[9px] uppercase text-gray-500 tracking-widest">{selectedMode.name} Cycle Active</h4>
            </div>

            <div className="absolute top-4 right-6">
               <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest inline-flex items-center gap-1">
                 <Clock className="w-3 h-3" /> Interval Limit: {selectedMode.duration / 60} minutes
               </span>
            </div>

            {/* Glowing circular timer construct */}
            <div className="relative mt-4">
              
              {/* Core SVG Ring */}
              <svg className="w-64 h-64 md:w-80 md:h-80 -rotate-90 select-none">
                 {/* Track Ring */}
                 <circle 
                   cx="50%" 
                   cy="50%" 
                   r={ringRadius} 
                   fill="transparent" 
                   stroke="rgba(255,255,255,0.03)" 
                   strokeWidth="6" 
                 />
                 {/* Glowing Active Progress Ring */}
                 <motion.circle 
                   cx="50%" 
                   cy="50%" 
                   r={ringRadius} 
                   fill="transparent" 
                   stroke={`url(#resonantCoreGradient_${selectedMode.id})`}
                   strokeWidth="8" 
                   strokeDasharray={ringCircumference}
                   strokeDashoffset={ringOffset}
                   strokeLinecap="round"
                   className="transition-all duration-150 ease-linear drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                   style={{
                     filter: isActive ? `drop-shadow(0 0 18px ${selectedMode.accentColor}70)` : 'none'
                   }}
                 />
                 {/* Linear Gradient references per each Focus Mode */}
                 <defs>
                   <linearGradient id={`resonantCoreGradient_${selectedMode.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" stopColor={selectedMode.accentColor} />
                     <stop offset="50%" stopColor="#fff" stopOpacity={0.6} />
                     <stop offset="100%" stopColor="#4f46e5" />
                   </linearGradient>
                 </defs>
              </svg>

              {/* Internal Digits & Mode Status Indicator */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <motion.div 
                   key={timeLeft}
                   initial={{ opacity: 0.9, scale: 0.99 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="font-mono tracking-tighter text-5xl md:text-6xl font-light text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] tabular-nums"
                 >
                   {formatCountdownTime(timeLeft)}
                 </motion.div>
                 
                 <span className={`text-[10px] tracking-widest font-mono text-gray-500 uppercase mt-2 block transition-all ${isActive ? 'animate-pulse text-white/55' : ''}`}>
                   {isActive ? '🧠 DEEP CONVERTING...' : '⏸ SESSION SUSPENDED'}
                 </span>

                 <div className="mt-4 px-3 py-1 bg-white/5 border border-white/5 rounded-full inline-flex items-center gap-1">
                   <Award className="w-3.5 h-3.5 text-amber-500" />
                   <span className="text-[9px] font-mono uppercase text-gray-400">Streak Session Count: {completedSessions.length}</span>
                 </div>
              </div>

            </div>

            {/* Interactive Flow Control Panel */}
            <div className="flex flex-col md:flex-row items-center gap-6 mt-10 w-full max-w-md justify-center">
               
               <div className="flex items-center gap-4">
                 {/* Reset Trigger */}
                 <button 
                   onClick={resetTimerCounter}
                   className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-300"
                   title="Reset Current Period Counter"
                 >
                   <RotateCcw className="w-4.5 h-4.5" />
                 </button>

                 {/* Play / Stop core controls */}
                 <button 
                   onClick={toggleTimerState}
                   className={`w-28 h-14 rounded-2xl flex items-center justify-center border font-mono text-xs uppercase font-extrabold tracking-widest shadow-lg transition-all active:scale-95 duration-250 ${
                     isActive 
                       ? 'bg-rose-500/10 border-rose-500/25 text-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:bg-rose-500/25' 
                       : 'bg-white text-black border-transparent shadow-[0_0_30px_rgba(255,255,255,0.35)] hover:bg-gray-100 hover:scale-102'
                   }`}
                 >
                   {isActive ? (
                     <span className="flex items-center gap-1.5"><Pause className="w-4 h-4 fill-current" /> Pause</span>
                   ) : (
                     <span className="flex items-center gap-1.5"><Play className="w-4 h-4 fill-current translate-x-0.5" /> Resume</span>
                   )}
                 </button>
               </div>

               {/* Right Side: Procedural Soundscape Control Slider Set */}
               <div className="w-px h-8 bg-white/10 hidden md:block" />

               <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 px-4 py-2 rounded-2xl w-full md:w-auto gap-4">
                 
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleSoundscapeChange(playbackSound === 'muted' ? 'rain' : 'muted')}
                      className={`p-1.5 rounded-lg border transition-all ${
                        playbackSound !== 'muted' 
                          ? 'bg-brand-purple/20 border-brand-purple/30 text-brand-purple shadow-sm' 
                          : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
                      }`}
                      title={playbackSound === 'muted' ? "Play soundscape" : "Mute Soundscapes"}
                    >
                      {playbackSound !== 'muted' ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>

                    <select
                      value={playbackSound}
                      onChange={(e) => handleSoundscapeChange(e.target.value as any)}
                      className="bg-transparent text-[11px] font-mono uppercase text-gray-300 border-none outline-none focus:ring-0 cursor-pointer pr-4"
                    >
                      <option value="muted" className="bg-neutral-950 font-sans text-xs">🔇 Generative Drone Off</option>
                      <option value="rain" className="bg-neutral-950 font-sans text-xs">🌧 Generative Binaural Rain</option>
                      <option value="brown" className="bg-neutral-950 font-sans text-xs">🟫 High Density Brown Noise</option>
                      <option value="cosmos" className="bg-neutral-950 font-sans text-xs">🌌 Solar Oscillation Drone</option>
                    </select>
                 </div>

                 {playbackSound !== 'muted' && (
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-gray-500" />
                      <input 
                        type="range"
                        min={0.05}
                        max={1.0}
                        step={0.05}
                        value={synthVol}
                        onChange={(e) => handleVolumeSlide(parseFloat(e.target.value))}
                        className="w-14 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-purple"
                      />
                      <span className="text-[8px] font-mono text-gray-500">{Math.round(synthVol * 100)}%</span>
                    </div>
                 )}

               </div>

            </div>
          </GlassCard>

          {/* Quick Tip Banner */}
          <div className="p-4 bg-brand-purple/5 border border-brand-purple/10 rounded-2xl flex items-start gap-3">
             <Sparkles className="w-5 h-5 text-brand-purple shrink-0 mt-0.5" />
             <p className="text-gray-400 text-xs leading-relaxed">
               <span className="text-brand-purple font-mono uppercase font-bold text-[9px] mr-1">[Study Tip]</span> 
               Each focus mode sets a unique ambient atmosphere to help you enter flow state. Alternating between study sessions and short breaks keeps your mind fresh.
             </p>
          </div>

        </div>

        {/* Right Side: Bento Focus Statistics and Session History (Cols 9-12) */}
        <div className="lg:col-span-4 space-y-8">
           
           {/* Focus Analytics Bento Board */}
           <GlassCard className="p-6 border-white/5 bg-white/[0.01]">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                 <h3 className="serif-title text-sm tracking-wide text-white uppercase flex items-center gap-1.5">
                   <Activity className="w-4 h-4 text-brand-purple" /> Focus Performance
                 </h3>
                 <span className="text-[9px] font-mono bg-white/5 border border-white/5 px-2 py-0.5 text-gray-400 rounded">METRICS</span>
              </div>

              {/* Bento Stat Figures */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                 
                 <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl text-center">
                    <span className="text-gray-500 text-[9px] font-mono block uppercase mb-1">Total Focused</span>
                    <h4 className="font-mono text-2xl text-white font-bold tracking-tight">
                      {formatHoursMinutes(aggregatedMinutes)}
                    </h4>
                 </div>

                 <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl text-center">
                    <span className="text-gray-500 text-[9px] font-mono block uppercase mb-1">Sessions Completed</span>
                    <h4 className="font-mono text-2xl text-indigo-400 font-bold tracking-tight">
                      {completedSessions.length}
                    </h4>
                 </div>

                 <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl text-center">
                    <span className="text-gray-500 text-[9px] font-mono block uppercase mb-1">Focus Efficiency</span>
                    <h4 className="font-mono text-2xl text-emerald-400 font-bold tracking-tight">
                      {completedSessions.length > 0 ? `${Math.round((completedSessions.length / (completedSessions.length + 0.3)) * 100)}%` : '0%'}
                    </h4>
                 </div>

                 <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl text-center">
                    <span className="text-gray-500 text-[9px] font-mono block uppercase mb-1">Preferred Mode</span>
                    <h4 className="font-mono text-xs text-brand-purple font-bold truncate tracking-tight py-2 uppercase">
                      {highestModeName}
                    </h4>
                 </div>

              </div>

              {/* Mode Completed Summary Checklist Ratio Bars */}
              <div className="space-y-3 pt-2">
                 <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">Mode completion stats</h4>
                 {FOCUS_MODES.map(mode => {
                    const completedCount = modeAggregation[mode.id] || 0;
                    return (
                      <div key={mode.id} className="space-y-1">
                         <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-400 font-mono capitalize">{mode.name}</span>
                            <span className="text-gray-500 font-mono font-bold bg-white/5 px-1.5 py-0.5 rounded text-[8px]">{completedCount} times</span>
                         </div>
                         <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (completedCount / Math.max(1, completedSessions.length)) * 100)}%` }}
                              className={`h-full bg-gradient-to-r ${mode.gradient}`}
                            />
                         </div>
                      </div>
                    );
                 })}
              </div>

           </GlassCard>

           {/* Session Compilation Timeline Logs */}
           <GlassCard className="p-6 border-white/5 bg-white/[0.01] flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                   <h3 className="serif-title text-sm tracking-wide text-white uppercase flex items-center gap-1.5">
                     <History className="w-4 h-4 text-indigo-400" /> Focus History Log
                   </h3>
                   <span className="text-[9px] font-mono bg-white/5 border border-white/5 px-2 py-0.5 text-indigo-400 rounded">TIMELINE</span>
                </div>

                {/* List Scroll */}
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                   {completedSessions.length === 0 ? (
                     <div className="text-center py-10 space-y-2">
                        <History className="w-8 h-8 text-gray-700 mx-auto animate-pulse" />
                        <p className="font-serif italic text-xs text-gray-500">No sessions recorded yet.</p>
                     </div>
                   ) : (
                     completedSessions.map(session => {
                        const targetModeConfig = FOCUS_MODES.find(m => m.id === session.modeId);
                        const displayDate = new Date(session.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                          <div 
                            key={session.id}
                            className="p-3 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between gap-2"
                          >
                             <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${targetModeConfig?.gradient || 'from-indigo-500 to-indigo-700'}`} />
                                <div>
                                   <h4 className="text-[11px] font-mono font-bold text-gray-250 uppercase">{session.modeName}</h4>
                                   <p className="text-[9px] text-gray-500 font-mono">Finished at {displayDate}</p>
                                </div>
                             </div>

                             <div className="text-right">
                                <span className="text-[10px] font-mono text-gray-300">+{Math.round(session.durationSeconds / 60)} min</span>
                             </div>
                          </div>
                        );
                     })
                   )}
                </div>
              </div>

              {completedSessions.length > 0 && (
                <button
                  onClick={clearSessionHistory}
                  className="w-full mt-4 py-2 border border-dashed border-rose-500/10 hover:border-rose-500/25 rounded-xl text-[10px] uppercase tracking-widest font-mono text-rose-450 hover:bg-rose-500/5 hover:text-rose-400 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Wipe History Cache
                </button>
              )}

           </GlassCard>

        </div>

      </div>

    </div>
  );
}

/* ==========================================================================
   AUXILIARY REACT COMPONENT: DOCUMENT TITLE SYNC COMPANION
   ========================================================================== */

function TabTitleSync({ remainingSecs, isActive, modeName }: { remainingSecs: number; isActive: boolean; modeName: string }) {
  useEffect(() => {
    const mins = Math.floor(remainingSecs / 60).toString().padStart(2, '0');
    const secs = (remainingSecs % 60).toString().padStart(2, '0');
    
    if (isActive) {
      document.title = `(${mins}:${secs}) ${modeName} | StudyVibe`;
    } else {
      document.title = `StudyVibe - Stay Focused`;
    }

    // Restore standard placeholder when component unmounts
    return () => {
      document.title = 'StudyVibe';
    };
  }, [remainingSecs, isActive, modeName]);

  return null;
}
