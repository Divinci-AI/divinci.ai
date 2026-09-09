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

> A photorealistic pen-and-ink anatomical study in the style of a Leonardo da
> Vinci codex page, rendered as live footage. A **Black man's right hand and
> forearm** enter from the lower right against a **solid chroma-green
> background**. The skin is deep warm brown, modelled in fine sepia and umber
> cross-hatching with the same engraved line-work used for the rest of the
> drawing — the hatching follows the tendons and knuckles. The forearm is a
> Renaissance automaton: exposed brass and pale wood machinery, pinned joints,
> visible linkages, drawn in the same ink technique, with a hatched cuff where
> the machinery meets the wrist.
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
