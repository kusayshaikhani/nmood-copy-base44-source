# Nmood Localization Development Guide

**Official localization standard for the Nmood platform.**
Established under **MP-004A — Permanent Localization Engineering Standard.**

Localization is not a feature. It is part of the platform architecture. Every
current and future module — Mobile App, Web App, Founder Console, Mission
Control, Admin Console, AI surfaces, emails, notifications, and legal
documents — must follow this guide.

---

## 1. The Centralized Localization Service

All user-facing text must be produced through the centralized Localization
Service. There is one service, one source of truth.

### 1.1 Use the hook in any React component

```jsx
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function MyComponent() {
  const { t, dir, lang, formatDate, formatNumber } = useLocalization();

  return (
    <button aria-label={t('common.save')}>
      {t('common.save')}
    </button>
  );
}
```

- `t(key, vars)` — translate a key, with optional interpolation variables.
- `dir` — always `'ltr'` in Release 1.0 (LTR-only).
- `formatDate`, `formatTime`, `formatNumber`, `formatCurrency` — locale-aware
  formatting via `Intl`. Never hand-format dates/numbers/currencies.

### 1.2 Outside React (backend functions, emails, notifications)

Backend and non-React code must not hardcode user-facing text either. Store
language-independent canonical values (see §7) and resolve localized strings
at the presentation edge. Where a backend function must emit text (e.g. an
email body), read the relevant translation resource for the recipient's
language and interpolate — never embed a literal English sentence in code.

---

## 2. Naming Conventions & Namespaces

### 2.1 Flat dotted keys

Keys are flat, dot-separated, lowercase strings grouped into namespaces.

```
common.save
auth.login.title
onboarding.step.profile.heading
onboarding.interest.sports
settings.privacy.visibility_title
```

### 2.2 Namespace rules

| Namespace      | Scope                                                       |
| -------------- | ----------------------------------------------------------- |
| `common.*`     | Globally reused UI words (save, cancel, continue, back, loading) |
| `auth.*`       | Authentication flows (login, register, reset, verify)      |
| `onboarding.*` | Onboarding wizard steps and reference data                  |
| `home.*`       | Home dashboard                                              |
| `settings.*`   | Settings screens                                            |
| `profile.*`    | Member profile                                              |
| `nav.*`        | Navigation labels                                           |
| `safety.*`     | Safety center & reporting                                   |
| `ai.*`         | AI-generated surfaces (chips, explanations, disclaimers)    |
| `email.*`      | Email templates                                            |
| `notif.*`      | Push / system notifications                                 |
| `legal.*`      | Legal documents (Terms, Privacy)                           |

When you add a module, choose a namespace and document it here.

### 2.3 Key naming rules

- `snake_case` within a key segment: `visibility_title`, not `visibilityTitle`.
- Be descriptive: `auth.login.email_label` not `auth.login.e`.
- Group related keys under a shared prefix: `onboarding.location.heading`,
  `onboarding.location.enable`, `onboarding.location.later`.
- **Reuse existing keys whenever possible.** Before adding a new key, search
  the English dictionary for an existing equivalent (e.g. reuse
  `common.continue` instead of creating `myModule.next`).

The `common.*` and `nav.*` namespaces form the **shared base vocabulary** —
intentionally pre-seeded for reuse across every module. They are exempt from
the unused-key gate (they are the reusable word set, not dead keys). When you
localize a module, prefer reusing a shared base key over minting a new one.

A namespace actively seeded for the immediate next localization phase is
listed in `PLANNED_NAMESPACES` in `governance.cjs` (currently `home`, the seed
for MP-005). Its keys are reported as "planned" rather than failed; remove the
namespace from that set once the module ships and all keys are referenced.

---

## 3. Interpolation Standards

Inject variables with `{varName}` placeholders and pass them as the second
argument to `t()`.

```js
// resource
'greeting.hello_name': 'Hello, {name}!'

// usage
t('greeting.hello_name', { name: 'Aisha' })
```

Rules:
- Placeholder names are valid identifiers: letters, digits, underscore; must
  not start with a digit. `{name}`, `{count}`, `{pal_name}` are valid; `{1x}`,
  `{foo bar}`, `{}` are **invalid** and will fail validation.
- Every `{var}` in a value should have a matching key passed at the call site.
- Do not concatenate translated fragments — reorder via placeholders so each
  language controls its own word order:

```js
// GOOD — each language reorders freely
'invite.sent_you': '{sender} sent you an invitation'
// ar: 'أرسل لك {sender} دعوة'

// BAD — concatenation breaks word order across languages
sentence = t('invite.sender') + ' ' + t('invite.action')
```

---

## 4. ICU Pluralization

Use ICU-style plural syntax for any count-dependent string. The plural engine
uses `Intl.PluralRules`, so every language gets correct agreement
automatically.

```js
// one / other (English, Spanish, French, German, Italian)
'circle.members': '{count, plural, one{# member} other{# members}}'

// Russian uses one / few / many / other
'circle.members': '{count, plural, one{# участник} few{# участника} many{# участников} other{# участников}}'

```

Rules:
- `#` inside a branch renders the count.
- Every plural **must include an `other` branch** — validation fails without it.
- Only valid categories: `zero, one, two, few, many, other`.
- Branch bodies must not contain nested braces.
- Plurals run before ordinary `{var}` interpolation, so keep branch bodies
  brace-free.

Usage:
```js
t('circle.members', { count: 3 })
```

---

## 5. Layout (LTR-Only)

Release 1.0 supports Left-to-Right (LTR) languages only. RTL and BiDi support
have been removed. Use logical Tailwind classes (`ms-`, `me-`, `ps-`, `pe-`,
`start-`, `end-`, `text-start`, `text-end`, `rounded-s`, `rounded-e`) for
clean, maintainable spacing — they resolve to physical left/right in LTR.

---

## 6. Accessibility Requirements

Localization changes must not reduce accessibility.

- Every icon-only button gets a localized `aria-label`.
- Images use a localized `alt` (or `alt=""` for purely decorative images).
- Form inputs keep `<Label htmlFor>` / `<Input id>` pairings — only the
  display text is swapped for `t()`.
- Do not rely on color alone to convey meaning.

---

## 7. Canonical Data Rules

Backend data must remain **language-independent**. Localization occurs only
in the presentation layer.

- Store raw codes/enums, not translated values: store `gender: 'female'`, not
  `gender: 'Female'`; store `country: 'AE'`, not `country: 'United Arab
  Emirates'`.
- Render localized labels at the UI via reference-data helpers:
  - Country names → `Intl.DisplayNames` (`src/lib/i18n/display-names.js`).
  - Language names → endonyms (`LANGUAGE_NATIVE_NAMES`).
  - Enums (gender, lifestyle, status) → translation keys.
- Never store translated strings in entity fields. A member's `bio` is
  user-authored content and is shown verbatim — but any system label describing
  it is localized at render time.

---

## 8. AI Localization

Every AI-generated user interface element must use localization. This
includes:

- Suggestion chips and quick-action buttons
- Helper text and AI explanations
- Loading messages (`shared.loading`, `ai.thinking`)
- Disclaimers and safety notices
- Generated summaries and empty states

Pattern: the AI returns structured, language-independent data; the UI maps it
to localized keys at render time. Never display a raw English string returned
by a model — wrap it in `t()` or map it to a key.

---

## 9. Emails & Notifications

Every email, push notification, system notification, reminder, and
announcement must be built from localization resources for the recipient's
language. Use the `email.*`, `notif.*` namespaces. Resolve the recipient's
language from their `app_language` preference (User entity) and format with
the centralized `Intl` helpers.

---

## 10. Legal Content

Legal documents (Terms, Privacy Policy) live under `legal.*`. Every future
legal document must support localization through this framework. If a
localized version is unavailable for a language, display the approved
fallback notice (English version + a localized banner stating the content is
shown in English) — never silently show English as if it were the member's
language.

---

## 11. Definition of Done — Localization Quality Gate

A feature is **not complete** until all of the following pass:

- [ ] Zero hardcoded user-facing strings in the module
- [ ] Zero missing translation keys (all 6 languages)
- [ ] Zero duplicate keys
- [ ] Zero accessibility regressions related to localization

Verify with the governance scanner before marking a module done:

```bash
node src/lib/i18n/governance.cjs
```

The command exits non-zero if any rule fails. Run it before every release and
in CI. The in-browser dev validator (`src/lib/i18n/validate.js`) also runs
automatically on import and warns in the console.

---

## 12. How to Localize a New Module — Step by Step

1. **Choose a namespace** and add keys to all 6 translation files
   (`src/lib/i18n/translations/{en,es,fr,de,it,ru}.js`). Every key must
   exist in every file — no silent fallback.
2. **Wire the hook**: `const { t } = useLocalization();`
3. **Replace** every literal user-facing string with `t('ns.key')`.
4. **Use logical Tailwind classes** (`ms-`, `me-`, `start-`, `end-`,
   `text-start`, `rounded-s/e-`).
5. **Add localized `aria-label`/`alt`** for icon buttons and images.
6. **Add the module's files** to `LOCALIZED_MODULES` in
   `src/lib/i18n/governance.cjs` so the hardcoded-string gate covers them.
7. **Run** `node src/lib/i18n/governance.cjs` — it must pass with zero errors.
8. **Visually verify** in at least two languages.
9. **Update** the namespace table in §2.2 of this guide.

---

## 13. Common Mistakes

| Mistake                                                      | Fix                                                         |
| ------------------------------------------------------------ | ----------------------------------------------------------- |
| Hardcoding `"Continue"` in JSX                               | Use `t('common.continue')`                                  |
| Creating `home.next` when `common.continue` exists            | Reuse `common.continue`                                     |
| Storing `country: 'France'` in the DB                        | Store `country: 'FR'`; localize via `Intl.DisplayNames`       |
| Plural without `other` branch                                | Always include `other`                                      |
| Concatenating translated fragments                           | Use one key with `{placeholders}` for word-order freedom     |
| Forgetting a key in one language                             | Add it to all 7 files; the validator catches parity gaps     |
| Adding a key but no `t()` call site                          | Remove unused keys or wire them up; unused keys fail the gate |
| Embedding an English sentence in a backend function         | Read the translation resource for the recipient's language  |

---

## 14. Correct Implementation Examples

### 14.1 A localized button with interpolation

```jsx
import { useLocalization } from '@/lib/i18n/useLocalization';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function SaveButton({ saving, count }) {
  const { t } = useLocalization();
  return (
    <Button disabled={saving} aria-label={t('common.save')}>
      {saving
        ? <><Loader2 className="w-4 h-4 me-2 animate-spin" />{t('common.saving')}</>
        : t('common.save_count', { count })}
    </Button>
  );
}
// en: 'common.save_count': '{count, plural, one{Save # item} other{Save # items}}'
// ru: 'common.save_count': '{count, plural, one{Сохранить # элемент} few{Сохранить # элемента} many{Сохранить # элементов} other{Сохранить # элементов}}'
```

### 14.2 A localized field

```jsx
import { useLocalization } from '@/lib/i18n/useLocalization';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

export default function SearchField({ value, onChange }) {
  const { t } = useLocalization();
  return (
    <div>
      <Label htmlFor="q">{t('common.search')}</Label>
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="q"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('common.search_placeholder')}
          className="ps-10"
        />
      </div>
    </div>
  );
}
```

### 14.3 Canonical data → localized label

```js
// store
await base44.entities.Member.create({ country: 'FR', gender: 'female' });

// render
import { countryNameByCode } from '@/lib/i18n/display-names';
import { useLocalization } from '@/lib/i18n/useLocalization';
// inside a component:
const { t, lang } = useLocalization();
<span>{countryNameByCode(lang, member.country)}</span>
<span>{t(`profile.gender.${member.gender}`)}</span>
```

---

## 15. Supported Languages

English, Spanish, French, German, Italian, Russian.

Metadata and the supported-language registry live in
`src/lib/i18n/languages.js`. Translation resources live in
`src/lib/i18n/translations/`. Adding a future language requires: an entry in
`languages.js`, a new translation file, registration in
`translations/index.js`, and translations for every existing key.

---

*This guide is the official localization standard for Nmood. It is enforced
by the governance scanner (`src/lib/i18n/governance.cjs`) and the runtime
validator (`src/lib/i18n/validate.js`).*