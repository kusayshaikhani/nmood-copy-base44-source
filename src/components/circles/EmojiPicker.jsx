import React from 'react';

const EMOJIS = ['😀','😂','😍','🥰','😎','🤩','😇','🤗','🙃','😉','😋','🤔','😅','😭','😡','😱','🥳','😴','🤯','🤠','🥺','😏','🤤','🤓','😈','👻','💀','🤖','👽','🤝','👏','🙌','💪','🔥','✨','🎉','💜','❤️','💙','💚','☕','🍕','🍔','🍻','🌊','☀️','🌙','⭐','🌈','🎯','🎵','✈️','🏖️','🏔️','📷','🎮','⚽','🏀','🏆','💎'];

export default function EmojiPicker({ onPick }) {
  return (
    <div className="grid grid-cols-8 gap-1 p-2 max-h-40 overflow-y-auto no-scrollbar">
      {EMOJIS.map((e) => (
        <button key={e} type="button" onClick={() => onPick?.(e)}
          className="w-9 h-9 rounded-lg hover:bg-muted text-xl flex items-center justify-center transition-default">
          {e}
        </button>
      ))}
    </div>
  );
}