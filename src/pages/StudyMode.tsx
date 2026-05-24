import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Maximize2, Minimize2, Sparkles, Image, Volume2, VolumeX, Flame, ChevronLeft, 
  ChevronRight, Compass, Shield, Clock, BookOpen, Quote, HelpCircle, ArrowLeft,
  RotateCcw, RefreshCw, Upload, Heart, Info, Sun, Eye, Play, Pause, Smartphone, Check
} from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from '@tanstack/react-router';

// Categories of rotating quotes
interface QuoteItem {
  text: string;
  author: string;
  category: 'motivational' | 'calm' | 'discipline' | 'exam' | 'focus';
}

const CINEMATIC_QUOTES: QuoteItem[] = [
  // Focus
  { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell", category: "focus" },
  { text: "My experience is that as soon as people are old enough to have a choice, they choose what they want to do, and then do it.", author: "Richard Feynman", category: "focus" },
  { text: "Deep work is the ability to focus without distraction on a cognitively demanding task.", author: "Cal Newport", category: "focus" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee", category: "focus" },
  
  // Discipline
  { text: "We must all suffer one of two things: the pain of discipline or the pain of regret or disappointment.", author: "Jim Rohn", category: "discipline" },
  { text: "He who has a why to live for can bear almost any how.", author: "Friedrich Nietzsche", category: "discipline" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "John Cross", category: "discipline" },
  { text: "Self-discipline is when your conscience tells you to do something and you don't talk back.", author: "W.K. Hope", category: "discipline" },
  
  // Calm
  { text: "Nowhere can man find a quieter or more untroubled retreat than in his own soul.", author: "Marcus Aurelius", category: "calm" },
  { text: "Calmness is the cradle of power.", author: "Josiah Gilbert Holland", category: "calm" },
  { text: "Within you, there is a stillness and a sanctuary to which you can retreat at any time.", author: "Hermann Hesse", category: "calm" },
  { text: "The nearer a man comes to a calm mind, the closer he is to strength.", author: "Marcus Aurelius", category: "calm" },

  // Exams / Academic
  { text: "True learning is not the capability to memorize, but the absolute willingness to explore the uncharted.", author: "Noble Scholar", category: "exam" },
  { text: "There are no secrets to success. It is the result of preparation, hard work, and learning from failure.", author: "Colin Powell", category: "exam" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King", category: "exam" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin", category: "exam" },

  // Motivational
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela", category: "motivational" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain", category: "motivational" },
  { text: "Your talent determines what you can do. Your motivation determines how much you are willing to do.", author: "Lou Holtz", category: "motivational" },
  { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi", category: "motivational" }
];

interface StudyWallpaper {
  id: string;
  name: string;
  url: string;
  credit: string;
  vibe: string;
}

const STUDY_WALLPAPERS: StudyWallpaper[] = [
  {
    id: 'rain-cabin',
    name: 'Cozy Rain Cabin',
    url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1920&q=80',
    credit: 'Unsplash Rain Cabin Vibe',
    vibe: 'Melancholic storm pattering on window pane pane'
  },
  {
    id: 'cyberpunk-alley',
    name: 'Neo Tokyo Alley',
    url: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=1920&q=80',
    credit: 'Vivid Cyber Rainscape',
    vibe: 'Holograms glowing through thick night fog'
  },
  {
    id: 'nordic-forest',
    name: 'Nordic Forest Mist',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80',
    credit: 'Misty Alpine Wilderness',
    vibe: 'Whispering pines surrounded by cold mountain dew'
  },
  {
    id: 'astral-void',
    name: 'Astral Observation Port',
    url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1920&q=80',
    credit: 'Void Deep Space Cabin',
    vibe: 'Constellations revolving silently behind observation glass'
  },
  {
    id: 'fireside-lounge',
    name: 'Crackling Hearth Lounge',
    url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1920&q=80',
    credit: 'Fireside Library Snug',
    vibe: 'Warm amber ember sparks floating above old mahogany tables'
  },
  {
    id: 'coffee-steam',
    name: 'Greenhouse Café Studio',
    url: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=1920&q=80',
    credit: 'Greenhouse Steam Conservatory',
    vibe: 'Cozy coffee mugs brewing under misty glass biodomes'
  }
];

export function StudyMode() {
  const { currentThemeSpec } = useSettings();
  const { guestUser, user } = useAuth();
  const navigate = useNavigate();

  // Fullscreen tracking state
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Custom Study wallpaper state (persisted as studyvibe_cinematic_study_wallpaper)
  const [activeWallId, setActiveWallId] = useState(() => {
    return localStorage.getItem('studyvibe_cinematic_study_active_wall_id') || 'rain-cabin';
  });
  
  const [customWallUrl, setCustomWallUrl] = useState(() => {
    return localStorage.getItem('studyvibe_cinematic_study_custom_url') || '';
  });

  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Rotating Quotes state (Forced to mixed mode as requested)
  const selectedQuoteCategory = 'all';
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [autoRotateQuotes, setAutoRotateQuotes] = useState(true);

  // Focus Countdown Mode state (All 6 core modes matching Focus.tsx)
  const [selectedModeId, setSelectedModeId] = useState<'pomodoro' | 'deep_work' | 'quick_focus' | 'long_sprint' | 'short_break' | 'long_break'>('pomodoro');
  
  const FOCUS_MODES_LIST = useMemo(() => [
    { id: 'pomodoro', name: 'Pomodoro', duration: 25 * 60, colorClass: 'text-indigo-400' },
    { id: 'deep_work', name: 'Deep Work', duration: 50 * 60, colorClass: 'text-amber-450' },
    { id: 'quick_focus', name: 'Quick Focus', duration: 15 * 60, colorClass: 'text-cyan-400' },
    { id: 'long_sprint', name: 'Long Sprint', duration: 90 * 60, colorClass: 'text-emerald-400' },
    { id: 'short_break', name: 'Short Break', duration: 5 * 60, colorClass: 'text-pink-400' },
    { id: 'long_break', name: 'Long Break', duration: 15 * 60, colorClass: 'text-fuchsia-400' }
  ], []);

  const selectedMode = useMemo(() => {
    return FOCUS_MODES_LIST.find(m => m.id === selectedModeId) || FOCUS_MODES_LIST[0];
  }, [selectedModeId, FOCUS_MODES_LIST]);

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);

  // Bottom drawer gallery tracker
  const [showConfigPanel, setShowConfigPanel] = useState(true);

  // Mobile orientation warning prompt state trigger on mount
  const [mobileOrientWarning, setMobileOrientWarning] = useState(false);

  // File uploader elements
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch the active user's key for the dynamic analytics sync
  const currentUserId = user?.id || guestUser?.id || 'guest_default';
  const logsKey = `studyvibe_focus_sessions_logs_${currentUserId}`;

  // Filter quotes based on selected category (strictly mixed)
  const filteredQuotes = useMemo(() => {
    return CINEMATIC_QUOTES;
  }, []);

  // Handle slide rotation for quotes
  useEffect(() => {
    setCurrentQuoteIndex(0);
  }, [selectedQuoteCategory]);

  useEffect(() => {
    if (!autoRotateQuotes || filteredQuotes.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentQuoteIndex(prev => (prev + 1) % filteredQuotes.length);
    }, 15000); // rotate every 15s for cozy pacing
    return () => clearInterval(interval);
  }, [autoRotateQuotes, filteredQuotes]);

  // Update clock
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Synchronize timer with Focus.tsx in real-time
  useEffect(() => {
    const syncFromStorage = () => {
      const savedMode = localStorage.getItem('studyvibe_focus_active_mode');
      const savedTimeLeftStr = localStorage.getItem('studyvibe_focus_time_left');
      const savedIsActive = localStorage.getItem('studyvibe_focus_is_active') === 'true';
      const savedTimestampStr = localStorage.getItem('studyvibe_focus_saved_timestamp');

      if (savedMode && FOCUS_MODES_LIST.some(m => m.id === savedMode)) {
        setSelectedModeId(savedMode as any);
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
              setIsTimerRunning(remainingVal > 0 ? savedIsActive : false);
              return;
            }
          }
          setTimeLeft(parsedTimeLeft);
          setIsTimerRunning(false);
        }
      }
    };

    syncFromStorage();
    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('focus', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('focus', syncFromStorage);
    };
  }, [FOCUS_MODES_LIST]);

  // Save changes block persistently to local storage on timer ticks & status adjustments
  useEffect(() => {
    localStorage.setItem('studyvibe_focus_active_mode', selectedModeId);
    localStorage.setItem('studyvibe_focus_time_left', timeLeft.toString());
    localStorage.setItem('studyvibe_focus_is_active', isTimerRunning.toString());
    localStorage.setItem('studyvibe_focus_saved_timestamp', Date.now().toString());
  }, [selectedModeId, timeLeft, isTimerRunning]);

  // Update study Session countdown duration
  useEffect(() => {
    let focusTimer: any = null;
    if (isTimerRunning && timeLeft > 0) {
      focusTimer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(focusTimer);
            setIsTimerRunning(false);
            
            // Log completed session to user history so that it shows on analytics page!
            try {
              const freshLog = {
                id: `session_live_${Date.now()}`,
                modeId: selectedMode.id,
                modeName: selectedMode.name,
                durationSeconds: selectedMode.duration,
                completedAt: new Date().toISOString()
              };
              const focusLogs = localStorage.getItem(logsKey);
              const currentLogs = focusLogs ? JSON.parse(focusLogs) : [];
              const nextLogs = [freshLog, ...currentLogs];
              localStorage.setItem(logsKey, JSON.stringify(nextLogs));
            } catch (err) {
              console.error(err);
            }
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(focusTimer);
  }, [isTimerRunning, timeLeft, selectedMode, logsKey]);

  // Orientation detector for cinematic mobile landscape guidance
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth < 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      // Trigger warning if phone is vertically oriented
      if (isMobile && isPortrait) {
        setMobileOrientWarning(true);
      } else {
        setMobileOrientWarning(false);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Fullscreen trigger handles
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Fullscreen request failed", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Fullscreen keyboard/escape listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Wallpaper change handler
  const handleSelectWallpaper = (id: string) => {
    setActiveWallId(id);
    localStorage.setItem('studyvibe_cinematic_study_active_wall_id', id);
    if (id !== 'custom') {
      setCustomWallUrl('');
      localStorage.removeItem('studyvibe_cinematic_study_custom_url');
    }
  };

  // Custom study mode wallpaper local computer upload
  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert("Study limits background cache files to 2MB to ensure responsive UI performance!");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCustomWallUrl(reader.result);
          setActiveWallId('custom');
          localStorage.setItem('studyvibe_cinematic_study_active_wall_id', 'custom');
          localStorage.setItem('studyvibe_cinematic_study_custom_url', reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getActiveWallpaperUrl = () => {
    if (activeWallId === 'custom' && customWallUrl) {
      return customWallUrl;
    }
    const standard = STUDY_WALLPAPERS.find(w => w.id === activeWallId);
    return standard ? standard.url : STUDY_WALLPAPERS[0].url;
  };

  // Human readable countdown formatting (MM:SS)
  const formatCountdown = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Interactive slide manual controls
  const prevQuote = () => {
    if (filteredQuotes.length <= 1) return;
    setCurrentQuoteIndex(prev => (prev - 1 + filteredQuotes.length) % filteredQuotes.length);
  };

  const nextQuote = () => {
    if (filteredQuotes.length <= 1) return;
    setCurrentQuoteIndex(prev => (prev + 1) % filteredQuotes.length);
  };

  const activeIndex = currentQuoteIndex >= filteredQuotes.length ? 0 : currentQuoteIndex;
  const currentQuote = filteredQuotes[activeIndex] || CINEMATIC_QUOTES[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950 flex flex-col justify-between text-white font-sans">
      
      {/* 1. Dynamic Scenic Immersive Wallpaper Under layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-[1500ms] scale-102 filter brightness-[0.25] saturate-[0.8] blur-[2px] z-0 pointer-events-none"
        style={{ backgroundImage: `url(${getActiveWallpaperUrl()})` }}
      />

      {/* 2. Cozy cinematic particle dusting overlays (looping abstract elements) */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,rgba(0,0,0,0)_20%,rgba(0,0,0,0.85)_100%] mix-blend-multiply z-[1] pointer-events-none" />
      
      <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
        {/* Soft simulated breathing light ripples mimicking particle embers */}
        <div className="absolute top-[20%] left-[30%] w-[12vw] h-[12vw] rounded-full bg-orange-500/5 blur-[80px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[25%] right-[20%] w-[15vw] h-[15vw] rounded-full bg-amber-500/5 blur-[90px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[40%] right-[40%] w-[10vw] h-[10vw] rounded-full bg-indigo-500/5 blur-[70px] animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      {/* 3. Mobile Landscape rotation prompt guidance */}
      <AnimatePresence>
        {mobileOrientWarning && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-3xl z-50 flex flex-col items-center justify-center p-8 text-center"
          >
            <Smartphone className="w-16 h-16 text-indigo-400 rotate-90 animate-bounce mb-6" />
            <h2 className="text-xl font-serif text-white italic mb-2">Cinematic Rotation Hint</h2>
            <p className="text-gray-400 text-xs max-w-sm leading-relaxed mb-6">
              StudyVibe Immersive Mode feels like a premium desktop browser operating environment when rotated in <b>landscape viewport mode</b>. Please rotate your mobile device sideways.
            </p>
            <button 
              onClick={() => setMobileOrientWarning(false)}
              className="px-5 py-2.5 bg-indigo-600 border border-transparent rounded-full font-mono text-[10px] uppercase font-bold tracking-widest cursor-pointer"
            >
              Acknowledge Sandbox
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          HEADER OVERLAY (Z-INDEX 10)
          ========================================== */}
      <header className="relative z-10 p-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent pointer-events-auto">
        <div className="flex items-center gap-4">
          <Link 
            to="/focus"
            className="p-2.5 rounded-full border border-white/10 bg-black/20 hover:bg-white/10 hover:border-white/20 transition-all text-gray-300"
            title="Leave Cinematic Aura"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#a78bfa] font-bold uppercase flex items-center gap-1.5 leading-none">
              <Sparkles className="w-3 h-3 text-amber-400" /> StudyVibe Cinema Operating System
            </span>
            <h1 className="text-xl text-white font-serif italic tracking-wide mt-1.5 leading-tight">
              {guestUser ? `${guestUser.name}'s Immersive Sanctuary` : `The Immersive Sanctuary`}
            </h1>
          </div>
        </div>

        {/* Dynamic Digital Clock */}
        <div className="flex items-center gap-4 bg-black/30 border border-white/5 backdrop-blur-xl px-5 py-2 rounded-2xl">
          <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="text-right font-mono">
            <p className="text-sm font-semibold tracking-wider text-white leading-none">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-0.5 leading-none">
              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </header>

      {/* ==========================================
          CENTER AREA: SEVERE DYNAMICS & QUOTE BLOCK
          ========================================== */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-6 text-center select-none">
        
        {/* Core Screen Layout: Timer on top, Quote on bottom */}
        <div className="max-w-2xl w-full space-y-8">
          
          {/* Subtle Session Clock Countdown Timer */}
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <p className="text-[9px] font-mono text-gray-400 tracking-widest uppercase mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              SANCTUARY FOCUS COUNTDOWN ({selectedMode.name})
            </p>
            
            <div className="font-mono text-6xl md:text-7xl font-light tracking-widest text-white drop-shadow-[0_2px_15px_rgba(0,0,0,0.6)] flex items-center gap-1.5">
              {formatCountdown(timeLeft)}
            </div>

            {/* Seamless Focus Modes selector bar */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 bg-black/40 p-1.5 rounded-full border border-white/5 backdrop-blur-md max-w-lg mt-4.5 shadow-xl">
              {FOCUS_MODES_LIST.map((mode) => {
                const isCur = mode.id === selectedModeId;
                return (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setIsTimerRunning(false);
                      setSelectedModeId(mode.id as any);
                      setTimeLeft(mode.duration);
                    }}
                    className={`px-3 py-1.5 rounded-full text-[9px] font-mono uppercase font-bold tracking-wider transition-all cursor-pointer ${
                      isCur
                        ? 'bg-indigo-600/90 text-white shadow-lg border border-indigo-500/30'
                        : 'text-gray-450 hover:text-gray-300'
                    }`}
                  >
                    {mode.name}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`px-5 py-2 rounded-full border text-[10px] font-mono font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                  isTimerRunning 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                    : 'bg-indigo-500/20 border-indigo-500/30 text-white hover:bg-indigo-500/30'
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-3 h-3 text-rose-400" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-indigo-400" /> Start
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimeLeft(selectedMode.duration);
                }}
                className="px-4 py-2 rounded-full border border-white/5 bg-black/20 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-[10px] font-mono uppercase tracking-widest cursor-pointer shadow-sm"
                title="Reset active mode"
              >
                <RotateCcw className="w-3" />
              </button>
            </div>
          </motion.div>
 
          {/* Majestic Animated Quote Box with Category presets (Unboxed for screensaver ambient clean-edge feel) */}
          <div className="relative overflow-hidden py-4 px-6 group flex flex-col justify-center items-center">
            
            {/* Elegant upper quote glyph */}
            <Quote className="w-5 h-5 text-indigo-400 opacity-25 mx-auto mb-2" />

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuote.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-2 max-w-lg text-center"
              >
                <p className="text-xs md:text-sm text-stone-300 font-serif leading-relaxed tracking-wide italic">
                  “{currentQuote.text}”
                </p>
                <p className="font-mono text-[9px] text-[#cbcae2] uppercase tracking-widest bg-black/20 border border-white/5 px-2 py-0.5 rounded inline-block">
                  — {currentQuote.author}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Slider back/forward navigators */}
            {filteredQuotes.length > 1 && (
              <div className="flex justify-between items-center gap-4 mt-5 max-w-xs mx-auto">
                <button 
                  onClick={prevQuote}
                  className="p-1.5 rounded-lg border border-white/5 bg-black/30 hover:bg-neutral-900/40 text-gray-400 hover:text-white transition-all cursor-pointer"
                  title="Previous quote"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[8.5px] font-mono text-gray-400 uppercase tracking-widest min-w-[80px] text-center">
                  Quote {currentQuoteIndex + 1} / {filteredQuotes.length}
                </span>
                <button 
                  onClick={nextQuote}
                  className="p-1.5 rounded-lg border border-white/5 bg-black/30 hover:bg-neutral-900/40 text-gray-400 hover:text-white transition-all cursor-pointer"
                  title="Next quote"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* ==========================================
          BOTTOM GALLERY CONTROL RAIL (Z-INDEX 20)
          ========================================== */}
      <footer className="relative z-20 pointer-events-auto p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent flex flex-col gap-4">
        
        {/* Toggle gallery header button */}
        <div className="flex justify-between items-center border-b border-white/15 pb-3">
          <button 
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className="text-[10px] font-mono text-indigo-400 hover:text-white uppercase tracking-widest flex items-center gap-2 group cursor-pointer"
          >
            <Image className="w-4 h-4 text-indigo-400" />
            <span>Study Sanctuary Wallpaper Hub</span>
            <ChevronRight className={`w-3.5 h-3.5 transform transition-transform duration-300 ${showConfigPanel ? 'rotate-90' : ''}`} />
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setAutoRotateQuotes(prev => !prev)}
              className={`px-3 py-1 bg-black/40 border rounded-full text-[8.5px] font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
                autoRotateQuotes ? 'text-indigo-450 border-indigo-500/20' : 'text-gray-500 border-white/5'
              }`}
            >
              <RefreshCw className={`w-2.5 h-2.5 ${autoRotateQuotes ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} /> Quote Looper: {autoRotateQuotes ? 'Enabled' : 'Paused'}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-full border border-white/10 bg-black/40 hover:bg-white/15 text-gray-300 cursor-pointer"
              title={isFullscreen ? "Exit Wide Mode" : "Expand Full Screen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Cinematic Wallpapers Tray Carousel */}
        <AnimatePresence>
          {showConfigPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden flex flex-col gap-4"
            >
              {/* Carousel cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4.5 pt-1">
                
                {STUDY_WALLPAPERS.map((wall) => {
                  const isCurrent = activeWallId === wall.id;
                  
                  return (
                    <button
                      key={wall.id}
                      onClick={() => handleSelectWallpaper(wall.id)}
                      className={`group relative text-left border rounded-2xl h-20 p-2.5 outline-none transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                        isCurrent 
                          ? 'border-indigo-500 bg-white/[0.03] ring-1 ring-indigo-500/30'
                          : 'border-white/10 hover:border-white/20 bg-black/30'
                      }`}
                    >
                      {/* Image Preview backdrop card */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity z-0 pointer-events-none"
                        style={{ backgroundImage: `url(${wall.url})` }}
                      />

                      <div className="relative z-10 w-full flex justify-between items-start">
                        <span className="text-[8px] font-mono text-indigo-400 bg-black/30 border border-white/5 py-0.5 px-1.5 rounded uppercase leading-none">
                          PRESET
                        </span>
                        {isCurrent && (
                          <span className="p-0.5 rounded-full bg-indigo-500 text-white block">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      <div className="relative z-10">
                        <h4 className="text-[10px] font-semibold text-white block truncate leading-tight">{wall.name}</h4>
                        <p className="text-[7.5px] text-gray-500 truncate block mt-0.5">{wall.vibe}</p>
                      </div>
                    </button>
                  );
                })}

                {/* Custom upload card slot */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative text-left border rounded-2xl h-20 p-2.5 transition-all outline-none cursor-pointer flex flex-col justify-between overflow-hidden ${
                    activeWallId === 'custom' 
                      ? 'border-indigo-500 bg-white/[0.03] ring-1 ring-indigo-500/30'
                      : 'border-dashed border-white/10 hover:border-white/20 bg-black/20 hover:bg-black/40'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleCustomUpload}
                    accept="image/*"
                    className="hidden" 
                  />

                  {customWallUrl ? (
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-25 group-hover:opacity-35 transition-opacity pointer-events-none"
                      style={{ backgroundImage: `url(${customWallUrl})` }}
                    />
                  ) : null}

                  <div className="relative z-10 w-full flex justify-between items-start">
                    <span className="text-[8px] font-mono text-amber-500 bg-black/30 border border-white/5 py-0.5 px-1.5 rounded uppercase leading-none font-bold">
                      CUSTOM
                    </span>
                    {activeWallId === 'custom' && (
                      <span className="p-0.5 rounded-full bg-indigo-500 text-white block">
                        <Check className="w-2.5 h-2.5 animate-pulse" />
                      </span>
                    )}
                  </div>

                  <div className="relative z-10 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-[10px] font-semibold text-stone-300 block truncate leading-none">Upload Image</h4>
                      <p className="text-[8px] text-gray-500 truncate block mt-0.5">Locals limit 2MB</p>
                    </div>
                  </div>
                </button>

              </div>

              {/* Paste Wallpaper image URL option (strictly local to cinematic study mode layout only!) */}
              <div className="flex flex-col md:flex-row gap-3 items-center border border-white/5 bg-black/50 backdrop-blur-xl p-3.5 rounded-2xl mt-2">
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest leading-none">Paste Ambient Wallpaper URL:</span>
                <div className="flex-1 w-full flex gap-2">
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={activeWallId === 'custom' ? customWallUrl : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        setCustomWallUrl(val);
                        setActiveWallId('custom');
                        localStorage.setItem('studyvibe_cinematic_study_active_wall_id', 'custom');
                        localStorage.setItem('studyvibe_cinematic_study_custom_url', val);
                      }
                    }}
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-250 italic focus:outline-none focus:border-indigo-500/50 font-mono"
                  />
                  {customWallUrl && (
                    <button
                      onClick={() => {
                        setActiveWallId('rain-cabin');
                        setCustomWallUrl('');
                        localStorage.removeItem('studyvibe_cinematic_study_custom_url');
                        localStorage.setItem('studyvibe_cinematic_study_active_wall_id', 'rain-cabin');
                      }}
                      className="px-3 py-1.5 border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-[10px] font-mono uppercase tracking-widest cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <span className="text-[8px] font-mono text-indigo-400 hidden md:inline">Applied strictly as background to Cinematic Study Mode view only!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </footer>

    </div>
  );
}
export default StudyMode;
