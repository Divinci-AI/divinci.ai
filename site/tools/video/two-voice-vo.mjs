/**
 * Two-voice narration with Deepgram Flux TTS.
 *
 *   DEEPGRAM_API_KEY=$(infisical secrets get DEEPGRAM_API_KEY \
 *     --projectId=15416dce-60a1-420e-a88c-a214e0d65551 --env=prod --path=/ --plain) \
 *   node tools/video/two-voice-vo.mjs tools/video/scripts/trustbench.mjs
 *
 * Generalized from gemma-gem/scripts/add-voiceover.mjs, which narrates with a
 * single voice. Everything that script learned the hard way is kept:
 *
 *   - Flux TTS is on the **v2** speak route. `GET /v1/models` lists only
 *     aura/aura-2, which reads as "flux does not exist"; `GET /v2/models` lists
 *     the 36 `flux-*-en` voices (`architecture: flux-tts`). Flux is ALSO the
 *     name of Deepgram's STT model on `wss://.../v2/listen` -- different things
 *     sharing a name.
 *   - One request per LINE, never a concatenated script: a single call loses
 *     the pause between lines and gives the whole thing one breath contour.
 *   - Lines are laid out SEQUENTIALLY from their anchors rather than pinned to
 *     fixed cues, because Flux returns different durations for identical text
 *     run to run (measured: the same line came back 3.8s then 5.1s).
 *
 * Three things a two-hander needs that a single narrator does not:
 *
 *   1. A per-line `voice`.
 *   2. A longer beat when the SPEAKER CHANGES than when one speaker continues.
 *      Real dialogue turns take longer than a comma; one gap for both makes the
 *      exchange sound like one person reading two parts.
 *   3. Per-clip loudness normalization BEFORE the mix. Flux voices come back at
 *      noticeably different levels, and normalizing only the final mix leaves
 *      one speaker sitting under the other for the whole video -- the mix meets
 *      its target while the dialogue stays lopsided.
 *
 * Renders are CACHED by (voice, text) hash under .vo-cache/. Re-running is then
 * free and, more importantly, REPRODUCIBLE: cue placement depends on clip
 * durations, so uncached re-runs would shuffle the timing of every line after
 * whichever one happened to come back longer this time.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const KEY = process.env.DEEPGRAM_API_KEY
if (!KEY) throw new Error('need DEEPGRAM_API_KEY (Infisical: prod, /, DEEPGRAM_API_KEY)')

const specPath = process.argv[2]
if (!specPath) throw new Error('usage: two-voice-vo.mjs <script.mjs>')
const spec = (await import(resolve(process.cwd(), specPath))).default

const CACHE = resolve(__dirname, '.vo-cache')
mkdirSync(CACHE, { recursive: true })

/** Speaker turn-taking. A change of voice gets the longer beat. */
const GAP_SAME = spec.gapSame ?? 0.28
const GAP_TURN = spec.gapTurn ?? 0.55
const DRIFT_WARN = spec.driftWarn ?? 2.0

const dur = (f) =>
  Number(
    execFileSync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f,
    ]).toString().trim(),
  )

/**
 * One line of TTS, with retries.
 *
 * A single dropped connection used to lose the whole render: undici raises
 * `TypeError: terminated` (cause ECONNRESET) from the socket, not from the
 * response, so the `res.ok` check never sees it and nothing above catches it.
 * Measured: a 36-line script died on line 20 of a re-render.
 *
 * Only TRANSPORT faults and 429/5xx are retried. A 4xx is a bad voice name or
 * a bad key and will fail identically five times, so it throws immediately.
 */
async function speak(line, i, tries = 4) {
  for (let attempt = 1; ; attempt++) {
    let res
    try {
      res = await fetch(
        `https://api.deepgram.com/v2/speak?model=${encodeURIComponent(line.voice)}&encoding=mp3`,
        {
          method: 'POST',
          headers: { Authorization: `Token ${KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: line.text }),
          signal: AbortSignal.timeout(120_000),
        },
      )
    } catch (err) {
      // Transport-level: ECONNRESET, DNS, or the timeout above.
      if (attempt >= tries) throw new Error(`TTS line ${i} (${line.voice}): ${err.message}`, { cause: err })
      const wait = 2 ** attempt
      console.log(`  retry ${attempt}/${tries - 1} in ${wait}s -- ${err.message} (line ${i})`)
      await new Promise((r) => setTimeout(r, wait * 1000))
      continue
    }
    // Never dump the body blind -- an error body is JSON, a success body is audio.
    if (res.ok) return Buffer.from(await res.arrayBuffer())
    const retryable = res.status === 429 || res.status >= 500
    const body = await res.text()
    if (!retryable || attempt >= tries) {
      throw new Error(`TTS failed, line ${i} (${line.voice}): HTTP ${res.status} ${body}`)
    }
    const wait = 2 ** attempt
    console.log(`  retry ${attempt}/${tries - 1} in ${wait}s -- HTTP ${res.status} (line ${i})`)
    await new Promise((r) => setTimeout(r, wait * 1000))
  }
}

// -- render each line (cached) --------------------------------------------
const clips = []
for (const [i, line] of spec.lines.entries()) {
  if (!line.voice) throw new Error(`line ${i} has no voice`)
  const hash = createHash('sha256').update(`${line.voice} ${line.text}`).digest('hex').slice(0, 16)
  const raw = join(CACHE, `${line.voice}-${hash}.mp3`)

  if (!existsSync(raw)) {
    writeFileSync(raw, await speak(line, i))
    console.log(`  rendered ${line.voice}  "${line.text.slice(0, 44)}"`)
  }

  // Level each clip to the same target BEFORE mixing, so neither speaker sits
  // under the other. loudnorm's one-pass mode is enough at this length.
  const lev = join(CACHE, `${line.voice}-${hash}-lev.mp3`)
  if (!existsSync(lev)) {
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', raw,
      '-af', 'loudnorm=I=-18:TP=-2.0:LRA=11', '-ar', '48000', '-ac', '1', lev])
  }
  clips.push({ ...line, file: lev, dur: dur(lev), i })
}

// -- lay the lines out sequentially from their anchors ---------------------
let cursor = 0
let prevVoice = null
for (const c of clips) {
  const gap = prevVoice && prevVoice !== c.voice ? GAP_TURN : GAP_SAME
  c.start = Math.max(c.at ?? 0, cursor + (prevVoice === null ? 0 : gap))
  c.drift = c.start - (c.at ?? 0)
  cursor = c.start + c.dur
  prevVoice = c.voice
}

const runtime = cursor
const videoDur = spec.video && existsSync(spec.video) ? dur(spec.video) : null
const voices = new Set(clips.map((c) => c.voice))
console.log(
  `\n${clips.length} lines, ${voices.size} voices, ${runtime.toFixed(1)}s of dialogue` +
    (videoDur ? ` against ${videoDur.toFixed(1)}s of video` : ' (audio only)'),
)

let problems = 0
for (const c of clips) {
  const end = c.start + c.dur
  const pushed = c.drift > DRIFT_WARN
  const over = videoDur !== null && end > videoDur
  if (pushed || over) problems++
  const who = c.voice.replace(/^flux-/, '').replace(/-en$/, '')
  console.log(
    `${c.start.toFixed(1).padStart(6)}s ${end.toFixed(1).padStart(6)}s  ${who.padEnd(8)}` +
      `${c.drift > 0.05 ? ` (+${c.drift.toFixed(1)}s past ${c.at}s)` : ''}` +
      `${pushed ? ' DRIFTED OFF ITS BEAT' : ''}${over ? ' RUNS PAST THE VIDEO' : ''}` +
      `  "${c.text.slice(0, 46)}"`,
  )
}
if (problems) {
  console.log(`\n${problems} line(s) no longer sit on the beat they were written for.`)
  console.log('   Shorten the copy or move the anchors -- the mix is still written so you can hear it.')
} else {
  console.log('\nall lines sit on their beats')
}

// -- mix -------------------------------------------------------------------
const inputs = clips.flatMap((c) => ['-i', c.file])
const base = videoDur !== null ? 1 : 0 // input 0 is the video when there is one
const delays = clips
  .map((c, i) => {
    const ms = Math.round(c.start * 1000)
    return `[${i + base}:a]adelay=${ms}|${ms}[a${i}]`
  })
  .join(';')
const filter =
  `${delays};${clips.map((_, i) => `[a${i}]`).join('')}amix=inputs=${clips.length}:normalize=0,` +
  // Broadcast-ish target for spoken web video. NOT a fixed +NdB gain -- a blanket
  // boost is how a sibling script pushed peaks to +3.43 dBFS and clipped.
  'loudnorm=I=-16:TP=-1.5:LRA=11' +
  // apad ONLY with a video. Its job is to stop the muxer truncating the video to
  // the last word, and `-shortest` (video branch only) is what bounds it. With
  // no video there is nothing to bound it: apad generates silence forever and
  // ffmpeg writes until the disk does. Measured before this guard: a 2.5-minute
  // dialogue produced a 110MB file and was still growing.
  (videoDur !== null ? ',apad' : '') +
  '[mix]'

mkdirSync(dirname(spec.out), { recursive: true })
execFileSync(
  'ffmpeg',
  videoDur !== null
    ? ['-y', '-v', 'error', '-i', spec.video, ...inputs, '-filter_complex', filter,
       '-map', '0:v', '-map', '[mix]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k',
       '-ar', '48000', '-ac', '1', '-shortest', '-movflags', '+faststart', spec.out]
    : ['-y', '-v', 'error', ...inputs, '-filter_complex', filter,
       '-map', '[mix]', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-ac', '1', spec.out],
  { stdio: 'inherit' },
)

console.log(`\nwrote ${spec.out}`)
