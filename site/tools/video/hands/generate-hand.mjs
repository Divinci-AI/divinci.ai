/**
 * Generate a green-screen hand clip with Veo, for keying by arm_video_alpha.py.
 *
 *   GEMINI_API_KEY=... node tools/video/hands/generate-hand.mjs \
 *     --prompt tools/video/hands/black-male-hand-veo-prompt.md \
 *     --out build/video/hands/leonardo-arm-ii-take1.mp4
 *
 * Request shape is copied from clients/tests/veo-scripts/generate-hero-veo.mjs,
 * which is the working example in this repo. The differences here are all about
 * what the KEYER needs downstream:
 *
 *   - The negative prompt fights the two things that make a clip unkeyable: a
 *     surface for the hand to rest on (keys opaque and composites as a grey
 *     slab) and a cast shadow on the green (keys as a floating smear).
 *   - It asks for the longest take available, because arm_video_alpha.py's
 *     drift gate keeps only the head of the clip up to the point the grip
 *     breaks. A long take that stays still for six seconds beats a short one.
 *
 * The prompt is read from the markdown brief so the two cannot drift apart —
 * the text between the first pair of `>` blockquote markers is the prompt.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta'
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
if (!API_KEY) throw new Error('need GEMINI_API_KEY')

const argv = process.argv.slice(2)
const flag = (n, d) => {
  const i = argv.indexOf(`--${n}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d
}
const MODEL = flag('model', 'veo-3.1-generate-preview')
const OUT = flag('out', 'build/video/hands/hand-take1.mp4')
const PROMPT_MD = flag('prompt', 'tools/video/hands/black-male-hand-veo-prompt.md')

/* Everything that would make the clip unkeyable, plus the motion failure the
   keyer's own drift gate exists to trim. */
const NEGATIVE = [
  'desk, table, paper, parchment, surface, props, objects',
  'cast shadow, drop shadow, shadow on background',
  'gradient background, textured background, vignette',
  'moving fingers, changing grip, opening hand, dropping the stylus',
  'camera movement, zoom, pan, dolly, rack focus',
  'text, watermark, caption, logo',
  'multiple hands, second arm, face, body',
].join(', ')

const md = await readFile(PROMPT_MD, 'utf8')
const quoted = md.split('\n').filter((l) => l.trimStart().startsWith('>'))
if (!quoted.length) throw new Error(`no > blockquote prompt found in ${PROMPT_MD}`)
const prompt = quoted
  .map((l) => l.replace(/^\s*>\s?/, ''))
  .join(' ')
  .replace(/\*\*/g, '')
  .replace(/\s+/g, ' ')
  .trim()

console.log(`model:  ${MODEL}`)
console.log(`prompt: ${prompt.length} chars from ${PROMPT_MD}\n`)
console.log(prompt.slice(0, 300) + '…\n')

const api = async (url, init = {}) => {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY, ...(init.headers || {}) },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}\n${(await res.text()).slice(0, 500)}`)
  return res.json()
}

const start = await api(`${API_ROOT}/models/${MODEL}:predictLongRunning`, {
  method: 'POST',
  body: JSON.stringify({
    instances: [{ prompt }],
    parameters: { aspectRatio: '16:9', negativePrompt: NEGATIVE, sampleCount: 1 },
  }),
})

const opName = start.name
if (!opName) throw new Error(`no operation: ${JSON.stringify(start).slice(0, 300)}`)
process.stdout.write(`op: ${opName}\npolling`)

const deadline = Date.now() + 10 * 60 * 1000
let op = start
while (!op.done) {
  if (Date.now() > deadline) throw new Error('timed out after 10 min')
  await new Promise((r) => setTimeout(r, 10_000))
  process.stdout.write('.')
  op = await api(`${API_ROOT}/${opName}`)
}
process.stdout.write('\n')
if (op.error) throw new Error(`failed: ${JSON.stringify(op.error).slice(0, 400)}`)

const findUri = (o) => {
  if (!o || typeof o !== 'object') return null
  for (const k of ['uri', 'url', 'videoUri', 'gcsUri']) {
    if (typeof o[k] === 'string' && /^https?:/.test(o[k])) return o[k]
  }
  for (const v of Object.values(o)) {
    if (Array.isArray(v)) { for (const e of v) { const f = findUri(e); if (f) return f } }
    else { const f = findUri(v); if (f) return f }
  }
  return null
}
const uri = findUri(op.response ?? op)
if (!uri) {
  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(`${OUT}.response.json`, JSON.stringify(op, null, 2))
  throw new Error(`no video URI; raw operation at ${OUT}.response.json`)
}

const dl = await fetch(uri, { headers: { 'x-goog-api-key': API_KEY } })
if (!dl.ok) throw new Error(`download failed: HTTP ${dl.status}`)
const buf = Buffer.from(await dl.arrayBuffer())
await mkdir(dirname(OUT), { recursive: true })
await writeFile(OUT, buf)
console.log(`\nwrote ${OUT} (${(buf.length / 1048576).toFixed(1)} MB)`)
