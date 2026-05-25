import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { fabric } from 'fabric';
import { usePDFAnnotations } from './usePDFAnnotations';
import { useAuth } from '@/context/AuthContext';
import { 
  X, UploadCloud, FileText, ChevronRight, BookOpen, 
  Search, Bookmark, Sparkles, Pin, Minimize2, Maximize2, 
  RotateCcw, Pencil, Highlighter, StickyNote, Type, Eraser, 
  Trash2, ChevronLeft, Volume2, Move, HelpCircle, Download, 
  Upload, CloudLightning, Sun, Moon, Info, MoreHorizontal,
  ZoomIn, ZoomOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import './PDFSidebar.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface StickyNoteItem {
  id: string;
  left: number;
  top: number;
  text: string;
}

interface DragAction {
  type: 'move' | 'resize-br' | 'resize-r' | 'resize-b';
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  startXPos: number;
  startYPos: number;
}

// Sub-component representing a single page thumbnail asynchronously with static image caching
const PDFThumbnail = React.memo(({
  pdfDoc,
  pageNum,
  aspectRatio
}: {
  pdfDoc: any;
  pageNum: number;
  aspectRatio: number;
}) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const renderThumb = async () => {
      if (!pdfDoc) return;
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (!active) return;

        // Render at a high-quality thumbnail width scale
        const baseWidth = 120; 
        const originalViewport = page.getViewport({ scale: 1 });
        const scaleFactor = (originalViewport.width > 0) ? baseWidth / originalViewport.width : 0.25;
        const viewport = page.getViewport({ scale: scaleFactor });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.warn('Could not acquire 2D context for offscreen thumbnail rendering');
          return;
        }

        // 1.5x DPR multiplier to guarantee high-definition vector text rendering
        const crispDpr = 1.5;
        canvas.width = viewport.width * crispDpr;
        canvas.height = viewport.height * crispDpr;

        ctx.scale(crispDpr, crispDpr);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, viewport.width, viewport.height);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };
        await page.render(renderContext).promise;
        
        if (active) {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setImgSrc(dataUrl);
        }
      } catch (err) {
        console.error('Thumbnail render failed', pageNum, err);
      }
    };

    renderThumb();
    return () => {
      active = false;
    };
  }, [pdfDoc, pageNum]);

  return (
    <div className="w-full aspect-[3/4] bg-[#0c0d12] flex items-center justify-center rounded-xl overflow-hidden relative shadow-inner border border-white/5 group-hover:border-brand-purple/40 transition-all select-none">
      {imgSrc ? (
        <img 
          src={imgSrc} 
          alt={`Page ${pageNum} thumbnail`} 
          className="w-full h-full object-cover transition-opacity duration-300 opacity-100"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col gap-1 items-center justify-center text-[10px] font-mono text-indigo-400 select-none bg-[#0a0b0f]">
          <div className="w-3.5 h-3.5 rounded-full border border-indigo-500/30 border-t-indigo-500 animate-spin" />
          <span>P. {pageNum}</span>
        </div>
      )}
    </div>
  );
});
PDFThumbnail.displayName = 'PDFThumbnail';

// Sub-component representing a single page of content
const PDFPageRow = React.memo(({
  pageNum,
  pdfDoc,
  zoomScale,
  activeTool,
  brushColor,
  pdfFilename,
  loadAnnotations,
  saveAnnotations,
  clearPageAnnotations,
  aspectRatio,
  onVisible,
  targetPageWidth
}: {
  pageNum: number;
  pdfDoc: any;
  zoomScale: number;
  activeTool: string;
  brushColor: string;
  pdfFilename: string;
  loadAnnotations: any;
  saveAnnotations: any;
  clearPageAnnotations: any;
  aspectRatio: number;
  onVisible: (p: number) => void;
  targetPageWidth: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricInstance = useRef<fabric.Canvas | null>(null);
  const saveTimeout = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const [stickyNotes, setStickyNotes] = useState<StickyNoteItem[]>([]);

  // Base calculated dimension with dynamic targetPageWidth to scale with sidebar size
  const width = targetPageWidth * zoomScale;
  const height = width / (aspectRatio || 0.77);

  // Monitor visibility in the viewport & dynamically mount/unmount heavy canvas renderings to free up system memory
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          onVisible(pageNum);
        } else {
          setIsVisible(false);
        }
      });
    }, {
      root: null,
      rootMargin: '450px 0px 450px 0px', // Loads next pages right before they enter viewport
      threshold: 0.01
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, [pageNum, onVisible]);

  // Sync rendering state based on visibility to prevent extreme canvas DOM accumulation
  useEffect(() => {
    if (isVisible) {
      setHasRendered(true);
    } else {
      setHasRendered(false);
    }
  }, [isVisible]);

  // Load notes specifically on active display
  useEffect(() => {
    if (!hasRendered) return;
    try {
      const cached = localStorage.getItem(`studyvibe_sticky_notes_${pdfFilename}_p_${pageNum}`);
      if (cached) {
        setStickyNotes(JSON.parse(cached));
      } else {
        setStickyNotes([]);
      }
    } catch {
      setStickyNotes([]);
    }
  }, [hasRendered, pdfFilename, pageNum]);

  const saveLocalNotes = (notes: StickyNoteItem[]) => {
    setStickyNotes(notes);
    try {
      localStorage.setItem(`studyvibe_sticky_notes_${pdfFilename}_p_${pageNum}`, JSON.stringify(notes));
    } catch (err) {
      console.error(err);
    }
  };

  // Re-render core canvas layers
  useEffect(() => {
    if (hasRendered) {
      renderPage();
    }
    return () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
        renderTaskRef.current = null;
      }
      if (fabricInstance.current) {
        fabricInstance.current.dispose();
        fabricInstance.current = null;
      }
    };
  }, [hasRendered, pdfDoc, pageNum, zoomScale, targetPageWidth]);

  // Adjust tools on brush option shift
  useEffect(() => {
    if (fabricInstance.current) {
      configureTools(fabricInstance.current);
    }
  }, [activeTool, brushColor]);

  const configureTools = (canvas: fabric.Canvas) => {
    canvas.isDrawingMode = activeTool === 'pen' || activeTool === 'highlighter';
    canvas.selection = activeTool === 'select';

    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor;
      if (activeTool === 'highlighter') {
        canvas.freeDrawingBrush.width = 24;
      } else if (activeTool === 'pen') {
        canvas.freeDrawingBrush.width = 4;
      }
      // Subpixel decimation reduces micro-coordinate jitter for smooth, fluid freehand drawing
      canvas.freeDrawingBrush.decimate = 2;
    }

    canvas.forEachObject((obj) => {
      obj.selectable = activeTool === 'select';
      obj.evented = activeTool === 'select' || activeTool === 'eraser';
    });
    canvas.requestRenderAll();
  };

  const renderPage = async () => {
    if (!pdfDoc || !pdfCanvasRef.current) return;
    try {
      // Cancel outstanding render task if any
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
        renderTaskRef.current = null;
      }

      const page = await pdfDoc.getPage(pageNum);
      
      const pdfCanvas = pdfCanvasRef.current;
      if (!pdfCanvas) return; // Safeguard if unmounted during getPage await

      const dpr = window.devicePixelRatio || 1;
      // High detail multiplier renders textbook vector text perfectly crisp even on zoomed-in viewports
      const hdMultiplier = 2.4;
      const renderViewport = page.getViewport({ scale: (width / page.getViewport({ scale: 1 }).width) * dpr * hdMultiplier });
      const cssViewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });

      pdfCanvas.width = renderViewport.width;
      pdfCanvas.height = renderViewport.height;
      pdfCanvas.style.width = '100%';
      pdfCanvas.style.height = '100%';

      const ctx = pdfCanvas.getContext('2d');
      if (!ctx) {
        console.warn('Could not acquire 2D context for page canvas rendering');
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);

      const renderContext = {
        canvasContext: ctx,
        viewport: renderViewport
      };
      
      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      await renderTask.promise;

      if (renderTaskRef.current === renderTask) {
        renderTaskRef.current = null;
      }

      // Ensure elements are still active in the DOM before overlay installation
      if (!pdfCanvasRef.current) return;

      initFabric(cssViewport.width, cssViewport.height);
    } catch (err: any) {
      if (err?.name === 'RenderingCancelledException' || err?.message?.includes('cancelled')) {
        return; // Peaceful cancel
      }
      console.error('Core page render failure', pageNum, err);
    }
  };

  const initFabric = async (w: number, h: number) => {
    if (!fabricCanvasRef.current) return;
    if (fabricInstance.current) {
      fabricInstance.current.dispose();
      fabricInstance.current = null;
    }

    const fEl = fabricCanvasRef.current;
    fEl.width = w;
    fEl.height = h;

    const fCanvas = new fabric.Canvas(fEl, {
      width: w,
      height: h,
      selection: activeTool === 'select',
      renderOnAddRemove: true
    });

    fabricInstance.current = fCanvas;

    // Load active drawing records with robust viewport-ratio resizing to prevent alignment shift
    const loadedData = await loadAnnotations(pdfFilename, pageNum);
    if (loadedData) {
      const savedWidth = loadedData.basePageWidth;
      const ratio = (savedWidth && savedWidth !== w && savedWidth > 0) ? (w / savedWidth) : 1;

      fCanvas.loadFromJSON(loadedData, () => {
        if (ratio !== 1) {
          fCanvas.forEachObject((obj) => {
            obj.left = (obj.left || 0) * ratio;
            obj.top = (obj.top || 0) * ratio;
            obj.scaleX = (obj.scaleX || 1) * ratio;
            obj.scaleY = (obj.scaleY || 1) * ratio;
            if (obj.strokeWidth) {
              obj.strokeWidth = obj.strokeWidth * ratio;
            }
            obj.setCoords();
          });
        }
        fCanvas.renderAll();
      });
    }

    configureTools(fCanvas);

    // Dynamic scale embedding on serialized objects
    const handleSave = () => {
      const json = fCanvas.toJSON();
      json.basePageWidth = w;
      json.basePageHeight = h;
      
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        await saveAnnotations(pdfFilename, pageNum, json);
      }, 700);
    };

    fCanvas.on('object:added', handleSave);
    fCanvas.on('object:modified', handleSave);
    fCanvas.on('object:removed', handleSave);
    fCanvas.on('path:created', handleSave);

    // Ignore multi-touch finger gesture scrolls while drawing
    const upperCanvasEl = fCanvas.upperCanvasEl;
    if (upperCanvasEl) {
      const handleTouchStart = (e: TouchEvent) => {
        if (e.touches && e.touches.length > 1) {
          fCanvas.isDrawingMode = false;
        }
      };
      const handleTouchEnd = () => {
        fCanvas.isDrawingMode = activeTool === 'pen' || activeTool === 'highlighter';
      };
      upperCanvasEl.addEventListener('touchstart', handleTouchStart, { passive: true });
      upperCanvasEl.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    // Precision swipe-eraser algorithm with pixel-accurate target check and generous bounding fallback
    const eraseAtPoint = (e: any, pointer: { x: number; y: number }) => {
      let target: fabric.Object | undefined = fCanvas.findTarget(e, false);
      
      if (!target) {
        const objects = fCanvas.getObjects();
        const tolerance = 18;
        for (let i = objects.length - 1; i >= 0; i--) {
          const obj = objects[i];
          const bounds = obj.getBoundingRect(true);
          
          const isWithinBounds = 
            pointer.x >= bounds.left - tolerance &&
            pointer.x <= bounds.left + bounds.width + tolerance &&
            pointer.y >= bounds.top - tolerance &&
            pointer.y <= bounds.top + bounds.height + tolerance;
            
          if (isWithinBounds) {
            target = obj;
            break;
          }
        }
      }

      if (target) {
        fCanvas.remove(target);
        fCanvas.requestRenderAll();
        handleSave();
      }
    };

    let isScratching = false;

    fCanvas.on('mouse:down', (options) => {
      const originalEvent = options.e;
      if (originalEvent && 'touches' in originalEvent && originalEvent.touches.length > 1) {
        return; 
      }

      if (activeTool === 'text') {
        const pointer = fCanvas.getPointer(options.e);
        const newNote: StickyNoteItem = {
          id: 'note_' + Date.now(),
          left: pointer.x / w, 
          top: pointer.y / h,  
          text: 'Note details...'
        };
        const updated = [...stickyNotes, newNote];
        saveLocalNotes(updated);
      } else if (activeTool === 'eraser') {
        isScratching = true;
        const pointer = fCanvas.getPointer(options.e);
        eraseAtPoint(options.e, pointer);
      }
    });

    fCanvas.on('mouse:move', (options) => {
      if (activeTool === 'eraser' && isScratching) {
        const pointer = fCanvas.getPointer(options.e);
        eraseAtPoint(options.e, pointer);
      }
    });

    fCanvas.on('mouse:up', () => {
      isScratching = false;
    });
  };

  const clearDrawings = async () => {
    if (fabricInstance.current) {
      fabricInstance.current.clear();
      await clearPageAnnotations(pdfFilename, pageNum);
    }
    saveLocalNotes([]);
  };

  // Event dispatcher for page clearing
  useEffect(() => {
    const handleClearEvent = (e: CustomEvent<{ page: number }>) => {
      if (e.detail.page === pageNum) {
        clearDrawings();
      }
    };
    window.addEventListener(`clear-page-drawings-${pdfFilename}-${pageNum}` as any, handleClearEvent);
    return () => {
      window.removeEventListener(`clear-page-drawings-${pdfFilename}-${pageNum}` as any, handleClearEvent);
    };
  }, [pdfFilename, pageNum]);

  return (
    <div 
      ref={containerRef}
      data-page-index={pageNum}
      className="relative flex-shrink-0 bg-[#161720] rounded-xl shadow-2xl border border-white/5 overflow-visible select-none my-3"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {!hasRendered ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-[11px] text-gray-500 font-mono gap-1.5 bg-[#0e0f14] rounded-xl">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <span>Page {pageNum}</span>
        </div>
      ) : (
        <>
          <canvas 
            ref={pdfCanvasRef} 
            className="block relative rounded-xl"
            style={{ width: `${width}px`, height: `${height}px` }}
          />

          {/* Core interactive drawing layer with pointer-events toggles list */}
          <div className={`absolute inset-0 z-10 ${activeTool === 'select' ? 'pointer-events-none' : 'pointer-events-auto'}`}>
            <canvas ref={fabricCanvasRef} />
          </div>

          <div className="absolute inset-0 z-30 pointer-events-none overflow-visible">
            {stickyNotes.map((note) => {
              // Read ratio coordinate projection or fallback to ancient pixel coordinates gracefully
              const displayLeft = note.left <= 1 ? note.left * width : note.left;
              const displayTop = note.top <= 1 ? note.top * height : note.top;
              return (
                <div 
                  key={note.id}
                  className="absolute p-2.5 bg-amber-200 text-neutral-900 border border-amber-300 shadow-[0_10px_25px_rgba(0,0,0,0.45)] rounded-xl max-w-[160px] text-[11px] font-sans pointer-events-auto sticky-note-pad no-drag scale-95 origin-top-left"
                  style={{
                    left: `${displayLeft}px`,
                    top: `${displayTop}px`,
                  }}
                >
                  <div className="flex justify-between items-center gap-1 border-b border-amber-400 pb-1 mb-1 text-[8.5px] font-mono tracking-wider font-bold text-amber-800">
                    <span>MEMO</span>
                    <button 
                      onClick={() => {
                        const next = stickyNotes.filter(n => n.id !== note.id);
                        saveLocalNotes(next);
                      }}
                      className="text-amber-800 hover:text-black hover:bg-amber-300/60 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <textarea 
                    value={note.text}
                    onChange={(e) => {
                      const next = stickyNotes.map(n => n.id === note.id ? { ...n, text: e.target.value } : n);
                      saveLocalNotes(next);
                    }}
                    className="w-full bg-transparent resize-none border-none focus:outline-none text-[10.5px] leading-relaxed text-neutral-800"
                    rows={2}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
});
PDFPageRow.displayName = 'PDFPageRow';


export function PDFSidebarPanel() {
  const { loadAnnotations, saveAnnotations, clearPageAnnotations, exportAllAnnotations, importAllAnnotations } = usePDFAnnotations();
  const { user } = useAuth() as any;

  // Mobile & responsive layouts resize tracking state
  const [isMobile, setIsMobile] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Bottom-sheet expandable height for mobile viewports
  const [mobileHeight, setMobileHeight] = useState<number>(window.innerHeight - 100);
  useEffect(() => {
    if (isMobile) {
      setMobileHeight(window.innerHeight - 100);
    }
  }, [isMobile, windowSize.height]);

  // Window positioning & sizing state
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [size, setSize] = useState({ width: 440, height: 750 });
  const [position, setPosition] = useState({ x: 80, y: 50 });

  // Native drag & resize state
  const [interaction, setInteraction] = useState<DragAction | null>(null);

  // Document states
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string>('Study Textbook.pdf');
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [aspectRatio, setAspectRatio] = useState<number>(0.77); // Portrait A4 default
  
  // Design control triggers
  const [activeTool, setActiveTool] = useState<string>('select');
  const [brushColor, setBrushColor] = useState<string>('rgba(234, 179, 8, 0.45)');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  
  // Frame option sheets
  const [isThumbsOpen, setIsThumbsOpen] = useState(false);
  const [isAnnotateOpen, setIsAnnotateOpen] = useState(false);
  const [isBookmarkOpen, setIsBookmarkOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainFrameRef = useRef<HTMLDivElement | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);

  // Force activeTool to 'select' when annotating is closed, stopping drawings from lingering active
  useEffect(() => {
    if (!isAnnotateOpen) {
      setActiveTool('select');
    }
  }, [isAnnotateOpen]);

  // Intercept trackpad multi-finger pinch zooms and mobile pinch gestures within the PDF scroll area, mapping them directly to the zoomScale
  useEffect(() => {
    const container = pdfContainerRef.current;
    if (!container) return;

    // Trackpad / Ctrl-wheel zoom handler
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault(); // Stop global browser scaling zoom
        const zoomDelta = -e.deltaY * 0.0035;
        setZoomScale(prev => Math.max(0.4, Math.min(2.5, prev + zoomDelta)));
      }
    };

    // Mobile touches pinch helper
    let initialDist = 0;
    let initialZoom = zoomScale;

    const getDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDist = getDistance(e.touches);
        initialZoom = zoomScale;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDist > 0) {
        if (e.cancelable) e.preventDefault();
        const currentDist = getDistance(e.touches);
        const factor = currentDist / initialDist;
        const nextZoom = Math.min(2.5, Math.max(0.4, initialZoom * factor));
        setZoomScale(nextZoom);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        initialDist = 0;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pdfDoc, zoomScale]);

  // Sync launching event trigger
  useEffect(() => {
    const handleOpenFile = async (e: CustomEvent<{ url: string; name: string }>) => {
      const { url, name } = e.detail;
      if (url) {
        setPdfFilename(name || 'DocumentNotes.pdf');
        setIsOpen(true);
        setIsMinimized(false);
        setPageNum(1);
        setActiveTool('select');
        setIsAnnotateOpen(false);
        setIsThumbsOpen(false);
        setIsBookmarkOpen(false);
        setIsMoreOpen(false);

        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const file = new File([blob], name, { type: 'application/pdf' });
          setPdfFile(file);
        } catch (err) {
          console.warn('Fallback stream download model:', err);
          try {
            const docTask = pdfjsLib.getDocument({ url });
            const doc = await docTask.promise;
            setPdfDoc(doc);
            setNumPages(doc.numPages);
            setPageNum(1);
            setBookmarks([]);
            setPdfFile({ name: name } as any);
          } catch (innerErr) {
            console.error('Parsing failed', innerErr);
          }
        }
      }
    };

    window.addEventListener('open-pdf-study-document' as any, handleOpenFile);
    
    const handleToggle = () => {
      setIsOpen(prev => !prev);
      setIsMinimized(false);
    };
    window.addEventListener('toggle-pdf-sidebar', handleToggle);

    return () => {
      window.removeEventListener('open-pdf-study-document' as any, handleOpenFile);
      window.removeEventListener('toggle-pdf-sidebar', handleToggle);
    };
  }, []);

  // Guarantee clean states reset whenever workspace is closed
  useEffect(() => {
    if (!isOpen) {
      setActiveTool('select');
      setIsAnnotateOpen(false);
      setIsThumbsOpen(false);
      setIsBookmarkOpen(false);
      setIsMoreOpen(false);
    }
  }, [isOpen]);

  // Sync popup position
  useEffect(() => {
    if (isOpen) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const initialPos = {
        x: Math.max(16, Math.floor(w / 2 - size.width / 2)),
        y: Math.max(16, Math.floor(h / 3 - size.height / 3))
      };
      setPosition(initialPos);
    }
  }, [isOpen]);

  // Synchronous restoration of previous learning states representing workspace checkpoints
  useEffect(() => {
    if (!pdfDoc) return;
    try {
      const cached = localStorage.getItem(`studyvibe_pdf_progress_${pdfFilename}`);
      if (cached) {
        const progress = JSON.parse(cached);
        if (progress.pageNum) {
          setPageNum(progress.pageNum);
          // Wait briefly for rows to render, then jump to restored offset page index
          setTimeout(() => {
            jumpToPage(progress.pageNum);
          }, 450);
        }
        if (progress.zoomScale) setZoomScale(progress.zoomScale);
        if (progress.activeTool) setActiveTool(progress.activeTool);
        if (progress.bookmarks) setBookmarks(progress.bookmarks);
        if (progress.isFullscreen !== undefined) setIsFullscreen(progress.isFullscreen);
        if (progress.darkMode !== undefined) setDarkMode(progress.darkMode);
      } else {
        setPageNum(1);
        setZoomScale(1.0);
        setActiveTool('select');
        setBookmarks([]);
        setDarkMode(false);
      }
    } catch (e) {
      console.warn('Progress restoration failure:', e);
    }
  }, [pdfFilename, pdfDoc]);

  // Autosave progress changes inside state updates
  useEffect(() => {
    if (!pdfDoc) return;
    try {
      const progress = {
        pageNum,
        zoomScale,
        activeTool,
        bookmarks,
        isFullscreen,
        darkMode
      };
      localStorage.setItem(`studyvibe_pdf_progress_${pdfFilename}`, JSON.stringify(progress));
    } catch (e) {
      console.error('Autosave progress failure:', e);
    }
  }, [pdfFilename, pdfDoc, pageNum, zoomScale, activeTool, bookmarks, isFullscreen, darkMode]);

  // Read PDF file changes
  useEffect(() => {
    if (pdfFile) {
      setBookmarks([]);
      const fileReader = new FileReader();
      fileReader.onload = async function() {
        try {
          const typedArray = new Uint8Array(this.result as ArrayBuffer);
          const docTask = pdfjsLib.getDocument({ data: typedArray });
          const doc = await docTask.promise;
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setPageNum(1);

          // Get default Aspect Ratio
          const firstPageObj = await doc.getPage(1);
          const viewportObj = firstPageObj.getViewport({ scale: 1 });
          setAspectRatio(viewportObj.width / viewportObj.height);
        } catch (err) {
          console.error('Error parsing loaded PDF binary', err);
        }
      };
      fileReader.readAsArrayBuffer(pdfFile);
    } else {
      setPdfDoc(null);
      setNumPages(0);
      setPageNum(1);
    }
  }, [pdfFile]);

  // Expand bottom drawer sheet by touch drags on mobile
  const handleMobileHandlebarDrag = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startY = touch.clientY;
    const startHeight = mobileHeight;
    
    const handleTouchMove = (moveEvt: TouchEvent) => {
      const currentY = moveEvt.touches[0].clientY;
      const deltaY = currentY - startY;
      // Dragging up reduces clientY, opening the sheet height
      const newHeight = Math.max(160, Math.min(window.innerHeight - 56, startHeight - deltaY));
      setMobileHeight(newHeight);
    };
    
    const handleTouchEnd = () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
    
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  };

  // Multitouch/Drag/Resize Interaction Handlers
  const handleInteractionStart = (
    e: React.MouseEvent | React.TouchEvent, 
    type: 'move' | 'resize-br' | 'resize-r' | 'resize-b'
  ) => {
    if (isFullscreen || isMobile) return;
    
    const target = e.target as HTMLElement;
    if (type === 'move' && target.closest('.no-drag')) return;

    // Only prevent default on control nodes to preserve textarea/scroller focus
    if (type !== 'move') {
      e.preventDefault();
    }
    
    const touches = 'touches' in e ? e.touches : null;
    if (touches && touches.length === 0) return;
    const clientX = touches ? touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = touches ? touches[0].clientY : (e as React.MouseEvent).clientY;

    setInteraction({
      type,
      startX: clientX,
      startY: clientY,
      startW: size.width,
      startH: size.height,
      startXPos: position.x,
      startYPos: position.y
    });
  };

  useEffect(() => {
    if (!interaction) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const touches = 'touches' in e ? e.touches : null;
      if (touches && touches.length === 0) return;
      const clientX = touches ? touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = touches ? touches[0].clientY : (e as MouseEvent).clientY;

      const deltaX = clientX - interaction.startX;
      const deltaY = clientY - interaction.startY;

      if (interaction.type === 'move') {
        let newX = interaction.startXPos + deltaX;
        let newY = interaction.startYPos + deltaY;

        // Snapping thresholds (edges snap within 16px magnetic radius)
        const SNAP_MARGIN = 16;
        if (newX < SNAP_MARGIN) newX = 0;
        if (window.innerWidth - (newX + size.width) < SNAP_MARGIN) {
          newX = window.innerWidth - size.width;
        }
        if (newY < SNAP_MARGIN) newY = 0;
        if (window.innerHeight - (newY + size.height) < SNAP_MARGIN) {
          newY = window.innerHeight - size.height;
        }

        newX = Math.max(0, Math.min(window.innerWidth - 100, newX));
        newY = Math.max(0, Math.min(window.innerHeight - 100, newY));
        setPosition({ x: newX, y: newY });
      } else if (interaction.type === 'resize-br') {
        const newW = Math.max(340, Math.min(window.innerWidth - position.x, interaction.startW + deltaX));
        const newH = Math.max(400, Math.min(window.innerHeight - position.y, interaction.startH + deltaY));
        setSize({ width: newW, height: newH });
      } else if (interaction.type === 'resize-r') {
        const newW = Math.max(340, Math.min(window.innerWidth - position.x, interaction.startW + deltaX));
        setSize(prev => ({ ...prev, width: newW }));
      } else if (interaction.type === 'resize-b') {
        const newH = Math.max(400, Math.min(window.innerHeight - position.y, interaction.startH + deltaY));
        setSize(prev => ({ ...prev, height: newH }));
      }
    };

    const handleEnd = () => {
      setInteraction(null);
    };

    window.addEventListener('mousemove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [interaction, position, size]);

  // Automatically switch back to safe drag/select mode when annotation tool wrap closes
  useEffect(() => {
    if (!isAnnotateOpen) {
      setActiveTool('select');
    }
  }, [isAnnotateOpen]);

  // Lock mousewheel ctrl zoom and iOS Safari gesture zoom to prevent scaling the whole HTML app
  useEffect(() => {
    const preventZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    const container = pdfContainerRef.current;
    if (container) {
      container.addEventListener('wheel', preventZoom, { passive: false });
      container.addEventListener('gesturestart', preventGesture, { passive: false });
      container.addEventListener('gesturechange', preventGesture, { passive: false });
    }

    const frame = mainFrameRef.current;
    if (frame) {
      frame.addEventListener('gesturestart', preventGesture, { passive: false });
      frame.addEventListener('gesturechange', preventGesture, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', preventZoom);
        container.removeEventListener('gesturestart', preventGesture);
        container.removeEventListener('gesturechange', preventGesture);
      }
      if (frame) {
        frame.removeEventListener('gesturestart', preventGesture);
        frame.removeEventListener('gesturechange', preventGesture);
      }
    };
  }, [isOpen]);

  // Navigation handlers
  const handlePageVisible = (p: number) => {
    setPageNum(p);
  };

  const jumpToPage = (p: number) => {
    if (p < 1 || p > numPages) return;
    setPageNum(p);
    
    // Scroll targeted row element smoothly into view
    const container = pdfContainerRef.current;
    if (container) {
      const pageEl = container.querySelector(`[data-page-index="${p}"]`);
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handlePrevPage = () => {
    if (pageNum > 1) {
      jumpToPage(pageNum - 1);
    }
  };

  const handleNextPage = () => {
    if (pageNum < numPages) {
      jumpToPage(pageNum + 1);
    }
  };

  const toggleBookmark = () => {
    if (bookmarks.includes(pageNum)) {
      setBookmarks(prev => prev.filter(p => p !== pageNum));
    } else {
      setBookmarks(prev => [...prev, pageNum].sort((a, b) => a - b));
    }
  };

  const triggerClearCurrentPage = () => {
    const isOk = window.confirm(`Permanently clear drawing markup on page ${pageNum}?`);
    if (!isOk) return;
    const evt = new CustomEvent(`clear-page-drawings-${pdfFilename}-${pageNum}`, {
      detail: { page: pageNum }
    });
    window.dispatchEvent(evt);
  };

  // Backups
  const handleExportJSON = async () => {
    const json = await exportAllAnnotations(pdfFilename);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pdfFilename}_annotations_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const loaded = await importAllAnnotations(pdfFilename, text);
      if (loaded) {
        alert('Annotations imported successfully! Refreshing active workspace.');
        // Trigger forced re-render of layout
        window.location.reload();
      }
    };
    input.click();
  };

  const handleSearchWord = async () => {
    if (!pdfDoc || !searchText) return;
    let foundPage = -1;
    for (let i = 1; i <= numPages; i++) {
      const pageObj = await pdfDoc.getPage(i);
      const textCtx = await pageObj.getTextContent();
      const contentStr = textCtx.items.map((it: any) => it.str).join(' ');
      if (contentStr.toLowerCase().includes(searchText.toLowerCase())) {
        foundPage = i;
        break;
      }
    }
    if (foundPage !== -1) {
      jumpToPage(foundPage);
    } else {
      alert(`No matches matching keyword "${searchText}" discovered.`);
    }
  };

  // We handle open/minimized animated states in the main return block with AnimatePresence

  const pagesArray = Array.from({ length: numPages }, (_, idx) => idx + 1);

  // Responsive adaptive placement sizes layout (Mobile acts as integrated bottom multitasking shell)
  const finalWidth = isFullscreen 
    ? '100vw' 
    : isMobile 
      ? '100vw' 
      : `${size.width}px`;

  const finalHeight = isFullscreen 
    ? '100vh' 
    : isMobile 
      ? `${mobileHeight}px` 
      : `${size.height}px`;

  const finalLeft = isFullscreen 
    ? '0px' 
    : isMobile 
      ? '0px' 
      : `${position.x}px`;

  const finalTop = isFullscreen 
    ? '0px' 
    : isMobile 
      ? `${window.innerHeight - mobileHeight}px` 
      : `${position.y}px`;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        isMinimized ? (
          <motion.div
            key="minimized-badge"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 15 }}
            onClick={() => setIsMinimized(false)}
            className="fixed bottom-20 right-6 z-50 flex items-center gap-3 bg-[#111218] border border-brand-purple/40 rounded-2xl p-3 shadow-[0_15px_40px_rgba(0,0,0,0.8)] cursor-pointer hover:scale-105 active:scale-95 transition-all text-white font-sans animate-bounce"
            title="Restore Textbook Window"
          >
            <BookOpen className="w-5 h-5 text-brand-purple" />
            <div className="text-left text-xs">
              <p className="text-[10px] font-mono text-indigo-300 uppercase font-semibold">Study Session</p>
              <p className="font-semibold max-w-[130px] truncate">{pdfFilename}</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="maximized-window"
            ref={mainFrameRef}
            initial={isMobile ? { y: '100%', opacity: 0.95 } : { opacity: 0, scale: 0.96, y: 24 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={isMobile ? { y: '100%', opacity: 0.95 } : { opacity: 0, scale: 0.96, y: 24 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            style={{
              width: finalWidth,
              height: finalHeight,
              left: finalLeft,
              top: finalTop,
              position: 'fixed',
              zIndex: 100
            }}
            className={`pdf-modular-window flex flex-col bg-[#0b0c10] border border-white/10 ${isFullscreen ? 'rounded-none' : isMobile ? 'rounded-t-[28px] rounded-b-none shadow-[0_-15px_40px_rgba(0,0,0,0.9)] border-t border-white/15' : 'rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.95)]'} overflow-hidden h-full font-sans transition-all duration-75 relative text-gray-200`}
          >
            {/* Elegant drag sheet handlebar for mobile multitasking */}
            {isMobile && (
              <div 
                onClick={() => setIsMinimized(true)}
                onTouchStart={handleMobileHandlebarDrag}
                className="w-12 h-1.5 bg-white/20 hover:bg-white/35 rounded-full mx-auto mt-2.5 mb-1 cursor-grabbing transition-colors z-45 flex-shrink-0"
              />
            )}
      
      {/* Absolute resize handles around container, disabled on mobile or fullscreen to prevent drag error */}
      {!isFullscreen && !isMobile && (
        <>
          <div 
            onMouseDown={(e) => handleInteractionStart(e, 'resize-r')}
            onTouchStart={(e) => handleInteractionStart(e, 'resize-r')}
            className="absolute top-0 right-0 w-2 h-full cursor-e-resize hover:bg-brand-purple/20 transition-all z-40" 
          />
          <div 
            onMouseDown={(e) => handleInteractionStart(e, 'resize-b')}
            onTouchStart={(e) => handleInteractionStart(e, 'resize-b')}
            className="absolute bottom-0 left-0 h-2 w-full cursor-s-resize hover:bg-brand-purple/20 transition-all z-40" 
          />
          <div 
            onMouseDown={(e) => handleInteractionStart(e, 'resize-br')}
            onTouchStart={(e) => handleInteractionStart(e, 'resize-br')}
            className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-50 group no-drag"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-brand-purple border border-white flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.8)]">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          </div>
        </>
      )}

      {/* HEADER ROW */}
      <header 
        onMouseDown={(e) => handleInteractionStart(e, 'move')}
        onTouchStart={(e) => handleInteractionStart(e, 'move')}
        className="flex items-center justify-between px-4 py-3 bg-[#111218] border-b border-white/5 cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2.5 no-drag">
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Close workspace"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-left">
            <h3 className="text-xs font-semibold max-w-[180px] truncate text-white">{pdfFilename}</h3>
            <p className="text-[9px] font-mono text-gray-500 uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> active work desk
            </p>
          </div>
        </div>

        {/* Action controllers */}
        <div className="flex items-center gap-1.5 no-drag">
          <button 
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Minimize Panel"
          >
            <span className="block w-2.5 h-0.5 bg-gray-400" />
          </button>
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Toggle fullscreen reader"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            title="Close viewer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* STAGE CONTAINER */}
      <div className="flex-1 flex relative overflow-hidden bg-[#0d0e14]">
        
        {/* PAGES SIDENAV PREVIEW */}
        <AnimatePresence>
          {isThumbsOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsThumbsOpen(false)}
                className="absolute inset-0 bg-black/60 z-30 pointer-events-auto"
              />

              <motion.div 
                initial={{ x: -160, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -160, opacity: 0 }}
                className="absolute top-0 bottom-0 left-0 w-44 bg-[#111218] border-r border-white/10 p-3 z-40 flex flex-col shadow-2xl pointer-events-auto no-drag"
              >
                <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3">
                  <span className="text-xs font-mono font-medium text-brand-purple">Pages</span>
                  <button onClick={() => setIsThumbsOpen(false)} className="p-0.5 hover:bg-white/5 rounded text-gray-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                {pdfDoc ? (
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
                    {pagesArray.map((page) => (
                      <button
                        key={page}
                        onClick={() => {
                          jumpToPage(page);
                          setIsThumbsOpen(false);
                        }}
                        className={`w-full text-left rounded-xl border p-2 transition-all group ${
                          pageNum === page
                            ? 'border-brand-purple bg-brand-purple/15 text-white animate-pulse'
                            : 'border-white/5 hover:border-brand-purple/30 text-gray-400 hover:text-white'
                        }`}
                      >
                        <PDFThumbnail 
                          pdfDoc={pdfDoc}
                          pageNum={page}
                          aspectRatio={aspectRatio}
                        />
                        <span className="text-[10px] mt-1.5 block text-center font-mono">Page {page}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 font-mono">Buffering pages...</p>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* BOOKMARKS LIST SHEET */}
        <AnimatePresence>
          {isBookmarkOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsBookmarkOpen(false)}
                className="absolute inset-0 bg-black/60 z-30 pointer-events-auto"
              />
              <motion.div 
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="absolute top-0 left-0 right-0 max-h-56 bg-[#111218] border-b border-white/15 p-3.5 z-40 shadow-2xl flex flex-col pointer-events-auto no-drag"
              >
                <div className="flex justify-between items-center pb-2.5 border-b border-white/5 mb-3">
                  <span className="text-xs font-mono font-medium text-brand-purple">Session Bookmarks</span>
                  <button onClick={() => setIsBookmarkOpen(false)} className="p-0.5 hover:bg-white/5 rounded text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {bookmarks.length === 0 ? (
                    <p className="text-[11px] font-mono text-gray-500 py-3 text-center">Place a bookmark inside the current page to locate it.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {bookmarks.map(page => (
                        <button
                          key={page}
                          onClick={() => {
                            jumpToPage(page);
                            setIsBookmarkOpen(false);
                          }}
                          className="px-2 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[11px] font-mono text-center hover:bg-indigo-600/30 hover:border-indigo-500 transition-all text-white"
                        >
                          Jump to P.{page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* REPLICATED BOTTOM DIALOG EXTRA FUNCTIONS */}
        <AnimatePresence>
          {isMoreOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMoreOpen(false)}
                className="absolute inset-0 bg-black/60 z-30 pointer-events-auto"
              />
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="absolute bottom-0 left-0 right-0 bg-[#111218] border-t border-white/15 p-4 z-40 shadow-2xl flex flex-col rounded-t-3xl pointer-events-auto no-drag"
              >
                <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3">
                  <span className="text-xs font-mono font-medium text-brand-purple">Study Options</span>
                  <button onClick={() => setIsMoreOpen(false)} className="p-0.5 hover:bg-white/15 rounded text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {/* Word lookup tool */}
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5">
                    <Search className="w-4 h-4 text-gray-500" />
                    <input 
                      type="text"
                      className="bg-transparent text-xs text-white focus:outline-none w-full placeholder-gray-500 font-sans"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Search PDF textbook keywords..."
                    />
                    <button 
                      onClick={handleSearchWord}
                      className="px-2.5 py-1 bg-brand-purple hover:bg-brand-purple/75 text-[10px] text-white font-semibold rounded-lg transition-colors inline-block"
                    >
                      FIND
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={handleImportJSON}
                      className="flex items-center justify-center gap-2 px-3 py-2 border border-white/10 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium text-gray-200 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-brand-indigo" />
                      <span>Import Sync</span>
                    </button>
                    <button 
                      onClick={handleExportJSON}
                      className="flex items-center justify-center gap-2 px-3 py-2 border border-white/10 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium text-gray-200 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-brand-purple" />
                      <span>Export Backup</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-2">
                    <span className="text-xs text-gray-400">Visual Night View:</span>
                    <button 
                      onClick={() => setDarkMode(!darkMode)}
                      className="flex items-center gap-2 px-3 py-1 rounded-lg bg-neutral-900 border border-white/10 hover:border-white/20 transition-all text-xs"
                    >
                      {darkMode ? (
                        <>
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                          <span>Standard View</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Dark Contrast</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* MAIN TEXTBOOK VIEWPORT */}
        {!pdfDoc ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none no-drag">
            <UploadCloud className="w-12 h-12 text-brand-purple/50 mb-3 animate-pulse" />
            <h4 className="text-sm font-semibold text-white mb-1.5">No Active Study Textbook loaded</h4>
            <p className="text-xs text-gray-500 max-w-xs mb-4">
              Select or open a textbook from the study library, or drop custom PDF notes directly below.
            </p>
            <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white text-xs font-semibold rounded-xl cursor-pointer">
              Browse PDF
              <input 
                type="file" 
                accept=".pdf" 
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setPdfFile(f);
                    setPdfFilename(f.name);
                  }
                }} 
                className="hidden" 
              />
            </label>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full relative overflow-hidden select-none no-drag">
            
            {/* CONTINUOUS VERTICAL SCROLL STAGE */}
            <div 
              ref={pdfContainerRef}
              className={`flex-1 overflow-auto bg-[#13141f] p-6 space-y-6 scroll-smooth scrollbar-thin flex flex-col items-center pdf-scroll-viewport origin-top ${darkMode ? 'pdf-sidebar-dark-filter' : ''}`}
            >
              {(() => {
                const padding = isMobile ? 32 : 48;
                const targetPageWidth = isFullscreen 
                  ? (isMobile ? window.innerWidth - 32 : Math.min(680, window.innerWidth - 64))
                  : isMobile 
                    ? window.innerWidth - 56 
                    : Math.max(280, size.width - padding);
                
                return pagesArray.map((pageIdx) => (
                  <PDFPageRow
                    key={pageIdx}
                    pageNum={pageIdx}
                    pdfDoc={pdfDoc}
                    zoomScale={zoomScale}
                    activeTool={activeTool}
                    brushColor={brushColor}
                    pdfFilename={pdfFilename}
                    loadAnnotations={loadAnnotations}
                    saveAnnotations={saveAnnotations}
                    clearPageAnnotations={clearPageAnnotations}
                    aspectRatio={aspectRatio}
                    onVisible={handlePageVisible}
                    targetPageWidth={targetPageWidth}
                  />
                ));
              })()}
            </div>

            {/* STATUS DIAL PILL LAYER */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex items-center bg-[#111218]/90 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 shadow-[0_10px_25px_rgba(0,0,0,0.5)] text-[11.5px] font-mono text-gray-200 justify-between gap-5 select-none text-center max-w-[90vw]">
              
              {/* Zoom scale dials with precise slider controls */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setZoomScale(p => Math.max(0.4, p - 0.1))}
                  className="w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                
                <input 
                  type="range"
                  min="0.4"
                  max="2.5"
                  step="0.05"
                  value={zoomScale}
                  onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                  className="w-16 sm:w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-purple focus:outline-none focus:ring-1 focus:ring-brand-purple"
                  title="Smooth Precision Zoom"
                />

                <span className="text-[10px] text-gray-300 min-w-[34px]">{Math.floor(zoomScale * 100)}%</span>
                
                <button 
                  onClick={() => setZoomScale(p => Math.min(2.5, p + 0.1))}
                  className="w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>

              <div className="h-4 w-[1px] bg-white/15" />

              {/* Vertical scroll sequence page trackers */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={handlePrevPage}
                  disabled={pageNum <= 1}
                  className="text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer text-[9px]"
                  title="Prev Page"
                >
                  ▲
                </button>
                <span className="text-[10.5px] tracking-wide text-white">{pageNum} / {numPages || '---'}</span>
                <button 
                  onClick={handleNextPage}
                  disabled={pageNum >= numPages}
                  className="text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer text-[9px]"
                  title="Next Page"
                >
                  ▼
                </button>
              </div>
            </div>
            
          </div>
        )}
      </div>

      {/* FLOATING BRUSH ROW */}
      <AnimatePresence>
        {isAnnotateOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 35 }}
            className="absolute bottom-[58px] left-0 right-0 z-30 bg-[#111218]/95 backdrop-blur-md border-t border-white/10 p-3 flex flex-col gap-2 shadow-2xl rounded-t-3xl border-b border-b-white/5"
          >
            {/* Color circles makers */}
            <div className="flex items-center justify-center gap-3 py-1 no-drag">
              {[
                { hex: 'rgba(234, 179, 8, 0.45)', label: 'Yellow marker' },
                { hex: 'rgba(34, 197, 94, 0.45)', label: 'Green high' },
                { hex: 'rgba(59, 130, 246, 0.45)', label: 'Blue note' },
                { hex: 'rgba(139, 92, 246, 0.45)', label: 'Purple high' },
                { hex: 'rgba(236, 72, 153, 0.45)', label: 'Pink' },
                { hex: 'rgba(239, 68, 68, 0.8)', label: 'Red stylus' }
              ].map((clr) => (
                <button
                  key={clr.hex}
                  onClick={() => {
                    setBrushColor(clr.hex);
                    if (activeTool === 'select') {
                      setActiveTool('highlighter');
                    }
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${
                    brushColor === clr.hex ? 'border-brand-purple scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: clr.hex }}
                  title={clr.label}
                />
              ))}

              <div className="w-[1px] h-4 bg-white/15 mx-1" />

              <button 
                onClick={triggerClearCurrentPage}
                className="p-1 px-2 text-[10px] font-mono hover:bg-rose-500/15 text-rose-400 hover:text-rose-300 border border-rose-500/20 bg-rose-950/15 rounded-lg transition-colors"
                title="Wipe canvas drawings on this page"
              >
                Clear
              </button>
            </div>

            {/* Brush tools selectors */}
            <div className="flex items-center justify-between gap-1.5 no-drag select-none pr-1">
              <div className="flex items-center gap-1">
                {[
                  { id: 'pen', label: 'Pen', icon: Pencil },
                  { id: 'highlighter', label: 'Highlight', icon: Highlighter },
                  { id: 'text', label: 'Memo', icon: StickyNote },
                  { id: 'eraser', label: 'Eraser', icon: Eraser },
                  { id: 'select', label: 'Grab', icon: Move }
                ].map(tool => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id)}
                      className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl transition-all ${
                        activeTool === tool.id
                          ? 'bg-brand-purple text-white shadow-lg'
                          : 'hover:bg-white/5 text-gray-400 hover:text-white'
                      }`}
                      title={tool.label}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[9px] font-mono">{tool.label}</span>
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setIsAnnotateOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium rounded-xl transition-all shadow-md cursor-pointer inline-block"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER TAB TABS MENU */}
      <footer className="footer-tab-navigation flex items-center justify-between px-6 py-2 pb-3 border-t border-white/5 bg-[#111218] select-none z-15 no-drag">
        
        <button 
          onClick={() => {
            setIsThumbsOpen(prev => !prev);
            setIsAnnotateOpen(false);
            setIsBookmarkOpen(false);
            setIsMoreOpen(false);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            isThumbsOpen ? 'text-brand-purple bg-brand-purple/5 font-semibold' : 'text-gray-400 hover:text-white'
          }`}
          title="Pages View list"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[9.5px]">Pages</span>
        </button>

        <button 
          onClick={() => {
            setIsAnnotateOpen(prev => !prev);
            setIsThumbsOpen(false);
            setIsBookmarkOpen(false);
            setIsMoreOpen(false);
            if (!isAnnotateOpen && activeTool === 'select') {
              setActiveTool('highlighter');
            }
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            isAnnotateOpen ? 'text-brand-purple bg-brand-purple/5 font-semibold' : 'text-gray-400 hover:text-white'
          }`}
          title="Annotate tools"
        >
          <Pencil className="w-5 h-5" />
          <span className="text-[9.5px]">Annotate</span>
        </button>

        <button 
          onClick={() => {
            setIsBookmarkOpen(prev => !prev);
            setIsThumbsOpen(false);
            setIsAnnotateOpen(false);
            setIsMoreOpen(false);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            isBookmarkOpen ? 'text-brand-purple bg-brand-purple/5 font-semibold' : 'text-gray-400 hover:text-white'
          }`}
          title="Bookmarks list"
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[9.5px]">Bookmark</span>
        </button>

        <button 
          onClick={() => {
            setIsMoreOpen(prev => !prev);
            setIsThumbsOpen(false);
            setIsAnnotateOpen(false);
            setIsBookmarkOpen(false);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            isMoreOpen ? 'text-brand-purple bg-brand-purple/5 font-semibold' : 'text-gray-400 hover:text-white'
          }`}
          title="Extra features"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[9.5px]">More</span>
        </button>
      </footer>
          </motion.div>
        )
      )}
    </AnimatePresence>
  );
}
