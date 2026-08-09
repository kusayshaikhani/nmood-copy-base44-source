import React, { useState, useRef } from 'react';
import { Camera, EyeOff, Trash2, X, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function MemoriesGallery({ memories, onToggleHide, onRemovePhoto, removedPhotos, palId }) {
  const fileRef = useRef(null);
  const [extraPhotos, setExtraPhotos] = useState([]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setExtraPhotos(prev => [...prev, file_url]);
    } catch {}
  };

  const allMemories = memories.length > 0 ? memories : [];
  const hasPhotos = allMemories.some(m => (m.photos || []).filter(p => !removedPhotos?.has(p)).length > 0) || extraPhotos.length > 0;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Memories</h2>
        <button onClick={() => fileRef.current?.click()} type="button" className="flex items-center gap-1.5 text-sm text-primary font-medium">
          <Camera className="w-4 h-4" /> Upload
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {hasPhotos ? (
        <div className="grid grid-cols-2 gap-3">
          {allMemories.map(mem => {
            const visiblePhotos = (mem.photos || []).filter(p => !removedPhotos?.has(p));
            if (visiblePhotos.length === 0) return null;
            return (
              <div key={mem.id} className="group relative rounded-2xl overflow-hidden border border-border bg-card">
                <img src={visiblePhotos[0]} alt={mem.experienceName} className="w-full h-40 object-cover" loading="lazy" />
                <div className="p-2.5">
                  <p className="text-xs font-semibold truncate">{mem.experienceName}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="w-2.5 h-2.5" /> {mem.date} · {visiblePhotos.length} photo{visiblePhotos.length > 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => onToggleHide?.(mem.id)}
                  type="button"
                  className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => visiblePhotos.forEach(p => onRemovePhoto?.(p))}
                  type="button"
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
          {extraPhotos.map((photo, i) => (
            <div key={`extra-${i}`} className="group relative rounded-2xl overflow-hidden border border-border bg-card">
              <img src={photo} alt="New memory" className="w-full h-40 object-cover" loading="lazy" />
              <div className="p-2.5">
                <p className="text-xs font-semibold truncate">New Memory</p>
                <p className="text-[10px] text-muted-foreground">Just added</p>
              </div>
              <button
                onClick={() => setExtraPhotos(prev => prev.filter(p => p !== photo))}
                type="button"
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <Camera className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No memories yet. Upload a photo to start your shared gallery.</p>
        </div>
      )}
    </section>
  );
}