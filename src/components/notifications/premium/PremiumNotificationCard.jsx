import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, BellOff, Trash2, Circle } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-019 — Premium notification card.
 * 22px rounded, soft shadow, large icon tile with ring, category accent,
 * headline, supporting text, relative timestamp, unread indicator, inline
 * action buttons, and optional thumbnail with fade-in loading.
 *
 * All action / select / swipe logic preserved from the previous card.
 */
export default function PremiumNotificationCard({ notification, onAction, selectMode, selected, onToggleSelect }) {
  const { t } = useLocalization();
  const [swipeOpen, setSwipeOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const Icon = notification.icon;

  const hasThumbnail = !!notification.thumbnail;
  const isUnread = !notification.read;

  const swipeActions = [
    { key: 'read', icon: Check, label: t('notifications.swipe.read'), bg: 'bg-success' },
    { key: 'mute', icon: BellOff, label: t('notifications.swipe.mute'), bg: 'bg-warning' },
    { key: 'delete', icon: Trash2, label: t('notifications.swipe.delete'), bg: 'bg-destructive' },
  ];
  const swipeWidth = swipeActions.length * 64;

  // ── Select mode ──────────────────────────────────────────────────────
  if (selectMode) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={() => onToggleSelect?.(notification.id)}
        className={`flex gap-3 p-4 bg-card border rounded-[22px] cursor-pointer transition-colors duration-200 shadow-soft ${
          selected ? 'border-primary/40 bg-primary/5 ring-2 ring-primary/30' : 'border-border/40'
        }`}
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
        <IconTile notification={notification} Icon={Icon} />
        <CardBody notification={notification} />
      </motion.div>
    );
  }

  // ── Default mode with swipe actions ──────────────────────────────────
  return (
    <div className="relative overflow-hidden rounded-[22px]">
      {/* Swipe action layer */}
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
              className={`w-16 my-1 flex flex-col items-center justify-center gap-1 text-white rounded-[22px] ${action.bg}`}
            >
              <ActionIcon className="w-4 h-4" />
              <span className="text-[10px] font-medium">{action.label}</span>
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
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20px' }}
        className="relative"
      >
        <div className={`flex gap-3.5 p-4 border rounded-[22px] transition-colors duration-200 ${
          isUnread
            ? 'bg-card border-primary/20 shadow-card'
            : 'bg-card border-border/30 shadow-soft'
        }`}>
          {/* Unread accent bar */}
          {isUnread && (
            <div className="absolute start-0 top-5 bottom-5 w-1 rounded-full bg-primary/40" />
          )}

          <IconTile notification={notification} Icon={Icon} hasThumbnail={hasThumbnail} imgLoaded={imgLoaded} setImgLoaded={setImgLoaded} />
          <CardBody notification={notification} onAction={onAction} />
        </div>
      </motion.div>
    </div>
  );
}

// ── Icon tile (or thumbnail) ──────────────────────────────────────────
function IconTile({ notification, Icon, hasThumbnail, imgLoaded, setImgLoaded }) {
  return (
    <div className="relative flex-shrink-0">
      {hasThumbnail ? (
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-muted relative">
          {!imgLoaded && <div className="absolute inset-0 shimmer" />}
          <img
            src={notification.thumbnail}
            alt=""
            className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
          />
          {/* Category icon badge over thumbnail */}
          <div className={`absolute -bottom-1 -end-1 w-6 h-6 rounded-full flex items-center justify-center ring-2 ring-card ${notification.iconBg}`}>
            <Icon className={`w-3 h-3 ${notification.iconColor}`} />
          </div>
        </div>
      ) : (
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ring-1 ring-border/50 ${notification.iconBg}`}>
          <Icon className={`w-6 h-6 ${notification.iconColor}`} />
        </div>
      )}
      {/* Unread pulse dot */}
      {!notification.read && (
        <span className="absolute -top-0.5 -end-0.5 w-3 h-3 rounded-full bg-primary border-2 border-card animate-pop" />
      )}
    </div>
  );
}

// ── Card body ─────────────────────────────────────────────────────────
function CardBody({ notification, onAction }) {
  return (
    <div className="flex-1 min-w-0 ps-0.5">
      <h3 className="font-semibold text-[15px] leading-snug">{notification.title}</h3>
      <p className="text-[13px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
        {notification.description}
      </p>
      <p className="text-[11px] text-muted-foreground/70 mt-1.5">{notification.timestamp}</p>

      {notification.actions?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {notification.actions.map((action) => {
            const isPrimary = action.variant === 'primary';
            return (
              <button
                key={action.label}
                onClick={() => onAction(action.action, notification)}
                className={`px-4 h-8 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 ${
                  isPrimary
                    ? 'bg-nmood-cta text-primary-foreground shadow-soft'
                    : 'border border-border text-foreground hover:bg-muted/50'
                }`}
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