import React, { useEffect, useMemo, useState } from "react";
import { Target, Heart, Circle as CircleIcon, Clock, Calendar, MapPin, Check, FilterX } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { buildConciergeFilterOptions } from "@/lib/concierge-filter-options";

// Premium, mobile-first filter sheet for the AI Concierge. Filter options
// are data-driven: buildConciergeFilterOptions() promotes real,
// frequency-sorted values from loaded data above seeded fallbacks, so the
// vocabulary evolves with the community instead of staying hardcoded.
// Every field is optional; users can browse with zero or few filters.
// Local draft state is applied on "Show results".

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold tracking-tight transition-default active:scale-[0.97] ${active ? "bg-nmood-cta text-primary-foreground shadow-soft" : "bg-secondary/60 text-secondary-foreground ring-1 ring-border/40 hover:border-primary/30 hover:bg-secondary"}`}
    >
      {children}
    </button>
  );
}

function Section({ icon: Icon, title, hint, children }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold tracking-tight text-foreground">{title}</p>
          {hint ? <p className="text-[11px] font-light text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

const FULL_RANGE = [18, 60];

export default function ConciergeFilterSheet({ open, onOpenChange, value, onApply, resultCount, members, circles }) {
  const [local, setLocal] = useState(value);
  const [ageRange, setAgeRange] = useState([value?.ageMin ?? 18, value?.ageMax ?? 60]);

  // Data-driven options: real values from loaded data first, seeded fallbacks
  // fill the rest. Rebuilds when the underlying data changes.
  const options = useMemo(
    () => buildConciergeFilterOptions({ members, circles }),
    [members, circles]
  );

  // Sync local draft from the live context each time the sheet opens.
  useEffect(() => {
    if (open) {
      setLocal(value);
      setAgeRange([value?.ageMin ?? 18, value?.ageMax ?? 60]);
    }
  }, [open, value]);

  const toggleArray = (key, item) => {
    setLocal((prev) => {
      const arr = Array.isArray(prev[key]) ? prev[key] : [];
      const has = arr.includes(item);
      return { ...prev, [key]: has ? arr.filter((x) => x !== item) : [...arr, item] };
    });
  };

  const toggleSingle = (key, val) => {
    setLocal((prev) => ({ ...prev, [key]: prev[key] === val ? "" : val }));
  };

  const setRadius = (val) => {
    setLocal((prev) => ({ ...prev, radius: prev.radius === val ? null : val }));
  };

  const handleClear = () => {
    setLocal({
      interests: [],
      goal: "",
      circles: [],
      availability: "",
      ageMin: null,
      ageMax: null,
      radius: null,
      // preserve hidden prompt-driven signals
      mood: value?.mood || "",
      intent: value?.intent || "",
      activity_style: value?.activity_style || ""
    });
    setAgeRange(FULL_RANGE);
  };

  const handleApply = () => {
    const ageIsFull = ageRange[0] === 18 && ageRange[1] === 60;
    onApply({
      ...local,
      ageMin: ageIsFull ? null : ageRange[0],
      ageMax: ageIsFull ? null : ageRange[1]
    });
  };

  const activeCount =
    (Array.isArray(local.interests) && local.interests.length ? 1 : 0) +
    (local.goal ? 1 : 0) +
    (Array.isArray(local.circles) && local.circles.length ? 1 : 0) +
    (local.availability ? 1 : 0) +
    (ageRange[0] !== 18 || ageRange[1] !== 60 ? 1 : 0) +
    (local.radius ? 1 : 0);

  const radiusLabel = local.radius ? `${local.radius} km` : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[28px] pb-[env(safe-area-inset-bottom)] max-h-[92vh] overflow-y-auto no-scrollbar">
        <div className="mx-auto w-10 h-1.5 rounded-full bg-muted mb-4" />
        <SheetHeader className="mb-5 px-1 text-left">
          <SheetTitle className="flex items-center gap-2 text-[17px]">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Target className="h-4 w-4" />
            </span>
            Filters
            {activeCount > 0 ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">{activeCount}</span>
            ) : null}
          </SheetTitle>
          <SheetDescription className="text-[12.5px]">Choose what matters — leave the rest open.</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-1">
          <Section icon={Target} title="Goal" hint="What you're hoping for">
            <div className="flex flex-wrap gap-2">
              {options.goals.map((g) => (
                <Chip key={g} active={local.goal === g} onClick={() => toggleSingle("goal", g)}>{g}</Chip>
              ))}
            </div>
          </Section>

          <Section icon={Heart} title="Interests" hint="Pick a few you love">
            <div className="flex flex-wrap gap-2">
              {options.interests.map((i) => (
                <Chip key={i} active={Array.isArray(local.interests) && local.interests.includes(i)} onClick={() => toggleArray("interests", i)}>{i}</Chip>
              ))}
            </div>
          </Section>

          <Section icon={CircleIcon} title="Circles" hint="Vibes you're drawn to">
            <div className="flex flex-wrap gap-2">
              {options.circles.map((c) => (
                <Chip key={c} active={Array.isArray(local.circles) && local.circles.includes(c)} onClick={() => toggleArray("circles", c)}>{c}</Chip>
              ))}
            </div>
          </Section>

          <Section icon={Clock} title="Availability" hint="When you're free">
            <div className="flex flex-wrap gap-2">
              {options.availability.map((a) => (
                <Chip key={a} active={local.availability === a} onClick={() => toggleSingle("availability", a)}>{a}</Chip>
              ))}
            </div>
          </Section>

          <Section icon={MapPin} title="Radius" hint={radiusLabel ? `Within ${radiusLabel}` : "How far you'll go"}>
            <div className="flex flex-wrap gap-2">
              {options.radius.map((r) => (
                <Chip key={r.value} active={local.radius === r.value} onClick={() => setRadius(r.value)}>{r.label}</Chip>
              ))}
            </div>
          </Section>

          <Section icon={Calendar} title="Age range" hint={`${ageRange[0]} – ${ageRange[1]} years`}>
            <Slider value={ageRange} onValueChange={setAgeRange} min={18} max={60} step={1} className="w-full" />
          </Section>
        </div>

        <SheetFooter className="mt-7 flex-row gap-2 px-1">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border/60 bg-card px-4 py-3 text-[13px] font-semibold text-foreground transition-default hover:bg-secondary"
          >
            <FilterX className="h-4 w-4" /> Clear all
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-nmood-cta px-4 py-3 text-[13px] font-semibold text-primary-foreground shadow-card transition-default hover:shadow-elevated"
          >
            <Check className="h-4 w-4" /> Show {resultCount != null ? resultCount : ""} results
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}