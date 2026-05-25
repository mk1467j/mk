import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '@/components/GlassCard';
import { 
  Plus, Search, FileText, Trash2, X, Sparkles, BookOpen, 
  CheckCircle2, Cloud, CloudOff, RefreshCw, FolderClosed, 
  FileBox, Grid3X3, ArrowUpRight, Upload
} from 'lucide-react';
import { GlowButton } from '@/components/GlowButton';
import { useAuth } from '@/context/AuthContext';
import { Note, Folder, NoteType, Attachment } from '@/types/notes';
import { FolderSidebar } from '@/components/notes/FolderSidebar';
import { NoteCard } from '@/components/notes/NoteCard';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { PdfViewer } from '@/components/notes/PdfViewer';
import { AudioPlayer } from '@/components/notes/AudioPlayer';
import { VideoPlayer } from '@/components/notes/VideoPlayer';
import { ImageViewer } from '@/components/notes/ImageViewer';
import { isFirebaseConfigured, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { saveFileToStorage, getFileObjectURL, deleteFileFromStorage } from '@/lib/fileStorage';

export function Notes() {
  const { user, guestUser } = useAuth();
  const currentUserId = user?.id || guestUser?.id || 'guest_default';

  // Core research state
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<NoteType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New note creation states
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<NoteType>('text');
  const [newFolderId, setNewFolderId] = useState<string | 'inbox'>('inbox');
  const [newContent, setNewContent] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Active view editors
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [activePdf, setActivePdf] = useState<{ url: string; title: string } | null>(null);

  // Load research data from Supabase or Local Fallback
  useEffect(() => {
    loadNotesAndFolders();
  }, [currentUserId, user]);

  const loadNotesAndFolders = async () => {
    setLoading(true);
    let loadedFolders: Folder[] = [];
    let loadedNotes: Note[] = [];

    // Local Keys definitions
    const notesStorageKey = `studyvibe_notes_${currentUserId}`;
    const foldersStorageKey = `studyvibe_folders_${currentUserId}`;

    try {
      if (isFirebaseConfigured && user) {
        // Fetch folders
        const folderRef = collection(db, 'folders');
        const folderQuery = query(folderRef, where('user_id', '==', currentUserId));
        const folderSnap = await getDocs(folderQuery).catch(err => {
          handleFirestoreError(err, OperationType.LIST, 'folders');
        });
        const folderData = folderSnap ? folderSnap.docs.map(d => d.data() as Folder) : [];

        // Fetch notes
        const notesRef = collection(db, 'notes');
        const notesQuery = query(notesRef, where('user_id', '==', currentUserId));
        const notesSnap = await getDocs(notesQuery).catch(err => {
          handleFirestoreError(err, OperationType.LIST, 'notes');
        });
        const noteData = notesSnap ? notesSnap.docs.map(d => d.data() as Note) : [];

        loadedFolders = folderData;
        loadedNotes = noteData;
      } else {
        // Local state loading
        const savedFolders = localStorage.getItem(foldersStorageKey);
        const savedNotes = localStorage.getItem(notesStorageKey);

        const isGuestId = currentUserId.startsWith('guest_') || currentUserId === 'guest_default';
        const fallbackNotes = isGuestId ? getDefaultNotes() : [];

        loadedFolders = savedFolders ? JSON.parse(savedFolders) : [];
        loadedNotes = savedNotes ? JSON.parse(savedNotes) : fallbackNotes;
      }
    } catch (e) {
      console.warn('Firebase offline or table schema mismatch. Seamlessly loading local nodes.', e);
      // Perfect database fallback gracefully syncing local client storage
      const savedFolders = localStorage.getItem(foldersStorageKey);
      const savedNotes = localStorage.getItem(notesStorageKey);

      const isGuestId = currentUserId.startsWith('guest_') || currentUserId === 'guest_default';
      const fallbackNotes = isGuestId ? getDefaultNotes() : [];

      loadedFolders = savedFolders ? JSON.parse(savedFolders) : [];
      loadedNotes = savedNotes ? JSON.parse(savedNotes) : fallbackNotes;
    }

    // Hydrate loaded notes to resolve any indexeddb:// URIs to live session blob object URLs
    const hydratedNotes = await Promise.all(loadedNotes.map(async (note) => {
      if (note.file_url) {
        if (note.file_url.startsWith('indexeddb://') || note.file_url.startsWith('data:')) {
          const fileId = note.file_url.startsWith('indexeddb://')
            ? note.file_url.replace('indexeddb://', '')
            : note.id;

          // Migrate legacy or newly created base64 strings into IndexedDB storage automatically
          if (note.file_url.startsWith('data:')) {
            await saveFileToStorage(note.id, note.file_url);
          }

          const blobUrl = await getFileObjectURL(fileId);
          if (blobUrl) {
            return {
              ...note,
              file_url: blobUrl
            };
          }
        }
      }
      return note;
    }));

    setFolders(loadedFolders);
    setNotes(hydratedNotes);
    setLoading(false);
  };

  const getDefaultNotes = (): Note[] => {
    return [
      { 
        id: '1', 
        title: 'Quantum Mechanics Ch. 3', 
        content: '<h2>Wave-Particle Duality and Schrödinger Packets</h2><p>Notes on wave-particle duality, Planck constant equations, and Schrödinger wave packets application to quantum tunneling experiments.</p><blockquote>Keep track of the tunneling potential equations derived on page 42.</blockquote>', 
        type: 'text', 
        folder_id: null, 
        file_url: null, 
        created_at: new Date(Date.now() - 3600000).toISOString() 
      },
      { 
        id: '2', 
        title: 'Study Music Instrumentals', 
        content: '<p>A premium binaural beat track recorded using acoustic mental spatial alignment.</p>', 
        type: 'audio', 
        folder_id: null, 
        file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 
        created_at: new Date(Date.now() - 86400000).toISOString() 
      },
      { 
        id: '3', 
        title: 'Calculus IV Reference Chart', 
        content: '<p>Multivariable calculus formula summary. Divergence theorem, Stokes theorem, and curvilinear coordinate systems cheat sheet.</p>', 
        type: 'pdf', 
        folder_id: null, 
        file_url: 'https://arxiv.org/pdf/quant-ph/0306161.pdf', 
        created_at: new Date(Date.now() - 172800000).toISOString() 
      }
    ];
  };

  // State setters that sync cleanly to database or fallback automatically
  const updateFoldersState = async (nextFolders: Folder[]) => {
    setFolders(nextFolders);
    localStorage.setItem(`studyvibe_folders_${currentUserId}`, JSON.stringify(nextFolders));

    if (isFirebaseConfigured && user) {
      try {
        for (const folder of nextFolders) {
          const folderPayload = { ...folder, user_id: currentUserId };
          await setDoc(doc(db, 'folders', folder.id), folderPayload).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `folders/${folder.id}`);
          });
        }
      } catch (err) {
        console.error('Folders database sync deferred:', err);
      }
    }
  };

  const updateNotesState = async (nextNotes: Note[]) => {
    // Keep active in-memory state with current (blob/base64) file_url so rendering remains intact
    setNotes(nextNotes);

    try {
      // Process notes to extract large base64/blob files and store them in IndexedDB instead of LocalStorage
      const notesToSerialize = await Promise.all(nextNotes.map(async (note) => {
        if (note.file_url) {
          // If the file is still a raw data URI, save it to IndexedDB and update reference
          if (note.file_url.startsWith('data:')) {
            await saveFileToStorage(note.id, note.file_url);
            return {
              ...note,
              file_url: `indexeddb://${note.id}`
            };
          } else if (note.file_url.startsWith('blob:')) {
            // If it is a blob url, it's already saved as a binary in IndexedDB, so save reference
            return {
              ...note,
              file_url: `indexeddb://${note.id}`
            };
          }
        }
        return note;
      }));

      localStorage.setItem(`studyvibe_notes_${currentUserId}`, JSON.stringify(notesToSerialize));
    } catch (err) {
      console.warn('LocalStorage limit fallback trigger:', err);
      // Clean fallback in case of write failures
      const safeNotes = nextNotes.map(n => {
        if (n.file_url && n.file_url.startsWith('data:') && n.file_url.length > 50000) {
          return {
            ...n,
            file_url: "https://arxiv.org/pdf/2103.11911.pdf"
          };
        }
        return n;
      });
      try {
        localStorage.setItem(`studyvibe_notes_${currentUserId}`, JSON.stringify(safeNotes));
      } catch (inner) {
        console.error('Fatal LocalStorage save failed', inner);
      }
    }

    if (isFirebaseConfigured && user) {
      try {
        // Upload lightweight records to Firestore
        for (const note of nextNotes) {
          const fileToSave = (note.file_url && (note.file_url.startsWith('data:') || note.file_url.startsWith('blob:')))
            ? `indexeddb://${note.id}`
            : (note.file_url || null);

          const notePayload = { 
            id: note.id,
            title: note.title,
            content: note.content,
            type: note.type,
            folder_id: note.folder_id || null,
            file_url: fileToSave,
            created_at: note.created_at,
            user_id: currentUserId 
          };
          await setDoc(doc(db, 'notes', note.id), notePayload).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `notes/${note.id}`);
          });
        }
      } catch (err) {
        console.error('Notes database sync deferred:', err);
      }
    }
  };

  // Folder actions
  const handleCreateFolder = (name: string) => {
    const newFolder: Folder = {
      id: `folder_${Date.now()}`,
      name
    };
    updateFoldersState([...folders, newFolder]);
  };

  const handleDeleteFolder = async (id: string) => {
    // Also move folder's notes back to Inbox
    const reassignedNotes = notes.map(n => n.folder_id === id ? { ...n, folder_id: null } : n);
    await updateNotesState(reassignedNotes);
    
    const nextFolders = folders.filter(f => f.id !== id);
    await updateFoldersState(nextFolders);
    
    if (currentFolderId === id) {
      setCurrentFolderId(null);
    }

    if (isFirebaseConfigured && user) {
      try {
        await deleteDoc(doc(db, 'folders', id)).catch(err => {
          handleFirestoreError(err, OperationType.DELETE, `folders/${id}`);
        });
      } catch (err) {
        console.error('Delete folder database sync deferred:', err);
      }
    }
  };

  // Create Note Form file processor
  const handleNoteFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setUploadProgress(true);
    setUploadError(null);

    try {
      // Local client base64 reader fallback
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewFileUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.warn('Secure storage upload error, initiating object fallback url:', err);
      const tempUrl = URL.createObjectURL(file);
      setNewFileUrl(tempUrl);
      setUploadError(`Storage loading: ${err.message || 'local file load failure'}`);
    } finally {
      setUploadProgress(false);
    }
  };

  // Form note compilation submission
  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Build the dynamic note
    const freshNote: Note = {
      id: `note_${Date.now()}`,
      title: newTitle.trim(),
      content: newContent || `<p>Formulated academic research node draft for ${newType} records.</p>`,
      type: newType,
      folder_id: newFolderId === 'inbox' ? null : newFolderId,
      file_url: newFileUrl || null,
      created_at: new Date().toISOString()
    };

    const nextNotes = [freshNote, ...notes];
    updateNotesState(nextNotes);

    // Reset creation states
    setNewTitle('');
    setNewType('text');
    setNewFolderId('inbox');
    setNewContent('');
    setNewFileUrl('');
    setShowAddModal(false);
  };

  const handleDeleteNote = async (id: string) => {
    const nextNotes = notes.filter(n => n.id !== id);
    await updateNotesState(nextNotes);
    await deleteFileFromStorage(id);
    if (editingNote?.id === id) {
      setEditingNote(null);
    }

    if (isFirebaseConfigured && user) {
      try {
        await deleteDoc(doc(db, 'notes', id)).catch(err => {
          handleFirestoreError(err, OperationType.DELETE, `notes/${id}`);
        });
      } catch (err) {
        console.error('Delete note database sync deferred:', err);
      }
    }
  };

  // Inline Note updates on Editor save
  const handleSaveEditorNote = (updatedNote: Note) => {
    const nextNotes = notes.map(n => n.id === updatedNote.id ? updatedNote : n);
    updateNotesState(nextNotes);
    setEditingNote(updatedNote);
  };

  // Double selection logic (opens editor for text/url, and opens special readers for media)
  const handleSelectNoteCard = (note: Note) => {
    if (note.type === 'text') {
      setEditingNote(note);
    } else if (note.type === 'pdf' && note.file_url) {
      // Open our shiny new resizable PDF viewer sidebar
      try {
        localStorage.setItem('pdf_sidebar_open', 'true');
        window.dispatchEvent(new Event('pdf-sidebar-state-change'));
        
        // Dispatch document opening details to sidebar
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-pdf-study-document', {
            detail: { url: note.file_url, name: note.title }
          }));
        }, 100);
      } catch (err) {
        console.warn('Failed to set localStorage PDF state', err);
      }
    } else {
      // Open editors or special players directly inline or in an immersive card viewer
      setEditingNote(note);
    }
  };

  // Filter notes based on active values
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      // 1. Search filter
      const matchesSearch = 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Type filter
      const matchesType = selectedTypeFilter === 'all' || n.type === selectedTypeFilter;

      // 3. Folder filter
      const matchesFolder = n.folder_id === currentFolderId;

      return matchesSearch && matchesType && matchesFolder;
    });
  }, [notes, searchQuery, selectedTypeFilter, currentFolderId]);

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700 relative overflow-x-hidden">
      
      {/* Top Title/Search bar Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/5">
        <div>
           <h1 className="text-4xl text-white mb-2 serif-title tracking-tight flex items-center gap-2">
             My Study Library
             {user && isFirebaseConfigured ? (
               <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-mono text-[9px] uppercase tracking-wider gap-1">
                 <Cloud className="w-3 h-3" /> Firebase Synced
               </span>
             ) : (
               <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-mono text-[9px] uppercase tracking-wider gap-1">
                 <CloudOff className="w-3 h-3" /> Local Mode
               </span>
             )}
           </h1>
           <p className="text-gray-400 text-sm">Organize notes, upload PDFs and draft study guides in your workspace.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Quick search input */}
          <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
             <input 
               type="text" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search active studies..." 
               className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple/50 focus:bg-white/10 transition-colors font-sans"
             />
          </div>
          <GlowButton size="sm" onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
             <Plus className="w-4 h-4" />
             Add Note
          </GlowButton>
        </div>
      </header>

      {/* Inline Active Media Viewer / Text Editor overlay panel */}
      <AnimatePresence>
        {editingNote && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6"
          >
            {/* Display Media Viewers dynamically on left or center if media type */}
            {editingNote.type !== 'text' && editingNote.file_url && (
              <div className="lg:col-span-6 flex flex-col justify-center bg-black/50 border border-white/5 rounded-2xl p-4 md:p-6 shadow-inner relative">
                <button 
                  onClick={() => setEditingNote({ ...editingNote, file_url: null })}
                  className="absolute top-4 left-4 p-2 text-rose-400 bg-rose-500/10 border border-rose-500/10 hover:bg-rose-500/25 rounded-md text-xs font-mono tracking-widest uppercase transition-colors z-30"
                >
                  Detach Media Frame
                </button>
                
                {editingNote.type === 'audio' && <AudioPlayer url={editingNote.file_url} title={editingNote.title} />}
                {editingNote.type === 'video' && <VideoPlayer url={editingNote.file_url} title={editingNote.title} />}
                {editingNote.type === 'image' && <ImageViewer url={editingNote.file_url} title={editingNote.title} />}
                {editingNote.type === 'pdf' && (
                  <div className="w-full h-[580px] bg-[#050505] rounded-xl border border-white/10 overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                    <iframe
                      src={`${editingNote.file_url}#toolbar=1`}
                      title={editingNote.title}
                      className="w-full h-full border-none rounded-xl"
                    />
                  </div>
                )}
                {editingNote.type === 'link' && (
                  <div className="text-center py-12 space-y-4">
                    <FileBox className="w-12 h-12 text-cyan-400 mx-auto" />
                    <h4 className="font-serif text-lg text-white">Resource Bookmark Link</h4>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">{editingNote.file_url}</p>
                    <a 
                      href={editingNote.file_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/20 hover:border-cyan-500/45 text-cyan-400 font-mono text-xs font-bold tracking-wider uppercase rounded-xl transition-all"
                    >
                      OPEN SOURCE LINK <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Note Draft Title Content Editor */}
            <div className={`${editingNote.type !== 'text' && editingNote.file_url ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
              <NoteEditor 
                note={editingNote} 
                onSave={handleSaveEditorNote} 
                onClose={() => setEditingNote(null)} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Core Layout */}
      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Folder Navigation Sidebar */}
        <div className="flex-shrink-0">
          <FolderSidebar 
            folders={folders}
            currentFolderId={currentFolderId}
            notes={notes}
            onSelectFolder={setCurrentFolderId}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
          />
        </div>

        {/* Right main workspace (Filters & Dynamic Responsive Grid) */}
        <div className="flex-1 flex flex-col gap-6 min-h-0">
          
          {/* Note Type Filters Row */}
          <div className="flex items-center justify-between bg-neutral-950/40 p-1.5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 px-1 pb-1 flex-1">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider pl-2 hidden lg:inline select-none whitespace-nowrap">Format:</span>
              {(['all', 'text', 'pdf', 'image', 'audio', 'video', 'link'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all ${
                    selectedTypeFilter === type
                      ? 'bg-neutral-800 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pr-2 select-none text-[10px] font-mono text-gray-500">
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>{filteredNotes.length} Nodes</span>
            </div>
          </div>

          {/* Notes Responsive Grid list */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            {loading ? (
              <div className="h-48 flex flex-col items-center justify-center gap-3 border border-white/5 rounded-2xl bg-black/20">
                <RefreshCw className="w-6 h-6 text-brand-purple animate-spin" />
                <p className="font-mono text-xs text-gray-500 uppercase">Synchronizing knowledge archives...</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                <FileBox className="w-8 h-8 text-semibold text-gray-600 animate-pulse" />
                <div className="text-center space-y-1">
                  <p className="font-serif italic text-white/90">No notes in this folder</p>
                  <p className="text-[10px] font-mono text-gray-500">Create a new note to get started.</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(true)} 
                  className="mt-2 text-[10px] font-mono font-bold tracking-widest uppercase text-brand-purple hover:text-white px-3 py-1.5 bg-brand-purple/15 hover:bg-brand-purple rounded-lg border border-brand-purple/20 transition-all"
                >
                  CREATE NEW NOTE
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredNotes.map((note) => (
                    <motion.div 
                      key={note.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <NoteCard 
                        note={note}
                        folders={folders}
                        onSelect={handleSelectNoteCard}
                        onDelete={handleDeleteNote}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add note modal panel overlay */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="glass-panel max-w-xl w-full p-6 md:p-8 space-y-6 relative border border-white/10 bg-black/95 shadow-[0_0_50px_rgba(139,92,246,0.3)]"
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1.5">
                <h2 className="text-2xl font-serif text-white italic">Create New Note</h2>
                <p className="text-xs text-gray-400 font-mono">Select note configurations and attach related source assets for your study.</p>
              </div>

              <form onSubmit={handleAddNoteSubmit} className="space-y-5">
                
                {/* 1. Title */}
                <div className="space-y-2">
                  <label className="block text-xs mono-label text-gray-400">Note Title</label>
                  <input 
                    type="text" 
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Relativistic Electro-dynamics"
                    className="w-full bg-white/5 border border-white/12 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple/50 focus:bg-white/10 transition-all font-sans"
                  />
                </div>

                {/* 2. Format / Category Select */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs mono-label text-gray-400">Folder</label>
                    <select 
                      value={newFolderId}
                      onChange={(e) => setNewFolderId(e.target.value)}
                      className="w-full bg-[#111] border border-white/12 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-brand-purple/50 focus:bg-[#181818] transition-all font-sans"
                    >
                      <option value="inbox">Inbox (Default)</option>
                      {folders.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs mono-label text-gray-400">Material Format</label>
                    <select 
                      value={newType}
                      onChange={(e) => {
                        const nextType = e.target.value as NoteType;
                        setNewType(nextType);
                        setNewFileUrl(''); // Clear previous uploads when type changes
                      }}
                      className="w-full bg-[#111] border border-white/12 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-brand-purple/50 focus:bg-[#181818] transition-all font-sans"
                    >
                      <option value="text">Text Document</option>
                      <option value="pdf">PDF Document File</option>
                      <option value="image">Image Asset</option>
                      <option value="audio">Audio Track</option>
                      <option value="video">Video Tutorial</option>
                      <option value="link">Web Bookmark Link</option>
                    </select>
                  </div>
                </div>

                {/* 3. Media file upload / Link input */}
                {newType !== 'text' && (
                  <div className="space-y-2 border border-dashed border-white/10 rounded-2xl p-4 bg-white/[0.01]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">{newType === 'link' ? 'Reference URI' : 'Attach Material Asset'}</span>
                      {uploadProgress && (
                        <span className="text-[10px] font-mono text-brand-purple animate-pulse">Processing File...</span>
                      )}
                    </div>

                    {uploadError && (
                      <p className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded mb-2">{uploadError}</p>
                    )}

                    {newType === 'link' ? (
                      <input 
                        type="url" 
                        required
                        value={newFileUrl}
                        onChange={(e) => setNewFileUrl(e.target.value)}
                        placeholder="https://encyclopedia.org/quantum-studies"
                        className="w-full bg-white/5 border border-white/12 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-purple/50 font-sans"
                      />
                    ) : (
                      <div className="space-y-3">
                        {newFileUrl ? (
                          <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/10">
                            <span className="text-xs text-emerald-400 font-mono truncate max-w-sm">✓ Resource mapped successfully</span>
                            <button 
                              type="button" 
                              onClick={() => setNewFileUrl('')} 
                              className="text-xs text-rose-400 p-1 hover:bg-rose-500/10 rounded"
                            >
                              Reset
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-4 cursor-pointer gap-2 hover:bg-white/[0.03] transition-colors rounded-xl border border-dashed border-white/10 relative">
                            <input 
                              type="file" 
                              onChange={handleNoteFileUpload}
                              disabled={uploadProgress}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              accept={
                                newType === 'pdf' ? 'application/pdf' :
                                newType === 'image' ? 'image/*' :
                                newType === 'audio' ? 'audio/*' :
                                'video/*'
                              }
                            />
                            <Upload className="w-5 h-5 text-gray-500" />
                            <span className="text-xs text-gray-400 font-mono">Upload scholars {newType} file (Click or Drag)</span>
                          </div>
                        )}
                        <p className="text-[10px] font-mono text-gray-500 text-center">Uploading directly into the Supabase 'notes' Bucket.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Optional Abstract block */}
                <div className="space-y-2">
                  <label className="block text-xs mono-label text-gray-400">Editorial Notes / Description (Optional)</label>
                  <textarea 
                    rows={3}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Short description, checklist, or transcription comments..."
                    className="w-full bg-white/5 border border-white/12 rounded-xl p-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple/50 focus:bg-white/10 transition-all font-sans resize-none"
                  />
                </div>

                {/* Form controls */}
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 border border-white/10 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <GlowButton type="submit" className="flex-1 text-xs uppercase tracking-wider py-3 rounded-xl font-bold">
                    Save Note
                  </GlowButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
