import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Sparkles, ArrowRight } from "lucide-react";
import { resolveMemberPhoto } from "@/lib/member-photo";
import { memberSubtitle } from "@/lib/member-display";

// Qualitative match tier from the raw AI score — keeps the card feeling
// curated rather than numeric.
function tierFor(score) {
  const s = Number(score) || 0;
  if (s >= 50) return { label: "In sync", strong: true };
  if (s >= 30) return { label: "Great match", strong: true };
  if (s >= 15) return { label: "Promising", strong: false };
  return { label: "Worth meeting", strong: false };
}

// Pull the single strongest matching factor (first segment before "•") so
// the card leads with one clean, curated reason instead of a raw list.
function firstReason(reason) {
  const raw = String(reason || "").trim();
  if (!raw) return "";
  const first = raw.split(/\s*•\s*/)[0].trim();
  if (!first) return raw;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

const CARD_WIDTH = "w-[248px]";

/**
 * PersonRecoCard — premium, swipe-style profile discovery card.
 * Full-bleed portrait photo dominates the card; name, city, match tier,
 * and an optional one-line AI reason float over a soft bottom scrim.
 * Faces are framed toward the upper third to reduce awkward cropping.
 * Tapping the card opens the member's profile via /pal/:userId when a
 * user id is available; otherwise it is presentational only.
 */
export default function PersonRecoCard({ member }) {
  const navigate = useNavigate();
  const { display_name, ai_reason, ai_score, user_id, languages } = member;
  const photo = resolveMemberPhoto(member);
  const tier = tierFor(ai_score);
  const reason = firstReason(ai_reason);
  const clickable = Boolean(user_id);
  const initial = (display_name || "M").charAt(0).toUpperCase();
  const [imgError, setImgError] = useState(false);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const hasPhoto = Boolean(photo) && !imgError;

  const go = () => {
    if (!clickable) return;
    console.debug('[nav] PersonReco card tap → /pal/:id', { entityId: member.id, userId: user_id, name: display_name });
    navigate(`/pal/${member.id}`);
  };

  return (
    <button
      type="button"
      onClick={go}
      disabled={!clickable}
      className={`group relative flex ${CARD_WIDTH} shrink-0 snap-start flex-col overflow-hidden rounded-[28px] bg-card text-start shadow-card transition-default hover:shadow-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-default`}
    >
      {/* Full-bleed photo region — dominant, portrait-framed */}
      <div className="relative h-[340px] w-full overflow-hidden bg-muted/40">
        {hasPhoto ? (
          <>
            {!photoLoaded && <div className="absolute inset-0 shimmer" aria-hidden="true" />}
            <img
              key={`${photo}-${attempt}`}
              src={photo}
              alt={display_name}
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
              onError={() => { if (attempt < 1) setAttempt((a) => a + 1); else setImgError(true); }}
              onLoad={() => setPhotoLoaded(true)}
              className={`h-full w-full object-cover object-[center_25%] transition-all duration-700 ease-out group-hover:scale-[1.06] ${photoLoaded ? "opacity-100 blur-0" : "opacity-0 blur-xl"}`}
            />
          </>
        ) : (
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-nmood-gradient">
            <div className="pointer-events-none absolute -top-10 -right-8 h-28 w-28 rounded-full bg-white/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-accent/30 blur-3xl" />
            <span className="relative font-heading text-[3.5rem] font-bold leading-none text-white drop-shadow-sm">{initial}</span>
          </div>
        )}

        {/* Top fade for tag legibility */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent" />
        {/* Bottom scrim — rich, for clean name readability */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Match tier — subtle pill, top-right */}
        <span className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-tight backdrop-blur-md ${tier.strong ? "bg-white/90 text-primary ring-1 ring-primary/20" : "bg-black/30 text-white/90 ring-1 ring-white/15"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${tier.strong ? "bg-primary" : "bg-white/70"}`} />
          {tier.label}
        </span>

        {/* Identity + reason overlaid on the bottom scrim */}
        <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
          {Array.isArray(languages) && languages.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {languages.slice(0, 2).map((l) => (
                <span key={l} className="inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/90 ring-1 ring-white/20 backdrop-blur-sm capitalize">{l}</span>
              ))}
            </div>
          )}
          <h3 className="truncate text-[17px] font-bold tracking-tight text-white drop-shadow-md">{display_name}</h3>
          {(() => {
            const sub = memberSubtitle(member);
            if (!sub) return null;
            if (sub.kind === "new") {
              return (
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/90 ring-1 ring-white/20 backdrop-blur-sm">
                  <Sparkles className="h-2.5 w-2.5 shrink-0" />
                  New member
                </div>
              );
            }
            return (
              <div className="mt-1 flex items-center gap-1 text-[12px] font-medium text-white/85">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{sub.label}</span>
              </div>
            );
          })()}
          {reason ? (
            <div className="mt-1.5 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 shrink-0 text-white/60" />
              <p className="line-clamp-1 text-[11.5px] font-light leading-snug text-white/85">{reason}</p>
            </div>
          ) : null}
          <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-white/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/85 ring-1 ring-white/15 backdrop-blur-sm transition-transform duration-200 group-hover:translate-x-0.5">
            View profile
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </button>
  );
}

/**
 * SeeMorePeopleCard — trailing "See more" tile that closes the horizontal
 * row and routes to the full people discovery experience.
 */
export function SeeMorePeopleCard() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate("/discover-people")}
      className={`group flex ${CARD_WIDTH} shrink-0 snap-start flex-col items-center justify-center gap-2.5 rounded-[28px] border border-dashed border-border/60 bg-secondary/30 px-4 py-10 text-center transition-default hover:border-primary/30 hover:bg-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
        <Sparkles className="h-5 w-5" />
      </span>
      <span className="text-[13px] font-semibold text-foreground">See more people</span>
      <span className="text-[11px] font-light leading-tight text-muted-foreground">Browse everyone on Nmood</span>
    </button>
  );
}