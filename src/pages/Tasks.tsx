import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '@/components/GlassCard';
import { GlowButton } from '@/components/GlowButton';
import { useAuth } from '@/context/AuthContext';
import { 
  CheckCircle, Circle, Trash2, Plus, Calendar, Star, Tag, AlertCircle,
  Flag, Search, Filter, RefreshCw, Sparkles, Check, CheckCircle2,
  Bookmark, Layout, Clock, Grid, ListTodo, Clipboard, HelpCircle
} from 'lucide-react';

interface Task {
  id: number;
  title: string;
  category: string;
  completed: boolean;
  time: string;
  priority?: 'High' | 'Medium' | 'Low';
}

const DEFAULT_CATEGORIES = [
  { name: 'Research', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20 glow-violet' },
  { name: 'Academics', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 glow-emerald' },
  { name: 'Synthetics', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 glow-cyan' },
  { name: 'Philosophy', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20 glow-amber' },
  { name: 'Optional', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20 glow-blue' }
];

export function Tasks() {
  const { user, guestUser } = useAuth();
  const currentUserId = user?.id || guestUser?.id || 'guest_default';
  const storageKey = `studyvibe_tasks_${currentUserId}`;

  // Core task list state
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Form input states
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Research');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCatInput, setShowCustomCatInput] = useState(false);

  // Filters and search states
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'time' | 'alphabetical'>('priority');

  // Loading tasks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing tasks list', e);
      }
    } else {
      const isGuest = currentUserId.startsWith('guest_') || currentUserId === 'guest_default';
      // Seed default dashboard compatibility tasks if guest, otherwise start blank
      const defaultTasks: Task[] = isGuest ? [
        { id: 1, title: 'Derive Schrödinger Equation', category: 'High Priority', completed: false, time: '02:00 PM', priority: 'High' },
        { id: 2, title: 'Review Heisenberg Principles', category: 'Completed', completed: true, time: '01:15 PM', priority: 'Medium' },
        { id: 3, title: 'Prepare Lab Report Draft', category: 'Upcoming', completed: false, time: '04:30 PM', priority: 'Medium' },
        { id: 4, title: 'Relativity Math exercises', category: 'Optional', completed: false, time: '06:15 PM', priority: 'Low' }
      ] : [];
      setTasks(defaultTasks);
      localStorage.setItem(storageKey, JSON.stringify(defaultTasks));
    }
  }, [storageKey, currentUserId]);

  // Persisting state helper
  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem(storageKey, JSON.stringify(newTasks));
  };

  // Add a task
  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const titleTrimmed = newTitle.trim();
    if (!titleTrimmed) return;

    const finalCategory = showCustomCatInput && customCategory.trim() 
      ? customCategory.trim() 
      : newCategory;

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const freshTask: Task = {
      id: Date.now(),
      title: titleTrimmed,
      category: finalCategory,
      completed: false,
      time: formattedTime,
      priority: newPriority
    };

    const updatedTasks = [freshTask, ...tasks];
    saveTasks(updatedTasks);
    
    // Reset inputs
    setNewTitle('');
    if (showCustomCatInput) {
      setCustomCategory('');
      setShowCustomCatInput(false);
    }
  };

  // Quick seed sample data if requested or empty
  const seedSampleTasks = () => {
    const samples: Task[] = [
      { id: Date.now() + 1, title: 'Synthesize Carbon Nanotube research papers', category: 'Research', completed: false, time: '09:00 AM', priority: 'High' },
      { id: Date.now() + 2, title: 'Complete Neural ODE math notebook calculations', category: 'Academics', completed: false, time: '11:15 AM', priority: 'High' },
      { id: Date.now() + 3, title: 'Audit spectral code deployment logs', category: 'Synthetics', completed: true, time: '02:30 PM', priority: 'Low' },
      { id: Date.now() + 4, title: 'Contemplate Epistemic Humility draft', category: 'Philosophy', completed: false, time: '04:00 PM', priority: 'Medium' },
      { id: Date.now() + 5, title: 'Organize high-density study audio playlists', category: 'Optional', completed: true, time: '08:00 AM', priority: 'Low' }
    ];
    saveTasks([...samples, ...tasks]);
  };

  // Complete/Toggle a task
  const toggleTaskCompletion = (id: number) => {
    const updated = tasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed, category: t.completed ? (t.category === 'Completed' ? 'Upcoming' : t.category) : t.category } : t
    );
    saveTasks(updated);
  };

  // Delete a task
  const handleDeleteTask = (id: number) => {
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);
  };

  // Clear completed tasks
  const clearCompletedTasks = () => {
    const updated = tasks.filter(t => !t.completed);
    saveTasks(updated);
  };

  // Map of categories and matching styles for label badges
  const getCategoryStyles = (categoryName: string) => {
    const matched = DEFAULT_CATEGORIES.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
    if (matched) return matched.color;
    
    // Generate simple custom color scheme on-the-fly based on category name lengths for visual variation
    const len = categoryName.length;
    if (len % 3 === 0) return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
    if (len % 3 === 1) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  // Filtering + Sorting + Searching sequence
  const processedTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by completion status
    if (activeFilter === 'pending') {
      result = result.filter(t => !t.completed);
    } else if (activeFilter === 'done') {
      result = result.filter(t => t.completed);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.category.toLowerCase().includes(q)
      );
    }

    // Sort accordingly
    result.sort((a, b) => {
      // Completed items sink to bottom naturally for optimal academic visibility
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      if (sortBy === 'priority') {
        const weights = { High: 3, Medium: 2, Low: 1 };
        const weightA = weights[a.priority || 'Medium'];
        const weightB = weights[b.priority || 'Medium'];
        return weightB - weightA;
      }

      if (sortBy === 'time') {
        return b.id - a.id; // Secondary reverse-chrono
      }

      return a.title.localeCompare(b.title);
    });

    return result;
  }, [tasks, activeFilter, searchQuery, sortBy]);

  // Priority count badges
  const priorityBreakdown = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    tasks.forEach(t => {
      if (!t.completed) {
        const prio = t.priority || 'Medium';
        counts[prio]++;
      }
    });
    return counts;
  }, [tasks]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 min-h-screen pb-16 relative overflow-x-hidden">
      
      {/* Cinematic ambient aura backgrounds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/3 -translate-y-1/2 w-[55vw] h-[55vw] rounded-full blur-[140px] opacity-[0.06] bg-gradient-to-tr from-violet-500 via-indigo-600 to-transparent" />
        <div className="absolute top-2/3 right-1/4 w-[45vw] h-[45vw] rounded-full blur-[120px] opacity-[0.04] bg-gradient-to-br from-emerald-500 to-transparent" />
      </div>

      {/* Main Header Row */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-white/5 relative z-10 gap-4">
        <div>
           <h1 className="text-4xl text-white mb-1 serif-title tracking-tight flex items-center gap-2">
             Milestones & Tasks
             <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-brand-purple/15 text-brand-purple border border-brand-purple/20 font-mono text-[9px] uppercase tracking-wider">
               Milestones
             </span>
           </h1>
           <p className="text-gray-400 text-xs">Set priorities, check off completed study goals, and stay organized throughout your semester.</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={seedSampleTasks}
            className="px-3.5 py-1.5 rounded-xl border border-white/5 bg-white/[0.02] text-gray-400 hover:text-white hover:bg-white/5 font-mono text-[10px] uppercase tracking-[0.12em] transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Seed Sample Goals
          </button>
          
          {tasks.some(t => t.completed) && (
            <button 
              onClick={clearCompletedTasks}
              className="px-3.5 py-1.5 rounded-xl border border-rose-500/10 bg-rose-500/5 text-rose-400 hover:bg-rose-500/15 font-mono text-[10px] uppercase tracking-[0.12em] transition-all flex items-center gap-1.5 animate-in fade-in duration-300"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Completed
            </button>
          )}
        </div>
      </header>

      {/* Main Column Split Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Left Hand: Compact Creation & Custom Core Filter Controller (Cols 1-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Creator Box */}
          <GlassCard className="p-6 border-white/5 bg-white/[0.015] glow-purple">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-5">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-400" /> Add New Task
              </span>
              <span className="text-[9px] font-mono bg-white/5 px-2 py-0.5 text-gray-500 rounded font-bold uppercase tracking-wider">ENTER-TO-ADD</span>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              {/* Task Title */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Goal Title</label>
                <input 
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Review cosmological expansion vectors..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-sans"
                 />
              </div>

              {/* Priority Selectors */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Priority Index</label>
                  <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-widest">
                    {newPriority} Priority
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['Low', 'Medium', 'High'] as const).map((prio) => {
                    const isSelected = newPriority === prio;
                    const borderColors = {
                      Low: 'hover:border-blue-400/30 selection:border-blue-400 bg-blue-500/5 text-blue-400',
                      Medium: 'hover:border-amber-400/30 selection:border-amber-400 bg-amber-500/5 text-amber-400',
                      High: 'hover:border-rose-400/30 selection:border-rose-400 bg-rose-500/5 text-rose-400'
                    };
                    return (
                      <button
                        key={prio}
                        type="button"
                        onClick={() => setNewPriority(prio)}
                        className={`py-2 rounded-xl border text-[10px] font-mono uppercase tracking-widest transition-all ${
                          isSelected 
                            ? prio === 'High' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.15)] font-bold'
                              : prio === 'Medium' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)] font-bold'
                              : 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.15)] font-bold'
                            : 'bg-white/[0.01] border-white/5 text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {prio}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Configuration */}
              <div className="space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest font-semibold">Category Segment</label>
                  <button 
                    type="button"
                    onClick={() => setShowCustomCatInput(!showCustomCatInput)}
                    className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider"
                  >
                    {showCustomCatInput ? '⚡ Select Preset' : '✨ Custom Category'}
                  </button>
                </div>

                {!showCustomCatInput ? (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-white/[0.02] border border-white/5 rounded-2xl max-h-[120px] overflow-y-auto">
                    {DEFAULT_CATEGORIES.map((cat) => {
                      const isSelected = newCategory === cat.name;
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => setNewCategory(cat.name)}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                            isSelected 
                              ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400 font-bold'
                              : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-indigo-400 animate-pulse' : 'bg-gray-600'}`} />
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1 animate-in fade-in duration-300"
                  >
                    <input 
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom category name..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                    />
                  </motion.div>
                )}
              </div>

              {/* Submit Trigger Actions */}
              <button
                type="submit"
                className="w-full mt-2 py-3 bg-white text-black border border-transparent rounded-2xl font-mono text-xs font-bold uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:bg-gray-100 transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 translate-y-[0.5px]" /> Compile Milestone
              </button>
            </form>
          </GlassCard>

          {/* Segment Statistics Monitor Card */}
          <GlassCard className="p-5 border-white/5 bg-white/[0.015]">
            <h4 className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest pb-2.5 border-b border-white/5 mb-4 flex items-center gap-1.5">
              <Clipboard className="w-4 h-4" /> Live Registry Diagnostics
            </h4>
            <div className="space-y-3.5">
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-mono">Completed milestones ratio</span>
                <span className="text-white font-mono font-bold bg-white/5 px-2 py-0.5 rounded">
                  {tasks.filter(t => t.completed).length} / {tasks.length}
                </span>
              </div>

              {/* Glowing Ratio Bar */}
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand-purple to-brand-indigo rounded-full transition-all duration-500"
                  style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%` }}
                />
              </div>

              <div className="pt-2 border-t border-white/5 space-y-2">
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-bold">Unfinished Priority Nodes</span>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 border border-rose-500/10 bg-rose-500/5 text-center rounded-xl">
                    <span className="text-rose-450 text-[8px] font-mono block">CRITICAL</span>
                    <span className="font-mono text-sm text-rose-400 font-bold">{priorityBreakdown.High}</span>
                  </div>
                  <div className="p-2 border border-amber-500/10 bg-amber-500/5 text-center rounded-xl">
                    <span className="text-amber-450 text-[8px] font-mono block">MEDIAL</span>
                    <span className="font-mono text-sm text-amber-400 font-bold">{priorityBreakdown.Medium}</span>
                  </div>
                  <div className="p-2 border border-blue-500/10 bg-blue-500/5 text-center rounded-xl">
                    <span className="text-blue-450 text-[8px] font-mono block">MEDITATIVE</span>
                    <span className="font-mono text-sm text-blue-400 font-bold">{priorityBreakdown.Low}</span>
                  </div>
                </div>

              </div>
            </div>
          </GlassCard>

          {/* Quick Guidelines Pro Tip */}
          <div className="p-4 bg-white/[0.015] border border-white/5 rounded-2xl flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-550 leading-relaxed">
              <span className="text-indigo-400 font-mono uppercase font-black mr-1">[Integration Tip]</span>
              These goals sync seamlessly with your academic home coordinates, providing a cohesive focus workflow.
            </p>
          </div>

        </div>

        {/* Right Hand: Search, Sorting, Filter Controls with Elegant Compact Task Cards (Cols 5-12) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Controls Panel */}
          <GlassCard className="p-4 border-white/5 bg-white/[0.01] flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Search Frame */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search milestones or tags..."
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500/40"
              />
            </div>

            {/* Filter Toggle Pills (All, Pending, Done) */}
            <div className="flex bg-white/[0.02] border border-white/5 p-1 rounded-xl w-full md:w-auto overflow-x-auto gap-1">
              {(['all', 'pending', 'done'] as const).map((filterOpt) => {
                const isCur = activeFilter === filterOpt;
                return (
                  <button
                    key={filterOpt}
                    onClick={() => setActiveFilter(filterOpt)}
                    className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all ${
                      isCur 
                        ? 'bg-white/10 text-white font-bold shadow-sm'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {filterOpt}
                  </button>
                );
              })}
            </div>

            {/* Sorting Configuration Selector */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <span className="text-[9px] font-mono text-gray-505 uppercase tracking-widest">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white/5 border border-white/5 rounded-xl text-[10px] font-mono text-gray-300 px-3 py-1.5 outline-none cursor-pointer focus:border-indigo-500/30"
              >
                <option value="priority" className="bg-neutral-950">🔥 Priority Weight</option>
                <option value="time" className="bg-neutral-950">⏱ Chronological</option>
                <option value="alphabetical" className="bg-neutral-950">🔠 Alphabetical</option>
              </select>
            </div>

          </GlassCard>

          {/* CORE TASK LIST RENDER PANELS */}
          <div className="space-y-4">
            
            <AnimatePresence mode="popLayout">
              {processedTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-16 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.005] flex flex-col items-center justify-center space-y-4"
                >
                  <div className="w-12 h-12 rounded-full border border-white/5 bg-white/[0.01] flex items-center justify-center text-gray-700">
                    <ListTodo className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h5 className="font-serif italic text-base text-gray-400">No matching milestones compiling</h5>
                    <p className="text-[10px] font-mono text-gray-500 uppercase mt-1 tracking-widest">
                      {searchQuery ? 'Adjust search query metrics' : 'Add objectives or seed sample nodes above'}
                    </p>
                  </div>
                  
                  {!searchQuery && (
                    <button
                      onClick={seedSampleTasks}
                      className="px-3.5 py-1.5 rounded-xl border border-indigo-500/15 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-[9px] font-mono uppercase tracking-widest transition-all"
                    >
                      Seed Demo Sequence
                    </button>
                  )}
                </motion.div>
              ) : (
                processedTasks.map((task) => {
                  const keyPriorityStr = task.priority || 'Medium';
                  const priorityTagStyles = 
                    keyPriorityStr === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 glow-rose' :
                    keyPriorityStr === 'Low' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 glow-blue' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20 glow-amber';

                  return (
                    <motion.div
                      layout
                      key={task.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className={`relative overflow-hidden group rounded-2xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between p-4.5 gap-4 ${
                        task.completed 
                          ? 'bg-emerald-500/[0.02] border-emerald-505/10 text-gray-500'
                          : 'bg-white/[0.015] border-white/5 hover:border-white/10 text-white'
                      }`}
                    >
                      
                      {/* Left Side: Completion Toggle Box and Title Info */}
                      <div className="flex items-center gap-4.5 flex-1 min-w-0">
                        {/* Toggle Checkbox */}
                        <button
                          type="button"
                          onClick={() => toggleTaskCompletion(task.id)}
                          className="flex-shrink-0 relative focus:outline-none focus:ring-0 active:scale-90 duration-200"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-5.5 h-5.5 text-emerald-450 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" />
                          ) : (
                            <div className="w-5.5 h-5.5 rounded-lg border-2 border-white/25 hover:border-indigo-400 transition-all cursor-pointer bg-black/40" />
                          )}
                        </button>

                        {/* Title & Metadata badges */}
                        <div className="min-w-0 space-y-1">
                          <p 
                            onClick={() => toggleTaskCompletion(task.id)}
                            className={`text-sm font-medium tracking-tight leading-snug cursor-pointer transition-all ${
                              task.completed ? 'line-through text-gray-550 italic font-light' : 'text-gray-100 hover:text-indigo-300'
                            }`}
                          >
                            {task.title}
                          </p>
                          
                          <div className="flex items-center flex-wrap gap-2">
                            {/* category label */}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8.5px] font-mono uppercase tracking-wider border ${getCategoryStyles(task.category)}`} style={{ textShadow: '0 0 10px rgba(255,255,255,0.05)' }}>
                              <Tag className="w-2.5 h-2.5 mr-1" /> {task.category}
                            </span>

                            {/* timestamp label */}
                            <span className="inline-flex items-center text-[8.5px] font-mono text-gray-500 uppercase tracking-wider">
                              <Clock className="w-2.5 h-2.5 mr-1" /> {task.time}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Priority Status Giver and Actions Container */}
                      <div className="flex items-center justify-between md:justify-end gap-3 flex-shrink-0 pt-2 md:pt-0 border-t border-white/5 md:border-none">
                        
                        {/* Priority glow indicator */}
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest ${priorityTagStyles}`}>
                          <Flag className="w-2.5 h-2.5 mr-1 fill-current" /> {keyPriorityStr}
                        </span>

                        {/* Task specific deletion trigger */}
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 rounded-xl border border-white/5 bg-white/[0.02] text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all flex items-center justify-center shrink-0"
                          title="Erase milestone permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>

                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>

          </div>

          {/* Quick Metrics Wrap bar */}
          {tasks.length > 0 && (
            <div className="p-4 bg-white/[0.005] border border-white/5 rounded-2xl flex justify-between items-center text-[10px] font-mono text-gray-550">
              <span className="uppercase">Sequential Progress Tracker</span>
              <span>
                Compiled Goals Index: {Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)}% Complete
              </span>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
