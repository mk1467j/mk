import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '@/components/GlassCard';
import { GlowButton } from '@/components/GlowButton';
import { useMusic, parseImportLink, Playlist, MusicTrack } from '@/context/MusicContext';
import { 
  Plus, Play, Pause, Trash2, ArrowUpRight, Radio, Sparkles, Sliders,
  HelpCircle, Volume2, Search, Shuffle, Repeat, Heart, Info, Check, AlertCircle,
  FolderPlus, Library, Compass, Link as LinkIcon, Youtube, Disc, X
} from 'lucide-react';

const SUGGESTED_LINKS = [
  { name: 'Classic Chill Lofi Stream', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk' },
  { name: 'Synthwave Study Beats Track', url: 'https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn99mZh' },
  { name: 'Public Domain Chill MP3 Loop', url: 'https://pub-c5e31b5cdafb419a86622d1ba4cb0520.r2.dev/lofi-study-beats.mp3' }
];

export function Music() {
  const {
    playlists,
    activePlaylistId,
    currentTrackIndex,
    currentTrack,
    isPlaying,
    isMuted,
    volume,
    isShuffle,
    isLoop,
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    toggleMute,
    setVolume,
    toggleShuffle,
    toggleLoop,
    importLink,
    deleteTrack,
    createPlaylist,
    addTrackToPlaylist
  } = useMusic();

  const [searchQuery, setSearchQuery] = useState('');
  const [importInput, setImportInput] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  // Forms for custom playlists
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  const activePlaylist = playlists.find(p => p.id === activePlaylistId) || playlists[0];

  // Filters track list by search query
  const filteredTracks = React.useMemo(() => {
    if (!activePlaylist) return [];
    const query = searchQuery.toLowerCase().trim();
    if (!query) return activePlaylist.tracks;
    return activePlaylist.tracks.filter(t => 
      t.title.toLowerCase().includes(query) || 
      t.artist.toLowerCase().includes(query)
    );
  }, [activePlaylist, searchQuery]);

  // Handle URL link triggers
  const handleImport = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setImportError('');
    setImportSuccess(false);

    if (!importInput.trim()) {
      setImportError('Please specify a valid clipboard URL');
      return;
    }

    const outcome = importLink(importInput);
    if (outcome) {
      setImportSuccess(true);
      setImportInput('');
      const clearSuccess = setTimeout(() => setImportSuccess(false), 3000);
      return () => clearTimeout(clearSuccess);
    } else {
      setImportError('Invalid or unsupported URL specification. Please ensure it is a YouTube (video/playlist), Spotify (track/playlist/album/episode/show), or raw web audio (.mp3) link.');
    }
  };

  // Create custom playlist action
  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    createPlaylist(newPlaylistName, newPlaylistDesc);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setShowCreatePlaylist(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 min-h-screen pb-16 relative overflow-x-hidden">
      
      {/* Dynamic ambient highlight lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-[0.05] bg-gradient-to-tr from-brand-purple to-transparent" />
        <div className="absolute bottom-1/4 right-1/4 w-[45vw] h-[45vw] rounded-full blur-[120px] opacity-[0.05] bg-gradient-to-br from-indigo-500 to-transparent" />
      </div>

      {/* Cinematic Header Block */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-white/5 relative z-10 gap-4">
        <div>
           <h1 className="text-4xl text-white mb-1 serif-title tracking-tight flex items-center gap-2">
             Ambient Soundscapes
             <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-indigo-550/15 text-indigo-400 border border-indigo-550/20 font-mono text-[9px] uppercase tracking-wider">
               Studio Audio
             </span>
           </h1>
           <p className="text-gray-400 text-xs">Acoustics tuning system. Instantly load custom presets or bind direct Spotfiy & YouTube audio tracks into unified focus channels.</p>
        </div>

        <div className="flex gap-2">
          <GlowButton 
            onClick={() => setShowCreatePlaylist(true)}
            className="text-xs flex items-center gap-1.5 font-mono uppercase tracking-widest px-4 py-2"
          >
            <FolderPlus className="w-3.5 h-3.5" /> New Playlist
          </GlowButton>
        </div>
      </header>

      {/* Main split-view dashboard columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Left Side Column: Playlists selector and input forms (Cols 1-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active Preset Playlists Folder Drawer */}
          <GlassCard className="p-5 border-white/5 bg-white/[0.015]">
            <h3 className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest pb-3 border-b border-white/5 mb-4 flex items-center gap-1.5 font-semibold">
              <Library className="w-4 h-4 text-indigo-400" /> Active Media Library
            </h3>

            <div className="space-y-2.5">
              {playlists.map((playlist) => {
                const isActive = activePlaylistId === playlist.id;
                const isImportedList = playlist.id === 'imported';

                return (
                  <button
                    key={playlist.id}
                    onClick={() => playTrack(playlist.id, 0)}
                    className={`w-full text-left rounded-xl border p-3.5 transition-all flex items-center justify-between gap-3 ${
                      isActive 
                        ? 'bg-indigo-500/10 border-indigo-500/40 text-white shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                        : 'bg-white/[0.01] border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-indigo-400 animate-pulse' : 'bg-gray-650'}`} />
                        <h4 className="text-xs font-semibold truncate uppercase tracking-wider">{playlist.name}</h4>
                      </div>
                      <p className="text-[9.5px] text-gray-500 mt-1 truncate leading-snug">{playlist.description}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[9px] font-mono bg-white/5 px-2 py-0.5 rounded text-gray-400">
                        {playlist.tracks.length}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Import custom URL feeds */}
          <GlassCard className="p-5 border-white/5 bg-white/[0.015]">
             <h3 className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest pb-3 border-b border-white/5 mb-4.5 flex items-center gap-1.5 font-semibold">
               <LinkIcon className="w-4 h-4 text-indigo-400" /> Import Media Feeds
             </h3>

             <form onSubmit={handleImport} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider font-bold">Paste URL Clipboard</span>
                  <div className="relative">
                     <input
                       type="text"
                       value={importInput}
                       onChange={(e) => setImportInput(e.target.value)}
                       placeholder="YouTube/Spotify/MP3 link..."
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                     />
                  </div>
                </div>

                {importError && (
                  <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-start gap-1.5">
                     <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                     <p className="text-[9px] font-mono text-rose-400 leading-normal">{importError}</p>
                  </div>
                )}

                {importSuccess && (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-1.5">
                     <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                     <p className="text-[9px] font-mono text-emerald-400">Track parsed successfully and pre-linked to Imports.</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-white text-black border border-transparent rounded-xl font-mono text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-gray-100 transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Load Registry Track
                </button>
             </form>

             {/* Suggested Core links */}
             <div className="pt-4 border-t border-white/5 mt-4 space-y-2">
                <span className="text-[8.5px] font-mono text-gray-500 uppercase tracking-wider font-bold block">Quick Presets</span>
                <div className="space-y-1.5">
                  {SUGGESTED_LINKS.map((link, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setImportInput(link.url);
                        setImportError('');
                      }}
                      className="w-full text-left p-2 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/5 hover:border-white/10 transition-colors flex items-center justify-between text-[9.5px] font-mono text-gray-400 hover:text-white"
                    >
                      <span className="truncate pr-2">{link.name}</span>
                      <ArrowUpRight className="w-3 h-3 text-indigo-400 shrink-0" />
                    </button>
                  ))}
                </div>
             </div>
          </GlassCard>

          {/* Guidelines info card */}
          <div className="p-4 bg-white/[0.015] border border-white/5 rounded-2xl flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-550 leading-relaxed">
              <span className="text-indigo-400 font-mono uppercase font-black mr-1">[Integrations Guide]</span>
              YouTube streams play silently in the background while Spotify syncs using active embedded panels inside the floating sound deck widgets.
            </p>
          </div>

        </div>

        {/* Right Side Column: Active playlist track rows list and full integrated web controller (Cols 5-12) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Playlist Header Control Box */}
          <GlassCard className="p-5 border-white/5 bg-white/[0.015]">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/5 mb-5 select-none">
                <div>
                   <h2 className="text-xl text-white font-serif">{activePlaylist.name}</h2>
                   <p className="text-[10px] text-gray-505 font-mono uppercase mt-0.5">{activePlaylist.description}</p>
                </div>

                <div className="relative w-full md:w-64">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                   <input
                     type="text"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search playlist tracks..."
                     className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500/40"
                   />
                </div>
             </div>

             {/* Tracks row loop blocks */}
             <div className="space-y-2">
                {filteredTracks.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.005] flex flex-col items-center justify-center space-y-3">
                     <span className="text-2xl text-gray-600">📭</span>
                     <div>
                        <h4 className="text-xs font-serif text-gray-400">Library segment empty</h4>
                        <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">Import custom source urls on the left panel</p>
                     </div>
                  </div>
                ) : (
                  filteredTracks.map((track, idx) => {
                    const isNowPlaying = currentTrack?.id === track.id && isPlaying;
                    const isSelected = currentTrack?.id === track.id;

                    const activeIndexInPlaylist = activePlaylist.tracks.findIndex(t => t.id === track.id);

                    return (
                      <div
                        key={track.id}
                        className={`group p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isSelected 
                            ? 'bg-indigo-500/5 border-indigo-500/20 text-white shadow-inner'
                            : 'bg-white/[0.015] border-white/5 hover:border-white/10 hover:bg-white/[0.025] text-gray-300'
                        }`}
                      >
                         <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            {/* Play trigger button */}
                            <button
                              onClick={() => {
                                if (isSelected) {
                                  togglePlay();
                                } else {
                                  playTrack(activePlaylistId, activeIndexInPlaylist);
                                }
                              }}
                              className={`p-2.5 rounded-xl flex items-center justify-center border transition-all ${
                                isSelected 
                                  ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                                  : 'bg-white/5 border-white/10 group-hover:bg-indigo-500 group-hover:border-indigo-400 group-hover:text-white'
                              }`}
                            >
                              {isNowPlaying ? (
                                <Pause className="w-3.5 h-3.5 fill-current" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                              )}
                            </button>

                            {/* Details text */}
                            <div className="min-w-0 flex-1">
                               <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold truncate block leading-snug">{track.title}</span>
                                  {isNowPlaying && (
                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[7px] uppercase tracking-wider animate-pulse height-xs">
                                      live audio
                                    </span>
                                  )}
                               </div>
                               <div className="flex items-center gap-2 flex-wrap mt-0.5 text-[10px] text-gray-500 font-mono">
                                  <span>{track.artist}</span>
                                  <span>•</span>
                                  <span className="capitalize">{track.source} Source</span>
                               </div>
                            </div>
                         </div>

                         {/* Track stats & actions */}
                         <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{track.duration}</span>
                            
                            {/* Deletion handles for custom loaded URL links */}
                            {track.id.startsWith('imported-') && (
                              <button
                                onClick={() => deleteTrack(activePlaylistId, track.id)}
                                className="p-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/25 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center shrink-0"
                                title="Delete Imported Entry"
                              >
                                 <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                         </div>
                      </div>
                    );
                  })
                )}
             </div>
          </GlassCard>

          {/* Custom Creation Dialog Modal popup */}
          <AnimatePresence>
            {showCreatePlaylist && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
              >
                <GlassCard className="w-full max-w-md p-6 border-white/10 bg-neutral-900/90 shadow-2xl relative">
                  <button 
                    onClick={() => setShowCreatePlaylist(false)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                  >
                     <X className="w-5 h-5" />
                  </button>

                  <h3 className="serif-title text-lg text-white mb-1.5 uppercase tracking-wide">Generate Custom Playlist folder</h3>
                  <p className="text-gray-550 text-xs font-mono">CREATE A STRUCTURED CHANNEL FOR SPECIFIC SUBJECT BLOCK GROUPS</p>

                  <form onSubmit={handleCreatePlaylist} className="space-y-4 mt-5">
                     <div className="space-y-1">
                       <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider font-bold">Playlist Descriptor Name</label>
                       <input
                         type="text"
                         required
                         value={newPlaylistName}
                         onChange={(e) => setNewPlaylistName(e.target.value)}
                         placeholder="e.g., Quantum Mathematics Mix..."
                         className="w-full bg-white/5 border border-white/10 rounded-xl px-4.5 py-3 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                       />
                     </div>

                     <div className="space-y-1">
                       <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider font-bold">Playlist Description info</label>
                       <input
                         type="text"
                         value={newPlaylistDesc}
                         onChange={(e) => setNewPlaylistDesc(e.target.value)}
                         placeholder="e.g., Retrospective high density focus logs..."
                         className="w-full bg-white/5 border border-white/10 rounded-xl px-4.5 py-3 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                       />
                     </div>

                     <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowCreatePlaylist(false)}
                          className="py-3.5 border border-white/5 bg-white/5 rounded-xl text-xs font-mono text-gray-400 hover:text-white uppercase tracking-widest font-bold"
                        >
                           Abrogate
                        </button>
                        <button
                          type="submit"
                          className="py-3.5 bg-indigo-500 text-white rounded-xl text-xs font-mono uppercase tracking-widest font-black shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                        >
                           Establish
                        </button>
                     </div>
                  </form>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
export default Music;
