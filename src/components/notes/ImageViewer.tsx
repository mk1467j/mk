import React, { useState } from 'react';
import { Download, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';

interface ImageProps {
  url: string;
  title: string;
}

export function ImageViewer({ url, title }: ImageProps) {
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => setScale(s => Math.min(3, s + 0.25));
  const handleZoomOut = () => setScale(s => Math.max(0.5, s - 0.25));
  const handleResetZoom = () => setScale(1);

  return (
    <div 
      className={`relative w-full bg-[#050505] rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-center items-center shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none h-screen w-screen' : 'aspect-video max-w-2xl mx-auto'
      }`}
    >
      {/* Cinematic Ambient Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.95)_100%)] pointer-events-none z-10" />

      {/* Control Actions Panel */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 z-20">
        <button 
          onClick={handleZoomIn}
          className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        {scale !== 1 && (
          <button 
            onClick={handleResetZoom}
            className="text-[10px] font-mono font-bold text-gray-400 hover:text-white px-1.5 hover:bg-white/5 rounded"
          >
            RESET
          </button>
        )}
        <div className="w-[1px] h-4 bg-white/10 mx-1" />
        <a 
          href={url}
          download={title}
          target="_blank"
          rel="noreferrer"
          className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          title="Download Node Image"
        >
          <Download className="w-4 h-4" />
        </a>
        <button 
          onClick={() => {
            setIsFullscreen(!isFullscreen);
            setScale(1);
          }}
          className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          title={isFullscreen ? "Exit Cinema View" : "Cinematic Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Title Subtitle overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono text-gray-400 z-20 pointer-events-none select-none">
        <span className="truncate max-w-xs">{title}</span>
        <span className="px-2 py-0.5 rounded bg-black/50 border border-white/5 text-[9px] uppercase tracking-wider">
          {scale * 100}% scale
        </span>
      </div>

      {/* Centered Image display frame */}
      <div className="w-full h-full flex items-center justify-center overflow-auto p-4 select-none">
        <img
          src={url}
          alt={title}
          referrerPolicy="no-referrer"
          className="max-w-full max-h-full object-contain transition-transform duration-200 select-none pointer-events-none"
          style={{ transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}
