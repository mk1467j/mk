import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  source: 'builtin' | 'url' | 'youtube' | 'spotify';
  type: 'ambient' | 'lofi' | 'academic' | 'imported';
  url: string; // URL, Video ID, Spotify URI, or synth preset identifier
  synthesizerPreset?: 'rain' | 'cafe' | 'white-noise' | 'fan' | 'night' | 'deep-focus' | 'soft-piano' | 'lofi-beats';
  duration?: string;
  cover?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: MusicTrack[];
  isCustom?: boolean;
}

interface MusicContextType {
  playlists: Playlist[];
  activePlaylistId: string;
  currentTrackIndex: number;
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number; // 0 - 100
  progress: number; // 0 - 100
  duration: number; // seconds
  currentTime: number; // seconds
  isShuffle: boolean;
  isLoop: boolean; // 'track' / 'none'
  activePreset: string | null;
  // Actions
  playTrack: (playlistId: string, trackIndex: number) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleMute: () => void;
  setVolume: (val: number) => void;
  seek: (percent: number) => void;
  toggleShuffle: () => void;
  toggleLoop: () => void;
  importLink: (url: string) => boolean;
  deleteTrack: (playlistId: string, trackId: string) => void;
  createPlaylist: (name: string, description?: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Omit<MusicTrack, 'id'>) => void;
  activePlaylist: Playlist | null;
  // YouTube element anchor
  setYoutubePlayer: (player: any) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

// Core tracks for Built-In player
const BUILTIN_TRACKS: MusicTrack[] = [
  {
    id: 'builtin-rain',
    title: 'Rain on Window',
    artist: 'StudyVibe Ambient Synth',
    source: 'builtin',
    type: 'ambient',
    url: 'rain',
    synthesizerPreset: 'rain',
    duration: '∞',
    cover: '🌧️',
  },
  {
    id: 'builtin-cafe',
    title: 'Cosy Parisian Cafe',
    artist: 'StudyVibe Chatter Synth',
    source: 'builtin',
    type: 'ambient',
    url: 'cafe',
    synthesizerPreset: 'cafe',
    duration: '∞',
    cover: '☕',
  },
  {
    id: 'builtin-white-noise',
    title: 'Pure White Noise',
    artist: 'StudyVibe Calming Drone',
    source: 'builtin',
    type: 'ambient',
    url: 'white-noise',
    synthesizerPreset: 'white-noise',
    duration: '∞',
    cover: '🌫️',
  },
  {
    id: 'builtin-fan',
    title: 'Vintage Desk Fan',
    artist: 'StudyVibe Deep Vanes',
    source: 'builtin',
    type: 'ambient',
    url: 'fan',
    synthesizerPreset: 'fan',
    duration: '∞',
    cover: '💨',
  },
  {
    id: 'builtin-night',
    title: 'Midnight Crickets',
    artist: 'StudyVibe Evolving Air',
    source: 'builtin',
    type: 'ambient',
    url: 'night',
    synthesizerPreset: 'night',
    duration: '∞',
    cover: '🌙',
  },
  {
    id: 'builtin-deep-focus',
    title: 'Binaural Deep Focus',
    artist: 'StudyVibe Binaural Waves',
    source: 'builtin',
    type: 'ambient',
    url: 'deep-focus',
    synthesizerPreset: 'deep-focus',
    duration: '∞',
    cover: '🧠',
  },
  {
    id: 'builtin-soft-piano',
    title: 'Procedural Soft Piano',
    artist: 'StudyVibe Generative Keys',
    source: 'builtin',
    type: 'lofi',
    url: 'soft-piano',
    synthesizerPreset: 'soft-piano',
    duration: '∞',
    cover: '🎹',
  },
  {
    id: 'builtin-lofi-beats',
    title: 'Infinite Scholar Beats',
    artist: 'StudyVibe Chill Drummer',
    source: 'builtin',
    type: 'lofi',
    url: 'lofi-beats',
    synthesizerPreset: 'lofi-beats',
    duration: '∞',
    cover: '🎧',
  }
];

export function parseImportLink(url: string): Omit<MusicTrack, 'id'> | null {
  const trimmed = url.trim();
  
  const ytVideoReg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const ytPlaylistReg = /[?&]list=([^"&?\/\s]+)/;
  
  const spotifyReg = /spotify(?:\/|:)(track|playlist|album|episode|show)(?:\/|:)([a-zA-Z0-9]+)/;
  const spotifyUrlReg = /open\.spotify\.com\/(track|playlist|album|episode|show)\/([a-zA-Z0-9]+)/;

  const ytVideoMatch = trimmed.match(ytVideoReg);
  const ytPlaylistMatch = trimmed.match(ytPlaylistReg);
  const spotifyUrlMatch = trimmed.match(spotifyUrlReg);
  const spotifyMatch = trimmed.match(spotifyReg);

  if (ytPlaylistMatch) {
    return {
      title: `YT Playlist ${ytPlaylistMatch[1].substring(0, 8)}...`,
      artist: 'YouTube Live',
      source: 'youtube',
      type: 'imported',
      url: ytPlaylistMatch[1],
      duration: 'Playlist',
      cover: '📺'
    };
  } else if (ytVideoMatch) {
    return {
      title: `YT Stream ${ytVideoMatch[1].substring(0, 8)}...`,
      artist: 'YouTube Video',
      source: 'youtube',
      type: 'imported',
      url: ytVideoMatch[1],
      duration: 'Live',
      cover: '🎥'
    };
  } else if (spotifyUrlMatch) {
    const type = spotifyUrlMatch[1];
    return {
      title: `${type.toUpperCase()} from Spotify`,
      artist: 'Spotify Sync',
      source: 'spotify',
      type: 'imported',
      url: `spotify:${type}:${spotifyUrlMatch[2]}`,
      duration: 'Active',
      cover: '🟢'
    };
  } else if (spotifyMatch) {
    const type = spotifyMatch[1];
    return {
      title: `${type.toUpperCase()} from Code`,
      artist: 'Spotify Link',
      source: 'spotify',
      type: 'imported',
      url: trimmed,
      duration: 'Active',
      cover: '🟢'
    };
  } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Extract file name
    const parts = trimmed.split('/');
    const name = parts[parts.length - 1].split('?')[0] || 'Imported Stream';
    return {
      title: decodeURIComponent(name).replace(/\+/g, ' '),
      artist: 'Web Audio URL',
      source: 'url',
      type: 'imported',
      url: trimmed,
      duration: 'Audio',
      cover: '🔗'
    };
  }

  return null;
}

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Playlists loaded from LS or default
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('studyvibe_playlists');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'all-ambient', name: 'Ambient Soundscapes', description: 'Cozy atmospheric generators for deeper retention', tracks: BUILTIN_TRACKS, isCustom: false },
      { id: 'imported', name: 'Scholar Imported Links', description: 'Custom tracks or playlists loaded from YouTube and Spotify link imports', tracks: [], isCustom: false }
    ];
  });

  const [activePlaylistId, setActivePlaylistId] = useState(() => {
    return localStorage.getItem('studyvibe_music_playlist_id') || 'all-ambient';
  });

  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => {
    const val = localStorage.getItem('studyvibe_music_track_idx');
    return val !== null ? parseInt(val, 10) : 0;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('studyvibe_music_muted') === 'true';
  });

  const [volume, setVolumeState] = useState(() => {
    const val = localStorage.getItem('studyvibe_music_vol');
    return val !== null ? parseInt(val, 10) : 60;
  });

  const [isShuffle, setIsShuffle] = useState(() => {
    return localStorage.getItem('studyvibe_music_shuffle') === 'true';
  });

  const [isLoop, setIsLoop] = useState(() => {
    return localStorage.getItem('studyvibe_music_loop') === 'true';
  });

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  // References for Player objects
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const customAudioCtxRef = useRef<AudioContext | null>(null);
  const activeSynthNodeRef = useRef<any[]>([]); // holds synthesized oscillators, gain, and generator references
  const synthIntervalRef = useRef<any>(null); // clock intervals for generative soft piano/lofi beats
  const ytPlayerRef = useRef<any>(null); // holds YouTube iframe bridge instance

  // Active track index resolve
  const activePlaylist = playlists.find(p => p.id === activePlaylistId) || playlists[0];
  const currentTrack = activePlaylist.tracks[currentTrackIndex] || null;

  // Persist settings
  useEffect(() => {
    localStorage.setItem('studyvibe_playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem('studyvibe_music_playlist_id', activePlaylistId);
    setCurrentTrackIndex(0);
  }, [activePlaylistId]);

  useEffect(() => {
    localStorage.setItem('studyvibe_music_track_idx', currentTrackIndex.toString());
    setCurrentTime(0);
    setProgress(0);
    setDuration(0);
    
    // Auto-pre-trigger audio type switch
    if (isPlaying) {
      triggerPlayback();
    }
  }, [currentTrackIndex]);

  useEffect(() => {
    localStorage.setItem('studyvibe_music_muted', isMuted.toString());
    updateVolume();
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem('studyvibe_music_vol', volume.toString());
    updateVolume();
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('studyvibe_music_shuffle', isShuffle.toString());
  }, [isShuffle]);

  useEffect(() => {
    localStorage.setItem('studyvibe_music_loop', isLoop.toString());
  }, [isLoop]);

  // Sync state tracking loop for standard HTML5 Audio
  useEffect(() => {
    const handleTimeUpdate = () => {
      if (audioRef.current && currentTrack?.source === 'url') {
        const t = audioRef.current.currentTime;
        const d = audioRef.current.duration || 0;
        setCurrentTime(t);
        setDuration(d);
        setProgress(d > 0 ? (t / d) * 100 : 0);
      }
    };

    const handleEnded = () => {
      if (isLoop) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
      } else {
        nextTrack();
      }
    };

    if (audioRef.current) {
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleEnded);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [currentTrack, isLoop]);

  // Main system audio control trigger
  useEffect(() => {
    if (isPlaying) {
      triggerPlayback();
    } else {
      pausePlayback();
    }
    return () => {
      // route-safe safe cleanup loops
      cleanupSynthesis();
    };
  }, [isPlaying, currentTrackIndex]);

  const setYoutubePlayer = (player: any) => {
    ytPlayerRef.current = player;
    // Apply mute/volume to YouTube player immediately
    if (player) {
      try {
        player.setVolume(isMuted ? 0 : volume);
        if (isPlaying && currentTrack?.source === 'youtube') {
          player.playVideo();
        }
      } catch (e) {}
    }
  };

  const updateVolume = () => {
    const activeVolume = isMuted ? 0 : volume;

    // 1. Sync standard audio volume
    if (audioRef.current) {
      audioRef.current.volume = activeVolume / 100;
    }

    // 2. Sync active synthesis volumes
    if (activeSynthNodeRef.current.length > 0) {
      activeSynthNodeRef.current.forEach(item => {
        if (item && item.gainNode && customAudioCtxRef.current) {
          const baseVol = item.presetBaseVolume || 0.1;
          const scaled = (activeVolume / 100) * baseVol;
          item.gainNode.gain.linearRampToValueAtTime(scaled, customAudioCtxRef.current.currentTime + 0.1);
        }
      });
    }

    // 3. Sync YT Player Volume
    if (ytPlayerRef.current) {
      try {
        if (typeof ytPlayerRef.current.setVolume === 'function') {
          ytPlayerRef.current.setVolume(activeVolume);
        }
      } catch (e) {}
    }
  };

  const playTrack = (playlistId: string, trackIndex: number) => {
    setActivePlaylistId(playlistId);
    setCurrentTrackIndex(trackIndex);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const nextTrack = () => {
    if (activePlaylist.tracks.length === 0) return;
    if (isShuffle) {
      const idx = Math.floor(Math.random() * activePlaylist.tracks.length);
      setCurrentTrackIndex(idx);
    } else {
      setCurrentTrackIndex(prev => (prev + 1) % activePlaylist.tracks.length);
    }
    setProgress(0);
    setCurrentTime(0);
  };

  const prevTrack = () => {
    if (activePlaylist.tracks.length === 0) return;
    setCurrentTrackIndex(prev => (prev - 1 + activePlaylist.tracks.length) % activePlaylist.tracks.length);
    setProgress(0);
    setCurrentTime(0);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const setVolume = (val: number) => {
    setVolumeState(Math.max(0, Math.min(100, val)));
  };

  const seek = (percent: number) => {
    const resolved = Math.max(0, Math.min(100, percent));
    
    if (currentTrack?.source === 'url' && audioRef.current && duration > 0) {
      const targetTime = (resolved / 100) * duration;
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
      setProgress(resolved);
    } else if (currentTrack?.source === 'youtube' && ytPlayerRef.current) {
      try {
        const ytDuration = ytPlayerRef.current.getDuration() || 0;
        if (ytDuration > 0) {
          const targetTime = (resolved / 100) * ytDuration;
          ytPlayerRef.current.seekTo(targetTime, true);
          setProgress(resolved);
        }
      } catch (e) {}
    } else {
      // Procedural synthetic loop simulation seek updates purely visually
      setProgress(resolved);
    }
  };

  const toggleShuffle = () => {
    setIsShuffle(prev => !prev);
  };

  const toggleLoop = () => {
    setIsLoop(prev => !prev);
  };

  const importLink = (url: string): boolean => {
    const parsed = parseImportLink(url);
    if (!parsed) return false;

    setPlaylists(prev => {
      return prev.map(p => {
        if (p.id === 'imported') {
          const freshTrack: MusicTrack = {
            id: `imported-${Date.now()}`,
            ...parsed
          };
          return {
            ...p,
            tracks: [freshTrack, ...p.tracks]
          };
        }
        return p;
      });
    });

    setActivePlaylistId('imported');
    return true;
  };

  const deleteTrack = (playlistId: string, trackId: string) => {
    setPlaylists(prev => {
      return prev.map(p => {
        if (p.id === playlistId) {
          const filtered = p.tracks.filter(t => t.id !== trackId);
          return { ...p, tracks: filtered };
        }
        return p;
      });
    });

    // Reset track indexes safely if the deletion affects active indexes
    if (activePlaylistId === playlistId) {
      setCurrentTrackIndex(0);
      setProgress(0);
      setCurrentTime(0);
    }
  };

  const createPlaylist = (name: string, description: string = '') => {
    const id = `custom-pl-${Date.now()}`;
    setPlaylists(prev => [
      ...prev,
      { id, name, description, tracks: [], isCustom: true }
    ]);
  };

  const addTrackToPlaylist = (playlistId: string, track: Omit<MusicTrack, 'id'>) => {
    setPlaylists(prev => {
      return prev.map(p => {
        if (p.id === playlistId) {
          const fresh: MusicTrack = {
            id: `track-${Date.now()}`,
            ...track
          };
          return { ...p, tracks: [...p.tracks, fresh] };
        }
        return p;
      });
    });
  };

  /* ==========================================================================
     INTEGRATED HIGH-fidelity WEB AUDIO SYNTHESIZERS
     ========================================================================== */

  const triggerPlayback = () => {
    pausePlayback(); // stop any other playing audio systems first

    if (!currentTrack) return;

    if (currentTrack.source === 'builtin') {
      runSynthesis(currentTrack.synthesizerPreset);
    } else if (currentTrack.source === 'url') {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = currentTrack.url;
      audioRef.current.loop = isLoop;
      audioRef.current.volume = (isMuted ? 0 : volume) / 100;
      audioRef.current.play().catch(e => {
        console.error("Audio playback error. User interaction rule might block auto-play.", e);
      });
    } else if (currentTrack.source === 'youtube' && ytPlayerRef.current) {
      try {
        const id = currentTrack.url;
        const isPlaylist = id.startsWith('PL') || currentTrack.duration === 'Playlist';
        
        if (isPlaylist) {
          if (typeof ytPlayerRef.current.loadPlaylist === 'function') {
            ytPlayerRef.current.loadPlaylist({
              list: id,
              listType: 'playlist',
              index: 0,
              startSeconds: 0
            });
          }
        } else {
          if (typeof ytPlayerRef.current.loadVideoById === 'function') {
            ytPlayerRef.current.loadVideoById(id);
          }
        }
        
        if (typeof ytPlayerRef.current.setVolume === 'function') {
          ytPlayerRef.current.setVolume(isMuted ? 0 : volume);
        }
        if (typeof ytPlayerRef.current.playVideo === 'function') {
          ytPlayerRef.current.playVideo();
        }
      } catch (e) {
        console.error("YouTube playback error:", e);
      }
    }
  };

  const pausePlayback = () => {
    // 1. Pause HTML Audio
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch (e) {}
    }

    // 2. Pause synthesis
    cleanupSynthesis();

    // 3. Pause YouTube
    if (ytPlayerRef.current) {
      try {
        if (typeof ytPlayerRef.current.pauseVideo === 'function') {
          ytPlayerRef.current.pauseVideo();
        }
      } catch (e) {}
    }
  };

  // Preloads and creates standard noise buffer configurations
  const createNoiseBuffer = (ctx: AudioContext, type: 'white' | 'brown' | 'pink') => {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'brown') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 4.5; // Compensate volume loss
      }
    } else {
      // Pink Noise
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        data[i] *= 0.11; // Compensate volume
      }
    }
    return buffer;
  };

  const runSynthesis = (preset?: string) => {
    try {
      if (!customAudioCtxRef.current) {
        customAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = customAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const activeVolume = isMuted ? 0 : volume;
      cleanupSynthesis();

      // Simple visual time ticking driver for synthetic loops
      synthIntervalRef.current = setInterval(() => {
        setCurrentTime(t => t + 1);
        setProgress(p => (p >= 100 ? 0 : p + 0.2));
      }, 1000);

      // Rain Synthesizer Preset
      if (preset === 'rain') {
        const rainSource = ctx.createBufferSource();
        rainSource.buffer = createNoiseBuffer(ctx, 'pink');
        rainSource.loop = true;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(650, ctx.currentTime);

        const gainNode = ctx.createGain();
        const presetBaseVol = 0.45;
        gainNode.gain.setValueAtTime(((activeVolume / 100) * presetBaseVol), ctx.currentTime);

        rainSource.connect(lowpass);
        lowpass.connect(gainNode);
        gainNode.connect(ctx.destination);
        rainSource.start();

        // Crushing crackle simulator for realistic droplets on window
        const crackleInterval = setInterval(() => {
          if (Math.random() > 0.4) {
            const crackOsc = ctx.createOscillator();
            const crackGain = ctx.createGain();
            crackOsc.type = 'sine';
            crackOsc.frequency.setValueAtTime(100 + Math.random() * 500, ctx.currentTime);

            crackGain.gain.setValueAtTime(0.001 * (activeVolume / 100), ctx.currentTime);
            crackGain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.12);

            crackOsc.connect(crackGain);
            crackGain.connect(ctx.destination);
            crackOsc.start();
            crackOsc.stop(ctx.currentTime + 0.15);
          }
        }, 180);

        activeSynthNodeRef.current.push({
          source: rainSource,
          gainNode,
          presetBaseVolume: presetBaseVol,
          extraInterval: crackleInterval
        });
      }

      // Vintage Desk Fan Preset (low-pitch humming drone)
      else if (preset === 'fan') {
        const motorOsc = ctx.createOscillator();
        motorOsc.type = 'triangle';
        motorOsc.frequency.setValueAtTime(55, ctx.currentTime); // Low 55Hz Hum

        const fanNoise = ctx.createBufferSource();
        fanNoise.buffer = createNoiseBuffer(ctx, 'brown');
        fanNoise.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(120, ctx.currentTime);

        const modOsc = ctx.createOscillator();
        modOsc.type = 'sine';
        modOsc.frequency.setValueAtTime(6, ctx.currentTime); // 6Hz blade rotation modulation

        const modGain = ctx.createGain();
        modGain.gain.setValueAtTime(0.15, ctx.currentTime);

        const noiseGain = ctx.createGain();
        const presetBaseVol = 0.55;
        noiseGain.gain.setValueAtTime(((activeVolume / 100) * presetBaseVol), ctx.currentTime);

        modOsc.connect(modGain);
        modGain.connect(noiseGain.gain); // modulate volume dynamically

        // Connections
        motorOsc.connect(noiseGain);
        fanNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        motorOsc.start();
        fanNoise.start();
        modOsc.start();

        activeSynthNodeRef.current.push({
          source: motorOsc,
          gainNode: noiseGain,
          presetBaseVolume: presetBaseVol,
          secondaryNodes: [fanNoise, modOsc, noiseFilter]
        });
      }

      // Cozy Parisian Cafe Preset
      else if (preset === 'cafe') {
        // Cafe Background Rumble
        const cafeSource = ctx.createBufferSource();
        cafeSource.buffer = createNoiseBuffer(ctx, 'brown');
        cafeSource.loop = true;

        const cafeFilter = ctx.createBiquadFilter();
        cafeFilter.type = 'lowpass';
        cafeFilter.frequency.setValueAtTime(160, ctx.currentTime);

        const gainNode = ctx.createGain();
        const presetBaseVol = 0.6;
        gainNode.gain.setValueAtTime(((activeVolume / 100) * presetBaseVol), ctx.currentTime);

        cafeSource.connect(cafeFilter);
        cafeFilter.connect(gainNode);
        gainNode.connect(ctx.destination);
        cafeSource.start();

        // Slow soft chime triggers representing clinks & voices
        const cafeInterval = setInterval(() => {
          if (Math.random() > 0.5) {
            const chime = ctx.createOscillator();
            const chimeGain = ctx.createGain();
            chime.type = 'sine';
            chime.frequency.setValueAtTime(600 + Math.random() * 800, ctx.currentTime);

            chimeGain.gain.setValueAtTime(0.005 * (activeVolume / 100), ctx.currentTime);
            chimeGain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3);

            const chimeFilter = ctx.createBiquadFilter();
            chimeFilter.type = 'lowpass';
            chimeFilter.frequency.setValueAtTime(1000, ctx.currentTime);

            chime.connect(chimeFilter);
            chimeFilter.connect(chimeGain);
            chimeGain.connect(ctx.destination);

            chime.start();
            chime.stop(ctx.currentTime + 0.4);
          }
        }, 800);

        activeSynthNodeRef.current.push({
          source: cafeSource,
          gainNode,
          presetBaseVolume: presetBaseVol,
          extraInterval: cafeInterval
        });
      }

      // Pure White Noise Preset
      else if (preset === 'white-noise') {
        const whiteSource = ctx.createBufferSource();
        whiteSource.buffer = createNoiseBuffer(ctx, 'white');
        whiteSource.loop = true;

        const gainNode = ctx.createGain();
        const presetBaseVol = 0.15; // Noise requires lower base gain
        gainNode.gain.setValueAtTime(((activeVolume / 100) * presetBaseVol), ctx.currentTime);

        whiteSource.connect(gainNode);
        gainNode.connect(ctx.destination);
        whiteSource.start();

        activeSynthNodeRef.current.push({
          source: whiteSource,
          gainNode,
          presetBaseVolume: presetBaseVol
        });
      }

      // Midnight Crickets & Gentle Wind Preset
      else if (preset === 'night') {
        // 1. Wind synthesis using slowly modulated pink noise
        const windSource = ctx.createBufferSource();
        windSource.buffer = createNoiseBuffer(ctx, 'pink');
        windSource.loop = true;

        const windFilter = ctx.createBiquadFilter();
        windFilter.type = 'lowpass';
        windFilter.frequency.setValueAtTime(250, ctx.currentTime);

        const windGain = ctx.createGain();
        const presetBaseVol = 0.4;
        windGain.gain.setValueAtTime(((activeVolume / 100) * presetBaseVol), ctx.currentTime);

        // Wind modulation wave
        const windLfo = ctx.createOscillator();
        windLfo.type = 'sine';
        windLfo.frequency.setValueAtTime(0.1, ctx.currentTime); // very slow 10-second cycles

        const windLfoGain = ctx.createGain();
        windLfoGain.gain.setValueAtTime(0.12, ctx.currentTime);

        windLfo.connect(windLfoGain);
        windLfoGain.connect(windFilter.frequency); // Sweep filter frequency for wind gusts

        windSource.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(ctx.destination);

        windSource.start();
        windLfo.start();

        // 2. Cricket Chirper trigger
        const cricketInterval = setInterval(() => {
          if (Math.random() > 0.4) {
            const time = ctx.currentTime;
            // 3-4 micro chirps in sequence
            for (let i = 0; i < 4; i++) {
              const chirp = ctx.createOscillator();
              const chirpGain = ctx.createGain();
              chirp.type = 'sine';
              chirp.frequency.setValueAtTime(3800 + Math.random() * 200, time + (i * 0.08));

              chirpGain.gain.setValueAtTime(0, time + (i * 0.08));
              chirpGain.gain.linearRampToValueAtTime(0.008 * (activeVolume / 100), time + (i * 0.08) + 0.01);
              chirpGain.gain.exponentialRampToValueAtTime(0.00001, time + (i * 0.08) + 0.04);

              chirp.connect(chirpGain);
              chirpGain.connect(ctx.destination);
              chirp.start(time + (i * 0.08));
              chirp.stop(time + (i * 0.08) + 0.05);
            }
          }
        }, 1500);

        activeSynthNodeRef.current.push({
          source: windSource,
          gainNode: windGain,
          presetBaseVolume: presetBaseVol,
          secondaryNodes: [windLfo, windFilter, windLfoGain],
          extraInterval: cricketInterval
        });
      }

      // Binaural Deep Focus Preset
      else if (preset === 'deep-focus') {
        const splitter = ctx.createChannelMerger(2);

        // Left ear oscillator
        const oscLeft = ctx.createOscillator();
        oscLeft.type = 'sine';
        oscLeft.frequency.setValueAtTime(140, ctx.currentTime);

        // Right ear oscillator, detuned by 10Hz (Alpha focal brainwave)
        const oscRight = ctx.createOscillator();
        oscRight.type = 'sine';
        oscRight.frequency.setValueAtTime(150, ctx.currentTime);

        const leftGain = ctx.createGain();
        leftGain.gain.setValueAtTime(0.5, ctx.currentTime);

        const rightGain = ctx.createGain();
        rightGain.gain.setValueAtTime(0.5, ctx.currentTime);

        oscLeft.connect(leftGain);
        oscRight.connect(rightGain);

        leftGain.connect(splitter, 0, 0);
        rightGain.connect(splitter, 0, 1);

        const gainNode = ctx.createGain();
        const presetBaseVol = 0.35;
        gainNode.gain.setValueAtTime(((activeVolume / 100) * presetBaseVol), ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, ctx.currentTime);

        splitter.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscLeft.start();
        oscRight.start();

        activeSynthNodeRef.current.push({
          source: oscLeft,
          gainNode,
          presetBaseVolume: presetBaseVol,
          secondaryNodes: [oscRight, leftGain, rightGain, splitter, filter]
        });
      }

      // Infinite Soft Piano Generative preset (Peaceful pentatonic canvas clock block)
      else if (preset === 'soft-piano') {
        const pentatonicChords = [
          [130.81, 164.81, 196.00, 246.94], // C4 Major 7 (C, E, G, B)
          [110.00, 130.81, 164.81, 196.00], // A3 minor 7 (A, C, E, G)
          [174.61, 220.00, 261.63, 311.13], // F4 Major 7 (F, A, C, Eb is sharpish, Eb-minor, beautiful chord)
          [146.83, 174.61, 220.00, 293.66], // D4 minor 7 (D, F, A, C)
        ];

        let chordIndex = 0;

        // Custom scheduled synth triggers
        const pianoInterval = setInterval(() => {
          chordIndex = (chordIndex + 1) % pentatonicChords.length;
          const chord = pentatonicChords[chordIndex];

          chord.forEach((freq, i) => {
            setTimeout(() => {
              // Only play if volume is not muted
              const currentVol = isMuted ? 0 : volume;
              if (currentVol === 0) return;

              const osc = ctx.createOscillator();
              const noteGain = ctx.createGain();
              
              // Custom vintage physical filter modeling key velocity
              const noteFilter = ctx.createBiquadFilter();
              noteFilter.type = 'lowpass';
              noteFilter.frequency.setValueAtTime(600, ctx.currentTime);

              osc.type = i === 0 ? 'triangle' : 'sine'; // Deep fundamental triangle, lush upper sines
              osc.frequency.setValueAtTime(freq * (i === 0 ? 1 : 2), ctx.currentTime); // Double octaves for depth

              const pianoGainScale = 0.02 * (currentVol / 100);
              noteGain.gain.setValueAtTime(0, ctx.currentTime);
              noteGain.gain.linearRampToValueAtTime(pianoGainScale, ctx.currentTime + 0.1);
              noteGain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 3.5);

              osc.connect(noteFilter);
              noteFilter.connect(noteGain);
              noteGain.connect(ctx.destination);

              osc.start();
              osc.stop(ctx.currentTime + 4.0);
            }, i * 150); // beautiful rolling chord strum delay
          });
        }, 6000); // peaceful change every 6 seconds

        activeSynthNodeRef.current.push({
          source: null,
          gainNode: null,
          presetBaseVolume: 1.0,
          extraInterval: pianoInterval
        });
      }

      // Infinite Scholar Lofi Beats preset
      else if (preset === 'lofi-beats') {
        const synthNotes = [261.63, 293.66, 329.63, 392.00]; // peaceful keys
        let stepIndex = 0;

        const drumInterval = setInterval(() => {
          const currentVol = isMuted ? 0 : volume;
          if (currentVol === 0) return;

          const time = ctx.currentTime;
          stepIndex = (stepIndex + 1) % 16;

          // 1. Cozy Soft Lofi Kick (every 4 steps: 0, 8, 10)
          if ([0, 8, 10].includes(stepIndex)) {
            const kickOsc = ctx.createOscillator();
            const kickGain = ctx.createGain();
            kickOsc.frequency.setValueAtTime(140, time);
            kickOsc.frequency.exponentialRampToValueAtTime(0.01, time + 0.12);

            kickGain.gain.setValueAtTime(0.12 * (currentVol / 100), time);
            kickGain.gain.exponentialRampToValueAtTime(0.00001, time + 0.15);

            kickOsc.connect(kickGain);
            kickGain.connect(ctx.destination);
            kickOsc.start(time);
            kickOsc.stop(time + 0.2);
          }

          // 2. Vinyl Hiss Snap Snare (every 4 steps: 4, 12)
          if ([4, 12].includes(stepIndex)) {
            const snareNoise = ctx.createBufferSource();
            snareNoise.buffer = createNoiseBuffer(ctx, 'pink');

            const snareFilter = ctx.createBiquadFilter();
            snareFilter.type = 'lowpass';
            snareFilter.frequency.setValueAtTime(1200, time);

            const snareGain = ctx.createGain();
            snareGain.gain.setValueAtTime(0.04 * (currentVol / 100), time);
            snareGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

            snareNoise.connect(snareFilter);
            snareFilter.connect(snareGain);
            snareGain.connect(ctx.destination);
            snareNoise.start(time);
            snareNoise.stop(time + 0.22);
          }

          // 3. Relaxed Jazz Piano Chord Pad (every 8 steps)
          if (stepIndex % 8 === 0) {
            const chordNotes = [130.81, 164.81, 196.00]; // Cozy C chord
            chordNotes.forEach(freq => {
              const padOsc = ctx.createOscillator();
              const padGain = ctx.createGain();
              const padFilter = ctx.createBiquadFilter();

              padOsc.type = 'sine';
              padOsc.frequency.setValueAtTime(freq, time);

              padFilter.type = 'lowpass';
              padFilter.frequency.setValueAtTime(220, time); // highly filtered warm vibe

              padGain.gain.setValueAtTime(0, time);
              padGain.gain.linearRampToValueAtTime(0.012 * (currentVol / 100), time + 0.4);
              padGain.gain.exponentialRampToValueAtTime(0.0001, time + 2.0);

              padOsc.connect(padFilter);
              padFilter.connect(padGain);
              padGain.connect(ctx.destination);
              padOsc.start(time);
              padOsc.stop(time + 2.1);
            });
          }
        }, 225); // ~133 BPM laid-back workflow groove

        activeSynthNodeRef.current.push({
          source: null,
          gainNode: null,
          presetBaseVolume: 1.0,
          extraInterval: drumInterval
        });
      }

    } catch (e) {
      console.error('Core Web Audio synthesis failed', e);
    }
  };

  const cleanupSynthesis = () => {
    // 1. Clear step clock tickers
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }

    // 2. Stop and dispose all Web Audio nodes
    if (activeSynthNodeRef.current.length > 0) {
      activeSynthNodeRef.current.forEach(item => {
        if (item) {
          if (item.extraInterval) {
            clearInterval(item.extraInterval);
          }
          if (item.source) {
            try { item.source.stop(); } catch (e) {}
            try { item.source.disconnect(); } catch (e) {}
          }
          if (item.secondaryNodes) {
            item.secondaryNodes.forEach((node: any) => {
              try { node.stop(); } catch (e) {}
              try { node.disconnect(); } catch (e) {}
            });
          }
          if (item.gainNode) {
            try { item.gainNode.disconnect(); } catch (e) {}
          }
        }
      });
      activeSynthNodeRef.current = [];
    }
  };

  return (
    <MusicContext.Provider value={{
      playlists,
      activePlaylistId,
      currentTrackIndex,
      currentTrack,
      isPlaying,
      isMuted,
      volume,
      progress,
      duration,
      currentTime,
      isShuffle,
      isLoop,
      activePreset: currentTrack?.synthesizerPreset || null,
      playTrack,
      togglePlay,
      nextTrack,
      prevTrack,
      toggleMute,
      setVolume,
      seek,
      toggleShuffle,
      toggleLoop,
      importLink,
      deleteTrack,
      createPlaylist,
      addTrackToPlaylist,
      activePlaylist,
      setYoutubePlayer
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
