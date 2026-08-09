import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, ArrowRight, Sparkles } from "lucide-react";
import PersonRecoCard, { SeeMorePeopleCard } from "@/components/concierge/PersonRecoCard";

/**
 * PeopleDiscoverySection — premium, swipe-native people discovery rail.
 * Strong section identity (eyebrow + title + count + "See all"), edge-faded
 * horizontal browsing, and elegant spacing/rhythm. Cohesive with Nmood's
 * blue/purple visual language.
 */
export default function PeopleDiscoverySection({ members }) {
  const navigate = useNavigate();
  const count = Array.isArray(members) ? members.length : 0;

  return (
    <section className="mb-7">
      {/* Premium section header */}
      <div className="mb-4 flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <Users className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/70">Curated for you</span>
          </div>
          <h2 className="font-heading text-[17px] font-bold tracking-tight text-foreground">
            People you might vibe with
            {count > 0 && (
              <span className="ms-2 align-middle text-[13px] font-medium tabular-nums text-muted-foreground">{count}</span>
            )}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => navigate("/discover-people")}
          className="group inline-flex shrink-0 items-center gap-1 rounded-full py-1 text-[12px] font-semibold text-primary transition-default hover:gap-1.5"
        >
          See all
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Discovery rail */}
      {count === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card to-secondary/20 px-5 py-6 shadow-soft">
          <div className="nmood-empty-glow pointer-events-none absolute -top-10 -right-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" aria-hidden="true" />
          <div className="relative flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary/70 ring-1 ring-primary/10">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="mt-1 text-[13px] font-light leading-relaxed text-muted-foreground">
              I haven't found the right people for this mood yet — but new members arrive all the time. Try a different vibe and I'll look again.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative -mx-4">
          {/* Edge fades — imply more to browse, soften the carousel edge */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-6 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-6 bg-gradient-to-l from-background to-transparent" />
          <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4 pb-2 momentum-scroll">
            {members.slice(0, 5).map((m) => (
              <PersonRecoCard key={m.id} member={m} />
            ))}
            <SeeMorePeopleCard />
          </div>
        </div>
      )}
    </section>
  );
}