import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Rnd } from 'react-rnd';
import { 
  X, Maximize2, Minimize2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, 
  RotateCw, Bookmark, BookmarkCheck, Search, List, Settings, Sparkles, 
  Type, PenTool, Highlighter, Trash2, RotateCcw, Redo, Download, Play, 
  Check, Volume2, Eraser, FileText, ChevronDown, CheckCircle2,
  FolderOpen, Eye, Plus, Scale, Compass, HelpCircle, RefreshCw, CloudOff
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import * as fabric from 'fabric';
import { isFirebaseConfigured, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { GlowButton } from '../GlowButton';

// Setup pdf.js global worker to pull matching jsdelivr modules flawlessly
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  title: string;
  onClose: () => void;
}

interface SavedAnnotationState {
  id: string;
  pdf_url: string;
  page_number: number;
  canvas_json: any;
  comments_json: any;
  updated_at: string;
}

export function PdfViewer({ url, title, onClose }: PdfViewerProps) {
  const { user } = useAuth();
  const currentUserId = user?.id || 'guest_default';

  // Float state positioning and scaling
  const [isFullSize, setIsFullSize] = useState(false);
  const [panelWidth, setPanelWidth] = useState(960);
  const [panelHeight, setPanelHeight] = useState(720);

  // PDF Document configurations
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [loadingDoc, setLoadingDoc] = useState(true);

  // Index text cache to run hyper-fast searches in-memory
  const [textIndex, setTextIndex] = useState<{ pageNum: number; text: string }[]>([]);
  const [isIndexing, setIsIndexing] = useState(false);

  // Navigation sidebar & quick action state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'thumbnails' | 'bookmarks' | 'search' | 'recent'>('thumbnails');
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [recentFiles, setRecentFiles] = useState<{ url: string; title: string; date: string }[]>([]);

  // Search inline matching terms state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<{ pageNum: number; snippet: string }[]>([]);
  const [activeMatchIdx, setActiveMatchIdx] = useState(0);

  // Annotation drawing toolbar states
  const [activeTool, setActiveTool] = useState<'pan' | 'pen' | 'highlight' | 'delete' | 'text' | 'sticky'>('pan');
  const [brushColor, setBrushColor] = useState('#8b5cf6'); // Violet Ray default
  const [brushSize, setBrushSize] = useState(4);
  const [comments, setComments] = useState<Record<string, { id: string; text: string; date: string }>>({});
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // Undo / Redo histories
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // DOM node references to align dual canvasses perfectly in place
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricInstanceRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  // Sync state indication
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');

  // Load preferences from local storage registry
  useEffect(() => {
    // Books or Page memory
    const prefKey = `studyvibe_pdf_pref_${btoa(url)}`;
    const savedPrefs = localStorage.getItem(prefKey);
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.page) setCurrentPage(parsed.page);
        if (parsed.zoom) setZoom(parsed.zoom);
        if (parsed.rotation) setRotation(parsed.rotation);
      } catch (e) {
        console.warn('Prefs parse error', e);
      }
    }

    // Bookmarks database fallback
    const bookmarkKey = `studyvibe_pdf_bookmarks_${btoa(url)}`;
    const savedBookmarks = localStorage.getItem(bookmarkKey);
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }

    // Recent Files indexer list
    try {
      const recentKey = `studyvibe_pdf_recent_files`;
      const savedRecents = localStorage.getItem(recentKey);
      let recents = savedRecents ? JSON.parse(savedRecents) : [];
      recents = recents.filter((f: any) => f.url !== url);
      
      // Sanitise massive base64 inputs to save space
      const safeUrl = (url && url.startsWith('data:') && url.length > 50000) 
        ? "https://arxiv.org/pdf/2103.11911.pdf" 
        : url;
        
      recents.unshift({ url: safeUrl, title: title || 'Academic PDF', date: new Date().toLocaleDateString() });
      const sliced = recents.slice(0, 6);
      setRecentFiles(sliced);
      localStorage.setItem(recentKey, JSON.stringify(sliced));
    } catch (e) {
      console.warn('Could not update recents database', e);
    }
  }, [url]);

  // Save active document dimensions state
  const savePrefsState = (page: number, z: number, r: number) => {
    try {
      const prefKey = `studyvibe_pdf_pref_${btoa(url)}`;
      localStorage.setItem(prefKey, JSON.stringify({ page, zoom: z, rotation: r }));
    } catch (e) {
      console.warn('Prefs save skipped due to size limits', e);
    }
  };

  // Document extraction logic using target Worker
  useEffect(() => {
    let active = true;
    const fetchDoc = async () => {
      setLoadingDoc(true);
      setIsIndexing(true);
      try {
        const loadingTask = pdfjsLib.getDocument({ url });
        const pdf = await loadingTask.promise;
        if (!active) return;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setLoadingDoc(false);

        // Run client indexing for search
        const idx: { pageNum: number; text: string }[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          try {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const text = content.items.map((item: any) => item.str).join(' ');
            idx.push({ pageNum: i, text });
          } catch (err) {
            console.warn(`Extraction error page ${i}`, err);
          }
        }
        if (active) {
          setTextIndex(idx);
          setIsIndexing(false);
        }
      } catch (err) {
        console.error('Core PDF document assembly failed:', err);
        setLoadingDoc(false);
        setIsIndexing(false);
      }
    };

    fetchDoc();
    return () => {
      active = false;
    };
  }, [url]);

  // Page index jumping helper
  const handlePageJump = (num: number) => {
    const validated = Math.max(1, Math.min(numPages, num));
    setCurrentPage(validated);
    savePrefsState(validated, zoom, rotation);
  };

  // Toggle index bookmarks status
  const handleToggleBookmark = () => {
    let next: number[];
    if (bookmarks.includes(currentPage)) {
      next = bookmarks.filter(b => b !== currentPage);
    } else {
      next = [...bookmarks, currentPage].sort((a, b) => a - b);
    }
    setBookmarks(next);
    try {
      localStorage.setItem(`studyvibe_pdf_bookmarks_${btoa(url)}`, JSON.stringify(next));
    } catch (e) {
      console.warn('Bookmarks save skipped', e);
    }
  };

  // Run in-memory regex text matching
  const executeSearch = () => {
    if (!searchQuery.trim()) {
      setSearchMatches([]);
      return;
    }
    const matches: { pageNum: number; snippet: string }[] = [];
    textIndex.forEach(idx => {
      const pos = idx.text.toLowerCase().indexOf(searchQuery.toLowerCase());
      if (pos !== -1) {
        const start = Math.max(0, pos - 40);
        const end = Math.min(idx.text.length, pos + searchQuery.length + 40);
        const snippet = '...' + idx.text.substring(start, end) + '...';
        matches.push({ pageNum: idx.pageNum, snippet });
      }
    });
    setSearchMatches(matches);
    setActiveMatchIdx(0);
    if (matches.length > 0) {
      handlePageJump(matches[0].pageNum);
    }
  };

  // Render PDF using canvas drawing context and overlay Fabric Canvas
  useEffect(() => {
    if (!pdfDoc || loadingDoc) return;
    let isCurrent = true;

    const renderSequence = async () => {
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

        const page = await pdfDoc.getPage(currentPage);
        if (!isCurrent) return;

        // Obtain PDF Viewport with matching rotation and scaling transformations
        const viewport = page.getViewport({ scale: zoom, rotation: rotation });

        const canvas = pdfCanvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Render PDF at high precision resolution
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        
        if (renderTaskRef.current === renderTask) {
          renderTaskRef.current = null;
        }

        if (!isCurrent) return;

        // Initialize Fabric Overlay
        initFabricCanvas(viewport.width, viewport.height);
      } catch (err: any) {
        if (err?.name === 'RenderingCancelledException' || err?.message?.includes('cancelled')) {
          return; // peaceful cancel
        }
        console.error('Underlying canvas compiling error:', err);
      }
    };

    renderSequence();

    return () => {
      isCurrent = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
        renderTaskRef.current = null;
      }
      // Dispose Fabric canvas completely to prevent layout duplicate-mismatches
      if (fabricInstanceRef.current) {
        fabricInstanceRef.current.dispose();
        fabricInstanceRef.current = null;
      }
    };
  }, [pdfDoc, currentPage, zoom, rotation, loadingDoc]);

  // Load canvas drawing overlays on page changes
  const initFabricCanvas = async (width: number, height: number) => {
    const fElement = fabricCanvasRef.current;
    if (!fElement) return;

    // Dispose if pre-existing elements list is active
    if (fabricInstanceRef.current) {
      fabricInstanceRef.current.dispose();
    }

    // Initialize Fabric Drawer Overlay
    const fCanvas = new fabric.Canvas(fElement, {
      width,
      height,
      isDrawingMode: activeTool === 'pen',
      selection: activeTool === 'pan',
      backgroundColor: 'transparent'
    });

    fabricInstanceRef.current = fCanvas;

    // Synchronize brush parameters if Drawing Mode is enabled
    if (activeTool === 'pen') {
      fCanvas.freeDrawingBrush = new fabric.PencilBrush(fCanvas);
      fCanvas.freeDrawingBrush.color = brushColor;
      fCanvas.freeDrawingBrush.width = brushSize;
    }

    // Set drawing events & histories
    fCanvas.on('object:added', () => captureCanvasHistory(fCanvas));
    fCanvas.on('object:modified', () => captureCanvasHistory(fCanvas));
    fCanvas.on('object:removed', () => captureCanvasHistory(fCanvas));

    // Handle highlight and rectangle drawing actions
    setupCanvasInteractions(fCanvas);

    // Retrieve annotations from online database or local storage fallback
    await pullSavedAnnotations(fCanvas);
  };

  // Capture current state in history stack to support undo / redo operations natively
  const captureCanvasHistory = (canvas: any) => {
    const stateStr = JSON.stringify(canvas.toJSON(['id', 'opacity', 'commentId']));
    setHistoryStack(prev => [...prev, stateStr]);
    setRedoStack([]); // Clear redo stack on fresh drawings
    triggerSyncToDatabase(canvas);
  };

  const setupCanvasInteractions = (canvas: any) => {
    let startX = 0;
    let startY = 0;
    let drawingRect: any = null;
    let isDrawing = false;

    canvas.on('mouse:down', (options: any) => {
      const pointer = canvas.getScenePoint(options.e);

      // Handle item Eraser Delete Mode
      if (activeTool === 'delete') {
        const target = canvas.findTarget(options.e);
        if (target) {
          canvas.remove(target);
          canvas.requestRenderAll();
        }
        return;
      }

      // Handle text inputs
      if (activeTool === 'text') {
        const textObj = new fabric.IText('Double click to edit scholastic notes...', {
          left: pointer.x,
          top: pointer.y,
          fontFamily: 'Inter',
          fontSize: 14,
          fill: brushColor,
          editable: true,
          id: `text_${Date.now()}`
        });
        canvas.add(textObj);
        canvas.setActiveObject(textObj);
        setActiveTool('pan'); // Reset to selection
        return;
      }

      // Handle transparent drawing highlights and underlines
      if (activeTool === 'highlight' || activeTool === 'sticky') {
        isDrawing = true;
        startX = pointer.x;
        startY = pointer.y;

        if (activeTool === 'highlight') {
          drawingRect = new fabric.Rect({
            left: startX,
            top: startY,
            width: 0,
            height: 0,
            fill: brushColor,
            opacity: 0.35,
            strokeWidth: 0,
            selectable: true,
            hasControls: true,
            id: `hilite_${Date.now()}`
          });
          canvas.add(drawingRect);
          canvas.setActiveObject(drawingRect);
        } else if (activeTool === 'sticky') {
          // Drop a comments visual coordinate pin
          const pinId = `comment_${Date.now()}`;
          const pinTriangle = new fabric.Triangle({
            left: startX - 10,
            top: startY - 10,
            width: 20,
            height: 20,
            fill: brushColor,
            stroke: '#ffffff',
            strokeWidth: 1.5,
            selectable: true,
            hasControls: false,
            id: pinId,
            commentId: pinId
          });
          canvas.add(pinTriangle);
          canvas.setActiveObject(pinTriangle);
          
          // Initialize empty comment text
          setComments(prev => ({
            ...prev,
            [pinId]: { id: pinId, text: '', date: new Date().toLocaleTimeString() }
          }));
          setActiveCommentId(pinId);
          setActiveTool('pan');
          isDrawing = false;
        }
      }
    });

    canvas.on('mouse:move', (options: any) => {
      if (!isDrawing || !drawingRect) return;
      const pointer = canvas.getScenePoint(options.e);

      drawingRect.set({
        width: Math.abs(pointer.x - startX),
        height: Math.abs(pointer.y - startY),
        left: Math.min(pointer.x, startX),
        top: Math.min(pointer.y, startY)
      });
      canvas.requestRenderAll();
    });

    canvas.on('mouse:up', () => {
      isDrawing = false;
      drawingRect = null;
    });

    // Tap Pin / Triangle shapes to open Comments editor sidebar
    canvas.on('selection:created', (e: any) => {
      const selected = e.selected?.[0];
      if (selected && selected.commentId) {
        setActiveCommentId(selected.commentId);
        setNewCommentText(comments[selected.commentId]?.text || '');
      }
    });
  };

  // Undo Drawing action
  const handleUndo = () => {
    const canvas = fabricInstanceRef.current;
    if (!canvas || historyStack.length === 0) return;

    const current = historyStack[historyStack.length - 1];
    const updatedHistory = historyStack.slice(0, -1);
    setHistoryStack(updatedHistory);
    setRedoStack(prev => [...prev, current]);

    const targetJsonStr = updatedHistory.length > 0
      ? updatedHistory[updatedHistory.length - 1]
      : JSON.stringify({ objects: [] });

    canvas.loadFromJSON(JSON.parse(targetJsonStr)).then(() => {
      canvas.requestRenderAll();
      triggerSyncToDatabase(canvas);
    });
  };

  // Redo Drawing action
  const handleRedo = () => {
    const canvas = fabricInstanceRef.current;
    if (!canvas || redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setHistoryStack(prev => [...prev, nextState]);

    canvas.loadFromJSON(JSON.parse(nextState)).then(() => {
      canvas.requestRenderAll();
      triggerSyncToDatabase(canvas);
    });
  };

  // Clear annotations sequence
  const handleClearAnnotations = () => {
    const canvas = fabricInstanceRef.current;
    if (!canvas) return;
    canvas.clear();
    setComments({});
    setHistoryStack([]);
    setRedoStack([]);
    triggerSyncToDatabase(canvas);
  };

  // database persistence syncing engine
  const pullSavedAnnotations = async (canvas: any) => {
    const fallbackKey = `studyvibe_anot_${btoa(url)}_p${currentPage}`;
    let loadedState: SavedAnnotationState | null = null;

    try {
      if (isFirebaseConfigured && user) {
        const qRef = collection(db, 'pdf_annotations');
        const q = query(
          qRef,
          where('pdf_url', '==', url),
          where('page_number', '==', currentPage),
          where('user_id', '==', currentUserId)
        );
        const snap = await getDocs(q).catch(err => {
          handleFirestoreError(err, OperationType.LIST, 'pdf_annotations');
        });
        if (snap && !snap.empty) {
          loadedState = snap.docs[0].data() as SavedAnnotationState;
        }
      }
    } catch (e) {
      console.warn('Database pull offline fallback:', e);
    }

    // Try localStorage ifDB query did not resolve or return data
    if (!loadedState) {
      const saved = localStorage.getItem(fallbackKey);
      if (saved) {
        try {
          loadedState = JSON.parse(saved);
        } catch {}
      }
    }

    if (loadedState && canvas) {
      try {
        if (loadedState.canvas_json) {
          await canvas.loadFromJSON(loadedState.canvas_json);
          canvas.requestRenderAll();
        }
        if (loadedState.comments_json) {
          setComments(loadedState.comments_json);
        }
      } catch (err) {
        console.warn('Annotation de-serialization failed', err);
      }
    }
  };

  const triggerSyncToDatabase = async (canvas: any) => {
    setSyncStatus('saving');
    const fallbackKey = `studyvibe_anot_${btoa(url)}_p${currentPage}`;
    const canvasJson = canvas.toJSON(['id', 'opacity', 'commentId']);

    const payload: SavedAnnotationState = {
      id: `${btoa(url).substring(0, 16)}_${currentPage}`,
      pdf_url: url,
      page_number: currentPage,
      canvas_json: canvasJson,
      comments_json: comments,
      updated_at: new Date().toISOString()
    };

    // 1. Double save in LocalStorage backup always
    try {
      localStorage.setItem(fallbackKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('Backup annotations localStorage save skipped', e);
    }

    // 2. Transmit to Supabase online database table if authentic user is present
    if (isFirebaseConfigured && user) {
      try {
        await setDoc(doc(db, 'pdf_annotations', payload.id), {
            id: payload.id,
            user_id: currentUserId,
            pdf_url: url,
            page_number: currentPage,
            canvas_json: canvasJson,
            comments_json: comments,
            updated_at: payload.updated_at
          }).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `pdf_annotations/${payload.id}`);
          });
        setSyncStatus('synced');
      } catch (err) {
        console.warn('Realtime sync offline. Secure local copy holds correctly.', err);
        setSyncStatus('offline');
      }
    } else {
      setSyncStatus('offline');
    }
  };

  // Sync comment updates
  const handleSaveComment = () => {
    if (!activeCommentId || !newCommentText.trim()) return;

    setComments(prev => {
      const updated = {
        ...prev,
        [activeCommentId]: {
          ...prev[activeCommentId],
          text: newCommentText.trim(),
          date: new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
        }
      };
      
      // Auto-trigger db sync incorporating the saved texts
      setTimeout(() => {
        if (fabricInstanceRef.current) {
          triggerSyncToDatabase(fabricInstanceRef.current);
        }
      }, 100);

      return updated;
    });
    setNewCommentText('');
    setActiveCommentId(null);
  };

  const handleDeleteComment = (commentId: string) => {
    const canvas = fabricInstanceRef.current;
    if (canvas) {
      // Find matching pin shape in canvas overlays list & remove it
      const objects = canvas.getObjects();
      const targetPin = objects.find((obj: any) => obj.commentId === commentId);
      if (targetPin) {
        canvas.remove(targetPin);
      }
    }

    setComments(prev => {
      const copy = { ...prev };
      delete copy[commentId];
      return copy;
    });

    if (activeCommentId === commentId) {
      setActiveCommentId(null);
    }

    setTimeout(() => {
      if (fabricInstanceRef.current) {
        triggerSyncToDatabase(fabricInstanceRef.current);
      }
    }, 100);
  };

  // Fit viewports
  const handleFitToWidth = () => {
    if (containerRef.current) {
      const scrollWidth = containerRef.current.clientWidth;
      const calcZoom = (scrollWidth - 40) / 600; // base viewport template normalization
      setZoom(Math.max(0.6, Math.min(2.5, calcZoom)));
    }
  };

  // Export Annotation canvas directly into an image binary download
  const handleExportAnnotationsAsImage = () => {
    const canvas = fabricInstanceRef.current;
    if (!canvas) return;
    
    // Obtain data URL content and download trigger offline
    const dataUrl = canvas.toDataURL({
      format: 'png',
      quality: 1.0
    });

    const trigger = document.createElement('a');
    trigger.download = `${title.replace(/\s+/g, '_')}_Anotations_Page_${currentPage}.png`;
    trigger.href = dataUrl;
    document.body.appendChild(trigger);
    trigger.click();
    document.body.removeChild(trigger);
  };

  return (
    <Rnd
      default={{
        x: window.innerWidth * 0.12,
        y: window.innerHeight * 0.08,
        width: panelWidth,
        height: panelHeight,
      }}
      minWidth={550}
      minHeight={450}
      bounds="window"
      dragHandleClassName="pdf-drag-handle"
      className="z-[90] fixed flex flex-col bg-[#07070a] border border-white/10 rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.85)] outline-none overflow-hidden"
      style={{ display: isFullSize ? 'none' : 'flex' }}
    >
      
      {/* Cinematic Dragging Title bar Header */}
      <div className="pdf-drag-handle flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/10 select-none cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-3.5">
          <BookMarkIndicator isBookmarked={bookmarks.includes(currentPage)} onToggle={handleToggleBookmark} />
          
          <div className="min-w-0">
             <h3 className="serif-title text-sm md:text-base text-white tracking-wide truncate max-w-sm md:max-w-md">{title}</h3>
             <div className="flex items-center gap-2 mt-0.5">
               <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Studying Suite</span>
               <div className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
               <span className="text-[10px] font-mono text-gray-400">
                 Page {currentPage} of {numPages}
               </span>
               <div className="w-1.5 h-1.5 rounded-full bg-brand-indigo" />
               <SyncVisuals status={syncStatus} />
             </div>
          </div>
        </div>

        {/* Window Panel Controls actions */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button 
            type="button"
            onClick={handleToggleBookmark}
            className={`p-1.5 rounded-lg border transition-all ${
              bookmarks.includes(currentPage) 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                : 'border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title="Bookmark Page"
          >
            <Bookmark className="w-4 h-4" />
          </button>

          <button 
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 rounded-lg border transition-all ${
              sidebarOpen 
                ? 'bg-brand-purple/10 border-brand-purple/30 text-brand-purple' 
                : 'border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title="Toggle Material Sidebar"
          >
            <List className="w-4 h-4" />
          </button>

          <a 
            href={url}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            title="Open Document in New Browser Tab"
          >
            <Maximize2 className="w-4 h-4" />
          </a>

          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-rose-500/15 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Close Book View"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawing Toolbar controls bar (Curated colors + highlight actions) */}
      <div className="px-5 py-2.5 bg-neutral-950 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <ToolTriggerIcon 
            selected={activeTool === 'pan'} 
            onClick={() => { setActiveTool('pan'); if (fabricInstanceRef.current) { fabricInstanceRef.current.isDrawingMode = false; fabricInstanceRef.current.selection = true; } }} 
            title="Selection / Zoom" 
            icon={Compass} 
          />
          <ToolTriggerIcon 
            selected={activeTool === 'pen'} 
            onClick={() => { setActiveTool('pen'); if (fabricInstanceRef.current) { fabricInstanceRef.current.isDrawingMode = true; } }} 
            title="Doodle Drawing Brush" 
            icon={PenTool} 
          />
          <ToolTriggerIcon 
            selected={activeTool === 'highlight'} 
            onClick={() => { setActiveTool('highlight'); if (fabricInstanceRef.current) { fabricInstanceRef.current.isDrawingMode = false; } }} 
            title="Draw Transparent Highlights" 
            icon={Highlighter} 
          />
          <ToolTriggerIcon 
            selected={activeTool === 'text'} 
            onClick={() => { setActiveTool('text'); if (fabricInstanceRef.current) { fabricInstanceRef.current.isDrawingMode = false; } }} 
            title="Place Text Node Overlays" 
            icon={Type} 
          />
          <ToolTriggerIcon 
            selected={activeTool === 'sticky'} 
            onClick={() => { setActiveTool('sticky'); if (fabricInstanceRef.current) { fabricInstanceRef.current.isDrawingMode = false; } }} 
            title="Drop Comments Stickys" 
            icon={BookmarkCheck} 
          />
          <ToolTriggerIcon 
            selected={activeTool === 'delete'} 
            onClick={() => { setActiveTool('delete'); if (fabricInstanceRef.current) { fabricInstanceRef.current.isDrawingMode = false; } }} 
            title="Eraser / Delete Annotation" 
            icon={Eraser} 
          />

          <div className="w-[1px] h-5 bg-white/10 mx-2" />

          {/* Color Palettes curated (Violet, Emerald, Gold, Pink, Slate) */}
          <div className="flex items-center gap-1.5">
            {['#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#ffffff'].map((color) => (
              <button
                key={color}
                onClick={() => {
                  setBrushColor(color);
                  if (fabricInstanceRef.current && fabricInstanceRef.current.freeDrawingBrush) {
                    fabricInstanceRef.current.freeDrawingBrush.color = color;
                  }
                }}
                className={`w-4 h-4 rounded-full border transition-all ${
                  brushColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="w-[1px] h-5 bg-white/10 mx-2" />

          {/* Brush thickness select slider */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-gray-500">Brush:</span>
            <input 
              type="range"
              min={2}
              max={20}
              value={brushSize}
              onChange={(e) => {
                const size = parseInt(e.target.value);
                setBrushSize(size);
                if (fabricInstanceRef.current && fabricInstanceRef.current.freeDrawingBrush) {
                  fabricInstanceRef.current.freeDrawingBrush.width = size;
                }
              }}
              className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-purple"
            />
            <span className="text-[9px] font-mono text-gray-400">{brushSize}px</span>
          </div>
        </div>

        {/* Undo, Redo, Clear events */}
        <div className="flex items-center gap-1.5">
          <button 
            type="button"
            onClick={handleUndo}
            disabled={historyStack.length === 0}
            className="p-1.5 rounded-lg border border-white/5 text-gray-400 hover:text-white disabled:opacity-25 transition-all"
            title="Undo stroke"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button 
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-1.5 rounded-lg border border-white/5 text-gray-400 hover:text-white disabled:opacity-25 transition-all"
            title="Redo stroke"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
          
          <div className="w-[1px] h-5 bg-white/10 mx-2" />

          <button 
            type="button"
            onClick={handleExportAnnotationsAsImage}
            className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[9px] font-mono font-bold uppercase tracking-wider text-gray-300 hover:text-white transition-all flex items-center gap-1.5"
            title="Export annotations card as image"
          >
            <Download className="w-3 h-3" /> PNG
          </button>

          <button 
            type="button"
            onClick={handleClearAnnotations}
            className="p-1.5 rounded-lg border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/15 text-rose-400 transition-colors"
            title="Wipe current page drawings"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Study Arena: Sidebar panel + Center book viewports */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* Left Side collapsible index indexer */}
        {sidebarOpen && (
          <aside className="w-56 bg-neutral-950/40 border-r border-white/5 flex flex-col min-h-0">
            {/* Nav tabs selection buttons */}
            <div className="flex border-b border-white/5">
              <SidebarTabBtn label="Index" active={sidebarTab === 'thumbnails'} onClick={() => setSidebarTab('thumbnails')} />
              <SidebarTabBtn label="Pins" active={sidebarTab === 'bookmarks'} onClick={() => setSidebarTab('bookmarks')} />
              <SidebarTabBtn label="Search" active={sidebarTab === 'search'} onClick={() => setSidebarTab('search')} />
            </div>

            {/* Panel views content lists */}
            <div className="flex-1 overflow-y-auto p-4 select-none min-h-0">
              
              {/* Thumbnails Lists index */}
              {sidebarTab === 'thumbnails' && (
                <div className="grid grid-cols-2 gap-3.5">
                  {Array.from({ length: numPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageJump(pageNum)}
                        className={`aspect-[3/4] rounded-xl flex flex-col items-center justify-center border font-mono tracking-widest transition-all ${
                          isActive 
                            ? 'bg-brand-purple/20 border-brand-purple/40 text-white font-bold shadow-lg' 
                            : 'bg-white/[0.02] border-white/5 text-gray-500 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className="text-xs">PAGE</span>
                        <span className="text-lg font-bold mt-1">{pageNum}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Bookmarks index List */}
              {sidebarTab === 'bookmarks' && (
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-mono tracking-widest text-gray-500 mb-2">Bookmarked Targets</h4>
                  {bookmarks.length === 0 ? (
                    <p className="text-[10px] font-mono italic text-gray-600">No pages pinned. Click the Bookmark indicator inside headers to pin scholarly pages.</p>
                  ) : (
                    bookmarks.map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageJump(pageNum)}
                        className={`w-full text-left px-3 py-2 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
                          pageNum === currentPage 
                            ? 'bg-brand-indigo/15 border-brand-indigo/30 text-white' 
                            : 'bg-white/[0.01] border-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        <span>Revision Pinned Page {pageNum}</span>
                        <ChevronRight className="w-3 h-3 text-gray-650" />
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Keyword Search inline list */}
              {sidebarTab === 'search' && (
                <div className="space-y-4">
                  <div className="flex gap-1.5">
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') executeSearch(); }}
                      placeholder="Keyword / term..."
                      className="flex-1 bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-purple/40 font-sans"
                    />
                    <button 
                      onClick={executeSearch}
                      className="p-1.5 rounded-xl bg-brand-purple/15 hover:bg-brand-purple text-brand-purple hover:text-white border border-brand-purple/20 transition-all"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isIndexing && (
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-brand-purple animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Indexing text archives...
                    </div>
                  )}

                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto">
                    {searchMatches.length > 0 && (
                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 pb-1 border-b border-white/5">
                        <span>{searchMatches.length} Matches Found</span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              const next = Math.max(0, activeMatchIdx - 1);
                              setActiveMatchIdx(next);
                              handlePageJump(searchMatches[next].pageNum);
                            }}
                            className="p-1 bg-white/5 rounded"
                          >
                            ▲
                          </button>
                          <span>{activeMatchIdx + 1}/{searchMatches.length}</span>
                          <button 
                            onClick={() => {
                              const next = Math.min(searchMatches.length - 1, activeMatchIdx + 1);
                              setActiveMatchIdx(next);
                              handlePageJump(searchMatches[next].pageNum);
                            }}
                            className="p-1 bg-white/5 rounded"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    )}
                    {searchMatches.map((match, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveMatchIdx(idx);
                          handlePageJump(match.pageNum);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all text-[11px] font-sans ${
                          idx === activeMatchIdx 
                            ? 'bg-brand-purple/10 border-brand-purple/20 text-white' 
                            : 'bg-white/[0.01] border-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        <div className="flex justify-between font-mono text-[9px] text-gray-550 mb-1">
                          <span>PAGE {match.pageNum}</span>
                        </div>
                        <p className="line-clamp-2 leading-relaxed italic text-gray-300">
                          {match.snippet}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Center Scrollable Document Viewport with Dual layered canvasses */}
        <section 
          ref={containerRef}
          className="flex-1 bg-[#09090c] overflow-auto flex flex-col items-center p-6 min-h-0 select-text relative"
        >
          {loadingDoc ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#07070a]/90 backdrop-blur-md z-35 font-mono select-none">
              <div className="w-12 h-12 rounded-full border-t-2 border-brand-purple/80 border-r-2 border-transparent animate-spin shadow-lg" />
              <p className="text-xs text-brand-purple/70 uppercase tracking-widest animate-pulse">Assembling study matrix nodes...</p>
            </div>
          ) : (
            <div 
              className="relative shadow-2xl rounded-2xl border border-white/10 bg-black overflow-hidden transition-all duration-300"
              style={{
                width: pdfCanvasRef.current?.width || 'auto',
                height: pdfCanvasRef.current?.height || 'auto'
              }}
            >
              {/* Layer 1: Underlying PDF Canvas */}
              <canvas 
                ref={pdfCanvasRef} 
                className="absolute inset-0 opacity-100 block select-none pointer-events-none" 
                style={{ zIndex: 5 }}
              />

              {/* Layer 2: Transparent Fabric Drawings overlay */}
              <canvas 
                ref={fabricCanvasRef} 
                className="absolute inset-0 opacity-100 block cursor-crosshair" 
                style={{ zIndex: 10 }}
              />
            </div>
          )}
        </section>

        {/* Comments Pins popup panel drawer (Only opens if active triangle is clicked!) */}
        {activeCommentId && (
          <aside className="w-64 bg-neutral-950 border-l border-white/10 p-4 font-sans flex flex-col gap-4 animate-in slide-in-from-right duration-350 z-30">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Pin Annotation</span>
              <button onClick={() => setActiveCommentId(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5">
               <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 space-y-1">
                 <div className="flex justify-between items-center text-[9px] font-mono text-gray-500">
                   <span>Study Scholar Comment</span>
                   <span>{comments[activeCommentId]?.date}</span>
                 </div>
                 {comments[activeCommentId]?.text ? (
                   <div className="space-y-2 mt-1">
                     <p className="text-xs text-white bg-black/40 p-2.5 rounded-xl border border-white/5 leading-relaxed italic pr-2">
                       "{comments[activeCommentId].text}"
                     </p>
                     <button 
                       onClick={() => handleDeleteComment(activeCommentId)}
                       className="p-1 rounded text-[9px] font-mono uppercase bg-rose-500/10 text-rose-450 hover:bg-rose-500/20 flex items-center gap-1 border border-rose-500/15"
                     >
                       <Trash2 className="w-3 h-3" /> Remove Pin
                     </button>
                   </div>
                 ) : (
                   <p className="text-xs italic text-gray-550 pt-1">No notes submitted. Type below to archive comments.</p>
                 )}
               </div>

               {/* New Comment Text fields */}
               <div className="space-y-2 mt-2">
                 <textarea 
                   rows={4}
                   value={newCommentText}
                   onChange={(e) => setNewCommentText(e.target.value)}
                   placeholder="Type academic synthesis, summary, or questions here..."
                   className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple/40 resize-none"
                 />
                 <GlowButton 
                   size="sm" 
                   onClick={handleSaveComment} 
                   className="w-full text-xs font-mono tracking-wider uppercase font-bold py-2 rounded-xl"
                 >
                   SAVE SYNTHESIS
                 </GlowButton>
               </div>
            </div>
          </aside>
        )}
      </div>

      {/* Cinematic footer controls: Zoom + Navigate page of document */}
      <footer className="px-6 py-4 bg-white/5 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 select-none">
        
        {/* Navigation buttons */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handlePageJump(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-20 text-gray-300 hover:text-white rounded-xl border border-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-mono text-gray-400">
            Page {currentPage} of {numPages}
          </span>

          <button 
            type="button"
            onClick={() => handlePageJump(currentPage + 1)}
            disabled={currentPage === numPages}
            className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-20 text-gray-300 hover:text-white rounded-xl border border-white/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Rotation degrees and theme settings */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => {
              const nextVal = (rotation + 90) % 360;
              setRotation(nextVal);
              savePrefsState(currentPage, zoom, nextVal);
            }}
            className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs text-gray-300 hover:text-white flex items-center gap-1.5 transition-all"
            title="Rotate Page by 90 Degrees"
          >
            <RotateCw className="w-3.5 h-3.5 text-brand-purple" /> Rotate
          </button>

          <button 
            onClick={handleFitToWidth}
            className="px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-mono text-gray-300 hover:text-white flex items-center gap-1.5 transition-all"
            title="Fit view to Page width"
          >
            <Scale className="w-3.5 h-3.5 text-brand-indigo" /> Fit Width
          </button>
        </div>

        {/* Zoom configuration controls block */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => { const val = Math.max(0.6, parseFloat((zoom - 0.15).toFixed(2))); setZoom(val); savePrefsState(currentPage, val, rotation); }}
              className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-450 hover:text-white rounded-lg border border-white/5 transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono text-gray-400 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button 
              type="button"
              onClick={() => { const val = Math.min(2.5, parseFloat((zoom + 0.15).toFixed(2))); setZoom(val); savePrefsState(currentPage, val, rotation); }}
              className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-450 hover:text-white rounded-lg border border-white/5 transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>
    </Rnd>
  );
}

// Compact helper components: Drawing tools selections
interface ToolTriggerIconProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  icon: React.ComponentType<any>;
}
function ToolTriggerIcon({ selected, onClick, title, icon: Icon }: ToolTriggerIconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-xl border transition-all ${
        selected 
          ? 'bg-brand-purple text-white border-brand-purple/75 shadow-[0_0_12px_rgba(139,92,246,0.5)]' 
          : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
      }`}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

// Compact helper components: Sync active indications
interface SyncVisualsProps {
  status: 'synced' | 'saving' | 'offline';
}
function SyncVisuals({ status }: SyncVisualsProps) {
  if (status === 'saving') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-mono uppercase bg-brand-purple/10 border border-brand-purple/20 text-brand-purple gap-1 animate-pulse">
        <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Saving...
      </span>
    );
  }
  if (status === 'synced') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-mono uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 gap-1">
        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> Cloud Synced
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-mono uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400 gap-1">
      <CloudOff className="w-2.5 h-2.5 text-amber-500 animate-pulse" /> Desktop Copy
    </span>
  );
}

// Bookmarked heart toggle helper
interface BookMarkIndicatorProps {
  isBookmarked: boolean;
  onToggle: () => void;
}
function BookMarkIndicator({ isBookmarked, onToggle }: BookMarkIndicatorProps) {
  return (
    <button 
      type="button"
      onClick={onToggle}
      className="p-1 rounded-full cursor-pointer transition-transform duration-200 active:scale-95"
    >
      <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]' : 'text-gray-600'}`} />
    </button>
  );
}

// Collapsible side nav layout tabs trigger
interface SidebarTabBtnProps {
  label: string;
  active: boolean;
  onClick: () => void;
}
function SidebarTabBtn({ label, active, onClick }: SidebarTabBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 text-center py-2 text-[10px] uppercase font-mono tracking-widest transition-all ${
        active 
          ? 'bg-white/5 border-b border-brand-purple text-white font-bold' 
          : 'text-gray-500 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}
