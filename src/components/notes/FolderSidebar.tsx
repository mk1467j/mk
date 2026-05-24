import React, { useState } from 'react';
import { Folder, Note } from '@/types/notes';
import { FolderIcon, Inbox, Plus, FolderKanban, Trash2, FolderClosed } from 'lucide-react';
import { motion } from 'motion/react';

interface FolderSidebarProps {
  folders: Folder[];
  currentFolderId: string | null; // null means Inbox / default folder
  notes: Note[];
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
}

export function FolderSidebar({
  folders,
  currentFolderId,
  notes,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder
}: FolderSidebarProps) {
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);

  const getNotesCount = (folderId: string | null) => {
    return notes.filter(n => n.folder_id === folderId).length;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setShowFolderInput(false);
    }
  };

  return (
    <div className="w-full md:w-64 bg-black/45 border border-white/5 rounded-2xl p-5 flex flex-col gap-6">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-brand-purple" />
          <h4 className="font-serif italic text-base text-white">Study Folders</h4>
        </div>
      </div>

      {/* Folders List Nav list */}
      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[350px] pr-1">
        
        {/* Default Inbox Category */}
        <motion.button
          whileHover={{ x: 3 }}
          onClick={() => onSelectFolder(null)}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs font-mono uppercase tracking-wider transition-all border ${
            currentFolderId === null 
              ? 'bg-brand-purple/20 border-brand-purple/35 text-white font-bold shadow-[0_0_15px_rgba(139,92,246,0.15)]' 
              : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Inbox className="w-4 h-4" />
            <span>Inbox (Default)</span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-gray-500">
            {getNotesCount(null)}
          </span>
        </motion.button>

        {/* Dynamic Folders */}
        {folders.map((folder) => {
          const isSelected = currentFolderId === folder.id;
          const count = getNotesCount(folder.id);

          return (
            <motion.div
              key={folder.id}
              whileHover={{ x: 3 }}
              className="group flex items-center justify-between text-xs font-mono uppercase tracking-wider transition-all rounded-xl relative"
            >
              <button
                onClick={() => onSelectFolder(folder.id)}
                className={`flex-1 text-left px-3.5 py-2.5 rounded-xl border flex items-center justify-between ${
                  isSelected 
                    ? 'bg-brand-indigo/25 border-brand-indigo/35 text-white font-bold shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate pr-2">
                  <FolderClosed className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-gray-500">
                  {count}
                </span>
              </button>
              
              {/* Delete folder button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFolder(folder.id);
                }}
                className="absolute right-12 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-all z-10"
                title="Delete Folder"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Create folders interaction form widget */}
      <div className="border-t border-white/5 pt-4">
        {showFolderInput ? (
          <form onSubmit={handleCreateSubmit} className="space-y-2">
            <input 
              type="text"
              required
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder Category Name..."
              className="w-full bg-[#050505] border border-white/12 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-purple/50 font-sans"
            />
            <div className="flex gap-1.5">
              <button 
                type="submit"
                className="flex-1 py-1.5 rounded-lg bg-brand-purple/20 hover:bg-brand-purple border border-brand-purple/30 text-[10px] font-mono font-bold uppercase tracking-wider text-white transition-colors"
              >
                CONFIRM
              </button>
              <button 
                type="button"
                onClick={() => setShowFolderInput(false)}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400 hover:text-white transition-colors"
              >
                CANCEL
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowFolderInput(true)}
            className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-xl text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-brand-purple" /> Create Folder
          </button>
        )}
      </div>
    </div>
  );
}
