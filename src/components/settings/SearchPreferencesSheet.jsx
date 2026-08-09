import React, { useEffect, useState } from "react";
import { Radar, MapPin, Globe, Heart, Check, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { updateMemberProfile } from "@/lib/member-update";
import { filterOptions } from "@/lib/matchmaker-data";
import { COUNTRIES } from "@/lib/master-data/countries";

// Persistent, profile-based location & language preferences. These shape
// discovery long-term (country, radius, discovery scope, languages) and live
// here rather than on the lightweight Discovery filter surface. Saved to
// the Member entity so they survive across sessions and devices.

const SCOPES = [
  { key: "nearby", label: "Nearby", hint: "Same city" },
  { key: "same_country", label: "Same country", hint: "Within your country" },
  { key: "anywhere", label: "Anywhere", hint: "No location limit" }
];

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

const selectClass =
  "w-full h-10 rounded-button border border-border/40 bg-card/60 px-3 text-[13px] font-medium text-foreground shadow-soft transition-default focus:outline-none focus:ring-2 focus:ring-primary/20 capitalize";

export default function SearchPreferencesSheet({ open, onOpenChange }) {
  const { member, refreshMember } = useAuth();
  const [scope, setScope] = useState("anywhere");
  const [country, setCountry] = useState("");
  const [radius, setRadius] = useState(50);
  const [languages, setLanguages] = useState([]);
  const [saving, setSaving] = useState(false);

  // Hydrate from the member profile each time the sheet opens.
  useEffect(() => {
    if (open && member) {
      setScope(member.discovery_scope || "anywhere");
      setCountry(member.search_country || member.country || "");
      setRadius(member.search_radius ?? 50);
      setLanguages(Array.isArray(member.search_languages) ? member.search_languages : []);
    }
  }, [open, member]);

  const toggleArray = (setter, arr, item) => {
    setter(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  };

  const handleSave = async () => {
    if (!member?.id) { onOpenChange(false); return; }
    setSaving(true);
    try {
      await updateMemberProfile({
        discovery_scope: scope,
        search_country: scope === "same_country" ? country : "",
        search_radius: radius,
        search_languages: languages
      });
      await refreshMember();
      onOpenChange(false);
    } catch {
      // ignore — user can retry
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[28px] pb-[env(safe-area-inset-bottom)] max-h-[92vh] overflow-y-auto no-scrollbar">
        <div className="mx-auto w-10 h-1.5 rounded-full bg-muted mb-4" />
        <SheetHeader className="mb-5 px-1 text-left">
          <SheetTitle className="flex items-center gap-2 text-[17px]">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Radar className="h-4 w-4" />
            </span>
            Search preferences
          </SheetTitle>
          <SheetDescription className="text-[12.5px]">These shape who you discover. Saved to your profile.</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-1">
          <Section icon={MapPin} title="Discovery scope" hint="Where to look for people">
            <div className="grid grid-cols-3 gap-2">
              {SCOPES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setScope(s.key)}
                  className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center transition-default active:scale-[0.97] ${scope === s.key ? "bg-nmood-cta text-primary-foreground shadow-soft" : "bg-secondary/60 text-secondary-foreground ring-1 ring-border/40 hover:bg-secondary"}`}
                >
                  <span className="text-[12.5px] font-semibold leading-tight">{s.label}</span>
                  <span className={`text-[10px] font-light leading-tight ${scope === s.key ? "text-white/80" : "text-muted-foreground"}`}>{s.hint}</span>
                </button>
              ))}
            </div>
          </Section>

          {scope === "same_country" && (
            <Section icon={Globe} title="Country" hint="Search within this country">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={selectClass}
              >
                <option value="">Any country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </Section>
          )}

          {scope === "nearby" && (
            <Section icon={MapPin} title="Radius" hint={`${radius} km from you`}>
              <Slider value={[radius]} onValueChange={(v) => setRadius(v[0])} min={5} max={200} step={5} className="w-full" />
              <p className="mt-1.5 text-[10.5px] font-light text-muted-foreground/80">Nearby uses your city until precise location is available.</p>
            </Section>
          )}

          <Section icon={Heart} title="Languages" hint="Optional — people who speak these">
            <div className="flex flex-wrap gap-2">
              {filterOptions.languages.map((l) => (
                <Chip key={l} active={languages.includes(l)} onClick={() => toggleArray(setLanguages, languages, l)}>{l}</Chip>
              ))}
            </div>
          </Section>
        </div>

        <SheetFooter className="mt-7 flex-row gap-2 px-1">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border/60 bg-card px-4 py-3 text-[13px] font-semibold text-foreground transition-default hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-nmood-cta px-4 py-3 text-[13px] font-semibold text-primary-foreground shadow-card transition-default hover:shadow-elevated disabled:opacity-60"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              <><Check className="h-4 w-4" /> Save preferences</>
            )}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}