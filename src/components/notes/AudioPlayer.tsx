import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, RotateCcw, VolumeX, FastForward } from 'lucide-react';

interface AudioProps {
  url: string;
  title: string;
}

export function AudioPlayer({ url, title }: AudioProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  const skipForwardSnapshot = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
  };

  const resetProgress = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
      audioRef.current.muted = v === 0;
    }
    setIsMuted(v === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioRef.current.muted = nextMuted;
  };

  const cycleSpeed = () => {
    if (!audioRef.current) return;
    let nextSpeed = 1;
    if (playSpeed === 1) nextSpeed = 1.25;
    else if (playSpeed === 1.25) nextSpeed = 1.5;
    else if (playSpeed === 1.5) nextSpeed = 2;
    else nextSpeed = 1;

    setPlaySpeed(nextSpeed);
    audioRef.current.playbackRate = nextSpeed;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="w-full bg-[#0d0d0d] border border-white/10 rounded-2xl p-5 shadow-[0_15px_30px_rgba(0,0,0,0.5)] flex flex-col gap-4 max-w-md mx-auto relative overflow-hidden">
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Pulsing soundwave visualization track */}
      {isPlaying && (
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-purple/50 via-teal-400 to-brand-indigo/50 animate-pulse" />
      )}

      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-full ${isPlaying ? 'bg-brand-purple/20 text-brand-purple animate-pulse' : 'bg-white/5 text-gray-400'} border border-white/5`}>
          <Volume2 className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-white truncate">{title || 'Scholar Audio Note'}</h4>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">Premium Audio Playback</p>
        </div>
        <button
          onClick={cycleSpeed}
          className="text-[10px] font-mono font-bold bg-white/5 border border-white/10 px-2 py-1 rounded hover:bg-white/10 text-gray-300 hover:text-white"
        >
          {playSpeed}x
        </button>
      </div>

      {/* Simulated Waveform bar animations on active play */}
      <div className="flex justify-between items-center h-8 px-1">
        {Array.from({ length: 24 }).map((_, idx) => {
          // Dynamic height formula
          const height = isPlaying 
            ? Math.sin(idx * 0.5 + currentTime * 4) * 12 + 16 
            : 6;
          return (
            <div 
              key={idx} 
              className={`w-[3px] rounded-full transition-all duration-300 ${
                isPlaying ? 'bg-brand-purple/60 shadow-[0_0_8px_rgba(139,92,246,0.3)]' : 'bg-white/10'
              }`}
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>

      {/* Timeline track Slider */}
      <div className="space-y-1.5">
        <input 
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-purple"
        />
        <div className="flex justify-between text-[10px] font-mono text-gray-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Control Actions bar */}
      <div className="flex items-center justify-between pt-1">
        {/* Reset */}
        <button 
          onClick={resetProgress}
          className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          title="Restart"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Master Active Trigger */}
        <button 
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-brand-purple text-white hover:bg-brand-indigo flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] hover:scale-105 active:scale-95 transition-all"
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        {/* Mute toggle / volume control */}
        <div className="flex items-center gap-2 group">
          <button 
            onClick={toggleMute}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input 
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-0 group-hover:w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-purple transition-all duration-300"
          />
        </div>
      </div>
    </div>
  );
}
