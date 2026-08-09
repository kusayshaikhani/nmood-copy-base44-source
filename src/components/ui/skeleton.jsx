import { cn } from "@/lib/utils"

/**
 * UI-026 — Premium skeleton system. Shimmer placeholders that mirror real
 * content shapes so layout never jumps, then fade naturally into content
 * (pair with `animate-content-rise` on the loaded content). Replaces every
 * generic spinner across the app.
 */
function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-muted", className)}
      {...props}
    />
  )
}

function SkeletonCard({ className, ...props }) {
  return (
    <Skeleton
      className={cn("rounded-card shadow-card border border-border/40", className)}
      {...props}
    />
  )
}

function SkeletonAvatar({ className, ...props }) {
  return (
    <Skeleton
      className={cn("rounded-full", className)}
      {...props}
    />
  )
}

function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3.5"
          style={{ width: `${i === lines - 1 ? 60 : 100 - i * 12}%` }}
        />
      ))}
    </div>
  )
}

function SkeletonImage({ className, ...props }) {
  return (
    <Skeleton
      className={cn("rounded-card", className)}
      {...props}
    />
  )
}

/** A single list row: avatar + two text lines. */
function SkeletonRow({ className }) {
  return (
    <div className={cn("flex items-center gap-3 p-3", className)}>
      <SkeletonAvatar className="w-11 h-11 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <Skeleton className="h-8 w-16 rounded-button" />
    </div>
  )
}

/** Vertical stack of rows. */
function SkeletonList({ rows = 5, className }) {
  return (
    <div className={cn("space-y-1", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}

/** Responsive grid of cards. */
function SkeletonGrid({ cards = 6, className }) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {Array.from({ length: cards }).map((_, i) => (
        <ExperienceCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Experience / discovery card skeleton — image + title + meta. */
function ExperienceCardSkeleton({ className }) {
  return (
    <SkeletonCard className={cn("overflow-hidden p-0", className)}>
      <SkeletonImage className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-2">
          <SkeletonAvatar className="w-6 h-6" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-3 w-1/5" />
        </div>
      </div>
    </SkeletonCard>
  )
}

/** Circle card skeleton — large image + overlapping avatars. */
function CircleCardSkeleton({ className }) {
  return (
    <SkeletonCard className={cn("overflow-hidden p-0", className)}>
      <SkeletonImage className="h-44 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonAvatar key={i} className="w-6 h-6 border-2 border-card" />
          ))}
          <Skeleton className="h-3 w-16 ms-1" />
        </div>
      </div>
    </SkeletonCard>
  )
}

/** Profile skeleton — hero + stats + sections. */
function ProfileSkeleton({ className }) {
  return (
    <div className={cn("space-y-5", className)}>
      <SkeletonImage className="h-40 w-full rounded-card" />
      <div className="flex items-start gap-4 -mt-10 ps-4">
        <SkeletonAvatar className="w-20 h-20 border-4 border-background" />
        <div className="flex-1 space-y-2 pt-10">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 px-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} className="p-4 space-y-2">
            <Skeleton className="h-6 w-2/3 mx-auto" />
            <Skeleton className="h-3 w-1/2 mx-auto" />
          </SkeletonCard>
        ))}
      </div>
      <div className="px-4 space-y-3">
        <Skeleton className="h-4 w-1/4" />
        <SkeletonText lines={3} />
      </div>
    </div>
  )
}

/** Chat skeleton — header + message bubbles. */
function ChatSkeleton({ className }) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center gap-3 p-3 border-b border-border/40">
        <SkeletonAvatar className="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-1/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="flex-1 p-4 space-y-4">
        <div className="flex justify-start">
          <Skeleton className="h-12 w-2/3 rounded-2xl rounded-bl-md" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-12 w-1/2 rounded-2xl rounded-br-md" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-12 w-3/5 rounded-2xl rounded-bl-md" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-12 w-2/5 rounded-2xl rounded-br-md" />
        </div>
      </div>
    </div>
  )
}

/** Notification skeleton — icon + two lines. */
function NotificationSkeleton({ rows = 5, className }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonCard key={i} className="flex items-center gap-3 p-3.5">
          <SkeletonAvatar className="w-10 h-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="w-2 h-2 rounded-full" />
        </SkeletonCard>
      ))}
    </div>
  )
}

/** Gallery skeleton — masonry of image tiles. */
function GallerySkeleton({ tiles = 6, className }) {
  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 gap-3", className)}>
      {Array.from({ length: tiles }).map((_, i) => (
        <SkeletonImage key={i} className={cn(i % 3 === 0 ? "h-48" : "h-32", "w-full")} />
      ))}
    </div>
  )
}

/** Map skeleton — muted panel with faux pins. */
function MapSkeleton({ className }) {
  return (
    <SkeletonCard className={cn("relative h-72 w-full overflow-hidden p-0", className)}>
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="absolute inset-0 flex items-center justify-center gap-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonAvatar key={i} className="w-7 h-7" />
        ))}
      </div>
    </SkeletonCard>
  )
}

/** Table skeleton — header + rows. */
function TableSkeleton({ rows = 5, cols = 4, className }) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-4 px-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-2">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonText,
  SkeletonImage,
  SkeletonRow,
  SkeletonList,
  SkeletonGrid,
  ExperienceCardSkeleton,
  CircleCardSkeleton,
  ProfileSkeleton,
  ChatSkeleton,
  NotificationSkeleton,
  GallerySkeleton,
  MapSkeleton,
  TableSkeleton,
}