import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Circle as CircleIcon, CalendarHeart, MapPin, SlidersHorizontal, ChevronDown, Info, RotateCcw, Loader2, FilterX, UserRound, Target, Clock, Heart, Calendar } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { runNmoodAI, interpretPromptToContext, buildConciergeResponse } from "@/lib/aiConcierge";
import { useAuth } from "@/lib/AuthContext";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import PeopleDiscoverySection from "@/components/concierge/PeopleDiscoverySection";
import ConciergeFilterSheet from "@/components/concierge/ConciergeFilterSheet";
import { resolveMemberPhoto } from "@/lib/member-photo";
import { resolveDisplayName, MEMBER_NAME_FALLBACK } from "@/lib/member-display";

// Concierge filter model — Interests, Goal, Circles, Availability, Age range.
// City/language were removed from this surface: location lives in search
// preferences (discovery), not the concierge. mood/intent/activity_style stay
// in context as hidden, prompt-driven signals (reply tone + light scoring)
// but are no longer manual filters.
const INITIAL_CONTEXT = {
  interests: [],
  goal: "",
  circles: [],
  availability: "",
  ageMin: null,
  ageMax: null,
  radius: null,
  mood: "",
  intent: "",
  activity_style: ""
};

// Premium, emotionally-aware framing for the curated results block.
const CURATED_HEADERS = [
  "Selected for your current energy",
  "Chosen for your mood",
  "Curated for how you feel today",
  "Tuned to your moment"
];

const PROMPT_SUGGESTIONS = [
  "Calm coffee and conversation",
  "Fun social plans tonight",
  "Meet ambitious people",
  "Something active outdoors",
  "Low-pressure meaningful connection"
];

const mapMember = (m) => ({
  id: m.id,
  user_id: m.created_by_id || "",
  created_date: m.created_date || "",
  display_name: resolveDisplayName(m) || MEMBER_NAME_FALLBACK,
  languages: Array.isArray(m.languages) ? m.languages : [],
  interests: Array.isArray(m.interests) ? m.interests : [],
  mood_tags: Array.isArray(m.mood_tags) ? m.mood_tags : [],
  intent_tags: Array.isArray(m.intent_tags) ? m.intent_tags : [],
  activity_style: m.activity_style || "",
  lifestyle: m.lifestyle || "",
  date_of_birth: m.date_of_birth || "",
  city: m.city || "",
  search_availability: Array.isArray(m.search_availability) ? m.search_availability : [],
  avatar: resolveMemberPhoto(m) || "",
  is_verified: Boolean(m.is_verified)
});

const mapCircle = (c) => ({
  id: c.id,
  name: c.name || "Circle",
  city: c.location || "",
  cover: c.cover_photo || "",
  tags: Array.isArray(c.shared_interests) ? c.shared_interests : (Array.isArray(c.tags) ? c.tags : []),
  mood_tags: Array.isArray(c.mood_tags) ? c.mood_tags : [],
  intent_tags: Array.isArray(c.intent_tags) ? c.intent_tags : []
});

const mapExperience = (e) => ({
  id: e.id,
  title: e.title || "Experience",
  city: e.location || "",
  cover: e.cover_image || "",
  tags: Array.isArray(e.tags) ? e.tags : (e.category ? [e.category] : []),
  mood_tags: Array.isArray(e.mood_tags) ? e.mood_tags : [],
  intent_tags: Array.isArray(e.intent_tags) ? e.intent_tags : [],
  activity_style: e.activity_style || ""
});

// Deduplicate member records by stable identity (email / created_by_id /
// name), preferring the record with a usable photo. See photo fix notes.
function dedupeMembers(list) {
  const seen = new Map();
  list.forEach((m) => {
    const key = (m.email && String(m.email).trim().toLowerCase())
      || (m.created_by_id && String(m.created_by_id))
      || (m.display_name && String(m.display_name).trim().toLowerCase())
      || m.id;
    const prev = seen.get(key);
    if (!prev) { seen.set(key, m); return; }
    const prevPhoto = resolveMemberPhoto(prev);
    const curPhoto = resolveMemberPhoto(m);
    if (curPhoto && !prevPhoto) seen.set(key, m);
  });
  return [...seen.values()];
}

function MatchTierPill({ score }) {
  const s = Number(score) || 0;
  const tier = s >= 50
    ? { label: "Top match", strong: true }
    : s >= 30
    ? { label: "Strong match", strong: true }
    : s >= 15
    ? { label: "Good match", strong: false }
    : { label: "Worth a look", strong: false };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-tight ${tier.strong ? "bg-primary/[0.08] text-primary ring-1 ring-primary/10" : "bg-secondary/60 text-muted-foreground/80 ring-1 ring-border/40"}`}>
      {tier.label}
    </span>
  );
}

function SummaryChip({ label, value }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.07] px-2.5 py-1 text-[11px] font-medium text-primary ring-1 ring-primary/10">
      <span className="text-primary/50">{label}</span>
      <span className="capitalize">{value}</span>
    </span>
  );
}

// Active-filter chip for the manual filter row. Empty values render as a
// muted "Any" pill so the unfiltered state reads as intentional.
function FilterChip({ icon: Icon, label, value }) {
  const empty = !value || (Array.isArray(value) && value.length === 0);
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11.5px] font-medium transition-default ${empty ? "bg-secondary/40 text-muted-foreground/55 ring-1 ring-border/20" : "bg-primary/10 text-primary ring-1 ring-primary/15"}`}>
      <Icon className="h-3 w-3 shrink-0" />
      <span className="capitalize">{empty ? label : value}</span>
    </span>
  );
}

function SectionLabel({ icon: Icon, title, count }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <h2 className="text-[13px] font-semibold tracking-tight text-foreground">{title}</h2>
      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">{count}</span>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card to-secondary/30 px-4 py-5 shadow-soft">
      <div className="pointer-events-none absolute -top-8 -right-6 h-20 w-20 rounded-full bg-primary/[0.06] blur-2xl" />
      <div className="relative flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary/70">
          <Info className="h-4 w-4" />
        </span>
        <p className="mt-0.5 text-[13px] font-light leading-relaxed text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

const WARM_FALLBACKS = [
  "Potentially aligned with your current mood",
  "A promising match for your current context",
  "Worth exploring based on your vibe today"
];

const GENERIC_REASON = /good overall fit|good fit|overall fit|^match$|no specific reason|default/i;

function splitReason(reason, name) {
  const raw = (reason || "").trim();
  const fallback = () => WARM_FALLBACKS[Array.from(name || "").reduce((a, c) => a + c.charCodeAt(0), 0) % WARM_FALLBACKS.length];
  if (!raw || GENERIC_REASON.test(raw)) return { highlight: null, supporting: fallback() };
  const parts = raw.split(/\s*•\s*/).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return { highlight: null, supporting: raw };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const [first, ...rest] = parts;
  return {
    highlight: cap(first),
    supporting: rest.length ? rest.map(cap).join(" · ") : null
  };
}

function RecoCard({ name, city, reason, score, icon: Icon, cover }) {
  const { highlight, supporting } = useMemo(() => splitReason(reason, name), [reason, name]);
  const [coverError, setCoverError] = useState(false);
  const [coverLoaded, setCoverLoaded] = useState(false);
  const showCover = Boolean(cover) && !coverError;
  return (
    <div className="pressable-card group flex overflow-hidden rounded-[20px] border border-border/40 bg-card shadow-soft transition-default hover:border-primary/20 hover:shadow-card">
      <div className="relative w-20 shrink-0 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/15">
        {showCover ? (
          <>
            {!coverLoaded && <div className="absolute inset-0 sk-shimmer" />}
            <img
              src={cover}
              alt={name}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setCoverError(true)}
              onLoad={() => setCoverLoaded(true)}
              className={`h-full w-full object-cover transition-opacity duration-500 group-hover:scale-105 ${coverLoaded ? "opacity-100" : "opacity-0"}`}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary/50">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-[14px] font-semibold tracking-tight text-foreground">{name}</h3>
          <MatchTierPill score={score} />
        </div>
        {city ? (
          <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{city}</span>
          </div>
        ) : null}
        {highlight ? (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/[0.06] px-2.5 py-1 text-[11px] font-medium text-primary ring-1 ring-primary/10">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
            <span className="truncate">{highlight}</span>
          </div>
        ) : null}
        {supporting ? (
          <p className="mt-1.5 text-[11.5px] font-light leading-snug text-muted-foreground/90">{supporting}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function AiConciergeTest() {
  const [members, setMembers] = useState([]);
  const [circles, setCircles] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { member } = useAuth();
  const [ctx, setCtx] = useState(INITIAL_CONTEXT);
  const [sheetOpen, setSheetOpen] = useState(false);
  const prefilledRef = useRef(false);
  const [prompt, setPrompt] = useState("");
  const [summary, setSummary] = useState(null);
  const [tuning, setTuning] = useState(false);
  const tuningTimer = useRef(null);

  useEffect(() => () => clearTimeout(tuningTimer.current), []);

  const updateCtx = (patch) => setCtx((prev) => ({ ...prev, ...patch }));

  // Natural-language prompt → context. The interpreter infers mood, intent,
  // activity_style, and interests from the text. Inferred interests are
  // merged into the multi-select (not replacing manual picks). The reply
  // tone adapts to the inferred mood; manual filters remain untouched.
  const handleFindMatches = () => {
    const text = prompt.trim();
    if (!text || tuning) return;
    setTuning(true);
    if (tuningTimer.current) clearTimeout(tuningTimer.current);
    tuningTimer.current = setTimeout(() => {
      const patch = interpretPromptToContext(text);
      if (patch.interests) {
        patch.interests = Array.from(new Set([...(ctx.interests || []), ...patch.interests]));
      }
      const next = { ...ctx, ...patch };
      updateCtx(patch);
      setSummary({
        mood: next.mood,
        intent: next.intent,
        activity_style: next.activity_style,
        interests: next.interests
      });
      setTuning(false);
    }, 500);
  };

  // Count of active manual filters (for the badge + summary).
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (ctx.interests.length) n++;
    if (ctx.goal) n++;
    if (ctx.circles.length) n++;
    if (ctx.availability) n++;
    if (ctx.ageMin != null || ctx.ageMax != null) n++;
    if (ctx.radius) n++;
    return n;
  }, [ctx]);

  const hasUserDefaults = Boolean(
    member && Array.isArray(member.interests) && member.interests.length
  );

  // Neutral browsing state — clears every manual filter but keeps the
  // hidden prompt-driven signals (mood/intent/activity_style) so the
  // concierge reply tone is preserved across a clear.
  const handleClearFilters = () => {
    setCtx((prev) => ({
      ...INITIAL_CONTEXT,
      mood: prev.mood,
      intent: prev.intent,
      activity_style: prev.activity_style
    }));
    setPrompt("");
    setSummary(null);
    setSheetOpen(false);
  };

  // Reset to the logged-in user's profile interests (or app defaults).
  const handleResetToDefaults = () => {
    const base = { ...INITIAL_CONTEXT };
    if (member && Array.isArray(member.interests) && member.interests.length) {
      base.interests = member.interests;
    }
    setCtx(base);
    setPrompt("");
    setSummary(null);
    setSheetOpen(false);
  };

  // Optionally hydrate interests from the logged-in user's profile. Runs
  // once when member data becomes available; manual edits afterwards win.
  useEffect(() => {
    if (prefilledRef.current || !member) return;
    prefilledRef.current = true;
    const userInterests = Array.isArray(member.interests) ? member.interests : null;
    if (userInterests && userInterests.length) {
      setCtx((prev) => ({ ...prev, interests: userInterests }));
    }
  }, [member]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [memberRes, circleRes, experienceRes] = await Promise.allSettled([
          base44.entities.Member.list("-created_date", 50),
          base44.entities.Circle.list("-created_date", 50),
          base44.entities.Experience.list("-created_date", 50)
        ]);

        if (!active) return;

        const rawMembers = memberRes.status === "fulfilled" ? (memberRes.value || []) : [];
        setMembers(dedupeMembers(rawMembers).map(mapMember));
        setCircles(circleRes.status === "fulfilled" ? (circleRes.value || []).map(mapCircle) : []);
        setExperiences(experienceRes.status === "fulfilled" ? (experienceRes.value || []).map(mapExperience) : []);
      } catch (err) {
        if (active) setError(err?.message || "Failed to load data");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const result = useMemo(() => {
    return runNmoodAI({ context: { ...ctx, userCity: member?.city }, members, circles, experiences });
  }, [ctx, members, circles, experiences, member]);

  const totalResults = result.members.length + result.circles.length + result.experiences.length;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
        <p className="text-[15px] font-semibold text-foreground">Tuning your recommendations…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Info className="h-5 w-5" />
        </div>
        <p className="text-[14px] text-foreground/80">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-5">
      {/* Hero + prompt — the main way to talk to the AI */}
      <header className="relative mb-6 overflow-hidden rounded-[24px] bg-nmood-gradient p-5 shadow-elevated">
        <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-[17px] font-bold leading-tight tracking-tight text-white">Nmood AI Concierge</h1>
            </div>
          </div>
          <h2 className="mb-1.5 font-heading text-[16px] font-medium leading-snug tracking-tight text-white/95">
            Tell me the kind of energy, people, or experience you want tonight.
          </h2>
          <p className="mb-3.5 text-[12.5px] font-light leading-relaxed text-white/70">
            The more you share, the better I can tune your matches.
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="I want something calm tonight. Maybe coffee, good conversation, and people with thoughtful energy."
            rows={4}
            className="w-full resize-none rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-[13.5px] font-light leading-relaxed text-white shadow-soft backdrop-blur-md transition-default placeholder:text-white/60 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/25"
          />
          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {PROMPT_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setPrompt(s)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[12px] font-medium text-white/85 backdrop-blur-md transition-default hover:border-white/40 hover:text-white active:scale-[0.97]"
              >
                <Sparkles className="h-3 w-3 text-white/70" />
                {s}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleFindMatches}
            disabled={!prompt.trim() || tuning}
            className="mt-3.5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-[14px] font-semibold text-primary shadow-elevated transition-default hover:bg-white/95 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
          >
            {tuning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Tuning your matches…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Show me what fits
              </>
            )}
          </button>
        </div>
      </header>

      {/* Concierge understanding — warm reply + parsed signals, shown after submit */}
      {summary && (
        <div className="mb-6 animate-fade-in-up overflow-hidden rounded-[20px] border border-border/40 bg-card p-4 shadow-card">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-nmood-cta text-primary-foreground shadow-soft">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="text-[14px] font-light leading-relaxed text-foreground/85">{buildConciergeResponse(summary)}</p>
          </div>
          <div className="mt-3.5 flex flex-wrap gap-1.5 ps-11">
            <SummaryChip label="Mood" value={summary.mood} />
            <SummaryChip label="Intent" value={summary.intent} />
            <SummaryChip label="Vibe" value={summary.activity_style} />
            {summary.interests?.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/70 px-2.5 py-1 text-[11px] font-medium text-secondary-foreground ring-1 ring-border/50">
                <span className="text-muted-foreground">Interests</span>
                <span className="capitalize">{summary.interests.join(", ")}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Filter bar — premium, mobile-first. Opens a bottom sheet; shows active filters as chips. */}
      <div className="mb-5 rounded-2xl border border-border/40 bg-card px-4 py-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-[13px] font-semibold tracking-tight text-foreground">Tune your matches</h2>
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">{activeFilterCount}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3.5 py-2 text-[11.5px] font-semibold text-foreground transition-default hover:border-primary/30 hover:bg-secondary"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full px-3 py-2 text-muted-foreground transition-default hover:bg-secondary hover:text-foreground"
                  aria-label="Reset filters"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 rounded-2xl border border-border/40 bg-popover/95 p-1.5 shadow-float backdrop-blur-xl">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-foreground transition-default hover:bg-secondary"
                >
                  <FilterX className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block">Clear filters</span>
                    <span className="block text-[11px] font-normal text-muted-foreground">Browse freely, no preferences</span>
                  </span>
                </button>
                {hasUserDefaults && (
                  <button
                    type="button"
                    onClick={handleResetToDefaults}
                    className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-foreground transition-default hover:bg-secondary"
                  >
                    <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0">
                      <span className="block">Reset to my interests</span>
                      <span className="block text-[11px] font-normal text-muted-foreground">Use your profile interests</span>
                    </span>
                  </button>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {/* Active filter chips — only non-empty manual filters render as filled; empty ones show "Any" */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <FilterChip icon={Target} label="goal" value={ctx.goal} />
          <FilterChip
            icon={Heart}
            label="interests"
            value={ctx.interests.length === 1 ? ctx.interests[0] : (ctx.interests.length > 1 ? `${ctx.interests[0]} +${ctx.interests.length - 1}` : "")}
          />
          <FilterChip
            icon={CircleIcon}
            label="circles"
            value={ctx.circles.length === 1 ? ctx.circles[0] : (ctx.circles.length > 1 ? `${ctx.circles[0]} +${ctx.circles.length - 1}` : "")}
          />
          <FilterChip icon={Clock} label="availability" value={ctx.availability} />
          <FilterChip
            icon={Calendar}
            label="age"
            value={ctx.ageMin != null || ctx.ageMax != null ? `${ctx.ageMin ?? 18}–${ctx.ageMax ?? 60}` : ""}
          />
          <FilterChip icon={MapPin} label="radius" value={ctx.radius ? `${ctx.radius} km` : ""} />
        </div>
      </div>

      <ConciergeFilterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        value={ctx}
        resultCount={totalResults}
        members={members}
        circles={circles}
        onApply={(next) => {
          setCtx((prev) => ({ ...prev, ...next }));
          setSheetOpen(false);
        }}
      />

      {/* Support-only debug strip — hidden in normal use, available via ?debug=1 */}
      {new URLSearchParams(window.location.search).get("debug") === "1" && (
        <div className="mb-3 flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground/70">
          <Info className="h-3 w-3 shrink-0" />
          <span>{members.length}m · {circles.length}c · {experiences.length}e</span>
        </div>
      )}

      {/* Premium curated-results header — frames the recommendations elegantly */}
      {summary && (
        <div className="mb-5 mt-1 flex items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border/70 to-transparent" />
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
            {CURATED_HEADERS[(summary.mood + summary.intent).length % CURATED_HEADERS.length]}
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border/70 to-transparent" />
        </div>
      )}

      {/* Recommended Members — premium discovery rail */}
      <PeopleDiscoverySection members={result.members} />

      {/* Recommended Circles */}
      <section className="mb-6">
        <SectionLabel icon={CircleIcon} title="Circles that match your energy" count={result.circles.length} />
        {result.circles.length === 0 ? (
          <EmptyState label="No circles quite match this energy yet — try a different vibe, or check back soon." />
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {result.circles.map((c) => (
              <RecoCard key={c.id} name={c.name} city={c.city} reason={c.ai_reason} score={c.ai_score} icon={CircleIcon} cover={c.cover} />
            ))}
          </div>
        )}
      </section>

      {/* Recommended Experiences */}
      <section className="mb-2">
        <SectionLabel icon={CalendarHeart} title="Experiences worth saying yes to" count={result.experiences.length} />
        {result.experiences.length === 0 ? (
          <EmptyState label="Nothing fits this exact mood yet. Try shifting your vibe and I'll look again." />
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {result.experiences.map((e) => (
              <RecoCard key={e.id} name={e.title} city={e.city} reason={e.ai_reason} score={e.ai_score} icon={CalendarHeart} cover={e.cover} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}