import React from 'react';

export default function TypingIndicator({ name }) {
  return (
    <div className="flex items-center gap-2 px-4 py-1.5">
      <div className="flex items-center gap-1 px-3 py-2 rounded-2xl rounded-bl-md bg-muted">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      {name && <span className="text-xs text-muted-foreground">{name} is typing...</span>}
    </div>
  );
}