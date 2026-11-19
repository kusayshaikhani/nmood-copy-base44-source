import React from 'react';
import { Check, Star, Users } from 'lucide-react';

/**
 * Nmood Premium bottom action — large gradient primary button.
 * State labels aligned to the redesign brief; all onClick handlers reused.
 */
export default function JoinStateButton({ joinState, onJoin, onLeave, onJoinWaitingList: _onJoinWaitingList, onRate, optimisticState, pending = false }) {
  const effectiveState = optimisticState || joinState;
  const primary = (label, gradient, icon, onClick, disabled = false) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      className={`pressable min-w-0 flex-1 min-h-14 px-3 py-3 rounded-button flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
        gradient
          ? 'bg-nmood-cta text-primary-foreground shadow-elevated'
          : 'bg-secondary text-secondary-foreground'
      } ${disabled || pending ? 'opacity-70 pointer-events-none' : 'hover:shadow-float'}`}
    >
      {pending && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {icon}
      {label}
    </button>
  );

  const dual = (primaryLabel, primaryGradient, primaryIcon, secondaryLabel, secondaryOnClick) => (
    <div className="flex gap-2.5 flex-1">
      <button
        type="button"
        className={`pressable min-w-0 flex-1 min-h-14 px-3 py-3 rounded-button flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
          primaryGradient ? 'bg-nmood-cta text-primary-foreground shadow-elevated' : 'bg-success text-success-foreground'
        }`}
        disabled
      >
        {primaryIcon}
        {primaryLabel}
      </button>
      <button
        type="button"
        onClick={secondaryOnClick}
        className="pressable h-14 px-5 rounded-button flex items-center justify-center text-sm font-semibold border border-border bg-card text-foreground hover:bg-secondary transition-all"
      >
        {secondaryLabel}
      </button>
    </div>
  );

  switch (effectiveState) {
    case 'confirmed':
    case 'going':
      return dual('You joined this Experience', true, <Check className="w-5 h-5" strokeWidth={2.5} />, 'Leave', onLeave);
    case 'pending':
    case 'waiting':
      return primary('Join request sent — awaiting approval', false, <Users className="w-5 h-5" />, null, true);
    case 'full':
      return primary('Experience full', false, <Users className="w-5 h-5" />, null, true);
    case 'loading': return primary('Checking attendance…',false,null,null,true);
    case 'unavailable': return primary('Attendance unavailable',false,null,null,true);
    case 'invite': return primary('Invite only',false,null,null,true);
    case 'ended': return primary('Experience ended',false,null,null,true);
    case 'join': return primary('Join Experience',true,null,onJoin);
    case 'closed':
      return primary('Closed', false, null, null, true);
    case 'cancelled':
      return primary('Cancelled', false, null, null, true);
    case 'completed':
      return primary('Rate Experience', true, <Star className="w-5 h-5" />, onRate, false);
    case 'rated':
      return primary('Rated', false, <Check className="w-5 h-5" strokeWidth={2.5} />, null, true);
    case 'request': return primary('Request to Attend', true, null, onJoin, false);
    default: return primary('Attendance unavailable', false, null, null, true);
  }
}