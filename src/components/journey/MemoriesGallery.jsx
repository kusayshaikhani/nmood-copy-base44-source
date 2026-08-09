import React from 'react';
import { motion } from 'framer-motion';
import { memories } from '@/lib/journey-data';

export default function MemoriesGallery() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Memories</h2>
        <p className="text-sm text-muted-foreground">Photos from your experiences.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {memories.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ delay: (i % 3) * 0.05 }}
            className={`relative rounded-2xl overflow-hidden group cursor-pointer ${
              m.size === 'large' ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
            }`}
          >
            <img
              src={m.url}
              alt={m.caption}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-xs font-medium text-white truncate">{m.caption}</p>
              <p className="text-[10px] text-white/70">{m.date}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}