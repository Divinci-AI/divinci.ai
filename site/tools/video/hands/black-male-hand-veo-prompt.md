# Veo director prompt — second hand (Black male), codex style

Generates the green-screen source for a second annotating hand, to sit beside
`leonardo-brush` and `leonardo-arm`. Key it afterwards with:

```bash
python3 tools/arm_video_alpha.py <clip>.mp4 static/video/ --name leonardo-arm-ii
```

Every constraint below exists because `arm_video_alpha.py` will reject or mangle
the clip otherwise. They are not stylistic preferences.

---

## The prompt

> A photorealistic pen-and-ink anatomical drawing in the engraved style of a
> Leonardo da Vinci anatomical study, rendered as live footage. A **Black man's
> right hand and forearm** float against a **solid chroma-green field that fills
> the entire frame, edge to edge**. There is no page, no paper, no parchment, no
> border and no frame — the drawing is composited directly onto the green.
>
> The skin is **deep dark brown**, clearly dark-skinned, modelled in dense umber
> and warm-grey cross-hatching. Keep the colour **low in saturation — muted,
> never orange, red, ruddy or terracotta** — but keep it BROWN and DARK rather
> than draining it to grey. The hatching follows the tendons and knuckles. The forearm is a Renaissance automaton:
> exposed brass and pale wood machinery, pinned joints, visible linkages, drawn
> in the same ink technique and the same muted palette, with a hatched cuff
> where the machinery meets the wrist.
>
> The hand holds a slender **reddish-brown wooden stylus** in a relaxed writing
> grip, the shaft running up and to the right, the tip pointing to the upper
> left. **The grip never changes and the fingers never move.** The only motion
> is a slow, small drift of the whole hand and forearm together, as if the
> subject is breathing — a few degrees at most over the whole clip.
>
> Even, shadowless lighting. No cast shadow on the background. No desk, no
> paper, no table, no other objects. Nothing but the hand, the forearm, the
> stylus and the green field. Locked-off camera, no zoom, no pan.

---

## Why each constraint

**Desaturated, not warm.** The first take read as orange-red — closer to
terracotta than ink — and sat badly against the existing pale hand, which is
almost monochrome. Saying "deep warm brown" invites saturation; the palette has
to be named as muted and the reds excluded by name. This also helps the keyer:
`pencil_angle()` finds the stylus by looking for reddish pixels, so the less red
the HAND is, the less it can compete with the implement.

**Never describe the medium as paper.** Take 2 said the palette was "papery
like aged parchment" and Veo drew the hand ON a parchment page with a border,
floating in the green. That page keys OPAQUE and composites as a cream slab over
the video — the exact failure the green-screen rule exists to prevent. Describe
the LINE-WORK as engraved or hatched; never name a surface, even as a simile.
Take 2 also over-corrected to grey, so the brief now asks for dark brown and low
saturation as two separate instructions rather than one.

**Solid chroma green, nothing else in frame.** The keyer is
`greenness = g - max(r, b)`, thresholded between 14 and 42. A desk, paper or
cast shadow keys as opaque and gets composited over the video as a grey slab.

**Reddish-brown stylus, not black or silver.** `pencil_angle()` finds the
implement by colour: `r` between 70 and 190, `g` and `b` both under 95, `r`
at least 35 above `g` and 25 above `b`. A graphite or metal stylus is invisible
to it, and the drift gate then cuts the clip at frame 2 because it cannot find
an angle at all.

**The grip never changes; fingers never move.** This is the one the tool's own
docstring warns about, in its words: *"Asking Veo for visible finger
articulation reliably breaks the grip: the motion is good for the first
seconds, then the hand rotates, opens, and in the worst case drops the pencil
entirely."* `drift_gate()` cuts the clip as soon as the stylus rotates more than
15° from its starting angle, so an articulated take yields a two-second clip
however long you generated. Ask for stillness and get the whole take.

**Slow whole-hand drift only.** The page positions the hand by its *tip*, which
is tracked per frame, so drift is free — the compositor compensates. What it
cannot compensate for is a changing grip.

**Enter from the lower right.** Mirrors `leonardo-brush`, which enters from the
right, so the two hands can trade a frame without one appearing to jump sides.

**No cast shadow.** There is no surface in the composite for a shadow to fall
on, so a generated one reads as a floating grey smear.

---

## After generating

1. Longer is better — the drift gate keeps the usable head and the compositor
   ping-pongs it, so a 12-second take that stays still for 6 is worth more than
   a 4-second take.
2. Key it with the command at the top. The tool writes the VP9-alpha `.webm`,
   the HEVC-alpha `.mp4`, the still cutout and `<name>-tips.json`.
3. Check the reported drift-gate cut. If it trims below ~2 seconds, the grip
   moved — regenerate rather than trying to salvage it.
4. Confirm alpha survived, because ffmpeg's default decoder silently drops it:

   ```bash
   ffmpeg -c:v libvpx-vp9 -i static/video/leonardo-arm-ii.webm \
     -vf "select=eq(n\,5)" -vframes 1 -pix_fmt rgba /tmp/probe.png
   ```

   The corners must be transparent. Without `-c:v libvpx-vp9` they will not be,
   and the clip will look like it has no alpha when it does.
