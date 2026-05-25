import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { 
  Clock, CheckCircle, Circle, Play, Pause, RotateCcw, 
  Sparkles, Music, Volume2, Calendar, TrendingUp, Cpu, 
  ArrowRight, Search, Activity, BookOpen, ChevronRight, CheckCircle2, 
  Cloud, CloudOff, Flame, Compass, FileText, ArrowUpRight, Zap, RefreshCw, Flag,
  GraduationCap, ChevronLeft, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from '@tanstack/react-router';
import { useMusic } from '@/context/MusicContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface Task {
  id: number;
  title: string;
  category: string;
  completed: boolean;
  time: string;
  priority?: 'High' | 'Medium' | 'Low';
}

const MOTIVATIONAL_QUOTES = [
  { text: "Late night effort builds extraordinary results.", author: "StudyOS" },
  { text: "The beautiful thing about learning is that nobody can take it away.", author: "B.B. King" },
  { text: "Focus is a muscle, and we build it by choosing what matters.", author: "Cal Newport" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" }
];

export function Dashboard() {
  const { user, guestUser } = useAuth();
  const currentUserId = user?.id || guestUser?.id || 'guest_default';
  const navigate = useNavigate();
  const { 
    isPlaying, 
    togglePlay, 
    currentTrack, 
    nextTrack, 
    prevTrack, 
    volume, 
    setVolume 
  } = useMusic();

  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [sessionName, setSessionName] = useState('LATE NIGHT SESSION');
  const [quoteIdx, setQuoteIdx] = useState(0);

  // Focus Stats matching user screenshot defaults
  const [focusHours] = useState(() => {
    const saved = localStorage.getItem(`studyvibe_stat_focus_hours_${currentUserId}`);
    const isGuest = currentUserId.startsWith('guest_') || currentUserId === 'guest_default';
    return saved !== null ? Number(saved) : (isGuest ? 32.4 : 0);
  });
  const [streakDays] = useState(() => {
    const saved = localStorage.getItem(`studyvibe_stat_streak_${currentUserId}`);
    const isGuest = currentUserId.startsWith('guest_') || currentUserId === 'guest_default';
    return saved !== null ? Number(saved) : (isGuest ? 14 : 0);
  });

  // Load and cycle quote index
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 12000);
    return () => clearInterval(quoteInterval);
  }, []);

  // Tasks list matching the screenshot items
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskPriority, setTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  // AI Assistant responses
  const [aiResponse, setAiResponse] = useState<string>(
    '\"Based on your recent notes on Wave-Particle Duality, I suggest reviewing the double-slit experiment data from 1927. Would you like a summary?\"'
  );
  const [aiTyping, setAiTyping] = useState(false);

  // Batch Momentum Data - computed from Batches or elegant default
  const momentumData = useMemo(() => {
    const saved = localStorage.getItem(`studyvibe_playlist_batches_${currentUserId}`);
    let completedCount = 2;
    if (saved) {
      try {
        const list = JSON.parse(saved);
        completedCount = list.reduce((acc: number, val: any) => {
          const lComps = val.lectures?.filter((l: any) => l.completed)?.length || 0;
          return acc + lComps;
        }, 0);
      } catch (e) {}
    }
    
    // Scale the 7-day study minutes curve
    const baseMinutes = [15, 30, 20, 45, 10, 25, 40];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const addedFactor = Math.min(60, completedCount * 12);
    
    return days.map((day, idx) => ({
      day,
      minutes: baseMinutes[idx] + (idx % 2 === 0 ? addedFactor : Math.round(addedFactor * 0.6))
    }));
  }, [currentUserId]);

  // Focus Heatmap Calendar state
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [focusGoals, setFocusGoals] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(`studyvibe_calendar_heatmap_${currentUserId}`);
    if (saved) return JSON.parse(saved);
    
    // Default seed data for elegant visualization
    const isGuest = currentUserId.startsWith('guest_') || currentUserId === 'guest_default';
    const defaults: Record<string, number> = {};
    if (isGuest) {
      const y = new Date().getFullYear();
      const m = new Date().getMonth();
      // seed first few weeks of the month with beautiful focus streaks
      for (let d = 1; d <= 23; d++) {
        if (d % 6 === 0) defaults[`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`] = 3; // stellar
        else if (d % 3 === 0) defaults[`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`] = 2; // deep
        else if (d % 5 === 0) defaults[`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`] = 0; // none
        else defaults[`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`] = 1; // light
      }
    }
    return defaults;
  });

  const saveFocusGoals = (updated: Record<string, number>) => {
    setFocusGoals(updated);
    localStorage.setItem(`studyvibe_calendar_heatmap_${currentUserId}`, JSON.stringify(updated));
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday,...
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const firstDayIndex = getFirstDayOfMonth(selectedYear, selectedMonth);

  // Month names for heading
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const handleDayClick = (dayNum: number) => {
    const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const currentVal = focusGoals[dateKey] || 0;
    const nextVal = (currentVal + 1) % 4; // Cycle through 0, 1, 2, 3
    const updated = { ...focusGoals, [dateKey]: nextVal };
    saveFocusGoals(updated);
  };

  // Set time date & reactive session name
  useEffect(() => {
    const updateTimeDate = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setCurrentDate(now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }));
      
      const hour = now.getHours();
      if (hour >= 23 || hour < 4) {
        setSessionName('LATE NIGHT SESSION');
      } else if (hour >= 4 && hour < 12) {
        setSessionName('EARLY BIRD SESSION');
      } else if (hour >= 12 && hour < 17) {
        setSessionName('MIDDAY CORE SESSION');
      } else {
        setSessionName('TWILIGHT DRILL SESSION');
      }
    };
    
    updateTimeDate();
    const timeInterval = setInterval(updateTimeDate, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // Sync tasks from local storage
  useEffect(() => {
    const storageKey = `studyvibe_tasks_${currentUserId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      const isGuest = currentUserId.startsWith('guest_') || currentUserId === 'guest_default';
      const defaultTasks: Task[] = isGuest ? [
        { id: 1, title: 'Review immunology slides', category: 'BIOLOGY', completed: false, time: '2:15 PM', priority: 'High' },
        { id: 2, title: 'Algebra problem set 4', category: 'MATH', completed: false, time: '4:30 PM', priority: 'Medium' },
        { id: 3, title: 'Read Ch. 12 – Modernism', category: 'ARCHITECTURE', completed: false, time: '6:15 PM', priority: 'Low' },
        { id: 4, title: 'Submit lab report', category: 'CHEMISTRY', completed: true, time: '11:15 AM', priority: 'High' }
      ] : [];
      setTasks(defaultTasks);
      localStorage.setItem(storageKey, JSON.stringify(defaultTasks));
    }
  }, [currentUserId]);

  const updateAndSaveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem(`studyvibe_tasks_${currentUserId}`, JSON.stringify(newTasks));
  };

  const toggleTaskCompletion = (id: number) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    updateAndSaveTasks(updated);
  };

  const deleteCustomTask = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = tasks.filter(t => t.id !== id);
    updateAndSaveTasks(filtered);
  };

  // Stats calculation
  const completedDynamicCount = tasks.filter(t => t.completed).length;
  const isGuestUserFlag = currentUserId.startsWith('guest_') || currentUserId === 'guest_default';
  const tasksDoneStat = (isGuestUserFlag ? 127 : 0) + completedDynamicCount; // 128 base from user screenshot
  const sessionsStat = (isGuestUserFlag ? 42 : 0) + Math.floor(completedDynamicCount * 0.5);

  const handleAskAI = () => {
    setAiTyping(true);
    const responses = [
      '\"Analysis completed: You retain information 24% faster when studying with nature acoustics playing. Ambient sounds optimized now.\"',
      '\"Excellent. E = hν. I\'ve loaded 5 sample questions matching your exam profile.\"',
      '\"Focus index remains at 98% efficiency. Let\'s practice architectural thesis principles next.\"'
    ];
    setTimeout(() => {
      const idx = Math.floor(Math.random() * responses.length);
      setAiResponse(responses[idx]);
      setAiTyping(false);
    }, 1200);
  };

  const getName = () => {
    if (user) return user.user_metadata?.full_name || 'Learner';
    if (guestUser) return guestUser.name || 'Learner';
    return 'Learner';
  };

  const getProfileInitials = () => {
    const name = getName();
    return name.substring(0, 1).toUpperCase();
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-700 relative overflow-x-hidden">
      
      {/* Minimalist Desk Bar - Hidden on mobile to prevent double upper bar structures */}
      <div className="hidden md:flex items-center justify-between py-4 border-b border-white/5">
        <div className="flex flex-col">
          <p className="font-mono text-[9px] text-[#888] uppercase tracking-[0.25em] font-semibold">STUDY WORKSPACE</p>
          <h2 className="text-lg font-serif text-white tracking-tight font-medium mt-0.5">
            Welcome, <span className="italic font-light text-brand-purple">{getName()}</span>
          </h2>
        </div>

        {/* Integrated Quick-Status Controls on Right */}
        <div className="flex items-center gap-4">
          <div 
            onClick={() => navigate({ to: '/focus' })}
            className="flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-brand-purple/20 hover:border-brand-purple/30 transition-all cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.1)]"
            title="Go to deep focus mode"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-pulse" />
            <span className="text-xs font-mono tracking-widest text-[#bbb] font-extrabold">POMODORO WORKFLOW</span>
            <ArrowRight className="w-3.5 h-3.5 text-brand-purple" />
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/5 bg-neutral-950/40 text-[10px] font-mono font-bold text-gray-400 tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            LIVE TIME: {currentTime || "CONNECTED"}
          </div>
        </div>
      </div>

      {/* Main split grid system on desktop, single stream flow on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        
        {/* LEFT COLUMN: Cinematic Quote, Navigation Actions, Stats Quad, Continue Working, Weekly and Milestones Tasks */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Hero Row: Quote Area + Batch Momentum Chart */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-0.5 text-left">
              <p className="font-mono text-[10px] uppercase text-gray-400 tracking-[0.25em] font-bold">{sessionName}</p>
              <h1 className="text-[36px] md:text-5xl font-serif text-white tracking-tight font-semibold leading-[1.15] py-2.5 select-none">
                Quiet hours.<br />
                <span className="italic font-light text-gray-400 font-serif">Deep focus.</span><br />
                Big dreams.
              </h1>
              <p className="font-serif italic text-gray-500 text-xs md:text-sm tracking-wide font-light max-w-xl pl-0.5">
                &ldquo;{MOTIVATIONAL_QUOTES[quoteIdx].text}&rdquo;
              </p>
            </div>
            
            {/* Batch Momentum Chart */}
            <div className="md:col-span-5 glass-panel glow-purple p-4.5 flex flex-col justify-between h-[170px] text-left">
              <div className="flex items-center justify-between pb-1 border-b border-white/[0.03]">
                <div>
                  <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-brand-purple font-bold">BATCH MOMENTUM</span>
                  <p className="text-[9px] font-serif text-gray-400 italic mt-0.5">My Batch 7-Day Performance</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#8b5cf6] font-bold bg-[#8b5cf6]/10 px-2 py-0.5 rounded cursor-pointer hover:bg-[#8b5cf6]/20 transition-colors" onClick={() => navigate({ to: '/batch' })} title="Go to batches playlist manager">
                    Active
                  </span>
                </div>
              </div>
              
              <div className="h-24 w-full pt-1.5">
                <ResponsiveContainer width="100%" height="100%" minHeight={96}>
                  <AreaChart data={momentumData} margin={{ top: 5, right: 5, left: -32, bottom: 0 }}>
                    <defs>
                      <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="day" 
                      stroke="#444" 
                      tick={{ fill: '#666', fontSize: 8, fontFamily: 'monospace' }} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#444" 
                      tick={{ fill: '#666', fontSize: 8, fontFamily: 'monospace' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#222', borderRadius: '8px', fontSize: '9px', fontFamily: 'monospace' }}
                      itemStyle={{ color: '#8b5cf6' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="minutes" 
                      stroke="#8b5cf6" 
                      strokeWidth={1.5}
                      fillOpacity={1} 
                      fill="url(#purpleGlow)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Pill Action Button Grid */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2 relative">
            <button 
              onClick={() => navigate({ to: '/focus' })}
              className="flex items-center gap-2 px-6 py-3 rounded-full border border-brand-purple/20 bg-brand-purple/10 hover:bg-brand-purple/20 text-white text-xs font-mono uppercase tracking-[0.14em] font-bold shadow-[0_0_15px_rgba(139,92,246,0.1)] hover:scale-102 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-white fill-white" /> Start Deep Work
            </button>

            <button 
              onClick={() => navigate({ to: '/tools' })}
              className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-mono uppercase tracking-[0.14em] font-normal hover:scale-102 transition-all cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" /> Teaching Tools
            </button>

            <button 
              onClick={() => navigate({ to: '/notes' })}
              className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-mono uppercase tracking-[0.14em] font-normal hover:scale-102 transition-all cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Library
            </button>

            <button 
              onClick={() => navigate({ to: '/tasks' })}
              className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-mono uppercase tracking-[0.14em] font-normal hover:scale-102 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Today's Tasks
            </button>

            {/* Direct Music page navigator */}
            <button 
              onClick={() => navigate({ to: '/music' })}
              className="w-10 h-10 rounded-full border border-white/10 bg-neutral-900/60 hover:border-brand-purple/50 flex items-center justify-center text-white active:scale-95 hover:scale-105 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.4)] cursor-pointer ml-auto md:ml-2"
              title="Go to Soundscape library"
            >
              <Music className={`w-4 h-4 ${isPlaying ? 'text-brand-purple animate-pulse' : 'text-gray-400'}`} />
            </button>
          </div>

          {/* Stats Quad Grid - styled like elegant rounded boxes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4.5 pt-4">
            
            <div className="glass-panel p-5.5 glow-indigo transition-all duration-300 hover:scale-[1.01]">
              <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest leading-none">Focus Hours</p>
              <h3 className="text-3xl font-mono font-medium text-white tracking-tight leading-none mt-3.5 flex items-baseline">
                {focusHours}
                <span className="text-[10px] font-sans font-normal text-gray-500 ml-1">hr</span>
              </h3>
            </div>

            <div className="glass-panel p-5.5 glow-purple transition-all duration-300 hover:scale-[1.01]">
              <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest leading-none">Current Streak</p>
              <h3 className="text-3xl font-mono font-medium text-white tracking-tight leading-none mt-3.5 flex items-baseline">
                {streakDays}
                <span className="text-[10px] font-sans font-normal text-gray-500 ml-1">days</span>
              </h3>
            </div>

            <div className="glass-panel p-5.5 glow-indigo transition-all duration-300 hover:scale-[1.01]">
              <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest leading-none">Tasks Done</p>
              <h3 className="text-3xl font-mono font-medium text-white tracking-tight leading-none mt-3.5 flex items-baseline">
                {tasksDoneStat}
              </h3>
            </div>

            <div className="glass-panel p-5.5 glow-purple transition-all duration-300 hover:scale-[1.01]">
              <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest leading-none">Sessions</p>
              <h3 className="text-3xl font-mono font-medium text-white tracking-tight leading-none mt-3.5 flex items-baseline">
                {sessionsStat}
              </h3>
            </div>

          </div>

          {/* Month-Level Focus Streak Heatmap & Up Next Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
            
            {/* MONTHLY FOCUS HEATMAP CALENDAR */}
            <div className="lg:col-span-7 p-6 glass-panel glow-purple flex flex-col justify-between min-h-[310px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-mono text-[9px] text-brand-purple uppercase tracking-[0.2em] font-bold">STREAK HEATMAP</p>
                    <h4 className="text-sm font-serif text-white font-semibold mt-1">
                      {MONTH_NAMES[selectedMonth]} {selectedYear}
                    </h4>
                  </div>
                  
                  {/* Calendar controller toggles */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (selectedMonth === 0) {
                          setSelectedMonth(11);
                          setSelectedYear(prev => prev - 1);
                        } else {
                          setSelectedMonth(prev => prev - 1);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-white/5 hover:border-white/10 hover:bg-neutral-900 text-gray-400 hover:text-white transition-all cursor-pointer"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        const now = new Date();
                        setSelectedYear(now.getFullYear());
                        setSelectedMonth(now.getMonth());
                      }}
                      className="px-2 py-1 text-[8px] font-mono uppercase tracking-wider text-gray-400 hover:text-brand-purple transition-all border border-white/5 rounded-lg cursor-pointer"
                      title="Current Month"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => {
                        if (selectedMonth === 11) {
                          setSelectedMonth(0);
                          setSelectedYear(prev => prev + 1);
                        } else {
                          setSelectedMonth(prev => prev + 1);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-white/5 hover:border-white/10 hover:bg-neutral-900 text-gray-400 hover:text-white transition-all cursor-pointer"
                      title="Next Month"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Day headers: S M T W T F S */}
                <div className="grid grid-cols-7 gap-1 text-center mb-2.5">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <span key={idx} className="text-[9px] font-mono text-gray-500 font-bold uppercase">{day}</span>
                  ))}
                </div>

                {/* Grid cells containing both empty offsets and active days */}
                <div className="grid grid-cols-7 gap-1.5">
                  {/* Empty cells before the 1st of the month */}
                  {Array.from({ length: firstDayIndex }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="aspect-square bg-transparent rounded-lg" />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const level = focusGoals[dateKey] || 0;
                    
                    // Style depends on level
                    let cellClass = "bg-[#0f0f0f] border-white/[0.03] text-gray-400 hover:border-brand-purple/40";
                    let glowStyle = {};
                    if (level === 1) {
                      cellClass = "bg-brand-purple/15 border-brand-purple/30 text-indigo-300 hover:bg-brand-purple/20";
                    } else if (level === 2) {
                      cellClass = "bg-brand-purple/45 border-brand-purple/60 text-white hover:bg-brand-purple/55";
                    } else if (level === 3) {
                      cellClass = "bg-gradient-to-br from-indigo-500 to-brand-purple border-indigo-400 text-white font-bold";
                      glowStyle = { boxShadow: '0 0 10px rgba(139, 92, 246, 0.4)' };
                    }

                    const isToday = new Date().getDate() === dayNum && 
                                    new Date().getMonth() === selectedMonth && 
                                    new Date().getFullYear() === selectedYear;

                    return (
                      <button
                        key={`day-${dayNum}`}
                        onClick={() => handleDayClick(dayNum)}
                        style={glowStyle}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] font-mono border transition-all cursor-pointer select-none active:scale-95 ${cellClass} ${
                          isToday ? "ring-1 ring-brand-purple ring-offset-1 ring-offset-black" : ""
                        }`}
                        title={`${dateKey}: Focus level ${level}`}
                      >
                        <span>{dayNum}</span>
                        {level > 0 && (
                          <span className="w-1 h-1 rounded-full bg-white mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Map/Legend at the bottom */}
                <div className="flex flex-wrap items-center justify-between mt-5 pt-3.5 border-t border-white/5 text-[9px] font-mono text-gray-500">
                  <span className="italic">Click days to record/cycle streak intensity</span>
                  <div className="flex items-center gap-1.5 mt-1 sm:mt-0">
                    <span>Legend:</span>
                    <div className="w-2.5 h-2.5 rounded bg-[#0f0f0f] border border-white/5" title="No focus session" />
                    <div className="w-2.5 h-2.5 rounded bg-brand-purple/15 border border-brand-purple/30" title="Light focus (1-2h)" />
                    <div className="w-2.5 h-2.5 rounded bg-brand-purple/45 border border-brand-purple/60" title="Deep focus (3-4h)" />
                    <div className="w-2.5 h-4.5 rounded bg-gradient-to-br from-indigo-500 to-brand-purple border-indigo-400 shadow-md" title="Stellar focus (5h+)" />
                  </div>
                </div>

              </div>
            </div>

            {/* UP NEXT INTERACTIVE FEED */}
            <div className="lg:col-span-5 p-6 glass-panel glow-indigo flex flex-col justify-between min-h-[310px]">
              <div>
                <p className="font-mono text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-4">Up Next</p>
                
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                  {tasks.filter(t => !t.completed).map((task) => (
                    <div 
                      key={task.id}
                      onClick={() => toggleTaskCompletion(task.id)}
                      className="flex items-start gap-3 cursor-pointer group py-0.5"
                    >
                      <div className="w-5 h-5 rounded-full border border-gray-600 hover:border-brand-purple flex items-center justify-center shrink-0 transition-colors mt-0.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-transparent group-hover:bg-brand-purple/20 transition-all" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-serif text-white group-hover:text-brand-purple transition-colors truncate">
                          {task.title}
                        </p>
                        <p className="text-[9px] font-mono tracking-wider text-gray-500 uppercase mt-0.5 flex items-center gap-2">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                            task.priority === 'High' ? 'bg-rose-500' :
                            task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-400'
                          }`} />
                          <span>{task.priority || 'Medium'} priority • {task.category}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {tasks.filter(t => !t.completed).length === 0 && (
                    <p className="text-xs text-gray-500 italic py-4">No pending milestone tasks.</p>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: AI Study Guide, Soundscape controller, Task compiler */}
        <div className="lg:col-span-4 space-y-6">

          {/* AI Teaching assistant */}
          <GlassCard className="p-6 flex flex-col justify-between relative overflow-hidden min-h-[300px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-purple/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-purple" />
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#aaa] font-bold">AI Study Assistant</span>
                 </div>
                 <span className="text-[8px] font-mono text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded">Online</span>
              </div>
              
              <div className="bg-black/35 border border-white/5 rounded-2xl p-4.5 text-xs leading-relaxed italic text-gray-300 relative min-h-[110px] flex items-center">
                <AnimatePresence mode="wait">
                  {aiTyping ? (
                    <motion.div 
                      key="typing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5 py-4 w-full justify-center"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-bounce" style={{ animationDelay: '300ms' }} />
                    </motion.div>
                  ) : (
                    <motion.p
                      key="sentence"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.95 }}
                      exit={{ opacity: 0 }}
                      className="text-left font-serif leading-relaxed text-gray-300"
                    >
                      {aiResponse}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-2.5 mt-6">
               <button 
                onClick={handleAskAI}
                disabled={aiTyping}
                className="w-full py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:border-brand-purple/50 text-[10px] font-mono font-bold uppercase tracking-widest text-white transition-all disabled:opacity-50 cursor-pointer"
              >
                Ask StudyVibe AI
              </button>
              
              <p className="text-[9px] text-gray-500 font-mono text-center">Synthesizing real-time logs & notes context</p>
            </div>
          </GlassCard>

          {/* Dynamic Task compiler */}
          <GlassCard className="p-6">
            <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-4 text-left">Task Register Engine</p>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                 <input 
                   type="text" 
                   id="newTaskInput"
                   placeholder="Add critical track segment..."
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                       const val = e.currentTarget.value.trim();
                       if (val) {
                         const next = [...tasks, { id: Date.now(), title: val, category: 'GENERAL', completed: false, time: 'Pending', priority: taskPriority }];
                         updateAndSaveTasks(next);
                         e.currentTarget.value = '';
                       }
                     }
                   }}
                   className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-purple/50 transition-all font-sans"
                 />
                 <button 
                   onClick={() => {
                     const el = document.getElementById('newTaskInput') as HTMLInputElement;
                     const val = el?.value.trim();
                     if (val) {
                       const next = [...tasks, { id: Date.now(), title: val, category: 'GENERAL', completed: false, time: 'Pending', priority: taskPriority }];
                       updateAndSaveTasks(next);
                       el.value = '';
                     }
                   }}
                   className="p-3 bg-brand-purple/15 text-brand-purple border border-brand-purple/20 rounded-xl hover:bg-brand-purple hover:text-white transition-all cursor-pointer shrink-0"
                 >
                   <ArrowRight className="w-4 h-4" />
                 </button>
              </div>

              {/* Priority select */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Weight:</span>
                <div className="flex gap-1.5">
                  {(['High', 'Medium', 'Low'] as const).map((p) => {
                    const activeStyle = p === 'High' ? 'bg-rose-500/25 border-rose-500/50 text-rose-400' :
                                       p === 'Medium' ? 'bg-amber-500/25 border-amber-500/50 text-amber-400' :
                                       'bg-blue-500/25 border-blue-500/50 text-blue-400';
                    return (
                      <button
                        key={p}
                        onClick={() => setTaskPriority(p)}
                        className={`px-3 py-1 rounded-lg border text-[9px] font-mono uppercase tracking-widest transition-all cursor-pointer ${
                          taskPriority === p ? activeStyle : 'bg-white/5 border-transparent text-gray-500 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Soundscape controls inside a gorgeous premium slate card */}
          <GlassCard className="p-6 flex flex-col justify-between relative overflow-hidden min-h-[200px]">
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#aaa]">Built-In Soundscape</span>
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full bg-brand-purple ${isPlaying ? 'animate-ping' : ''}`} />
                <span className="text-[9px] font-mono text-gray-400 uppercase">{isPlaying ? 'active' : 'idle'}</span>
              </span>
            </div>

            <div className="py-4">
              <h4 className="text-base font-serif italic text-white leading-tight truncate">
                {currentTrack?.title || "Quiet Ambient Wind"}
              </h4>
              <p className="text-[10px] font-mono text-gray-500 lowercase mt-1 truncate">
                {currentTrack?.artist || "natural atmospheric synth"}
              </p>
            </div>

            <div className="pt-2 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                {/* Volume bar or info */}
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500">
                  <Volume2 className="w-3.5 h-3.5 text-brand-purple" />
                  <span>Vol: {volume}%</span>
                </div>
                
                {/* Controller Buttons */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={prevTrack}
                    className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Previous Ambient Preset"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  
                  <button 
                    onClick={togglePlay}
                    className="w-8 h-8 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-md cursor-pointer font-bold"
                  >
                    {isPlaying ? <Pause className="w-3 h-3 fill-black text-black" /> : <Play className="w-3 h-3 fill-black text-black translate-x-0.5" />}
                  </button>

                  <button 
                    onClick={nextTrack}
                    className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Next Ambient Preset"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Incremental volume control */}
              <input 
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-purple"
              />
            </div>
          </GlassCard>

        </div>

      </div>

    </div>
  );
}
