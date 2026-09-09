/**
 * Cut a still sequence to a narration track.
 *
 *   node tools/video/assemble.mjs tools/video/scripts/trustbench.shots.mjs
 *
 * The narration is authored first and is the master clock: two-voice-vo.mjs
 * prints the measured start of every line, those become the `at` anchors in the
 * dialogue spec, and the shot spec here reuses the same numbers. So a shot
 * change lands on the sentence that describes it by construction, rather than
 * by nudging cues until it looks right.
 *
 * Why stills rather than a screen recording: the capture comes from the browser
 * extension, which can only ever see the tab it is pointed at. A display
 * recording would take in whatever else happens to be on screen — and on this
 * project secrets have twice reached a transcript through screenshots of
 * adjacent UI. A tab capture cannot make that mistake.
 *
 * Two ffmpeg details worth keeping:
 *
 *   - h.264 requires EVEN dimensions. The captures are 1568x767 — odd height —
 *     so every frame is padded onto a 16:9 canvas in the dashboard's own
 *     background colour. Without the pad, x264 simply refuses the stream.
 *   - xfade consumes T seconds of BOTH clips at each join, so a chain of n
 *     clips is `sum(durations) - T*(n-1)` long, not `sum(durations)`. Each clip
 *     is therefore cut T longer than its visible span, which makes the total
 *     land exactly on the narration length instead of drifting short by a
 *     transition per cut.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

const specPath = process.argv[2]
if (!specPath) throw new Error('usage: assemble.mjs <shots.mjs>')
const spec = (await import(resolve(process.cwd(), specPath))).default

const T = spec.crossfade ?? 0.6
const W = spec.width ?? 1568
const H = spec.height ?? 882 // 16:9 for a 1568-wide capture
const BG = spec.background ?? '#151b2b'

const dur = (f) =>
  Number(
    execFileSync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f,
    ]).toString().trim(),
  )

const audio = resolve(process.cwd(), spec.audio)
if (!existsSync(audio)) throw new Error(`no narration at ${audio}`)
const total = dur(audio)

// Visible span of each shot: from its own `at` to the next shot's `at`, with
// the last running to the end of the narration.
const shots = spec.shots.map((s, i, a) => {
  /* The FIRST shot always starts at 0, whatever its `at` says. Its anchor is
     the first spoken line, which begins slightly after the video does — take
     that literally and the picture starts late, so every later shot lands
     early by the same offset and `-shortest` trims that much narration off the
     end. Measured before this: 214.6s of picture against 215.1s of audio, with
     every cut 0.5s ahead of its sentence. */
  const start = i === 0 ? 0 : s.at
  const end = i + 1 < a.length ? a[i + 1].at : total
  const file = resolve(process.cwd(), s.frame)
  if (!existsSync(file)) throw new Error(`missing frame ${s.frame}`)
  return { ...s, file, start, span: end - start }
})

const bad = shots.filter((s) => s.span <= T)
if (bad.length) {
  throw new Error(
    `${bad.length} shot(s) shorter than the ${T}s crossfade — they would never ` +
      `be fully visible: ${bad.map((s) => `${s.frame}@${s.at}s`).join(', ')}`,
  )
}

console.log(`narration ${total.toFixed(1)}s, ${shots.length} shots, ${T}s crossfade\n`)
for (const s of shots) {
  console.log(
    `${s.start.toFixed(1).padStart(7)}s  ${s.span.toFixed(1).padStart(5)}s  ` +
      `${(s.scene ?? '').padEnd(20)} ${s.frame.split('/').pop()}`,
  )
}

// Each clip runs T longer than its visible span so the crossfade eats the
// overlap rather than the content; the last needs no tail.
const inputs = []
shots.forEach((s, i) => {
  const d = i === shots.length - 1 ? s.span : s.span + T
  inputs.push('-loop', '1', '-t', d.toFixed(3), '-i', s.file)
})

const pads = shots
  .map(
    (_, i) =>
      `[${i}:v]scale=${W}:-1:flags=lanczos,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=${BG},` +
      `format=yuv420p,fps=30[v${i}]`,
  )
  .join(';')

let chain = ''
let acc = shots[0].span + (shots.length > 1 ? T : 0)
let last = 'v0'
for (let i = 1; i < shots.length; i++) {
  const off = acc - T
  const out = i === shots.length - 1 ? 'vout' : `x${i}`
  chain += `;[${last}][v${i}]xfade=transition=fade:duration=${T}:offset=${off.toFixed(3)}[${out}]`
  const d = i === shots.length - 1 ? shots[i].span : shots[i].span + T
  acc = acc + d - T
  last = out
}
if (shots.length === 1) chain = ';[v0]null[vout]'

/* Picture and narration must be the same length. If they are not, `-shortest`
   silently truncates whichever is longer — losing the end of the narration, or
   holding the last frame past it — and every cut before that point is off by
   the same amount. Loud, not silent. */
const drift = acc - total
console.log(`\nassembled length ${acc.toFixed(2)}s (narration ${total.toFixed(2)}s)`)
if (Math.abs(drift) > 0.05) {
  throw new Error(
    `picture is ${Math.abs(drift).toFixed(2)}s ${drift < 0 ? 'SHORTER' : 'LONGER'} than the ` +
      `narration — every cut would sit off its line, and -shortest would trim the difference. ` +
      `Check the first shot's anchor and the last shot's span.`,
  )
}

mkdirSync(dirname(resolve(process.cwd(), spec.out)), { recursive: true })
execFileSync(
  'ffmpeg',
  [
    '-y', '-v', 'error',
    ...inputs,
    '-i', audio,
    '-filter_complex', pads + chain,
    '-map', '[vout]', '-map', `${shots.length}:a`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    /* A keyframe every 2s. x264's default is 250 frames — 8.3s at 30fps — and
       on a video built from long-held stills that makes scrubbing feel broken:
       the player can only land on a keyframe, so dragging the playhead sticks
       several seconds from where you dropped it. Denser keyframes cost almost
       nothing here because consecutive frames are identical, so the extra
       I-frames compress to very little. */
    '-force_key_frames', 'expr:gte(t,n_forced*2)',
    '-c:a', 'aac', '-b:a', '160k',
    '-shortest', '-movflags', '+faststart',
    resolve(process.cwd(), spec.out),
  ],
  { stdio: 'inherit' },
)

console.log(`\nwrote ${spec.out}`)
