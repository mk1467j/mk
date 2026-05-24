import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from '@tanstack/react-router';
import { GlassCard } from '@/components/GlassCard';
import { GlowButton } from '@/components/GlowButton';
import { Sparkles, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isFirebaseConfigured } from '@/lib/firebase';

export function Auth() {
  const { user, login, signup, loginWithGoogle, continueAsGuest } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Simulated Google interactive account chooser states
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [googleAccounts] = useState([
    { name: 'Manju Nath', email: 'manjuaim17@gmail.com', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=manju' },
    { name: 'Demo Student', email: 'student@studyvibe.co', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=student' }
  ]);
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showGoogleForm, setShowGoogleForm] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate({ to: '/' });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSubmitting(true);

    try {
      if (isSignUp) {
        const { error } = await signup(email, password, fullName);
        if (error) {
          setAuthError(error.message || 'Error occurred during registration');
        } else {
          navigate({ to: '/' });
        }
      } else {
        const { error } = await login(email, password);
        if (error) {
          setAuthError(error.message || 'Invalid credentials or login failure');
        } else {
          navigate({ to: '/' });
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'System connectivity issue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuthLogin = async () => {
    setAuthError(null);
    
    // Ask for actual Simulated Google Login when Supabase is not active
    if (!isFirebaseConfigured) {
      setShowGooglePrompt(true);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await loginWithGoogle();
      if (error) {
        setAuthError(error.message || 'Google OAuth failed');
      } else {
        navigate({ to: '/' });
      }
    } catch (err: any) {
      setAuthError(err.message || 'Google login failure');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmGoogleSelect = async (gEmail: string, gName: string) => {
    setShowGooglePrompt(false);
    setSubmitting(true);
    try {
      const { error } = await loginWithGoogle(gEmail, gName);
      if (error) {
        setAuthError(error.message || 'Google Sign-In failed');
      } else {
        navigate({ to: '/' });
      }
    } catch (err: any) {
      setAuthError(err.message || 'Google authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail.trim() || !customGoogleName.trim()) return;
    await handleConfirmGoogleSelect(customGoogleEmail.trim(), customGoogleName.trim());
  };

  const handleGuestEntry = () => {
    continueAsGuest();
    navigate({ to: '/' });
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-12 px-4 animate-in fade-in zoom-in-95 duration-1000">
      
      {/* Decorative Blur Backdrops */}
      <div className="absolute top-[10%] left-[20%] w-[350px] h-[350px] rounded-full bg-brand-purple/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-[350px] h-[350px] rounded-full bg-brand-indigo/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 z-10">
        
        {/* Simple Professional Header Text */}
        <div className="text-center space-y-3">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
          >
            <Sparkles className="w-4 h-4 text-brand-purple" />
            <span className="mono-label text-[10px] text-brand-purple uppercase tracking-widest font-semibold">Study Playlist & Notes Companion</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5.5xl serif-title tracking-tight text-white italic text-center font-semibold drop-shadow"
          >
            StudyVibe
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-xs md:text-sm font-mono tracking-wide uppercase"
          >
            Your distraction-free study environment
          </motion.p>
        </div>

        {/* Floating Glass Container */}
        <GlassCard className="relative p-8 md:p-10 border-white/10 bg-white/5 glow-indigo shadow-2xl">
          <div className="space-y-6">
            <div className="space-y-1 text-center md:text-left">
              <h2 className="text-xl font-medium text-white font-serif italic">
                Sign In with Google
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                Authorize your StudyVibe session using standard Google accounts to sync study playlists and notes companion tools.
              </p>
            </div>

            {authError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono leading-relaxed text-center">
                {authError}
              </div>
            )}

            {!isFirebaseConfigured ? (
              /* Elevated Google Account Chooser for non-Firebase environments */
              <div className="space-y-4">
                <p className="text-[10px] text-gray-500 uppercase font-mono tracking-wider text-center">
                  Select an account to authorize
                </p>
                <div className="space-y-2">
                  {googleAccounts.map((acc, index) => (
                    <button
                      key={index}
                      onClick={() => handleConfirmGoogleSelect(acc.email, acc.name)}
                      disabled={submitting}
                      className="w-full p-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-2xl flex items-center justify-between transition-all group active:scale-[0.99] cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={acc.avatar} 
                          alt={acc.name} 
                          className="w-8 h-8 rounded-full border border-white/10"
                        />
                        <div>
                          <p className="text-xs font-semibold text-white group-hover:text-brand-purple transition-colors">{acc.name}</p>
                          <p className="text-[10px] font-mono text-gray-500">{acc.email}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">Google</span>
                    </button>
                  ))}
                </div>

                {showGoogleForm ? (
                  <form onSubmit={handleCustomGoogleSubmit} className="space-y-3 pt-3 border-t border-white/5 animate-in fade-in duration-300">
                    <p className="text-[10px] text-brand-purple uppercase font-mono tracking-wider">Add Custom Google Profile</p>
                    <div className="space-y-1">
                      <input 
                        type="text" 
                        required
                        value={customGoogleName}
                        onChange={(e) => setCustomGoogleName(e.target.value)}
                        placeholder="Google Account Name" 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <input 
                        type="email" 
                        required
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        placeholder="username@gmail.com" 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div className="flex gap-2.5 pt-1">
                      <button 
                        type="button" 
                        onClick={() => setShowGoogleForm(false)}
                        className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-xs text-gray-400 rounded-lg font-mono transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-1.5 bg-brand-purple text-white hover:bg-opacity-90 text-xs rounded-lg font-mono font-bold transition-all"
                      >
                        Confirm
                      </button>
                    </div>
                  </form>
                ) : (
                  <button 
                    onClick={() => setShowGoogleForm(true)}
                    className="w-full py-2.5 rounded-xl border border-dashed border-white/10 hover:border-white/20 text-[10px] font-mono text-gray-400 hover:text-white uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    + Authorize Another email
                  </button>
                )}
              </div>
            ) : (
              /* Standard Firebase Native Redirect Button */
              <div className="space-y-4">
                <button 
                  onClick={handleOAuthLogin}
                  disabled={submitting}
                  className="w-full py-4 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-2xl text-xs font-semibold text-white transition-all flex items-center justify-center gap-3 active:scale-98 cursor-pointer shadow-lg"
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>{submitting ? 'Connecting Google Account...' : 'Continue with Google Account'}</span>
                </button>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Guest Mode Direct Access CTA */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.3 }}
          className="text-center space-y-3"
        >
          <button 
             onClick={handleGuestEntry}
             className="inline-flex items-center gap-2 group text-xs text-brand-purple hover:text-brand-indigo font-mono font-bold tracking-widest uppercase transition-colors py-2 px-4 rounded-xl hover:bg-white/5 cursor-pointer"
          >
            <span>Skip and use Local Guest Mode</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
          </button>
          
          <p className="text-[10px] text-gray-500 font-mono leading-relaxed max-w-xs mx-auto">
            Your playlists, audio tracks, and markdown notes are saved locally inside your browser storage.
          </p>
        </motion.div>

      </div>

      {/* Simulated Google Sign-In Selector Modal Overlay */}
      <AnimatePresence>
        {showGooglePrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-[24px] bg-[#1a1a1e] border border-white/10 p-6 text-left shadow-2xl relative overflow-hidden"
            >
              {/* Google colored bar at top */}
              <div className="absolute top-0 left-0 right-0 h-1 flex">
                <div className="flex-1 bg-[#4285F4]"></div>
                <div className="flex-1 bg-[#EA4335]"></div>
                <div className="flex-1 bg-[#FBBC05]"></div>
                <div className="flex-1 bg-[#34A853]"></div>
              </div>

              {/* Header */}
              <div className="flex flex-col items-center text-center mt-4">
                <svg className="w-8 h-8 mb-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <h3 className="text-xl font-medium text-white tracking-tight">Sign In with Google</h3>
                <p className="text-xs text-gray-400 mt-1">Provide credentials to authorize your <span className="font-semibold text-brand-purple">StudyVibe</span> session</p>
              </div>

              {/* Accounts List / Input form directly to avoid silent bypass */}
              <div className="mt-6 space-y-4">
                <form onSubmit={handleCustomGoogleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">Google Account Email</label>
                    <input 
                      type="email"
                      required
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      placeholder="e.g. manjuaim17@gmail.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple/50 focus:bg-white/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">Full Account Name</label>
                    <input 
                      type="text"
                      required
                      value={customGoogleName}
                      onChange={(e) => setCustomGoogleName(e.target.value)}
                      placeholder="e.g. Manju Nath"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple/50 focus:bg-white/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">Security Password</label>
                    <input 
                      type="password"
                      required
                      placeholder="••••••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple/50 focus:bg-white/10"
                    />
                  </div>
                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowGooglePrompt(false)}
                      className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all font-mono"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-brand-purple text-white text-xs font-semibold hover:bg-opacity-90 transition-all font-mono"
                    >
                      Authorize Sign In
                    </button>
                  </div>
                </form>
              </div>

              {/* Secure Note */}
              <div className="mt-6 border-t border-white/5 pt-4 text-[10px] text-gray-500 font-mono leading-relaxed">
                To continue, Google will share your matching account details with StudyVibe to safely synchronize your local playlists across this browser session.
              </div>

              <button
                onClick={() => setShowGooglePrompt(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
