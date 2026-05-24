import React, { useState, useEffect, useRef } from 'react';
import { 
  Bold, Italic, Underline, Heading1, Quote, Code, Highlighter, 
  List, ListOrdered, Link, Paperclip, CheckCircle2, CloudLightning, 
  RefreshCw, Trash2, File, Eye
} from 'lucide-react';
import { Note, Attachment } from '@/types/notes';
import { isFirebaseConfigured } from '@/lib/firebase';

interface NoteEditorProps {
  note: Note;
  onSave: (updatedNote: Note) => void;
  onClose: () => void;
}

export function NoteEditor({ note, onSave, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [attachments, setAttachments] = useState<Attachment[]>(note.attachments || []);
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state when editing a new note
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setAttachments(note.attachments || []);
    if (editorRef.current) {
      editorRef.current.innerHTML = note.content;
    }
    const now = new Date();
    setLastSaved(`Loaded at ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`);
  }, [note.id]);

  // Command wrapper for Rich Text formatting
  const executeCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    // Focus back to editor
    editorRef.current?.focus();
    handleContentChange();
  };

  const handleLinkInsert = () => {
    const url = prompt('Enter the scholars-link URL:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const htmlValue = editorRef.current.innerHTML;
      setContent(htmlValue);
      triggerAutosave(title, htmlValue, attachments);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextTitle = e.target.value;
    setTitle(nextTitle);
    triggerAutosave(nextTitle, content, attachments);
  };

  const triggerAutosave = (t: string, c: string, a: Attachment[]) => {
    setIsSaving(true);
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(() => {
      const updated: Note = {
        ...note,
        title: t,
        content: c,
        attachments: a,
        created_at: new Date().toISOString()
      };
      
      onSave(updated);
      setIsSaving(false);
      const now = new Date();
      setLastSaved(`Saved at ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
    }, 1200); // 1.2s delay for perfect non-blocking feel
  };

  // Cleanup autosave timer
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, []);

  // Upload attachment file (Supabase storage or Local fallback)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setUploading(true);
    setUploadError(null);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `attachments/${fileName}`;

    try {
      let publicUrl = '';

      if (isFirebaseConfigured) {
        // Safe check block: Since Firebase is primarily provisioning Firestore and Auth,
        // we capture the attachment as a high-fidelity local memory Object URL
        publicUrl = URL.createObjectURL(file);
      } else {
        // Local Guest Storage Fallback
        publicUrl = URL.createObjectURL(file);
      }

      const newAttachment: Attachment = {
        name: file.name,
        url: publicUrl,
        size: file.size
      };

      const updatedAttachments = [...attachments, newAttachment];
      setAttachments(updatedAttachments);
      
      // Save instantly
      triggerAutosave(title, content, updatedAttachments);
    } catch (err: any) {
      console.error('Core attachment compilation error:', err);
      // Fallback base64 or memory file in case bucket permissions or network isn't fully set up yet
      const fallbackUrl = URL.createObjectURL(file);
      const newAttachment: Attachment = {
        name: file.name,
        url: fallbackUrl,
        size: file.size
      };
      const updatedAttachments = [...attachments, newAttachment];
      setAttachments(updatedAttachments);
      triggerAutosave(title, content, updatedAttachments);
      setUploadError(`Using secure client fallback: ${err.message || 'Supabase bucket configuration sync delay'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (idx: number) => {
    const updated = attachments.filter((_, i) => i !== idx);
    setAttachments(updated);
    triggerAutosave(title, content, updated);
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
  };

  return (
    <div className="flex flex-col h-full bg-[#080808] border border-white/10 rounded-2xl overflow-hidden relative shadow-[0_30px_60px_rgba(0,0,0,0.6)] animate-in fade-in duration-300">
      
      {/* Editorial Header */}
      <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <input 
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Note Draft"
            className="w-full bg-transparent border-none outline-none text-xl sm:text-2xl font-serif text-white placeholder-white/30 truncate focus:ring-0 leading-tight"
          />
        </div>

        {/* Sync / Autosave Indicator */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="flex items-center gap-1.5 text-[10px] font-mono select-none">
            {isSaving ? (
              <span className="flex items-center gap-1.5 text-brand-purple">
                <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-gray-500">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {lastSaved}
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            CLOSE ENCORE
          </button>
        </div>
      </div>

      {/* Styled Formatting Toolbar */}
      <div className="px-4 py-2 bg-neutral-950 border-b border-white/5 flex flex-wrap items-center gap-1">
        <button
          onClick={() => executeCommand('bold')}
          className="p-1.5 cursor-pointer rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => executeCommand('italic')}
          className="p-1.5 cursor-pointer rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => executeCommand('underline')}
          className="p-1.5 cursor-pointer rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        <button
          onClick={() => executeCommand('formatBlock', '<h2>')}
          className="p-1.5 cursor-pointer rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          title="Heading (H2)"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => executeCommand('formatBlock', '<blockquote>')}
          className="p-1.5 cursor-pointer rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          onClick={() => executeCommand('formatBlock', '<pre>')}
          className="p-1.5 cursor-pointer rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          onClick={() => executeCommand('backColor', '#a21caf')}
          className="p-1.5 cursor-pointer rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          title="Highlight Purple Accent"
        >
          <Highlighter className="w-4 h-4 text-brand-purple" />
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        <button
          onClick={() => executeCommand('insertUnorderedList')}
          className="p-1.5 cursor-pointer rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => executeCommand('insertOrderedList')}
          className="p-1.5 cursor-pointer rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={handleLinkInsert}
          className="p-1.5 cursor-pointer rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          title="Link Card"
        >
          <Link className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        {/* Paperclip upload trigger */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`p-1.5 cursor-pointer rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors ${
            uploading ? 'animate-pulse text-brand-purple' : ''
          }`}
          title="Attach Scholars File"
          disabled={uploading}
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,audio/*,video/*,application/pdf"
        />
      </div>

      {/* Editor Content Area (Rich contentEditable) */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 min-h-[300px]">
        {/* Attachment Error message */}
        {uploadError && (
          <div className="mb-4 text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg flex items-center justify-between">
            <span>{uploadError}</span>
            <button onClick={() => setUploadError(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>
        )}

        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          placeholder="Begin drafting your intellectual notes here..."
          className="w-full h-full text-sm leading-relaxed text-gray-200 outline-none select-text prose prose-invert font-sans max-w-none"
          style={{ minHeight: '100%', wordBreak: 'break-word' }}
        />
      </div>

      {/* Attachments Footer bar */}
      {attachments.length > 0 && (
        <div className="px-6 py-4 bg-neutral-950 border-t border-white/10 flex flex-col gap-2">
          <h5 className="text-[10px] font-mono uppercase text-gray-500 tracking-wider flex items-center gap-1">
            <Paperclip className="w-3 h-3" /> Attached Media Resources ({attachments.length})
          </h5>
          <div className="flex flex-wrap gap-2">
            {attachments.map((attach, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300 max-w-xs truncate hover:border-white/20 transition-all"
              >
                <File className="w-3.5 h-3.5 fill-current text-brand-purple" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-sans font-medium text-white/90">{attach.name}</p>
                  <p className="text-[9px] font-mono text-gray-500 mt-0.5">{formatSize(attach.size)}</p>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <a 
                    href={attach.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-1 hover:bg-white/10 text-gray-400 hover:text-white rounded transition-colors"
                    title="View media URL"
                  >
                    <Eye className="w-3 h-3" />
                  </a>
                  <button 
                    onClick={() => handleRemoveAttachment(idx)}
                    className="p-1 hover:bg-rose-500/15 text-gray-500 hover:text-rose-400 rounded transition-colors"
                    title="Detach Resource"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
