# Handoff: Typpo Marketing Landing Page

## Overview
A single-page marketing landing page for **Typpo** — an iOS app that turns talking into
finished, word-by-word captioned videos, plus a pro layer where designers build reusable
templates in Figma. The page leads with the mobile "talk → designed video" magic and gives
the Figma plugin its own distinct section. Two CTAs run throughout: **Download on the App
Store** (primary) and **Get the Figma plugin** (secondary).

Company: **BeatPitch Inc., Santa Monica, CA.** Brand line: *"typpo records it."*

## About the Design Files
The files in this bundle are **design references created in HTML** — a prototype showing the
intended look and behavior, **not production code to copy directly**. The task is to
**recreate this design in your target codebase** (React/Next, Vue, Astro, plain HTML, etc.)
using its established patterns, component library, and conventions. If no environment exists
yet, pick the most appropriate framework and implement there.

`typpo-landing.standalone.html` is a fully self-contained, offline-openable copy — open it in
a browser to see the live design, animations, and responsive behavior. `source/` contains the
authoring files (see **Files** below).

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, radii, and interactions are all
specified below and should be recreated faithfully. Media (phone clips, Figma handoff visual)
are intentional **placeholders** — see **Assets**.

---

## Design Tokens

### Color
| Token | Hex | Use |
|---|---|---|
| Page background | `#FFFFFF` | Body background (light palette) |
| Off-white band | `#F6F4F0` | Hook card, Figma band, social-proof card, footer |
| Off-white band 2 | `#FBFAF8` | Final CTA band |
| Ink (text) | `#1A1A18` | Headlines, primary text |
| Body text | `#56554E` | Paragraphs / ledes |
| Muted text | `#6E6D64` | Nav links, footer links |
| Faint text | `#8B8B80` | Captions, meta |
| Faintest | `#A4A496` | Footer eyebrows / fine print |
| Salmon (accent) | `#EE7F7B` | CTAs, eyebrows, highlights, caption word-highlight |
| Salmon (text on white) | `#D65F5B` | Eyebrow labels that need AA contrast on white |
| Green (confirm) | `#047857` | Step 3 accent, Figma checkmarks |
| Record red | `#FF0404` | Live "rec" dot only |
| Card border | `#EDEAE3` | Card / divider borders |
| Card border 2 | `#E4E1DB` | Button borders, phone bezel ring |
| Phone/clip bg | `#0a0a0b` | Dark media regions & phone screens |
| Dark button | `#1A1A18` | Figma-band primary button |
| App Store badge | `#000000` | Official App Store button background |

Dark-clip accents (sample gallery): mint `#ACE9ED`, orchid `#DA70D6`, blue `#1ABCFE`,
yolk `#FED916`, green `#0ACF83`.

Hero salmon radial glow: `radial-gradient(circle, rgba(238,127,123,.85), rgba(238,127,123,.25) 34%, transparent 66%)` at ~16–20% opacity, blurred.

### Typography
- **Major Mono Display** (400) — wordmark, all big hero/section headlines, step numbers,
  stat numerals. Rendered **lowercase**, letter-spacing `.01em`–`.02em`. Techy, spaced.
- **Montserrat** — everything else. 900/800/700 for headings & buttons, 400/500 for body.
- Google Fonts equivalents exist; this build uses local TTFs (`source/fonts/`).

Type scale (clamp, min→max):
- Hero H1: `clamp(38px, 7.6vw, 74px)` / line-height 1.02 (Major Mono)
- Section H2: `clamp(28px, 4.6vw, 46px)` (Major Mono)
- Figma-band H2: `clamp(30px, 5vw, 52px)`
- Final-CTA H2: `clamp(38px, 8vw, 86px)`
- Eyebrow: 12px, weight 700, letter-spacing `.18em`, uppercase
- Card title (H3): 18–20px, weight 800
- Body: `clamp(15px, 2vw, 19px)`, line-height 1.6, weight 500

### Spacing & layout
- Content max-width: `1180px`, centered.
- Section horizontal padding: `clamp(18px, 5vw, 40px)`.
- Section vertical rhythm: `clamp(48px, 7vw, 100px)`.
- Card grids: `repeat(auto-fit, minmax(250px, 1fr))`, gap `18px`.
- Mobile-first; fully responsive down to 360px.

### Radii
- Cards: `22px` (feature/step), `24px` (social-proof), `20px` (why-typpo)
- Buttons: pill `99px` (salmon CTAs, chips); `9px` (App Store badge + Figma buttons, 56px tall)
- Media clip corners: inherit card `22px` (clipped by `overflow:hidden` on the card)

### Shadows
- Cards: `0 16px 40px -24px rgba(28,24,20,.22)` (soft, low)
- Phone frames: `0 44px 90px -30px rgba(28,24,20,.5)` + `0 0 0 1px #E4E1DB`
- Salmon CTA: `0 16px 34px -12px rgba(238,127,123,.6)`

---

## Screens / Sections (in order)

1. **Nav** (sticky, blurred `rgba(255,255,255,.78)`, 1px bottom border `#EDEAE3`) —
   `typpo` wordmark (Major Mono) left; links "how it works · figma plugin · download" (muted);
   salmon pill "get typpo" right.

2. **Hero** — eyebrow "powered by your voice" (with red rec dot); H1 *"create videos as you
   speak."* (Major Mono, "speak." in salmon); lede; dual CTA (black App Store badge + white
   Figma button, both 56px/9px radius); star + "loved by creators" line. Right: a dark 9:16
   **phone frame** with an **animated word-by-word caption demo** (see Interactions) and a
   looping progress bar. Salmon radial glow behind, pulsing.

3. **Hook card** (off-white) — Major Mono: *"no design skills? no problem. no time to type?
   no problem."* with salmon "no problem." + one-line subcopy.

4. **How it works** — 3 cards. Each card: `overflow:hidden`, dark **media region at the top**
   (top-clipped, `clamp(230px,30vw,290px)` tall, bg `#0a0a0b`) holding a `<media-slot>`
   upload placeholder, a numbered pill badge overlaid top-left, then title + description below.
   - 01 **pick a look** — clip bottom-anchored, 15% side gutters (`left:15%;width:70%`), crop `50% 100%`.
   - 02 **enter your script** — clip top-anchored, full width, crop `50% 0%`.
   - 03 **render & share** — clip `fit:contain` (whole phone), full width, badge number in green.

5. **Show the output** — horizontal scroll-snap **carousel** of 5 vertical 9:16 sample clips
   in dark phone-style cards (minimalist / neon vibes / gradient pop / lifestyle / big type),
   each with a caption below. Prev/next circular buttons scroll the row. Float animations.

6. **Figma band** (off-white, purple radial glow) — eyebrow "for designers & brands" with the
   real multi-color Figma logo; H2 *"design once. reuse forever."*; explainer naming the free
   **Typpo Template Export** plugin; 3 green checkmarks (reads layouts/backgrounds/overlays;
   carries animations; honors a text safe zone); dark "get it on the figma community" button.
   Right: a **Figma → Typpo handoff visual** — a Figma artboard card (with dashed "SAFE ZONE")
   → arrow → a small phone showing "your script here" captions.

7. **Why Typpo** — 4 cards: powered by voice / fastest motion tool ever / always on-brand /
   share anywhere. Brand line above: *"people don't talk to brands. people talk to people."*

8. **Social proof** (off-white card) — 4.8 star rating, "120k+ clips created", "10s avg. make
   time", plus 3 testimonial blockquotes with gradient avatar dots. (Placeholder data.)

9. **Final CTA band** — Major Mono *"talk. tap. share."* (salmon "share."), App Store badge +
   Figma button, pulsing salmon glow.

10. **Footer** — `typpo` wordmark + tagline, social icons (X, Instagram, Figma), product &
    company link columns, "© 2026 typpo by beatpitch inc. · santa monica, ca" + "typpo records it."

---

## Interactions & Behavior
- **Word-by-word caption demo (hero):** each caption word starts hidden
  (`opacity:0; translateY(10px)`), then reveals one at a time on a beat (default 340ms/word,
  transitions 260ms). The **current** word is salmon (`#EE7F7B`); already-shown words are
  white. After the full line, a ~1.5s hold, then reset and loop. Drives via JS timeouts, not
  CSS animation, so it survives re-renders.
- **On-scroll reveals:** elements with `data-reveal` start `opacity:0; translateY(28px)` and
  animate to visible via IntersectionObserver (threshold .12), with a per-element stagger delay
  (the `data-reveal` value in ms). Transition: `.8s cubic-bezier(.16,.7,.3,1)`.
- **Gallery:** `scroll-snap-type:x mandatory`; prev/next buttons call `scrollBy` ~85% of width.
- **Float:** phone frames use gentle `translateY` keyframe loops (7–9.5s).
- **Glow pulse:** hero + final-CTA radial glows scale/opacity pulse (7s).
- **Hover:** links lighten; buttons keep their shadow (no scale). Focus-visible: 2px salmon outline.
- **`prefers-reduced-motion`:** all animations/transitions collapsed to ~0ms; the caption
  demo shows all words at once; reveals show immediately; dropped videos show playback controls
  instead of autoplaying.

## State
Minimal. Component state: hero caption loop index + timers; gallery scroll (native). No data
fetching. Tweakable props exposed in the prototype (map to your config/props):
`accent` (color, default `#EE7F7B`), `captionSpeed` (160–600ms, default 340), `glow` (0–40%,
default 18).

## Responsive
- Hero, Figma band: two-column flex that wraps to single column on narrow screens (`flex-wrap`).
- All card rows: `auto-fit minmax()` grids reflow 3→2→1 columns.
- Type uses `clamp()` throughout; verify at 360px, 768px, 1180px+.

---

## Assets
- **Fonts:** Major Mono Display, Montserrat (local TTFs in `source/fonts/`; Google Fonts
  equivalents are fine).
- **Figma logo:** inline multi-color SVG (official 5-shape mark) — reused in nav-adjacent
  buttons, Figma band, footer. Safe to reuse (Figma's brand mark for linking to their plugin).
- **App Store badge:** rebuilt as the official **black** "Download on the App Store" button
  (Apple logo + two-line label). For production, swap in Apple's official downloadable badge
  asset to meet their marketing guidelines.
- **Phone clips / step views / gallery clips:** **placeholders.** In the prototype these are
  `<media-slot>` drop targets (accept video or image; a dropped video autoplays muted+looped,
  cover-fit). Replace with your real 9:16 clips (`<video autoplay muted loop playsinline>`),
  respecting the per-step crop framing noted in section 4. The Figma section visual is a
  built-from-HTML mock — replace with a real 16:9 asset if desired.
- **Icons:** inline SVGs (mic, upload, share, template grid, social).

### Links
- App Store: `https://apps.apple.com/us/app/typpo/id1667857726`
- Figma plugin: `https://www.figma.com/community/plugin/1654183953415393934`

---

## Files
- `typpo-landing.standalone.html` — self-contained, offline-openable reference (open this first).
- `source/Typpo Landing.dc.html` — authoring source (uses the prototype runtime; not required
  to recreate, but shows exact markup, inline styles, and the caption/reveal JS logic).
- `source/media-slot.js` — the custom video/image upload-slot web component used for the
  placeholder media. In production, replace slots with plain `<video>`/`<img>`.
- `source/fonts/` — Major Mono Display + Montserrat TTFs.

> Note on inline styles: the source deliberately uses inline styles (a constraint of the
> prototype tool). When recreating, translate these to your codebase's styling system
> (CSS modules, Tailwind, styled-components, etc.) using the tokens above.
