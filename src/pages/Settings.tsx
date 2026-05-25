import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { GlassCard } from '@/components/GlassCard';
import { GlowButton } from '@/components/GlowButton';
import { useAuth } from '@/context/AuthContext';
import { useSettings, THEME_PRESETS, ACCENT_COLOR_PRESETS, AnimationIntensity, SizingDensity } from '@/context/SettingsContext';
import { 
  User, Settings as SettingsIcon, LogOut, ShieldAlert, Sparkles, Sliders, Layout, 
  Upload, Image, Trash2, SlidersHorizontal, Check, RefreshCw, KeyRound, Cloud, 
  HelpCircle, Eye, Sliders as QuickSliders, RotateCcw, AlertTriangle, ChevronRight, Activity
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export function Settings() {
  const { user, guestUser, isGuest, logout, updateGuestProfile } = useAuth();
  const {
    activeThemeId,
    setTheme,
    activeAccentId,
    setAccentColor,
    animationIntensity,
    setAnimationIntensity,
    density,
    setDensity,
    backgroundImage,
    setBackgroundImage,
    bgOpacity,
    setBgOpacity,
    removeBackground,
    currentThemeSpec,
  } = useSettings();

  const navigate = useNavigate();

  // Profile forms
  const [guestName, setGuestName] = useState(guestUser?.name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Background Image Drag-Drop state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authenticated state parameters
  const getEmail = () => {
    if (user) return user.email || 'scholar@studyvibe.co';
    if (guestUser) return guestUser.email || 'guest@studyvibe.local';
    return '';
  };

  const getName = () => {
    if (user) return user.user_metadata?.full_name || 'Noble Scholar';
    if (guestUser) return guestUser.name || 'Guest Scholar';
    return 'Scholar';
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

  // Profile update handler
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(false);

    setTimeout(() => {
      if (isGuest && guestName.trim()) {
        updateGuestProfile(guestName.trim());
      }
      setProfileSaving(false);
      setProfileSuccess(true);
      const timer = setTimeout(() => setProfileSuccess(false), 3000);
      return () => clearTimeout(timer);
    }, 800);
  };

  // Convert uploaded background image to Base64 of local storage
  const processFile = (file: File) => {
    setUploadError('');
    if (!file.type.startsWith('image/')) {
      setUploadError('Unsupported file type. Please upload a standard image file (.png, .jpg, .webp).');
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      setUploadError('File exceeds 1.5MB. Please upload a smaller image to optimize memory storage.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBackgroundImage(reader.result);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read the file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDisconnect = async () => {
    await logout();
    navigate({ to: '/auth' });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-16 relative overflow-x-hidden">
      
      {/* Decorative background aura lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 right-[10%] w-[45vw] h-[45vw] rounded-full blur-[140px] opacity-[0.04] bg-brand-purple" />
        <div className="absolute bottom-1/4 left-[5%] w-[40vw] h-[40vw] rounded-full blur-[120px] opacity-[0.04] bg-brand-indigo" />
      </div>

      {/* Settings Page Header */}
      <header className="pb-6 border-b border-white/5 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl text-white mb-1.5 serif-title tracking-tight flex items-center gap-2">
            System Control Deck
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple border border-brand-purple/20 font-mono text-[9px] uppercase tracking-wider">
              Operating Version 1.4
            </span>
          </h1>
          <p className="text-gray-400 text-xs">Aesthetics and architecture config. Personalize themes, layouts, responsive animation loops, and ambient wallpapers.</p>
        </div>

        {/* Enter Cinematic Study button as key shortcut entry point */}
        <GlowButton
          onClick={() => navigate({ to: '/focus' })}
          className="text-xs font-mono uppercase tracking-widest px-4.5 py-2.5 flex items-center gap-2"
        >
          <Activity className="w-4 h-4 animate-pulse text-brand-purple" /> Active Study Room
        </GlowButton>
      </header>

      {/* Main Grid Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left column elements (Cols 1-5): Auth Details, Density, and Animations */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Account Profile Card */}
          <GlassCard className="p-6 border-white/5 bg-white/[0.015]">
            <h3 className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest pb-3 border-b border-white/5 mb-5 flex items-center gap-1.5 font-bold">
              <User className="w-4 h-4" /> Scholar Account Credentials
            </h3>

            {/* Profile Aura Block */}
            <div className="flex items-center gap-4 p-4.5 rounded-2xl bg-white/[0.02] border border-white/5 mb-5">
              <div className="relative">
                <img 
                  src={getAvatarUrl()} 
                  alt="Custom Avatar" 
                  className="w-14 h-14 rounded-full border border-white/10 bg-neutral-900 shadow-inner"
                />
                {user ? (
                  <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border border-neutral-950" title="Secure Sync Active">
                    <Cloud className="w-2.5 h-2.5 text-white" />
                  </span>
                ) : (
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-amber-500 rounded-md border border-neutral-950 font-mono text-[6px] text-white uppercase font-black" title="Local sandbox store">
                    GUEST
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-[7.5px] font-mono uppercase tracking-widest text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {user ? 'AUTHENTICATED SCHOLAR' : 'OFFLINE DIRECT GUEST'}
                </span>
                <h4 className="text-sm font-semibold text-white truncate mt-1.5 leading-snug">{getName()}</h4>
                <p className="text-[10px] font-mono text-gray-500 truncate mt-0.5 leading-none">{getEmail()}</p>
              </div>
            </div>

            {/* Guest vs Sync state notifications */}
            {!user ? (
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 mb-5 text-[11px] text-amber-300 leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> Guest Mode Sandbox
                </p>
                <p className="opacity-80">All StudyLogs, notes, and checklist timers reside in your local browser sandbox. Create an account to sync progress to cloud database repositories instantly.</p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 mb-5 text-[11px] text-emerald-300 leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Cloud className="w-4 h-4 shrink-0" /> Cloud Sync Operational
                </p>
                <p className="opacity-80">Your metrics, custom ambient widgets, and profile metadata sync in real-time. Any interface customizations automatically adapt on any synchronized hardware.</p>
              </div>
            )}

            {/* Profile update form */}
            {isGuest && (
              <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2 border-t border-white/5">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider font-bold">Edit Display Name</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="flex-1 py-2.5 bg-indigo-600 text-white border border-transparent rounded-xl font-mono text-[9px] font-bold uppercase tracking-widest hover:bg-indigo-500 transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {profileSaving ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                      </>
                    ) : (
                      'Save Settings'
                    )}
                  </button>
                </div>

                {profileSuccess && (
                  <p className="text-[10px] text-emerald-400 font-mono text-center flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Guest file updated successfully.
                  </p>
                )}
              </form>
            )}

            {/* Account Disconnect action */}
            <div className="pt-4 border-t border-white/5 mt-4">
              <button
                onClick={handleDisconnect}
                className="w-full py-2.5 border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 rounded-xl font-mono text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Disconnect Sequence (Sign Out)
              </button>
            </div>
          </GlassCard>

          {/* layout Density configs */}
          <GlassCard className="p-6 border-white/5 bg-white/[0.015]">
            <h3 className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest pb-3 border-b border-white/5 mb-5 flex items-center gap-1.5 font-bold">
              <Layout className="w-4 h-4" /> Layout Interface Density
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              {(['compact', 'normal', 'spacious'] as SizingDensity[]).map((d) => {
                const isSelected = density === d;
                return (
                  <button
                    key={d}
                    onClick={() => setDensity(d)}
                    className={`p-3 rounded-xl border font-mono text-[10px] uppercase tracking-wider font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
                      isSelected 
                        ? 'bg-indigo-500/10 border-indigo-550/40 text-white shadow-md'
                        : 'bg-white/[0.01] border-white/5 text-gray-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{d}</span>
                    <span className="text-[8px] opacity-40 font-normal capitalize">
                      {d === 'compact' && 'Dense Gaps'}
                      {d === 'normal' && 'Standard UI'}
                      {d === 'spacious' && 'Breathe'}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] font-mono text-gray-500 text-center uppercase tracking-widest mt-4">Alters margins, grid spacing, and card padding levels across paths.</p>
          </GlassCard>

          {/* Animation Level selectors */}
          <GlassCard className="p-6 border-white/5 bg-white/[0.015]">
            <h3 className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest pb-3 border-b border-white/5 mb-5 flex items-center gap-1.5 font-bold">
              <Activity className="w-4 h-4" /> Motion Dynamic Loops
            </h3>

            <div className="grid grid-cols-4 gap-2">
              {(['none', 'slow', 'normal', 'high'] as AnimationIntensity[]).map((intensity) => {
                const isSelected = animationIntensity === intensity;
                return (
                  <button
                    key={intensity}
                    onClick={() => setAnimationIntensity(intensity)}
                    className={`py-2 px-1 rounded-xl border font-mono text-[9px] uppercase tracking-widest font-bold transition-all flex flex-col items-center justify-center ${
                      isSelected 
                        ? 'bg-indigo-500/10 border-indigo-550/40 text-white shadow-md'
                        : 'bg-white/[0.01] border-white/5 text-gray-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{intensity}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] font-mono text-gray-500 text-center uppercase tracking-widest mt-4">Scales transition duration and spring damping on animations.</p>
          </GlassCard>

        </div>

        {/* Right column elements (Cols 6-12): Cinematic theme selection and uploaded wallpapers */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Theme Selector Deck */}
          <GlassCard className="p-6 border-white/5 bg-white/[0.015]">
            <h3 className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest pb-3 border-b border-white/5 mb-5 flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Cinematic System Themes
            </h3>

            {/* Grid of Theme options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {THEME_PRESETS.map((p) => {
                const isSelected = activeThemeId === p.id;
                
                return (
                  <button
                    key={p.id}
                    onClick={() => setTheme(p.id)}
                    className={`group text-left border rounded-2xl p-3.5 transition-all outline-none flex flex-col justify-between relative overflow-hidden h-32 cursor-pointer ${
                      isSelected 
                        ? 'bg-white/[0.025] border-indigo-500/50 text-white shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30'
                        : 'bg-white/[0.01] border-white/5 text-gray-400 hover:text-white hover:bg-white/[0.02] hover:border-white/10'
                    }`}
                  >
                    {/* Tiny micro lighting visual preview */}
                    <div className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity">
                      <div className="absolute -top-10 -left-10 w-20 h-20 rounded-full blur-xl" style={{ backgroundColor: p.ambient1 }} />
                      <div className="absolute -bottom-10 -right-10 w-20 h-20 rounded-full blur-xl" style={{ backgroundColor: p.ambient2 }} />
                    </div>

                    <div className="relative z-10">
                      <h4 className="text-xs font-serif italic text-white flex items-center gap-1">
                        {p.name}
                      </h4>
                      <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest mt-1">Palette spec</p>
                    </div>

                    <div className="relative z-10 flex items-center justify-between w-full mt-4">
                      {/* Swatch Previews */}
                      <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: p.bg }} title="Primary Core Background" />
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.primary }} title="Primary Glow Accent" />
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.secondary }} title="Secondary Ambient Color" />
                      </div>

                      {isSelected && (
                        <span className="p-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                          <Check className="w-3 h-3 block" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Accent Color Override Swatches */}
          <GlassCard className="p-6 border-white/5 bg-white/[0.015]">
            <h3 className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest pb-3 border-b border-white/5 mb-5 flex items-center gap-1.5 font-bold">
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" /> Accent Aura Overrides
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ACCENT_COLOR_PRESETS.map((preset) => {
                const isActive = activeAccentId === preset.id;
                const isNative = preset.id === 'default';

                return (
                  <button
                    key={preset.id}
                    onClick={() => setAccentColor(preset.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-550/10 border-indigo-505/30 text-white'
                        : 'bg-white/[0.01] border-white/5 text-gray-400 hover:text-white hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="min-w-0">
                      <h5 className="text-[10.5px] font-medium leading-none block truncate">{preset.name}</h5>
                      <span className="text-[8px] font-mono text-gray-500 uppercase mt-0.5 block leading-none">
                        {isNative ? 'Theme Linked' : 'Static Override'}
                      </span>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      {isNative ? (
                        <div className="w-4 h-4 rounded-full border border-dashed border-white/20 flex items-center justify-center text-[7px]" />
                      ) : (
                        <>
                          <span className="w-3.5 h-3.5 rounded-full block border border-white/5" style={{ backgroundColor: preset.primary }} />
                          <span className="w-3.5 h-3.5 rounded-full block border border-white/5" style={{ backgroundColor: preset.secondary }} />
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] font-mono text-gray-500 text-center uppercase tracking-widest mt-4">Injects custom primary and secondary color overrides into components dynamically.</p>
          </GlassCard>

          {/* Ambient Wallpapers & Opacity */}
          <GlassCard className="p-6 border-white/5 bg-white/[0.015]">
            <h3 className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest pb-3 border-b border-white/5 mb-5 flex items-center gap-1.5 font-bold">
              <Image className="w-4 h-4 text-indigo-400" /> Custom Ambient Wallpaper
            </h3>

            {/* Custom file Drop Zone */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-2.5 bg-white/[0.005] select-none ${
                isDragging 
                  ? 'border-indigo-500/50 bg-indigo-500/10 scale-98 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                  : (backgroundImage ? 'border-indigo-500/15 hover:border-indigo-500/30' : 'border-white/10 hover:border-indigo-500/30 hover:bg-white/[0.01]')
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden" 
              />

              {backgroundImage ? (
                // Selected/Uploaded custom preview card
                <div className="flex items-center gap-3 w-full p-2 bg-neutral-950/60 rounded-2xl border border-white/5">
                  <div 
                    className="w-14 h-14 rounded-xl bg-cover bg-center shrink-0 border border-white/10"
                    style={{ backgroundImage: `url(${backgroundImage})` }}
                  />
                  <div className="min-w-0 flex-1 text-left">
                    <span className="text-[8px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded tracking-wide font-black">IMAGE LOADED</span>
                    <h5 className="text-xs font-semibold text-white truncate mt-1 leading-snug">Personal Wallpaper Profile</h5>
                    <p className="text-[9px] font-mono text-gray-500">Stored inside LocalStorage sandbox</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBackground();
                    }}
                    className="p-2 border border-rose-500/10 hover:border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all mr-1.5"
                    title="Remove custom wallpaper"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-indigo-400 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Drag & Drop Background file</h4>
                    <p className="text-[9.5px] text-gray-500 mt-1">Supports PNG, JPG, or WEBP. Max resolution sizes: 1.5MB limit</p>
                  </div>
                </>
              )}

              {uploadError && (
                <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-center justify-center gap-1.5 text-rose-400 mt-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="text-[9px] font-mono text-left leading-normal">{uploadError}</span>
                </div>
              )}
            </div>

            {/* Ambient Background Wallpaper Opacity slider */}
            <div className="space-y-2 mt-5 select-none pt-4 border-t border-white/5">
              <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" /> Wallpaper Dynamic Opacity
                </span>
                <span className="text-indigo-400 font-bold">{bgOpacity}%</span>
              </div>
              <input 
                type="range"
                min="5"
                max="95"
                value={bgOpacity}
                onChange={(e) => setBgOpacity(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1 rounded-lg bg-white/10 appearance-auto cursor-pointer"
              />
              <p className="text-[8.5px] font-mono text-gray-500 text-center uppercase tracking-widest leading-relaxed">Adapts card backgrounds, solid overlays, and custom wallpaper visibility strengths on pages.</p>
            </div>
          </GlassCard>

        </div>

      </div>

    </div>
  );
}
export default Settings;
