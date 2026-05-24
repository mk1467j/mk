import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Book, Layers, CheckSquare, Music, BarChart3, Settings, Menu, LogOut, Coffee, ShieldCheck, HelpCircle, Cloud, CloudOff, RefreshCw, KeyRound, GraduationCap } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { Outlet, Link, useRouterState, useLocation, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/context/AuthContext';


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

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row relative">
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
          <Link to="/settings" className="p-1 rounded-full border border-white/10 hover:border-white/20">
             <img src={getAvatarUrl()} alt="Avatar" className="w-8 h-8 rounded-full bg-white/10" />
          </Link>
        </div>
      </header>


      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ width: sidebarCollapsed ? 80 : 280 }}
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden md:flex flex-col h-screen sticky top-0 border-r border-glass-border bg-black/20 backdrop-blur-xl z-40"
      >
        <div className="p-6 flex items-center gap-3">
          <button onClick={toggleSidebar} className="p-2 rounded-xl hover:bg-white/10 text-gray-300 transition-colors flex-shrink-0">
             <Menu className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden flex items-center gap-2"
              >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-purple to-brand-indigo flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.4)]">
                     <span className="font-serif font-bold text-white text-[10px]">SV</span>
                  </div>
                 <span className="font-serif font-semibold tracking-wide text-white whitespace-nowrap">StudyVibe</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-4 px-3 py-3 rounded-2xl transition-all duration-300 group relative",
                  isActive ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                )}
              >
                 {isActive && (
                    <motion.div 
                      layoutId="active-nav"
                      className="absolute inset-0 bg-brand-purple/20 rounded-2xl border border-brand-purple/30"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                 )}
                <item.icon className={cn("w-5 h-5 relative z-10 flex-shrink-0", isActive ? "text-brand-purple glow-icon" : "")} />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-medium whitespace-nowrap relative z-10 block"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-glass-border space-y-2">
             <Link
                to="/settings"
                className={cn(
                  "flex items-center gap-4 px-3 py-2.5 rounded-2xl transition-colors group",
                  location.pathname === '/settings' ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                )}
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                   {!sidebarCollapsed && (
                     <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="font-medium whitespace-nowrap block"
                     >Settings</motion.span>
                   )}
                </AnimatePresence>
             </Link>

             {/* Profile Account Card */}
             <div className="pt-2 border-t border-white/5">
                <div className={cn(
                  "flex items-center rounded-2xl p-2 bg-white/5 border border-white/5 space-x-3 overflow-hidden",
                  sidebarCollapsed ? "justify-center p-1" : ""
                )}>
                  <img 
                    src={getAvatarUrl()} 
                    alt="User Avatar" 
                    className="w-10 h-10 rounded-full border border-white/10 bg-white/5 shadow-inner flex-shrink-0" 
                  />
                  
                  <AnimatePresence>
                    {!sidebarCollapsed && (
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
                    {!sidebarCollapsed && (
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

                {sidebarCollapsed && (
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

      {/* Main Content */}
      <main className="flex-1 relative overflow-x-hidden pb-24 md:pb-8 z-10">
        <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-full">
           <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4">
        <div className="glass-panel flex items-center justify-between px-6 py-4 rounded-full bg-black/60 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          {NAV_ITEMS.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 relative p-2 rounded-xl transition-colors",
                  isActive ? "text-brand-purple" : "text-gray-500 hover:text-gray-300"
                )}
              >
                {isActive && (
                    <motion.div 
                      layoutId="active-mobile-nav"
                      className="absolute inset-0 bg-brand-purple/20 rounded-xl blur-md"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                 )}
                <item.icon className="w-6 h-6 relative z-10" />
              </Link>
            );
          })}
            <Link
              to="/settings"
              className={cn(
                "flex flex-col items-center gap-1 relative p-2 rounded-xl transition-colors",
                location.pathname === '/settings' ? "text-brand-purple" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Settings className="w-6 h-6 relative z-10" />
            </Link>
        </div>
      </div>

      {/* Global Interactive Widgets are disabled per user request */}
    </div>
  );
}
