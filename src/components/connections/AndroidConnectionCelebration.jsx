import React from 'react';
import { useReducedMotion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';

const PARTICLES = Array.from({ length: 12 }, (_, index) => ({
  id: index,
  left: `${8 + ((index * 29) % 84)}%`,
  top: `${8 + ((index * 43) % 72)}%`,
  delay: `${(index % 4) * 120}ms`,
}));

/**
 * Android-only connection moments. Callers render this only after their
 * existing server-confirmed match response, so a decorative event can never
 * create a connection or reveal somebody who is no longer eligible.
 */
export default function AndroidConnectionCelebration({ type = 'match', name, myPhoto, memberPhoto, onMessage, onDismiss }) {
  const reducedMotion = useReducedMotion();
  const spark = type === 'spark';
  const title = spark ? 'SPARK ACCEPTED!' : 'IT’S A MATCH!';
  const message = spark
    ? `${name} liked you back. Your Spark started a new connection.`
    : `You and ${name} liked each other.`;

  return <div role="dialog" aria-modal="true" aria-labelledby="connection-celebration-title" className={`fixed inset-0 z-[100] grid place-items-center p-5 backdrop-blur-md ${spark ? 'bg-[#061851]/80' : 'bg-[#20104b]/75'}`}>
    <section className="relative w-full max-w-sm overflow-hidden rounded-[2.25rem] border border-white/30 bg-transparent text-center text-white shadow-[0_30px_90px_rgba(42,13,108,.5)]">
      <div aria-hidden="true" className={`absolute inset-0 overflow-hidden ${spark ? 'bg-[radial-gradient(circle_at_50%_25%,#a9f1ff_0%,transparent_28%),linear-gradient(145deg,#0759d7,#4e2ecf_53%,#9b47f3)]' : 'bg-[radial-gradient(circle_at_50%_20%,#edc5ff_0%,transparent_25%),linear-gradient(145deg,#3d159e,#6928e5_53%,#a95aff)]'}`}>
        {PARTICLES.map(particle => <span key={particle.id} className={`absolute h-2.5 w-2.5 rounded-full bg-white/80 ${reducedMotion ? '' : 'animate-pulse'} ${spark ? 'shadow-[0_0_16px_6px_rgba(158,237,255,.65)]' : 'shadow-[0_0_15px_5px_rgba(255,214,255,.6)]'}`} style={{ left: particle.left, top: particle.top, animationDelay: particle.delay }} />)}
      </div>
      <div className="relative px-7 pb-10 pt-8 text-white">
        <p className="text-[11px] font-bold uppercase tracking-[.28em] text-white/80">{spark ? 'Priority connection' : 'New connection'}</p>
        <div aria-hidden="true" className={`mx-auto mt-5 grid h-20 w-20 place-items-center rounded-[1.8rem] border border-white/45 bg-white/15 shadow-[0_0_45px_rgba(255,255,255,.42)] ${spark ? 'rotate-12' : ''}`}>
          {spark ? <Sparkles className="h-10 w-10 fill-white/35" /> : <Heart className="h-10 w-10 fill-white/35" />}
        </div>
        <h2 id="connection-celebration-title" className="mt-5 text-4xl font-black leading-none tracking-[-.065em]">{title}</h2>
        <p className="mt-3 text-sm font-medium text-white/90">{message}</p>
        <div className="absolute -bottom-8 left-1/2 flex -translate-x-1/2 items-center justify-center">
          <img src={myPhoto || memberPhoto} alt="Your profile" className="h-16 w-16 rounded-full border-3 border-white object-cover shadow-lg" />
          <span aria-hidden="true" className={`-mx-3 z-10 grid h-10 w-10 place-items-center rounded-full border-4 bg-white text-base shadow-lg ${spark ? 'border-sky-500 text-sky-600' : 'border-[#7944ee] text-[#6b32e7]'}`}>{spark ? '✦' : '♥'}</span>
          <img src={memberPhoto || myPhoto} alt={`${name}'s profile`} className="h-16 w-16 rounded-full border-3 border-white object-cover shadow-lg" />
        </div>
      </div>
      <div className="relative px-6 pb-6 pt-14">
        <p className="text-sm leading-relaxed text-white">{spark ? 'Say hello while the moment is fresh.' : 'Say hello and start the conversation.'}</p>
        <div className="mt-6 grid gap-2">
          <button type="button" onClick={onMessage} className={`min-h-12 rounded-2xl px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(48,85,220,.34)] ${spark ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-violet-600' : 'bg-gradient-to-r from-[#5623d3] via-[#7540ef] to-[#9654fb]'}`}>{spark ? 'Say hello' : 'Start chatting'}</button>
          <button type="button" onClick={onDismiss} className="min-h-11 text-sm font-semibold text-white">Keep exploring</button>
        </div>
      </div>
    </section>
  </div>;
}
