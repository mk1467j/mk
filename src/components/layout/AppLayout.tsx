import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Book, Layers, CheckSquare, Music, BarChart3, Settings, Menu, 
  LogOut, Coffee, ShieldCheck, HelpCircle, Cloud, CloudOff, RefreshCw, 
  KeyRound, GraduationCap, Sparkles, Pin, PinOff, Compass, Maximize2, Minimize2, X, ChevronRight, CircleDot
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { Outlet, Link, useRouterState, useLocation, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/context/AuthContext';
import { PDFSidebarPanel } from '../PDFSidebar/PDFSidebar';
import { FloatingPomodoro } from '../widgets/FloatingPomodoro';


const NAV_ITEMS = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: GraduationCap, label: 'My Batch', path: '/batch' },
  { icon: Book, label: 'Notes', path: '/notes' },
  { icon: Layers, label: 'Tools', path: '/tools' },
  { icon: Coffee, label: 'Focus', path: '/focus' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: Music, label: 'Music', path: '/music' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
];

export function AppLayout() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, guestUser, isGuest, logout, loading } = useAuth();
  const currentUserId = user?.id || guestUser?.id || 'guest_default';

  // Hover & lock state for the spatial launcher sidebar
  const [isHovered, setIsHovered] = useState(false);
  const [isSidebarLocked, setIsSidebarLocked] = useState(() => {
    const saved = localStorage.getItem('studyvibe_sidebar_locked');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Mobile Spatial Orb Menu State
  const [isMobileHubOpen, setIsMobileHubOpen] = useState(false);

  // Fullscreen / standalone App Mode tracking state
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen API not allowed or supported in this workspace: ", err);
    }
  };

  // Expanded calculated state
  const isExpanded = isSidebarLocked || isHovered;

  // Real-time background screen-time tracker hook
  useEffect(() => {
    const isGuestUser = currentUserId.startsWith('guest_') || currentUserId === 'guest_default';
    const storageKey = `studyvibe_web_screentime_${currentUserId}`;
    
    const existing = localStorage.getItem(storageKey);
    if (!existing) {
      localStorage.setItem(storageKey, isGuestUser ? '7420' : '0');
    }

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const currentVal = Number(localStorage.getItem(storageKey) || 0);
        localStorage.setItem(storageKey, String(currentVal + 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('studyvibe_sidebar_locked', JSON.stringify(isSidebarLocked));
  }, [isSidebarLocked]);

  // Route-protection guard
  React.useEffect(() => {
    if (!loading && !user && !isGuest && location.pathname !== '/auth') {
      navigate({ to: '/auth' });
    }
  }, [user, isGuest, loading, location.pathname, navigate]);

  // Handle cinematic auth screen bypass
  if (location.pathname === '/auth') {
    return (
      <div className="min-h-screen relative overflow-x-hidden flex items-center justify-center bg-black w-full text-white">
        <Outlet />
      </div>
    );
  }

  // Handle cinematic immersive study mode bypass
  if (location.pathname === '/study') {
    return <Outlet />;
  }

  // Handle loading states securely
  if (loading) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center bg-[#050510] text-gray-400 gap-4">
        <div className="w-12 h-12 rounded-full border-t-2 border-brand-purple border-r-2 border-transparent animate-spin" />
        <p className="font-mono text-xs tracking-widest uppercase text-brand-purple">Loading your study workspace...</p>
      </div>
    );
  }

  // Auth Display Profile Helpers
  const getInitials = () => {
    if (user) {
      const name = user.user_metadata?.full_name || user.email || 'S';
      return name.substring(0, 2).toUpperCase();
    }
    if (guestUser) {
      return guestUser.name.substring(0, 2).toUpperCase();
    }
    return 'SV';
  };

  const getEmail = () => {
    if (user) return user.email || 'scholar@studyvibe.co';
    if (guestUser) return guestUser.email || 'guest@studyvibe.local';
    return '';
  };

  const getName = () => {
    if (user) return user.user_metadata?.full_name || 'Student';
    if (guestUser) return guestUser.name || 'Guest Learner';
    return 'Learner';
  };

  const getAvatarUrl = () => {
    if (user) {
      return user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.email || 'Study'}`;
    }
    if (guestUser) {
      return guestUser.avatar_url;
    }
    return 'https://api.dicebear.com/7.x/notionists/svg?seed=Study';
  };

  const mainContent = (
    <div className="min-h-[100dvh] flex flex-col md:flex-row relative w-full overflow-x-hidden">
      {/* Mobile Top Header */}
      <header className="md:hidden glass-panel rounded-none border-t-0 border-l-0 border-r-0 border-b border-glass-border/50 sticky top-0 z-50 px-4 py-3 flex justify-between items-center bg-black/40 backdrop-blur-3xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-purple to-brand-indigo flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            <span className="font-serif font-bold text-white text-sm">SV</span>
          </div>
          <span className="font-serif font-semibold text-lg tracking-wide text-white">StudyVibe</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <p className="text-[10px] text-white font-serif max-w-[80px] truncate">{getName()}</p>
            <span className="text-[8px] font-mono text-gray-400 uppercase flex items-center gap-1">
              {user ? (
                <>
                  <Cloud className="w-2.5 h-2.5 text-emerald-400" />
                  Synced
                </>
              ) : (
                <>
                  <CloudOff className="w-2.5 h-2.5 text-amber-500" />
                  Guest
                </>
              )}
            </span>
          </div>
          <button 
            onClick={toggleFullscreen}
            className="p-1.5 rounded-full border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Standalone Mode" : "Enter Standalone Mode"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-brand-purple" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <Link to="/settings" className="p-1 rounded-full border border-white/10 hover:border-white/20">
             <img src={getAvatarUrl()} alt="Avatar" className="w-8 h-8 rounded-full bg-white/10" />
          </Link>
        </div>
      </header>


      {/* Desktop Sidebar */}
      <motion.aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ width: 84 }}
        animate={{ width: isExpanded ? 245 : 84 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="hidden md:flex flex-col fixed left-4 top-4 bottom-4 z-40 rounded-[32px] border border-white/10 bg-[#050510]/60 backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.85)] select-none overflow-hidden group/sidebar"
      >
        <div className="p-5 flex items-center justify-between w-full border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-purple to-brand-indigo flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.35)] shrink-0">
              <span className="font-serif font-extrabold text-white text-xs">SV</span>
            </div>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-serif font-semibold text-white text-xs tracking-wide whitespace-nowrap"
                >
                  StudyVibe OS
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <div className="flex items-center gap-1 shrink-0">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title={isFullscreen ? "Exit Standalone Mode" : "Enter Standalone Mode"}
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-brand-purple" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </motion.button>
                
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarLocked(!isSidebarLocked)}
                  className={cn(
                    "p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer",
                    isSidebarLocked ? "text-brand-purple bg-brand-purple/10" : ""
                  )}
                  title={isSidebarLocked ? "Unlock Sidebar Autohide" : "Pin Sidebar Open"}
                >
                  {isSidebarLocked ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
                </motion.button>
              </div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 w-full px-3 py-6 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3.5 px-3 py-3 rounded-2xl transition-all duration-300 relative overflow-hidden group/link",
                  isActive 
                    ? "text-white bg-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                 {isActive && (
                    <motion.div 
                      layoutId="active-spatial-nav"
                      className="absolute inset-[1px] bg-brand-purple/15 rounded-[14px]"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                 )}
                <item.icon className={cn(
                  "w-5 h-5 relative z-10 shrink-0 transition-transform group-hover/link:scale-105",
                  isActive ? "text-brand-purple text-glow" : "text-gray-400"
                )} />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="font-medium text-[11px] whitespace-nowrap relative z-10 font-sans tracking-wide"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/[0.06] space-y-2">
             <Link
                to="/settings"
                className={cn(
                  "flex items-center gap-3.5 px-3 py-2.5 rounded-2xl transition-colors group",
                  location.pathname === '/settings' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                   {isExpanded && (
                     <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="font-medium text-xs whitespace-nowrap block"
                     >System Preferences</motion.span>
                   )}
                </AnimatePresence>
             </Link>

             {/* Profile Account Card */}
             <div className="pt-2 border-t border-white/5">
                <div className={cn(
                  "flex items-center rounded-2xl p-2 bg-white/5 border border-white/5 space-x-3 overflow-hidden",
                  !isExpanded ? "justify-center p-1.5" : ""
                )}>
                  <img 
                    src={getAvatarUrl()} 
                    alt="User Avatar" 
                    className="w-10 h-10 rounded-full border border-white/10 bg-white/5 shadow-inner flex-shrink-0" 
                  />
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="flex-1 min-w-0 font-sans"
                      >
                        <h4 className="text-xs font-serif text-white truncate leading-snug">{getName()}</h4>
                        <p className="text-[9px] font-mono text-gray-500 truncate leading-tight">{getEmail()}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          {user ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-mono uppercase tracking-wide">
                              <Cloud className="w-2.5 h-2.5 mr-0.5" /> Synced
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-mono uppercase tracking-wide">
                              <CloudOff className="w-2.5 h-2.5 mr-0.5" /> Guest
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Sign out Action Button */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={async () => {
                          await logout();
                          navigate({ to: '/auth' });
                        }}
                        className="p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                        title="Disconnect sequence"
                      >
                        <LogOut className="w-4 h-4" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {!isExpanded && (
                  <button
                    onClick={async () => {
                      await logout();
                      navigate({ to: '/auth' });
                    }}
                    className="w-full mt-2 p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-white/5 transition-colors flex justify-center"
                    title="Disconnect sequence"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                )}
             </div>
        </div>
      </motion.aside>

      {/* Main Content Pane */}
      <main className={cn(
        "flex-1 relative z-10 w-full max-w-full transition-[padding] duration-300 ease-in-out min-h-screen overflow-x-hidden",
        "pb-8 md:pb-8",
        isExpanded ? "md:pl-[260px]" : "md:pl-[104px]"
      )}>
        <div className="max-w-7xl mx-auto p-3 sm:p-5 md:p-8 min-h-full">
           <Outlet />
        </div>
      </main>

      {/* Spatial Stage Manager Control Orb Centerpiece (Mobile Only) */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsMobileHubOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-purple to-brand-indigo flex items-center justify-center text-white shadow-[0_4px_24px_rgba(139,92,246,0.6)] border border-brand-purple/20 cursor-pointer relative"
        >
          <motion.div 
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="absolute inset-[2px] rounded-full border border-white/25"
          />
          <Compass className="w-6 h-6 text-white relative z-10" />
        </motion.button>
      </div>

      {/* Spatial Control Portal Overlay (Stage Switching) */}
      <AnimatePresence>
        {isMobileHubOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-3xl p-6 flex flex-col justify-end"
          >
            {/* Close touch pad area */}
            <div className="absolute inset-0 z-0" onClick={() => setIsMobileHubOpen(false)} />

            <motion.div
              initial={{ y: 80, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 80, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="bg-[#050510]/95 border border-white/10 rounded-[28px] p-5 shadow-2xl relative z-10 max-h-[85vh] overflow-y-auto flex flex-col gap-6"
            >
              {/* Header inside center */}
              <div className="flex items-center justify-between pointer-events-auto">
                <div className="text-left font-sans">
                  <h3 className="text-white font-serif font-bold tracking-wide text-base">Stage Controller</h3>
                  <p className="text-[10px] font-mono text-gray-500 font-extrabold">SPATIAL CHANNELS & WORKSPACES</p>
                </div>
                <button 
                  onClick={() => setIsMobileHubOpen(false)}
                  className="p-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Workspaces Spatial Navigation Grid */}
              <div className="grid grid-cols-2 gap-3">
                {NAV_ITEMS.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate({ to: item.path });
                        setIsMobileHubOpen(false);
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center gap-2 cursor-pointer",
                        isActive 
                          ? "bg-brand-purple/20 border-brand-purple/30 text-white shadow-lg shadow-brand-purple/5" 
                          : "bg-white/[0.02] border-white/5 hover:border-white/10 text-gray-300"
                      )}
                    >
                      <item.icon className={cn("w-6 h-6", isActive ? "text-brand-purple" : "text-gray-400")} />
                      <span className="text-[11px] font-sans font-medium tracking-wide">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Direct Spatial Layout Toggles */}
              <div className="space-y-2.5">
                <p className="text-[8.5px] font-mono font-bold text-gray-500 uppercase tracking-widest text-left">Overlay Quick Links</p>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('toggle-pomodoro-widget'));
                      setIsMobileHubOpen(false);
                    }}
                    className="w-full p-3.5 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 text-left rounded-2xl flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <Coffee className="w-4.5 h-4.5" />
                      <div className="text-left font-sans">
                        <span className="text-xs font-semibold block text-white">Focus Timer Deck</span>
                        <span className="text-[9px] font-mono text-gray-500 block">Deploy floating Pomo timer</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>

                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('toggle-music-widget'));
                      setIsMobileHubOpen(false);
                    }}
                    className="w-full p-3.5 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-300 text-left rounded-2xl flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 text-left font-sans">
                      <Music className="w-4.5 h-4.5" />
                      <div>
                        <span className="text-xs font-semibold block text-white">Stereo Sound Controller</span>
                        <span className="text-[9px] font-mono text-gray-500 block">Deploy floating audio deck</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>

                  <button
                    onClick={() => {
                      // Trigger direct call to toggle global PDF Panel
                      window.dispatchEvent(new CustomEvent('toggle-pdf-sidebar'));
                      setIsMobileHubOpen(false);
                    }}
                    className="w-full p-3.5 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 text-left rounded-2xl flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 text-left font-sans">
                      <Book className="w-4.5 h-4.5" />
                      <div>
                        <span className="text-xs font-semibold block text-white">Interactive PDF Workbench</span>
                        <span className="text-[9px] font-mono text-gray-500 block">Slide open PDF workspace</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>

                  <button
                    onClick={() => {
                      navigate({ to: '/settings' });
                      setIsMobileHubOpen(false);
                    }}
                    className="w-full p-3.5 bg-violet-500/10 hover:bg-violet-500/15 border border-violet-500/20 text-violet-350 text-left rounded-2xl flex items-center justify-between cursor-pointer group animate-in fade-in"
                  >
                    <div className="flex items-center gap-3 text-left font-sans">
                      <Settings className="w-4.5 h-4.5 text-brand-purple" />
                      <div>
                        <span className="text-xs font-semibold block text-white">System Preferences & Settings</span>
                        <span className="text-[9px] font-mono text-gray-550 block">Configure profile, keys & visual options</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Synced profile bottom panel */}
              <div className="mt-2 p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-brand-purple/20 border border-brand-purple/20 text-brand-purple text-[10px] font-bold rounded-full flex items-center justify-center">
                    {getInitials()}
                  </div>
                  <div className="text-left font-sans">
                    <p className="text-xs text-white font-medium leading-none mb-0.5">{getName()}</p>
                    <p className="text-[9px] font-mono text-gray-500 leading-none">{getEmail()}</p>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    await logout();
                    setIsMobileHubOpen(false);
                    navigate({ to: '/auth' });
                  }}
                  className="p-1 px-3 text-[10px] bg-rose-500/10 hover:bg-rose-500/15 text-rose-450 font-mono rounded-lg border border-rose-500/20 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      {mainContent}
      <PDFSidebarPanel />
      <FloatingPomodoro />
    </>
  );
}
