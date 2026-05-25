import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, Pause, Plus, Link2, Clock, Trash2, CheckCircle2, ChevronRight, 
  Sparkles, ArrowLeft, ArrowRight, ExternalLink, HelpCircle, 
  Volume2, Maximize2, RotateCcw, Bookmark, ClipboardCheck, 
  FileText, Search, PlayCircle, Eye, AlignLeft, RefreshCw, 
  Folder, ChevronDown, Check, Sliders, Menu, X, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from '@tanstack/react-router';

// Core Type Definitions block
interface Lecture {
  id: string;
  lectureNumber: number;
  title: string;
  duration: string;
  url: string; 
  videoId: string;
  thumbnail: string;
  completed: boolean;
  lastTimestamp: number; // in seconds
  notes?: string;
}

interface Batch {
  id: string;
  title: string;
  playlistUrl: string;
  coverImage: string;
  category: string;
  totalLectures: number;
  progressPercentage: number;
  lastWatchedLectureId?: string;
  lastWatchedTimestamp?: number; // total seconds
  lectures: Lecture[];
}

export function BatchPage() {
  const { user, guestUser } = useAuth();
  const currentUserId = user?.id || guestUser?.id || 'guest_default';
  const navigate = useNavigate();

  // Selected Perspective: 'home' (grids etc) or 'view' (immersive streaming layout)
  const [activeTab, setActiveTab] = useState<'home' | 'view'>('home');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [activeLectureId, setActiveLectureId] = useState<string | null>(null);

  // Form Creation states
  const [inputUrl, setInputUrl] = useState('');
  const [inputTitle, setInputTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Immersive Loader simulation
  const [loadingStep, setLoadingStep] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Manual lecture insertion form
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [newLectureUrl, setNewLectureUrl] = useState('');
  const [showAddLecture, setShowAddLecture] = useState(false);

  // Adaptive Interactive states for player
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [savedTimeNotify, setSavedTimeNotify] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');

  // Compact Pomodoro timer states for study blocks structuring
  const [pomoMinutes, setPomoMinutes] = useState(25);
  const [pomoSeconds, setPomoSeconds] = useState(0);
  const [pomoIsActive, setPomoIsActive] = useState(false);
  const [pomoMode, setPomoMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [autoPauseVideo, setAutoPauseVideo] = useState(true);
  const [showPomoSuggestion, setShowPomoSuggestion] = useState(false);

  // Tick the Pomodoro Focus timer
  useEffect(() => {
    let interval: any = null;
    if (pomoIsActive) {
      interval = setInterval(() => {
        if (pomoSeconds > 0) {
          setPomoSeconds(pomoSeconds - 1);
        } else if (pomoSeconds === 0) {
          if (pomoMinutes === 0) {
            // Timer complete!
            setPomoIsActive(false);
            
            // Trigger a clean sound synthesizer beep without relying on file assets
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.frequency.setValueAtTime(660, audioCtx.currentTime); 
              gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.6);
            } catch (soundErr) {}

            // Auto-pause standard iframe
            if (autoPauseVideo) {
              const iframe = document.getElementById("yt-player-iframe") as HTMLIFrameElement;
              if (iframe?.contentWindow) {
                console.log("[POMO] Dispatching pause command payload to target media...");
                iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
              }
            }

            // Record completed sessions into stats to reflect in Dashboard instantly in LocalStorage
            const statKey = `studyvibe_stat_focus_hours_${currentUserId}`;
            const existingHours = Number(localStorage.getItem(statKey) || "32.4");
            const newHours = Number((existingHours + 0.42).toFixed(1)); // 25 Min = 0.42 hr
            localStorage.setItem(statKey, String(newHours));

            setSavedTimeNotify("👑 Focus session complete! YouTube playback was automatically paused to structure your break.");
            setTimeout(() => setSavedTimeNotify(null), 9000);

            // Re-initialize mode defaults
            const originalLength = pomoMode === 'focus' ? 25 : pomoMode === 'shortBreak' ? 5 : 15;
            setPomoMinutes(originalLength);
            setPomoSeconds(0);
          } else {
            setPomoMinutes(pomoMinutes - 1);
            setPomoSeconds(59);
          }
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [pomoIsActive, pomoMinutes, pomoSeconds, autoPauseVideo, currentUserId, pomoMode]);

  // Offer to start pomodoro timer when active lecture changes
  useEffect(() => {
    if (activeLectureId && !pomoIsActive) {
      setShowPomoSuggestion(true);
      const delayTimer = setTimeout(() => {
        setShowPomoSuggestion(false);
      }, 15000);
      return () => clearTimeout(delayTimer);
    }
  }, [activeLectureId]);

  // Standard predefined high-end educational tracks for seamless user onboard
  const INITIAL_TEMPLATES: Batch[] = [
    {
      id: 'react-hydra-prot',
      title: 'React 19 High-Performance Rendering & Suspense Hydration Protocols',
      playlistUrl: 'https://www.youtube.com/playlist?list=PL38D39FE3E4B56C',
      coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80',
      category: 'Frameworks',
      totalLectures: 4,
      progressPercentage: 50,
      lastWatchedLectureId: 'hydra-l2',
      lastWatchedTimestamp: 74,
      lectures: [
        {
          id: 'hydra-l1',
          lectureNumber: 1,
          title: 'React 19 Deep Dive: Server Actions & Concurrent Transitions',
          duration: '14:20',
          url: 'https://www.youtube.com/watch?v=Ke90Tje7VS0',
          videoId: 'Ke90Tje7VS0',
          thumbnail: 'https://img.youtube.com/vi/Ke90Tje7VS0/mqdefault.jpg',
          completed: true,
          lastTimestamp: 860,
          notes: 'Important notes:\n- Server actions automatically batch state updates.\n- useActionState handles forms natively without boilerplate.\n- Hydration occurs concurrently on hydration elements.'
        },
        {
          id: 'hydra-l2',
          lectureNumber: 2,
          title: 'Decoding Regional Hydration Overheads & Streamed Action Buffers',
          duration: '11:15',
          url: 'https://www.youtube.com/watch?v=yQGv9O_b3E8',
          videoId: 'yQGv9O_b3E8',
          thumbnail: 'https://img.youtube.com/vi/yQGv9O_b3E8/mqdefault.jpg',
          completed: false,
          lastTimestamp: 74,
          notes: 'Regional hydration refers to isolated React islands being revived sequentially.\nSuspense component layout acts as boundaries.'
        },
        {
          id: 'hydra-l3',
          lectureNumber: 3,
          title: 'Deep-Dive: React Server Components (RSC) and Prerendering',
          duration: '18:30',
          url: 'https://www.youtube.com/watch?v=yK88tXvY2_Y',
          videoId: 'yK88tXvY2_Y',
          thumbnail: 'https://img.youtube.com/vi/yK88tXvY2_Y/mqdefault.jpg',
          completed: false,
          lastTimestamp: 0,
          notes: ''
        },
        {
          id: 'hydra-l4',
          lectureNumber: 4,
          title: 'Cumulative Layout Metrology & Progressive Decompression Metrics',
          duration: '19:05',
          url: 'https://www.youtube.com/watch?v=7fVf2Tj0C98',
          videoId: '7fVf2Tj0C98',
          thumbnail: 'https://img.youtube.com/vi/7fVf2Tj0C98/mqdefault.jpg',
          completed: false,
          lastTimestamp: 0,
          notes: ''
        }
      ]
    },
    {
      id: 'ai-cognitive-maps',
      title: 'Cognitive Science: Multi-Agent Systems & Attention Vector Delimiters',
      playlistUrl: 'https://www.youtube.com/playlist?list=PL_ai_cognition',
      coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80',
      category: 'AI Agents',
      totalLectures: 3,
      progressPercentage: 0,
      lastWatchedLectureId: 'ai-l1',
      lastWatchedTimestamp: 0,
      lectures: [
        {
          id: 'ai-l1',
          lectureNumber: 1,
          title: 'The Core Architecture of Autonomous Multi-Agent Systems',
          duration: '09:40',
          url: 'https://www.youtube.com/watch?v=3qHk_S69iJE',
          videoId: '3qHk_S69iJE',
          thumbnail: 'https://img.youtube.com/vi/3qHk_S69iJE/mqdefault.jpg',
          completed: false,
          lastTimestamp: 0,
          notes: ''
        },
        {
          id: 'ai-l2',
          lectureNumber: 2,
          title: 'Inside Self-Attention Maps and Sequence Boundaries',
          duration: '13:10',
          url: 'https://www.youtube.com/watch?v=0S7R31OEV34',
          videoId: '0S7R31OEV34',
          thumbnail: 'https://img.youtube.com/vi/0S7R31OEV34/mqdefault.jpg',
          completed: false,
          lastTimestamp: 0,
          notes: ''
        },
        {
          id: 'ai-l3',
          lectureNumber: 3,
          title: 'Autonomous Reflection Loops & Real-time Corrective Engines',
          duration: '15:25',
          url: 'https://www.youtube.com/watch?v=z_VnOn9S_z4',
          videoId: 'z_VnOn9S_z4',
          thumbnail: 'https://img.youtube.com/vi/z_VnOn9S_z4/mqdefault.jpg',
          completed: false,
          lastTimestamp: 0,
          notes: ''
        }
      ]
    }
  ];

  // Batches persistence layer hook-in
  const [batches, setBatches] = useState<Batch[]>(() => {
    const saved = localStorage.getItem(`studyvibe_playlist_batches_${currentUserId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const isGuestId = currentUserId.startsWith('guest_') || currentUserId === 'guest_default';
    if (!isGuestId) {
      return [];
    }
    return INITIAL_TEMPLATES;
  });

  // Synchronize batches state when the active user switches or logs in/out
  useEffect(() => {
    const saved = localStorage.getItem(`studyvibe_playlist_batches_${currentUserId}`);
    if (saved) {
      try {
        setBatches(JSON.parse(saved));
        return;
      } catch (e) {}
    }
    const isGuestId = currentUserId.startsWith('guest_') || currentUserId === 'guest_default';
    if (!isGuestId) {
      setBatches([]);
    } else {
      setBatches(INITIAL_TEMPLATES);
    }
  }, [currentUserId]);

  const saveBatches = (list: Batch[]) => {
    setBatches(list);
    localStorage.setItem(`studyvibe_playlist_batches_${currentUserId}`, JSON.stringify(list));
  };

  const activeBatch = useMemo(() => {
    return batches.find(b => b.id === selectedBatchId) || null;
  }, [batches, selectedBatchId]);

  const activeLecture = useMemo(() => {
    if (!activeBatch || !activeLectureId) return null;
    return activeBatch.lectures.find(l => l.id === activeLectureId) || null;
  }, [activeBatch, activeLectureId]);

  const playlistDurationString = useMemo(() => {
    if (!activeBatch) return '';
    let totalSeconds = 0;
    activeBatch.lectures.forEach(lec => {
      const parts = (lec.duration || '').split(':').map(Number);
      if (parts.length === 2) {
        totalSeconds += parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    });

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  }, [activeBatch]);

  // Unified YouTube IFrame Player instance holder
  const playerRef = useRef<any>(null);

  // Load YouTube IFrame Player API scripts securely
  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
  }, []);

  // Update dynamic playback rate on the player whenever speed updates
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      try {
        playerRef.current.setPlaybackRate(playbackSpeed);
      } catch (e) {}
    }
  }, [playbackSpeed]);

  // Setup active playhead tracker polling
  useEffect(() => {
    if (!activeLecture?.videoId || activeTab !== 'view') return;

    let playerInstance: any = null;
    let timeInterval: any = null;

    const setupPlayer = () => {
      try {
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
          playerRef.current.destroy();
          playerRef.current = null;
        }
      } catch (err) {}

      playerInstance = new (window as any).YT.Player('yt-player-placeholder', {
        height: '100%',
        width: '100%',
        videoId: activeLecture.videoId,
        playerVars: {
          enablejsapi: 1,
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
          autoplay: 0,
        },
        events: {
          onReady: (event: any) => {
            playerRef.current = event.target;
            try {
              event.target.setPlaybackRate(playbackSpeed);
              if (activeLecture.lastTimestamp && activeLecture.lastTimestamp > 0) {
                event.target.seekTo(activeLecture.lastTimestamp, true);
              }
            } catch (err) {}
          },
          onStateChange: (event: any) => {
            // PlayerState.PLAYING matches 1
            if (event.data === 1) {
              if (timeInterval) clearInterval(timeInterval);
              timeInterval = setInterval(() => {
                if (event.target && typeof event.target.getCurrentTime === 'function') {
                  const currentSec = event.target.getCurrentTime();
                  saveActiveTimestamp(currentSec);
                }
              }, 1000);
            } else {
              if (timeInterval) {
                clearInterval(timeInterval);
                timeInterval = null;
              }
              if (event.target && typeof event.target.getCurrentTime === 'function') {
                const currentSec = event.target.getCurrentTime();
                saveActiveTimestamp(currentSec);
              }
            }
          }
        }
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      setupPlayer();
    } else {
      const waitAPI = setInterval(() => {
        if ((window as any).YT && (window as any).YT.Player) {
          clearInterval(waitAPI);
          setupPlayer();
        }
      }, 200);
      return () => {
        clearInterval(waitAPI);
        if (timeInterval) clearInterval(timeInterval);
      };
    }

    return () => {
      if (timeInterval) clearInterval(timeInterval);
      setTimeout(() => {
        try {
          if (playerInstance && typeof playerInstance.destroy === 'function') {
            playerInstance.destroy();
          }
        } catch (e) {}
      }, 100);
    };
  }, [activeLecture?.videoId, activeTab]);

  // Parser to extract anchors from notes and render quick links
  const parsedTimeAnchors = useMemo(() => {
    const notesStr = activeLecture?.notes || '';
    const regex = /\[Time Anchor:\s*([0-9:]+)\]/gi;
    const results: { text: string; seconds: number }[] = [];
    let match;
    while ((match = regex.exec(notesStr)) !== null) {
      const stampStr = match[1];
      const parts = stampStr.split(':').map(Number);
      let sec = 0;
      if (parts.length === 2) {
        sec = parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      results.push({ text: stampStr, seconds: sec });
    }
    return results;
  }, [activeLecture?.notes]);

  const filteredLectures = useMemo(() => {
    if (!activeBatch) return [];
    if (!sidebarSearchQuery.trim()) return activeBatch.lectures;
    const query = sidebarSearchQuery.toLowerCase();
    return activeBatch.lectures.filter((lec) => {
      const origIndex = activeBatch.lectures.indexOf(lec);
      const isMatch = lec.title.toLowerCase().includes(query) || 
                      `lecture ${origIndex + 1}`.includes(query) || 
                      String(origIndex + 1) === query;
      return isMatch;
    });
  }, [activeBatch, sidebarSearchQuery]);

  // Sync active lecture selection
  useEffect(() => {
    setSidebarSearchQuery('');
    if (activeBatch && !activeLectureId) {
      if (activeBatch.lastWatchedLectureId) {
        setActiveLectureId(activeBatch.lastWatchedLectureId);
      } else if (activeBatch.lectures.length > 0) {
        setActiveLectureId(activeBatch.lectures[0].id);
      }
    }
  }, [selectedBatchId, activeBatch]);

  // YouTube core extractor function
  const extractVideoDetails = (urlStr: string) => {
    const regList = /[&?]list=([^&]+)/i;
    const matchList = urlStr.match(regList);
    
    const regVideo = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
    const matchVideo = urlStr.match(regVideo);
    
    return {
      playlistId: matchList ? matchList[1] : null,
      videoId: matchVideo ? matchVideo[1] : null,
      isPlaylist: !!matchList
    };
  };

  // Convert seconds into standard duration string (00:00:00)
  const formatSecondsToPlayhead = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Submit playlist generator flow
  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;

    const parsed = extractVideoDetails(inputUrl);
    if (!parsed.videoId && !parsed.playlistId) {
      alert("Invalid Youtube url signature specified. Please provide a standard YouTube watch link, playlist URL, or youtu.be shortener.");
      return;
    }

    setIsCreating(true);
    setLoadingProgress(15);
    setLoadingStep("Accessing live YouTube metadata proxy...");

    fetch(`/api/playlist?url=${encodeURIComponent(inputUrl)}`)
      .then(async (res) => {
        setLoadingProgress(55);
        setLoadingStep("Analyzing returned YouTube playlist data...");
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with status status ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setLoadingProgress(80);
        setLoadingStep("Compiling syllabus lecture sequence...");

        if (!data.videos || data.videos.length === 0) {
          throw new Error("No videos could be extracted from this URL. Please verify the URL's visibility or try another.");
        }

        const playlistLectures: Lecture[] = data.videos.map((vid: any, idx: number) => ({
          id: vid.id || `vid-${idx}-${Date.now()}`,
          lectureNumber: idx + 1,
          title: vid.title || `Lecture ${idx + 1}`,
          duration: vid.duration || "15:00",
          url: vid.url || `https://www.youtube.com/watch?v=${vid.videoId}`,
          videoId: vid.videoId,
          thumbnail: vid.thumbnail || `https://img.youtube.com/vi/${vid.videoId}/mqdefault.jpg`,
          completed: false,
          lastTimestamp: 0,
          notes: ''
        }));

        const finalTitle = inputTitle.trim() || data.title || (data.isPlaylist ? "Curated Playlist Series" : "Lecture Track Series");

        const assembledBatch: Batch = {
          id: `batch-${Date.now()}`,
          title: finalTitle,
          playlistUrl: inputUrl,
          coverImage: playlistLectures[0]?.thumbnail || `https://img.youtube.com/vi/${parsed.videoId || 'Ke90Tje7VS0'}/hqdefault.jpg`,
          category: data.isPlaylist ? "Curated Playlist" : "Lecture Track",
          totalLectures: playlistLectures.length,
          progressPercentage: 0,
          lastWatchedLectureId: playlistLectures[0]?.id,
          lastWatchedTimestamp: 0,
          lectures: playlistLectures
        };

        setLoadingProgress(100);
        setLoadingStep("Activating immersive scholar staging...");

        setTimeout(() => {
          const updatedList = [assembledBatch, ...batches];
          saveBatches(updatedList);
          setSelectedBatchId(assembledBatch.id);
          setActiveLectureId(playlistLectures[0]?.id || null);

          // Reset state & load immersive viewer
          setInputTitle('');
          setInputUrl('');
          setIsCreating(false);
          setShowCreateForm(false);
          setActiveTab('view');
        }, 500);
      })
      .catch((err) => {
        console.error("[ERROR] Client dynamic playlist expansion failure:", err);
        alert(`Failed to load YouTube content: ${err.message || "Please check network status or terminal output logs."}`);
        setIsCreating(false);
      });
  };

  // Interactive safe deletion state to bypass native confirm alerts in iframe sandbox
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);

  const handleDeleteBatch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingBatchId === id) {
      const remaining = batches.filter(b => b.id !== id);
      saveBatches(remaining);
      if (selectedBatchId === id) {
        setSelectedBatchId(null);
        setActiveLectureId(null);
        setActiveTab('home');
      }
      setDeletingBatchId(null);
    } else {
      setDeletingBatchId(id);
      // Auto-reset after 3 seconds
      setTimeout(() => {
        setDeletingBatchId(current => current === id ? null : current);
      }, 3000);
    }
  };

  const handleToggleCompleted = (lectureId: string) => {
    if (!selectedBatchId) return;
    const modified = batches.map(b => {
      if (b.id === selectedBatchId) {
        const nextLectures = b.lectures.map(lec => {
          if (lec.id === lectureId) {
            return { ...lec, completed: !lec.completed };
          }
          return lec;
        });

        // Compute metrics
        const completedCount = nextLectures.filter(l => l.completed).length;
        const finalPct = Math.round((completedCount / nextLectures.length) * 100);

        return {
          ...b,
          progressPercentage: finalPct,
          lectures: nextLectures
        };
      }
      return b;
    });

    saveBatches(modified);
  };

  const saveActiveTimestamp = (sec: number) => {
    if (!selectedBatchId || !activeLectureId) return;
    const updated = batches.map(b => {
      if (b.id === selectedBatchId) {
        const nextLectures = b.lectures.map(lec => {
          if (lec.id === activeLectureId) {
            return { ...lec, lastTimestamp: Math.floor(sec) };
          }
          return lec;
        });
        return {
          ...b,
          lastWatchedLectureId: activeLectureId,
          lastWatchedTimestamp: Math.floor(sec),
          lectures: nextLectures
        };
      }
      return b;
    });
    setBatches(updated);
    localStorage.setItem(`studyvibe_playlist_batches_${currentUserId}`, JSON.stringify(updated));
  };

  const saveLectureNotes = (noteStr: string) => {
    if (!selectedBatchId || !activeLectureId) return;
    const updated = batches.map(b => {
      if (b.id === selectedBatchId) {
        const nextLectures = b.lectures.map(lec => {
          if (lec.id === activeLectureId) {
            return { ...lec, notes: noteStr };
          }
          return lec;
        });
        return {
          ...b,
          lectures: nextLectures
        };
      }
      return b;
    });
    setBatches(updated);
    localStorage.setItem(`studyvibe_playlist_batches_${currentUserId}`, JSON.stringify(updated));
  };

  // Append customized future lectures onto an active cohort!
  const appendFutureLecture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || !newLectureUrl || !newLectureTitle) return;

    const parsed = extractVideoDetails(newLectureUrl);
    if (!parsed.videoId) {
      alert("Invalid Youtube link. Please enter a valid single video link to add.");
      return;
    }

    const modified = batches.map(b => {
      if (b.id === selectedBatchId) {
        const nextNum = b.lectures.length + 1;
        const addedLec: Lecture = {
          id: `added-${Date.now()}`,
          lectureNumber: nextNum,
          title: newLectureTitle.trim(),
          duration: "15:00",
          url: newLectureUrl,
          videoId: parsed.videoId || "dQw4w9WgXcQ",
          thumbnail: `https://img.youtube.com/vi/${parsed.videoId || "dQw4w9WgXcQ"}/mqdefault.jpg`,
          completed: false,
          lastTimestamp: 0
        };

        const totalLecs = b.lectures.length + 1;
        const comps = b.lectures.filter(l => l.completed).length;
        const updatedPct = Math.round((comps / totalLecs) * 100);

        return {
          ...b,
          totalLectures: totalLecs,
          progressPercentage: updatedPct,
          lectures: [...b.lectures, addedLec]
        };
      }
      return b;
    });

    saveBatches(modified);
    setNewLectureTitle('');
    setNewLectureUrl('');
    setShowAddLecture(false);
  };

  // Nav to next/previous step
  const handleNextLecture = () => {
    if (!activeBatch || !activeLecture) return;
    const currentIdx = activeBatch.lectures.findIndex(l => l.id === activeLecture.id);
    if (currentIdx !== -1 && currentIdx < activeBatch.lectures.length - 1) {
      setActiveLectureId(activeBatch.lectures[currentIdx + 1].id);
    }
  };

  const handlePrevLecture = () => {
    if (!activeBatch || !activeLecture) return;
    const currentIdx = activeBatch.lectures.findIndex(l => l.id === activeLecture.id);
    if (currentIdx > 0) {
      setActiveLectureId(activeBatch.lectures[currentIdx - 1].id);
    }
  };

  // Setup dynamic playhead timing notification helpers
  const handleMarkTimestampClick = () => {
    if (!activeLecture) return;
    let actualSeconds = activeLecture.lastTimestamp;
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      try {
        actualSeconds = Math.floor(playerRef.current.getCurrentTime());
        saveActiveTimestamp(actualSeconds);
      } catch (e) {}
    }
    const stamp = formatSecondsToPlayhead(actualSeconds);
    const existing = activeLecture.notes || '';
    const updated = existing + (existing ? '\n' : '') + `[Time Anchor: ${stamp}] `;
    saveLectureNotes(updated);
    setSavedTimeNotify(`Anchored at ${stamp}`);
    setTimeout(() => setSavedTimeNotify(null), 2500);
  };

  return (
    <div className="space-y-6 pb-16 text-left antialiased max-w-7xl mx-auto px-4 md:px-6">
      
      {/* Dynamic Header Hub */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-[#07070b] p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 z-10 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-indigo-400 uppercase tracking-[0.25em] font-semibold bg-indigo-400/10 px-2.5 py-0.5 rounded-full border border-indigo-400/20">
              Study Playlist Player
            </span>
            <span className="font-mono text-[9px] text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Distraction-free playlist player
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-serif text-white tracking-tight font-medium mt-1">
            Learning Batches
          </h1>
          <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
            Organize educational YouTube playlists into distraction-free courses with local progress tracking.
          </p>
        </div>

        {/* View Controllers */}
        <div className="flex items-center gap-3 shrink-0 z-10">
          <button
            onClick={() => { setActiveTab('home'); }}
            className={`px-4 py-2 rounded-2xl text-xs font-mono font-medium tracking-wider transition-all border cursor-pointer ${
              activeTab === 'home' 
                ? 'bg-white text-black font-semibold border-white shadow-md' 
                : 'bg-white/5 text-gray-400 hover:text-white border-white/5'
            }`}
          >
            My Workspace Library
          </button>
          
          {selectedBatchId && (
            <button
              onClick={() => setActiveTab('view')}
              className={`px-4 py-2 rounded-2xl text-xs font-mono font-medium tracking-wider transition-all border flex items-center gap-2 cursor-pointer ${
                activeTab === 'view' 
                  ? 'bg-indigo-500/15 text-indigo-300 font-bold border-indigo-500/30' 
                  : 'bg-white/5 text-gray-400 hover:text-white border-white/5'
              }`}
            >
              Active Playroom &rarr;
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* VIEW PERSPECTIVE 1: ROADMAP LIBRARY HOME GRID */}
        {activeTab === 'home' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            key="home-grid"
            className="space-y-8"
          >
            
            {/* Header section with optional Create Batch trigger */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-2">
              <div>
                <h3 className="font-serif text-lg text-white font-medium italic">Your Course Playlists</h3>
                <p className="text-[10.5px] font-mono text-gray-500 uppercase">{batches.length} Course Playlists Available</p>
              </div>

              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all border flex items-center gap-2 cursor-pointer ${
                  showCreateForm
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 shadow-md'
                    : 'bg-white text-black border-white hover:bg-gray-100 shadow-md'
                }`}
              >
                {showCreateForm ? (
                  <>
                    <X className="w-4 h-4" /> Close Planner
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Create Learning Batch
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {showCreateForm && (
                <div className="lg:col-span-4 glass-panel glow-indigo p-6 relative overflow-hidden h-fit">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <p className="font-mono text-[9px] uppercase tracking-widest text-indigo-400 font-bold mb-1">Assemble Playlist</p>
                  <h3 className="font-serif italic text-lg text-white font-medium mb-1">Create Learning Batch</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-5">
                    Paste any YouTube playlist or watch link to instantly compile modular components. We structure thumbnails and title indices automatically.
                  </p>

                  <form onSubmit={handleCreateBatch} className="space-y-4">
                    <div>
                      <label className="block text-[8.5px] font-mono text-gray-400 uppercase tracking-widest mb-1.5 font-bold">Custom Title Accent (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Master React Core 19"
                        value={inputTitle}
                        onChange={(e) => setInputTitle(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-650 focus:outline-none focus:border-indigo-500/40 transition-colors font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[8.5px] font-mono text-gray-400 uppercase tracking-widest mb-1.5 font-bold">Paste YouTube URL *</label>
                      <div className="relative">
                        <input 
                          type="url" 
                          required
                          placeholder="Playlist or single video link..."
                          value={inputUrl}
                          onChange={(e) => setInputUrl(e.target.value)}
                          className="w-full bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/40 transition-colors font-mono"
                        />
                        <Link2 className="absolute left-3.5 top-3 w-4.5 h-4.5 text-gray-500" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isCreating}
                      className="w-full bg-white text-black hover:bg-gray-100 font-mono text-xs font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-40"
                    >
                      {isCreating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" /> Assemble...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 text-black" /> Generate Immersive Batch
                        </>
                      )}
                    </button>
                  </form>

                  {/* Simulated creation progress logger */}
                  {isCreating && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-4 border-t border-white/5 mt-4 space-y-2 font-mono"
                    >
                      <div className="flex justify-between items-center text-[9.5px] text-gray-400">
                        <span className="text-indigo-400 font-semibold">{loadingStep}</span>
                        <span>{loadingProgress}%</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${loadingProgress}%` }} />
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* LIST OF CREATED BATCH CARDS */}
              <div className={`${showCreateForm ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-5`}>
                {batches.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl border border-white/5 bg-neutral-950/25 space-y-4">
                    <p className="text-gray-300 text-sm font-semibold">No playlist courses added yet.</p>
                    <p className="text-xs text-gray-500 font-mono max-w-sm mx-auto">Click "+ Create Learning Batch" above and paste any YouTube playlist link to import it as an interactive study course!</p>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-mono font-semibold rounded-xl text-white transition-all cursor-pointer shadow-md"
                    >
                      <Plus className="w-4.5 h-4.5 text-white" /> Open Course Planner
                    </button>
                  </div>
                ) : (
                  <div className={`grid grid-cols-1 ${showCreateForm ? 'sm:grid-cols-1 md:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-6`}>
                    {batches.map((batch) => {
                      const completedCount = batch.lectures.filter(l => l.completed).length;
                      const activeLecTitle = batch.lectures.find(l => l.id === batch.lastWatchedLectureId)?.title || "Orientation";
                      
                      // Calculate batch total playlist duration
                      let totalSeconds = 0;
                      batch.lectures.forEach(lec => {
                        const parts = (lec.duration || '').split(':').map(Number);
                        if (parts.length === 2) {
                          totalSeconds += parts[0] * 60 + parts[1];
                        } else if (parts.length === 3) {
                          totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
                        }
                      });
                      const hrs = Math.floor(totalSeconds / 3600);
                      const mins = Math.floor((totalSeconds % 3600) / 60);
                      const durationStr = hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`;

                      return (
                        <div
                          key={batch.id}
                          onClick={() => {
                            setSelectedBatchId(batch.id);
                            setActiveLectureId(batch.lastWatchedLectureId || batch.lectures[0].id);
                            setActiveTab('view');
                          }}
                          className="group relative glass-panel p-5 hover:border-indigo-500/30 hover:scale-[1.01] transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[260px] shadow-lg text-left glow-indigo animate-in fade-in"
                        >
                          {/* Highlight background banner projection */}
                          <div className="absolute inset-0 bg-cover bg-center opacity-[0.03] grayscale transition-all duration-500 pointer-events-none group-hover:scale-105 group-hover:opacity-[0.06]" style={{ backgroundImage: `url(${batch.coverImage})` }} />
                          
                          <div className="space-y-4 z-10 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="py-0.5 px-2.5 rounded-full bg-white/5 border border-white/5 text-gray-400 font-mono text-[8.5px] uppercase tracking-wider font-semibold">
                                {batch.category}
                              </span>
                              
                              <button
                                onClick={(e) => handleDeleteBatch(batch.id, e)}
                                className={`p-1 px-2.5 rounded-lg transition-all cursor-pointer text-[10px] font-mono flex items-center gap-1.5 ${
                                  deletingBatchId === batch.id
                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold"
                                    : "text-gray-500 hover:text-rose-400 hover:bg-rose-500/10"
                                }`}
                                title={deletingBatchId === batch.id ? "Confirm Deletion" : "Delete Course"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {deletingBatchId === batch.id && <span>Click to Confirm</span>}
                              </button>
                            </div>

                            <div className="space-y-1">
                              <h4 className="font-serif text-base text-white tracking-tight leading-tight font-medium group-hover:text-indigo-400 transition-colors">
                                {batch.title}
                              </h4>
                              <div className="flex items-center gap-2">
                                <p className="text-[10px] text-gray-500 font-mono">YouTube Playlist Course</p>
                                <span className="text-[10px] text-indigo-300 font-mono flex items-center gap-1">
                                  🍉 {durationStr}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-8 z-10 space-y-3 pt-4 border-t border-white/5">
                            {/* Continuing section */}
                            {batch.lastWatchedLectureId && (
                              <div className="bg-black/40 rounded-xl p-2.5 flex items-center justify-between gap-2 border border-white/[0.02]">
                                <div className="min-w-0 flex-1">
                                  <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest font-bold">CONTINUE WATCHING</p>
                                  <p className="text-[10.5px] text-gray-300 truncate font-sans">{activeLecTitle}</p>
                                </div>
                                <span className="font-mono text-[9px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded shrink-0">
                                  {formatSecondsToPlayhead(batch.lastWatchedTimestamp || 0)}
                                </span>
                              </div>
                            )}

                            {/* Aggregated progress track */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className="text-gray-400">{completedCount} / {batch.lectures.length} Lectures Completed</span>
                                <span className="text-white font-bold">{batch.progressPercentage}%</span>
                              </div>
                              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                                  style={{ width: `${batch.progressPercentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        )}

        {/* VIEW PERSPECTIVE 2: THE IMMERSIVE CINEMATIC PLAYROOM VIEW */}
        {activeTab === 'view' && activeBatch && activeLecture && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            key="classroom-player"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            
            {/* Playroom Left: Lectures vertical sidebar (Full desktop list, mobile responsive collapsible side) */}
            <div className="lg:col-span-4 glass-panel glow-indigo overflow-hidden flex flex-col h-full lg:max-h-[700px] order-2 lg:order-1">
              
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                <div>
                  <p className="font-mono text-[8px] text-gray-500 uppercase font-bold">BATCH PROGRESS</p>
                  <h4 className="text-xs font-serif text-white truncate font-medium max-w-[200px]" title={activeBatch.title}>
                    {activeBatch.title}
                  </h4>
                  {playlistDurationString && (
                    <p className="text-[9.5px] font-mono text-indigo-300 mt-1 flex items-center gap-1">
                      🍉 {playlistDurationString} total
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="font-mono text-[10px] font-bold text-indigo-400">
                    {activeBatch.lectures.filter(l => l.completed).length} / {activeBatch.lectures.length}
                  </p>
                  <p className="text-[7.5px] font-mono text-gray-500 font-extrabold uppercase">COMPLETED</p>
                </div>
              </div>

              {/* Progress bar spacer */}
              <div className="h-1 bg-white/5 w-full">
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${activeBatch.progressPercentage}%` }} />
              </div>

              {/* Sidebar Search Bar */}
              <div className="p-3 border-b border-white/5 bg-black/10 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search lectures/topics..."
                    value={sidebarSearchQuery}
                    onChange={(e) => setSidebarSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/30 font-mono"
                  />
                  {sidebarSearchQuery && (
                    <button
                      onClick={() => setSidebarSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-0.5 rounded cursor-pointer flex items-center justify-center p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Lectures list wrapper */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[500px]">
                {filteredLectures.length === 0 ? (
                  <div className="py-12 text-center">
                    <Search className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-40" />
                    <p className="text-xs text-gray-500 font-mono">No lectures match filter</p>
                  </div>
                ) : (
                  filteredLectures.map((lec) => {
                    const isCurrent = lec.id === activeLectureId;
                    const origIndex = activeBatch.lectures.findIndex((l) => l.id === lec.id);
                    return (
                      <div
                        key={lec.id}
                        onClick={() => {
                          setActiveLectureId(lec.id);
                          setMobileSidebarOpen(false);
                        }}
                        className={`group flex items-start gap-3 p-2.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                          isCurrent 
                            ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                            : 'bg-black/20 border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                        }`}
                      >
                        {/* Thumbnail frame */}
                        <div className="relative w-20 aspect-video rounded-lg overflow-hidden border border-white/5 group-hover:scale-[1.02] transition-transform shrink-0">
                          <img 
                            src={lec.thumbnail} 
                            alt="Lecture visual cover" 
                            className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute right-1 bottom-1 text-[8px] px-1 py-0.5 rounded font-mono bg-black/80 text-gray-300">
                            {lec.duration}
                          </div>
                          {isCurrent && (
                            <div className="absolute inset-0 bg-indigo-600/15 flex items-center justify-center">
                              <Play className="w-5 h-5 text-white animate-pulse" />
                            </div>
                          )}
                        </div>

                        {/* Info lines */}
                        <div className="min-w-0 flex-1 pt-0.5 text-left">
                          <p className="text-[8px] font-mono text-indigo-400 font-bold uppercase tracking-wider mb-0.5">
                            Lecture {origIndex !== -1 ? origIndex + 1 : lec.lectureNumber || 1}
                          </p>
                          <h5 className={`text-xs leading-tight font-medium ${isCurrent ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'} truncate`}>
                            {lec.title}
                          </h5>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCompleted(lec.id);
                              }}
                              className={`p-1 px-2 rounded font-mono text-[8px] cursor-pointer transition-colors ${
                                lec.completed 
                                  ? 'bg-[#22c55e]/10 text-[#22c55e]' 
                                  : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {lec.completed ? '✓ Completed' : 'Mark Completed'}
                            </button>
                          </div>
                        </div>

                        {/* completed check overlay indicator */}
                        {lec.completed && (
                          <div className="absolute top-2 right-2 p-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                            <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sidebar bottom: dynamic future additions panel */}
              <div className="p-3 border-t border-white/5 bg-black/10">
                {showAddLecture ? (
                  <form onSubmit={appendFutureLecture} className="space-y-3.5 bg-black/30 p-3 rounded-2xl border border-white/5 animate-in fade-in">
                    <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest font-bold">Add Next Module</p>
                    <div>
                      <input 
                        type="text" 
                        required
                        placeholder="Lecture Title..." 
                        value={newLectureTitle}
                        onChange={(e) => setNewLectureTitle(e.target.value)}
                        className="w-full bg-black border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input 
                        type="url" 
                        required
                        placeholder="YouTube watch link..." 
                        value={newLectureUrl}
                        onChange={(e) => setNewLectureUrl(e.target.value)}
                        className="w-full bg-black border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2">
                      <button 
                        type="button" 
                        onClick={() => setShowAddLecture(false)} 
                        className="text-[9.5px] font-mono text-gray-500 hover:text-white uppercase cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-3 py-1.5 text-[9.5px] font-mono font-bold uppercase tracking-wider text-black bg-white rounded-lg cursor-pointer hover:bg-gray-100"
                      >
                        Add to Queue
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowAddLecture(true)}
                    className="w-full hover:scale-101 hover:bg-white/5 py-2.5 rounded-2xl border border-dashed border-white/5 flex items-center justify-center gap-1.5 font-mono text-[10px] text-gray-400 hover:text-white cursor-pointer"
                  >
                    <Plus className="w-4.5 h-4.5" /> Append Lecture to Queue
                  </button>
                )}
              </div>
            </div>

            {/* Playroom Right: Immersive stream viewport player & text notes */}
            <div className="lg:col-span-8 space-y-6 order-1 lg:order-2">
              
              {/* POPUP FOCUS SUGGESTION OVERLAY */}
              <AnimatePresence>
                {showPomoSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    className="p-4 rounded-[20px] bg-gradient-to-r from-indigo-950/45 to-black border border-indigo-500/30 glow-indigo shadow-lg flex items-center justify-between gap-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h6 className="text-[11px] font-mono tracking-wider text-indigo-300 font-bold uppercase mb-0.5">Structure Study Session?</h6>
                        <p className="text-[9.5px] text-gray-300 font-sans leading-tight">
                          Shall we start a 25-minute Pomodoro focus timer? The video will automatically pause when the session ends.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setPomoMode('focus');
                          setPomoMinutes(25);
                          setPomoSeconds(0);
                          setPomoIsActive(true);
                          setShowPomoSuggestion(false);
                        }}
                        className="px-3 py-1.5 rounded-lg text-[9.5px] font-mono font-bold uppercase tracking-wider text-black bg-white hover:bg-gray-100 cursor-pointer"
                      >
                        Start Timer
                      </button>
                      <button
                        onClick={() => setShowPomoSuggestion(false)}
                        className="px-2.5 py-1.5 rounded-lg text-[9.5px] font-mono uppercase tracking-wider text-gray-400 hover:text-white cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Immersive YouTube Video Frame Wrapper */}
              <div className="relative rounded-[28px] overflow-hidden bg-black border border-white/10 group shadow-2xl">
                
                {/* Standard Youtube Embed */}
                <div className="aspect-video w-full leading-none">
                  <div className="w-full h-full" id="yt-player-placeholder" />
                </div>

                {/* Sub-bar player dashboard metrics */}
                <div className="p-4 bg-[#08080a] border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-left">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 p-1 px-2.5 rounded font-bold">
                      Lecture {activeLecture.lectureNumber}
                    </span>
                    <div>
                      <h4 className="text-sm font-serif text-white font-medium truncate max-w-[280px]" title={activeLecture.title}>
                        {activeLecture.title}
                      </h4>
                      <p className="text-[9.5px] font-mono text-gray-500">Duration: {activeLecture.duration}</p>
                    </div>
                  </div>

                  {/* Controller commands wrapper */}
                  <div className="flex items-center gap-4">
                    
                    {/* Timestamp mark */}
                    <button
                      onClick={handleMarkTimestampClick}
                      className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 border border-white/5"
                      title="Anchors active progress mark in your notes"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-mono">Anchor Time</span>
                    </button>

                    {/* Left right buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handlePrevLecture}
                        className="p-2 hover:bg-white/5 rounded-lg border border-white/5 text-gray-400 hover:text-white disabled:opacity-20 cursor-pointer"
                        title="Previous Lecture Module"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleNextLecture}
                        className="p-2 hover:bg-white/5 rounded-lg border border-white/5 text-gray-400 hover:text-white disabled:opacity-20 cursor-pointer"
                        title="Next Lecture Module"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleToggleCompleted(activeLecture.id)}
                      className={`px-3 py-1.5 rounded-xl font-mono text-[9.5px] font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeLecture.completed 
                          ? 'bg-emerald-500/10 text-[#22c55e] border-emerald-500/30 font-bold' 
                          : 'bg-white text-black border-white hover:scale-101 hover:bg-gray-100'
                      }`}
                    >
                      {activeLecture.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                      <span>{activeLecture.completed ? 'Finished' : 'Mark Completed'}</span>
                    </button>

                  </div>
                </div>
              </div>

              {/* INTEGRATED COGNITIVE FOCUS POMODORO (BatchPage Exclusive) */}
              <div className="p-5 glass-panel glow-indigo rounded-[24px] flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-mono uppercase tracking-[0.2em] text-indigo-400 font-bold leading-none mb-1">COGNITIVE FOCUS BLOCK</h5>
                    <p className="text-[9.5px] font-sans text-gray-400">
                      Auto-pause is <span className="text-emerald-400 font-semibold">{autoPauseVideo ? "Enabled" : "Disabled"}</span>
                    </p>
                  </div>
                </div>

                {/* Mode Selector pills */}
                <div className="flex flex-wrap items-center gap-1 bg-black/40 border border-white/5 p-1 rounded-xl">
                  {(['focus', 'shortBreak', 'longBreak'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setPomoMode(mode);
                        setPomoIsActive(false);
                        setPomoMinutes(mode === 'focus' ? 25 : mode === 'shortBreak' ? 5 : 15);
                        setPomoSeconds(0);
                      }}
                      className={`px-3 py-1 rounded-lg text-[9px] font-mono tracking-wider transition-all cursor-pointer capitalize ${
                        pomoMode === mode 
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold' 
                          : 'text-gray-500 hover:text-white border border-transparent'
                      }`}
                    >
                      {mode === 'focus' ? '🎯 Focus (25m)' : mode === 'shortBreak' ? '☕ Break (5m)' : '🌴 Long Break (15m)'}
                    </button>
                  ))}
                </div>

                {/* Time Display and control action deck */}
                <div className="flex items-center gap-4">
                  <span className="font-mono text-2xl font-semibold text-white tracking-widest bg-black/55 border border-white/5 rounded-xl px-4 py-1.5 min-w-[96px] text-center shadow-inner select-none">
                    {String(pomoMinutes).padStart(2, '0')}:{String(pomoSeconds).padStart(2, '0')}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPomoIsActive(!pomoIsActive)}
                      className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center border font-mono ${
                        pomoIsActive 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                          : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      }`}
                      title={pomoIsActive ? "Pause Timer" : "Start Focus Cycle"}
                    >
                      {pomoIsActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setPomoIsActive(false);
                        setPomoMinutes(pomoMode === 'focus' ? 25 : pomoMode === 'shortBreak' ? 5 : 15);
                        setPomoSeconds(0);
                      }}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
                      title="Reset Session Clock"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Auto pause toggle checkbox */}
                  <label className="flex items-center gap-1.5 cursor-pointer border border-white/5 rounded-xl p-2 bg-black/20 text-[9.5px] font-mono text-gray-500 hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={autoPauseVideo}
                      onChange={(e) => setAutoPauseVideo(e.target.checked)}
                      className="rounded border-white/10 bg-black text-indigo-500 checked:bg-indigo-500 focus:ring-0 cursor-pointer"
                    />
                    <span>Auto-Pause</span>
                  </label>
                </div>
              </div>

              {/* Dynamic Notification Bubble */}
              {savedTimeNotify && (
                <div className="bg-emerald-500 text-black px-4 py-2 rounded-xl text-xs font-mono font-bold animate-pulse inline-flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  <span>{savedTimeNotify}</span>
                </div>
              )}

              {/* Notes workspace panel: Lecture specific notepad that autosaves */}
              <div className="p-6 glass-panel glow-purple space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span className="font-mono text-[9.5px] text-gray-300 uppercase tracking-widest font-bold">Study Notebook</span>
                  </div>
                  <span className="font-mono text-[8px] text-gray-600 uppercase">Autosaves locally per lecture index</span>
                </div>

                <textarea
                  className="w-full min-h-[140px] bg-black/40 border border-white/5 p-4 rounded-2xl text-xs text-gray-300 placeholder-gray-700 leading-relaxed font-sans focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/10"
                  placeholder="Record key learning formulas, questions, or critical summaries matching this lecture block here. Press 'Anchor Time' to insert current playback cursor markers..."
                  value={activeLecture.notes || ''}
                  onChange={(e) => saveLectureNotes(e.target.value)}
                />

                <div className="flex justify-between items-center text-[9px] font-mono text-gray-500 border-t border-white/5 pt-3">
                  <span className="italic">Pro-Tip: Click 'Anchor Time' above to mark timestamps in notes!</span>
                  <span>Character scale: {activeLecture.notes?.length || 0}</span>
                </div>

                {parsedTimeAnchors.length > 0 && (
                  <div className="space-y-1.5 pt-3 border-t border-white/5">
                    <p className="text-[9px] uppercase font-mono tracking-wider text-gray-500">Jump to marked Time Anchors:</p>
                    <div className="flex flex-wrap gap-2">
                      {parsedTimeAnchors.map((anchor, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
                              try {
                                playerRef.current.seekTo(anchor.seconds, true);
                              } catch (e) {}
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 hover:bg-purple-500/10 text-[10px] text-indigo-400 hover:text-brand-purple font-mono rounded-lg border border-indigo-500/20 hover:border-brand-purple/20 transition-all cursor-pointer active:scale-95"
                        >
                          <Clock className="w-3 h-3 animate-pulse" />
                          <span>{anchor.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
