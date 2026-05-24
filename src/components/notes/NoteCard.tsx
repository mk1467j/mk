import React from 'react';
import { motion } from 'motion/react';
import { 
  FileText, File, Image, Music, Video, ExternalLink, Trash2, FolderIcon 
} from 'lucide-react';
import { Note, Folder } from '@/types/notes';
import { GlassCard } from '../GlassCard';

interface NoteCardProps {
  note: Note;
  folders: Folder[];
  onSelect: (note: Note) => void;
  onDelete: (id: string) => void;
}

export function NoteCard({ note, folders, onSelect, onDelete }: NoteCardProps) {
  // Find current folder
  const folder = folders.find(f => f.id === note.folder_id);
  const folderName = folder ? folder.name : 'Inbox';

  // Get type icon & styling
  const getTypeConfig = () => {
    switch (note.type) {
      case 'pdf':
        return { icon: File, color: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'PDF Document' };
      case 'image':
        return { icon: Image, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', label: 'Image File' };
      case 'audio':
        return { icon: Music, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Audio File' };
      case 'video':
        return { icon: Video, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20', label: 'Video Tutorial' };
      case 'link':
        return { icon: ExternalLink, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', label: 'Web Bookmark' };
      default:
        return { icon: FileText, color: 'text-brand-purple bg-brand-purple/10 border-brand-purple/20', label: 'Text Draft' };
    }
  };

  const { icon: Icon, color, label } = getTypeConfig();

  // Create clean human-readable excerpt from content
  const getExcerpt = () => {
    if (!note.content) return 'No notes added yet.';
    // Strip HTML tags for clean text
    const stripped = note.content.replace(/<[^>]*>/g, ' ');
    return stripped.slice(0, 110) + (stripped.length > 110 ? '...' : '');
  };

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      onClick={() => onSelect(note)}
      className="cursor-pointer"
    >
      <GlassCard 
        hoverable 
        className="flex flex-col h-[280px] p-6 justify-between relative border-white/5 bg-white/[0.03] hover:border-brand-purple/20 transition-all duration-300 group overflow-hidden"
      >
        {/* Abstract Glowing Accent Blob inside cards on hover */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-purple/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${color}`}>
              <Icon className="w-3 h-3" /> {note.type}
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-all"
              title="Delete Note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h3 className="serif-title text-lg text-white group-hover:text-brand-purple transition-colors line-clamp-2 leading-snug">{note.title}</h3>
            <p className="text-gray-400 text-xs font-sans leading-relaxed line-clamp-3 mt-2">{getExcerpt()}</p>
          </div>
        </div>

        {/* Footer info: Folder & date */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-500">
          <span className="flex items-center gap-1.5 truncate max-w-[130px]">
            <FolderIcon className="w-3.5 h-3.5 text-gray-600" /> {folderName}
          </span>
          <span className="whitespace-nowrap">
            {new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </GlassCard>
    </motion.div>
  );
}
