import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, BellOff, Trash, Circle } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-007 — Premium notification card.
 * Rounded card, member-style avatar (ringed icon tile), rich content,
 * swipe-to-act animations. All select-mode / swipe / action logic preserved.
 */
export default function NotificationCard({ notification, onAction, selectMode, selected, onToggleSelect }) {
  const { t } = useLocalization();
  const [swipeOpen, setSwipeOpen] = useState(false);
  const Icon = notification.icon;
  const cardBorder = notification.read ? 'border-border/40' : 'border-primary/25';

  const swipeActions = [
    { key: 'read', icon: Check, label: t('notifications.swipe.read'), bg: 'bg-success' },
    { key: 'mute', icon: BellOff, label: t('notifications.swipe.mute'), bg: 'bg-warning' },
    { key: 'delete', icon: Trash, label: t('notifications.swipe.delete'), bg: 'bg-destructive' },
  ];

  const swipeWidth = swipeActions.length * 60;

  // Selection mode — checkbox, swipe disabled
  if (selectMode) {
    return (
      <div
        onClick={() => onToggleSelect?.(notification.id)}
        className={'flex gap-3 p-4 bg-card border rounded-card cursor-pointer transition-default shadow-sm ' + cardBorder + (selected ? ' ring-2 ring-primary/40 bg-primary/5' : '')}
      >
        <div className="flex-shrink-0 mt-0.5">
          {selected ? (
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground/40" />
          )}
        </div>
        <AvatarTile notification={notification} Icon={Icon} />
        <CardBody notification={notification} />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-card">
      {/* Swipe actions */}
      <div className="absolute end-0 top-0 bottom-0 flex gap-1 pe-1">
        {swipeActions.map((action) => {
          const ActionIcon = action.icon;
          return (
            <button
              key={action.key}
              onClick={() => {
                onAction(action.key, notification);
                setSwipeOpen(false);
              }}
              className={'w-[60px] my-1 flex flex-col items-center justify-center gap-1 text-white rounded-card ' + action.bg}
            >
              <ActionIcon className="w-4 h-4" />
              <span className="text-[9px] font-medium">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Draggable card */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -swipeWidth, right: 0 }}
        dragElastic={0.05}
        onDragEnd={(_, info) => {
          setSwipeOpen(info.offset.x < -swipeWidth / 2);
        }}
        animate={{ x: swipeOpen ? -swipeWidth : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative bg-card"
      >
        <div className={'flex gap-3 p-4 bg-card border rounded-card shadow-sm ' + cardBorder}>
          <AvatarTile notification={notification} Icon={Icon} />
          <CardBody notification={notification} onAction={onAction} />
        </div>
      </motion.div>
    </div>
  );
}

function AvatarTile({ notification, Icon }) {
  return (
    <div className="relative flex-shrink-0">
      <div className={'w-12 h-12 rounded-full flex items-center justify-center ring-2 ring-card shadow-sm ' + notification.iconBg}>
        <Icon className={'w-5 h-5 ' + notification.iconColor} />
      </div>
      {!notification.read && (
        <span className="absolute -top-0.5 -end-0.5 w-3 h-3 rounded-full bg-primary border-2 border-card" />
      )}
    </div>
  );
}

function CardBody({ notification, onAction }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm leading-tight">{notification.title}</h3>
      </div>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{notification.description}</p>
      <p className="text-[11px] text-muted-foreground/70 mt-1.5">{notification.timestamp}</p>

      {notification.actions?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {notification.actions.map((action) => {
            const btnClass = action.variant === 'primary'
              ? 'px-3.5 py-1.5 rounded-button bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-default shadow-sm'
              : 'px-3.5 py-1.5 rounded-button border border-border text-xs font-medium hover:bg-muted/50 transition-default';
            return (
              <button
                key={action.label}
                onClick={() => onAction(action.action, notification)}
                className={btnClass}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}