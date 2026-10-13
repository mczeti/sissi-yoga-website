# CLAUDE.md – Sissi Yoga Website

Astro 6 + Tailwind CSS 4 Website. Kommunikation auf Deutsch.

## Entwicklung

```bash
npm run dev    # Dev-Server (http://localhost:4321)
```

Nach Änderungen an `.env` muss der Dev-Server neu gestartet werden.

## .env Variablen

```
STORYBLOK_TOKEN=...
GOOGLE_CALENDAR_ID=...
GOOGLE_API_KEY=...
```

Nie committen.

## Projektstruktur

```
src/
  components/
    Nav.astro              # Navigation (transparent auf Hero, cream nach Scroll)
    Stundenplan.astro      # Google Calendar Widget (client-side JS, Mock-Fallback)
    storyblok/Flyer.astro  # Storyblok Block-Komponente
  layouts/
    Layout.astro           # Basis-Layout
    SubpageLayout.astro    # Unterseiten-Layout
    global.css             # Brandfarben, Tailwind-Import
  pages/
    index.astro            # Startseite
    kinderyoga.astro
    praenatal.astro
    seniorenyoga.astro
    schulen.astro
    workshops.astro
    kontakt.astro
public/
  images/                  # Fotos (JPG)
  logos/                   # Logo-Varianten (PNG)
```

## Coding-Konventionen

- **CSS-Variablen** immer per `style="..."` verwenden, keine Hex-Werte hardcoden:
  ```
  --color-sissi-green:  #8db33a   /* Akzente, Highlights */
  --color-sissi-olive:  #4a5240   /* Headlines, CTAs */
  --color-sissi-circle: #596049   /* Sekundärer Text */
  --color-sissi-cream:  #f9f6f0   /* Hintergründe, Karten */
  ```
- Runde Ecken: `rounded-2xl`
- Hover: `hover:scale-105`
- Max-Width: `max-w-6xl mx-auto`
- Buttons: Primary = olive-filled, Secondary = olive-border
- Headlines: `font-light`, Farbe olive
- Subheadlines: `text-xs font-bold tracking-widest uppercase`, Farbe green
- Logos: `logo-white.png` auf dunklen Hintergründen, `logo-colored.png` auf hellen

## Hero-Video (Branch `feature/hero-video`)

Hochformat-Video im Story-Rahmen auf der Startseite (`src/components/HeroVideo.astro`).
Ohne Videodateien zeigt der Rahmen nur das Poster.

```bash
brew install ffmpeg                                  # einmalig
scripts/encode-hero-video.sh pfad/zum/original.mp4   # erzeugt public/video/hero/*
```

- Adaptives HLS (360p/540p/720p, `master.m3u8`); Safari nativ, andere Browser über `hls.js` (lazy), Fallback `hero-720.mp4`
- Video lädt erst nach `load`, pausiert außerhalb des Viewports, nicht bei `prefers-reduced-motion`/Datensparmodus
- Caption: Props `title`/`subtitle` an `<HeroVideo />`; Bogen-Variante: `<HeroVideo arch />`
- Fonts (Young Serif, Outfit) self-hosted via `@fontsource`, neue Farb-Tokens `--color-sissi-{ink,forest,muted,terracotta,sage,chip,line,sand}`

## Architektur-Entscheidungen

- **Stundenplan nicht als Nav-Item** – eingebettet auf Startseite (`id="stundenplan"`)
- Auf jeder Kursseite: zwei CTAs nebeneinander ("Aktuelle Termine" → `/#stundenplan` + "Jetzt anfragen")
- **Keine Adresse** auf der Kontaktseite
- Google Calendar Termine müssen Sichtbarkeit "Öffentlich" haben (sonst fehlen Titel & Ort in der API)
- Storyblok: `version: 'draft'` im DEV-Modus, `'published'` in Produktion

## Git-Workflow

```bash
git checkout -b feature/name
# entwickeln, testen
git checkout main && git merge feature/name && git branch -d feature/name && git push
```

`main` = stabiler Branch. Kein Gitflow.
