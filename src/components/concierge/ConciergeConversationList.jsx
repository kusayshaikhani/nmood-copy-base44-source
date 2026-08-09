import React from 'react';
import { MessageCircle, Trash2, Pencil, Check, X } from 'lucide-react';
import { useState } from 'react';

/**
 * List of recent Concierge conversations for the landing screen.
 */
export default function ConciergeConversationList({ conversations, onSelect, onDelete, onRename }) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const startEdit = (conv) => {
    setEditingId(conv.id);
    setEditTitle(conv.title || '');
  };

  const confirmRename = (conv) => {
    if (editTitle.trim() && editTitle !== conv.title) {
      onRename(conv, editTitle.trim());
    }
    setEditingId(null);
  };

  if (!conversations.length) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">Recent conversations</h3>
      <div className="space-y-2">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className="pressable flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-3.5 shadow-soft hover:border-primary/20 transition-default"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            {editingId === conv.id ? (
              <div className="flex-1 flex items-center gap-1.5">
                <input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(conv); if (e.key === 'Escape') setEditingId(null); }}
                  className="flex-1 text-sm font-medium bg-transparent border-b border-primary py-1 outline-none"
                />
                <button onClick={() => confirmRename(conv)} className="text-success"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingId(null)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <>
                <button type="button" onClick={() => onSelect(conv)} className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">{conv.title || 'Untitled'}</p>
                  {conv.last_message && <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message}</p>}
                </button>
                <button onClick={() => startEdit(conv)} className="text-muted-foreground hover:text-foreground p-1" title="Rename">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDelete(conv)} className="text-muted-foreground hover:text-destructive p-1" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}