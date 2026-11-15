#!/usr/bin/env node
// Flyer (JPG/PNG/PDF) zu Storyblok hochladen, als "flyer"-Story anlegen und veröffentlichen.
//
//   node scripts/flyer-publish.mjs --datei pfad/flyer.jpg --titel "Kinderyoga Jänner 2027" \
//     --datum 2027-01-12 --zielgruppe kinder --typ kurs [--featured] [--ausgebucht] [--slug x] [--dry-run]
//
// Benötigt in .env: STORYBLOK_MANAGEMENT_TOKEN (Personal Access Token)
// Optional:         STORYBLOK_SPACE_ID (sonst über STORYBLOK_TOKEN ermittelt)
// Live-Site: Storyblok-Webhook stößt nach dem Publish den Netlify-Build an (~1–2 Min.)

import { readFileSync, existsSync, statSync } from 'node:fs'
import { basename, extname } from 'node:path'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'

// --- .env laden (ohne Abhängigkeit) ---
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

// --- Argumente ---
const args = {}
const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (!a.startsWith('--')) continue
  const key = a.slice(2)
  const next = argv[i + 1]
  if (next === undefined || next.startsWith('--')) args[key] = true
  else { args[key] = next; i++ }
}

function fail(msg) { console.error(`✗ ${msg}`); process.exit(1) }

const datei = args.datei
const titel = args.titel
const datum = args.datum
const zielgruppe = args.zielgruppe ?? 'erwachsene'
const typ = args.typ ?? 'kurs'
const dryRun = !!args['dry-run']

if (!datei || !existsSync(datei)) fail('--datei fehlt oder existiert nicht')
if (!titel) fail('--titel fehlt')
if (!datum || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) fail('--datum fehlt (Format YYYY-MM-DD)')
if (!['kinder', 'erwachsene'].includes(zielgruppe)) fail('--zielgruppe muss kinder oder erwachsene sein')
if (!['kurs', 'workshop'].includes(typ)) fail('--typ muss kurs oder workshop sein')

const slugify = (s) => s.toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const slug = args.slug ?? slugify(titel)

const ext = extname(datei).toLowerCase()
const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.pdf': 'application/pdf' }[ext]
if (!mime) fail(`Dateityp ${ext} nicht unterstützt (jpg, png, webp, pdf)`)

// Bildgröße (für Storyblok-URL / meta) per macOS sips
let size
if (mime.startsWith('image/')) {
  try {
    const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', datei], { encoding: 'utf8' })
    const w = out.match(/pixelWidth:\s*(\d+)/)?.[1], h = out.match(/pixelHeight:\s*(\d+)/)?.[1]
    if (w && h) size = `${w}x${h}`
  } catch { /* egal */ }
}

const fileName = `${slug}${ext === '.jpeg' ? '.jpg' : ext}`
const content = {
  _uid: randomUUID(),
  component: 'flyer',
  titel,
  gueltig_ab: `${datum} 00:00`,
  zielgruppe,
  typ,
  featured: !!args.featured,
  ausgebucht: !!args.ausgebucht,
}

console.log(`Flyer: ${titel}`)
console.log(`  Datei:      ${datei} (${size ?? mime}, ${(statSync(datei).size / 1024).toFixed(0)} KB)`)
console.log(`  Slug:       ${slug}`)
console.log(`  ${typ === 'workshop' ? 'Am' : 'Ab'}:         ${datum}`)
console.log(`  Zielgruppe: ${zielgruppe} · Typ: ${typ} · Featured: ${content.featured} · Ausgebucht: ${content.ausgebucht}`)
if (dryRun) { console.log('\n(dry-run – nichts hochgeladen)'); process.exit(0) }

const token = process.env.STORYBLOK_MANAGEMENT_TOKEN
if (!token) fail('STORYBLOK_MANAGEMENT_TOKEN fehlt in .env (Storyblok → My Account → Personal access tokens)')

const MAPI = 'https://mapi.storyblok.com/v1'
async function mapi(path, opts = {}) {
  const res = await fetch(`${MAPI}${path}`, {
    ...opts,
    headers: { Authorization: token, 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
  })
  const text = await res.text()
  if (!res.ok) fail(`Storyblok ${opts.method ?? 'GET'} ${path} → ${res.status}: ${text}`)
  return text ? JSON.parse(text) : {}
}

// Space-ID
let spaceId = process.env.STORYBLOK_SPACE_ID
if (!spaceId) {
  const r = await fetch(`https://api.storyblok.com/v2/cdn/spaces/me?token=${process.env.STORYBLOK_TOKEN}`)
  spaceId = (await r.json())?.space?.id
  if (!spaceId) fail('Space-ID nicht ermittelbar – STORYBLOK_SPACE_ID in .env setzen')
}

// Slug schon vergeben?
const existing = await mapi(`/spaces/${spaceId}/stories?with_slug=${encodeURIComponent(slug)}`)
if (existing.stories?.length) fail(`Slug "${slug}" existiert schon – anderen --slug wählen`)

// 1) Asset anmelden (signierter Upload)
const signed = await mapi(`/spaces/${spaceId}/assets/`, {
  method: 'POST',
  body: JSON.stringify({ filename: fileName, ...(size ? { size } : {}) }),
})

// 2) Datei zu S3 hochladen
const form = new FormData()
for (const [k, v] of Object.entries(signed.fields)) form.append(k, v)
form.append('file', new Blob([readFileSync(datei)], { type: mime }), fileName)
const up = await fetch(signed.post_url, { method: 'POST', body: form })
if (!up.ok) fail(`Upload fehlgeschlagen: ${up.status} ${await up.text()}`)

// 3) Upload abschließen
await mapi(`/spaces/${spaceId}/assets/${signed.id}/finish_upload`)
const assetUrl = signed.pretty_url.startsWith('//') ? `https:${signed.pretty_url}` : signed.pretty_url
console.log(`✓ Asset hochgeladen: ${assetUrl}`)

content.bild = {
  id: signed.id,
  alt: titel,
  name: '',
  focus: '',
  title: '',
  source: '',
  filename: assetUrl,
  copyright: '',
  fieldtype: 'asset',
  meta_data: {},
  is_external_url: false,
}

// 4) Story anlegen + veröffentlichen
const { story } = await mapi(`/spaces/${spaceId}/stories/`, {
  method: 'POST',
  body: JSON.stringify({ story: { name: titel, slug, content }, publish: 1 }),
})
console.log(`✓ Story veröffentlicht: ${story.full_slug} (id ${story.id})`)
console.log(`  https://app.storyblok.com/#/me/spaces/${spaceId}/stories/0/0/${story.id}`)
console.log('ℹ Netlify baut die Site automatisch neu – Flyer ist in ~1–2 Min. live.')
