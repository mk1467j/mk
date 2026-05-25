import React from 'react';
import { 
  Type, Highlighter, Pencil, Eraser, Move, Trash2, 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Search, 
  Bookmark, Sun, Moon, Download, Upload, CloudLightning
} from 'lucide-react';

interface PDFToolbarProps {
  activeTool: string;
  setActiveTool: (tool: string) => void;
  pageNum: number;
  numPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  zoomScale: number;
  setZoomScale: (scale: number) => void;
  clearPage: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  searchText: string;
  setSearchText: (text: string) => void;
  findNext: () => void;
  findPrev: () => void;
  addBookmark: () => void;
  bookmarks: number[];
  jumpToPage: (page: number) => void;
  onExport: () => void;
  onImport: () => void;
  // Google Keep helper elements
  onKeepSync?: () => void;
  keepChecking?: boolean;
}

export function PDFToolbar({
  activeTool,
  setActiveTool,
  pageNum,
  numPages,
  onPrevPage,
  onNextPage,
  zoomScale,
  setZoomScale,
  clearPage,
  darkMode,
  setDarkMode,
  searchText,
  setSearchText,
  findPrev,
  findNext,
  addBookmark,
  bookmarks,
  jumpToPage,
  onExport,
  onImport,
  onKeepSync,
  keepChecking = false
}: PDFToolbarProps) {

  const annotationTools = [
    { id: 'select', label: 'Select / Move Object', icon: Move },
    { id: 'highlighter', label: 'Highlighter (Yellow, 40% opacity)', icon: Highlighter },
    { id: 'pen', label: 'Pen Drawing (Red ink)', icon: Pencil },
    { id: 'text', label: 'Placed Text Note', icon: Type },
    { id: 'eraser', label: 'Annotation Eraser', icon: Eraser },
  ];

  const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div className="pdf-sidebar-toolbar flex flex-col gap-3 w-full border-b border-white/10 bg-black/40 p-3">
      {/* 1. Navigation Panel & Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
        <span className="text-[10px] font-mono tracking-widest uppercase text-brand-purple">Navigation</span>
        
        <div className="flex items-center gap-2">
          <button 
            disabled={pageNum <= 1}
            onClick={onPrevPage}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 text-white transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono">
            Page {pageNum} of {numPages || '?'}
          </span>
          <button 
            disabled={pageNum >= numPages}
            onClick={onNextPage}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 text-white transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setZoomScale(Math.max(0.4, zoomScale - 0.1))}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          
          <input 
            type="range"
            min="0.4"
            max="2.5"
            step="0.05"
            value={zoomScale}
            onChange={(e) => setZoomScale(parseFloat(e.target.value))}
            className="w-24 md:w-32 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-purple focus:outline-none focus:ring-1 focus:ring-brand-purple"
            title="Sleek Precision Zoom Slider"
          />

          <span className="text-[11px] font-mono text-gray-300 min-w-[34px] text-right">
            {Math.floor(zoomScale * 100)}%
          </span>

          <button 
            onClick={() => setZoomScale(Math.min(2.5, zoomScale + 0.1))}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Annotation Toolbar Layer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-widest uppercase text-brand-purple">Annotations</span>
          <div className="flex flex-wrap gap-1">
            {annotationTools.map(tool => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`p-1.5 rounded-lg border transition-all relative group ${
                    activeTool === tool.id 
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm' 
                      : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                  }`}
                  title={tool.label}
                >
                  <Icon className="w-4 h-4" />
                  {/* Tooltip */}
                  <span className="absolute z-50 left-1/2 -translate-x-1/2 -top-8 px-2 py-1 bg-gray-900 border border-white/15 text-white text-[9px] font-sans rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
                    {tool.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button 
          onClick={clearPage}
          className="p-1.5 rounded-lg bg-red-950/40 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center gap-1.5 text-xs"
          title="Clear Annotations on this page"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Page</span>
        </button>
      </div>

      {/* 3. Study Tools & Bookmarks & Search */}
      <div className="flex flex-col gap-2 border-b border-white/5 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-widest uppercase text-brand-purple">Study Assist</span>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors flex items-center gap-1 text-xs"
            title="Invert PDF viewport colors"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-gray-300" />}
            <span>{darkMode ? "Light View" : "Contrast Invert"}</span>
          </button>
        </div>

        {/* Text Search element layout */}
        <div className="flex items-center gap-1 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1">
          <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <input 
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search textbook content..."
            className="bg-transparent text-white text-xs w-full focus:outline-none placeholder-gray-500"
          />
          <button 
            onClick={findPrev} 
            className="px-1 text-[10px] hover:text-white text-gray-400 font-mono transition-colors"
          >
            PREV
          </button>
          <button 
            onClick={findNext} 
            className="px-1 text-[10px] hover:text-white text-gray-400 font-mono transition-colors border-l border-white/10"
          >
            NEXT
          </button>
        </div>

        {/* Bookmarking list */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <button
            onClick={addBookmark}
            className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors flex items-center gap-1 text-xs"
            title="Bookmark Current Page"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Bookmark Page</span>
          </button>

          {bookmarks.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto max-w-[170px] scrollbar-hide py-1">
              <span className="text-[10px] text-gray-500 whitespace-nowrap">Jumps:</span>
              {bookmarks.map(page => (
                <button
                  key={page}
                  onClick={() => jumpToPage(page)}
                  className="px-1.5 py-0.5 rounded bg-white/10 border border-white/5 text-[9px] hover:bg-indigo-600 hover:text-white transition-all font-mono"
                >
                  P.{page}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Settings & IO / Cloud Google Keep Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <span className="text-[10px] font-mono tracking-widest uppercase text-brand-purple">I/O Sync</span>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onImport}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors flex items-center gap-1 text-[11px]"
            title="Import Annotations JSON File"
          >
            <Upload className="w-3 h-3" />
            <span>Import</span>
          </button>
          <button
            onClick={onExport}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors flex items-center gap-1 text-[11px]"
            title="Export Page Annotations"
          >
            <Download className="w-3 h-3" />
            <span>Export</span>
          </button>

          {onKeepSync && (
            <button
              onClick={onKeepSync}
              disabled={keepChecking}
              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 border border-amber-500/20 transition-all flex items-center gap-1 text-[11px] disabled:opacity-40 animate-pulse"
              title="Push Study Review notes to your Google Keep workspace accounts"
            >
              <CloudLightning className="w-3.5 h-3.5" />
              <span>{keepChecking ? 'Syncing...' : 'Keep Notes'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
