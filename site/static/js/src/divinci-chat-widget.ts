/**
 * Divinci homepage free-chat widget — a floating chat bubble for divinci.ai.
 *
 * Email-gated, keyless public chat powered by @divinci-ai/client's
 * `freeChatGate` namespace (the platform Free-Chat Gate, captcha+otp mode):
 * a visitor verifies an email with a 6-digit OTP (behind a Cloudflare Turnstile
 * bot check) to earn a short-lived token, then gets a few free messages with
 * the release's assistant. Supersedes the deprecated `homepageChat` namespace.
 *
 * Bundled (with the SDK inlined) by esbuild → /static/js/divinci-chat.js.
 * Config comes from data-* attributes on that script tag (see base.html).
 *
 * Per-page personality: base.html exposes a `chat_release_id` Tera block (a
 * page can point the bubble at its own Release) and a `chat_config` block
 * where a page emits `divinci-chat-{greeting,starters,blurbs,speech,context}`.
 * Every one of those is optional and falls back to the site-wide default, so
 * pages that say nothing keep behaving exactly as before. /www-rag/ and
 * /open-web-vectors/ use them to keep the bubble on-topic.
 */
import { DivinciClient } from "@divinci-ai/client";

type View = "loading" | "email" | "otp" | "chat" | "error" | "blocked";

// Mirrors @divinci-ai/client's FreeChatGateMode — declared locally to avoid
// depending on the SDK's exported type surface for one string union.
type GateMode = "none" | "captcha-only" | "captcha+otp" | "captcha+magic-link";

interface WidgetConfig {
  apiBase: string;
  releaseId: string;
  turnstileSiteKey: string;
  signupUrl: string;
}

// Cloudflare Turnstile global (loaded via the api.js script in base.html).
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      getResponse: (id?: string) => string | undefined;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
    __divinciChatBooted?: boolean;
    DivinciRobotLauncher?: {
      mount: (el: HTMLElement, opts: { onFail: () => void }) => () => void;
    };
  }
}

function readConfig(): WidgetConfig | null {
  const el = document.getElementById("divinci-chat-js");
  if (!el) return null;
  const d = (el as HTMLElement).dataset;
  if (!d.apiBase || !d.releaseId || !d.turnstileSitekey) {
    console.warn("[divinci-chat] missing data-api-base / data-release-id / data-turnstile-sitekey");
    return null;
  }
  let apiBase = d.apiBase;
  let releaseId = d.releaseId;
  let turnstileSiteKey = d.turnstileSitekey;

  // Local Zola serve: use Cloudflare's always-passes test sitekey (no domain binding).
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    turnstileSiteKey = "1x00000000000000000000AA";
  }

  return {
    apiBase,
    releaseId,
    turnstileSiteKey,
    signupUrl: d.signupUrl || "https://app.divinci.app",
  };
}

// Mirrors the release's server-side conversationStarter config (set via
// `divinci release update --conversation-starters`) — kept in sync manually
// since this vanilla-JS widget doesn't fetch it (see sdk.divinci.ai's
// DocsAssistant for the page-aware, server-driven version of this idea).
function readJsonConfig<T>(id: string, fallback: T): T {
  const el = document.getElementById(id);
  if (!el) return fallback;
  try { return JSON.parse(el.textContent || "") as T; } catch { return fallback; }
}

/** Same idea for plain prose — no JSON quoting/escaping in the template. */
function readTextConfig(id: string, fallback: string): string {
  const el = document.getElementById(id);
  const text = el ? (el.textContent || "").trim() : "";
  return text || fallback;
}

const CONVERSATION_STARTERS: Array<{ label: string; message: string }> = readJsonConfig("divinci-chat-starters", [
  { label: "What is Divinci?", message: "What is Divinci AI?" },
  { label: "Connect an AI via MCP", message: "How do I connect Claude or Grok to Divinci over MCP?" },
  { label: "Compare pricing plans", message: "What's the difference between the Free, Starter, Pro, and Enterprise plans?" },
]);

/** Homepage section blurbs for the ambient speech bubble above the robot.
 *  Hero is omitted — the launcher stays hidden until the second section. */
const SECTION_BLURBS: Array<{ selector: string; blurb: string }> = readJsonConfig("divinci-chat-blurbs", [
  { selector: "#solutions, .compare-section", blurb: "Same prompt, two systems — want the methodology?" },
  { selector: "#features, .features-section", blurb: "I can walk you through compliance, testing, or recovery." },
  { selector: ".research-band", blurb: "Open weights, open patches — ask about vIndexes." },
  { selector: "#team, .team-section", blurb: "Meet the people behind Divinci." },
  { selector: "#signup, .signup-section", blurb: "Ready to start? I can point you to a demo." },
  { selector: ".expert-answers-section", blurb: "Got a reliability or workflow question? Ask me." },
  { selector: ".contact-section", blurb: "Want to talk to a human? I can help you reach us." },
]);
/**
 * Panel greeting, shown above the starter buttons on an empty conversation.
 * Per-page override via the `divinci-chat-greeting` block (see base.html's
 * `chat_config` Tera block).
 */
const GREETING = readTextConfig(
  "divinci-chat-greeting",
  "👋 Hi, I'm Divinci! Ask me anything — what the platform does, how to get started, our API/SDK/CLI/MCP, or how to connect Claude, Grok, Perplexity, or Mistral.",
);

/**
 * Page-scoped grounding, prepended to every prompt this page sends.
 *
 * The site runs ONE release, so without this the bubble answers as the
 * generic divinci.ai assistant no matter which page it is floating over.
 * A page that sets `divinci-chat-context` gets its own framing — the text
 * is prepended to the wire prompt only; the visitor's own words are what
 * gets rendered, stored in localStorage, and echoed back on screen.
 *
 * Sent on EVERY turn rather than just the first: conversations are restored
 * from localStorage across page loads, so a visitor who chatted on the home
 * page and then opened this one would otherwise never get the framing at all.
 * Keep the text short — it rides along with each message.
 *
 * A dedicated Release per page (see `chat_release_id`) is the stronger
 * version of this; this is the part that works without provisioning one.
 */
const PAGE_CONTEXT = readTextConfig("divinci-chat-context", "");

function withPageContext(prompt: string): string {
  return PAGE_CONTEXT ? PAGE_CONTEXT + "\n\n" + prompt : prompt;
}

const SPEECH_FALLBACK = readTextConfig("divinci-chat-speech", "👋 Hi! I'm Divinci — ask me anything.");
const SPEECH_DWELL_MS = 2500;
const SPEECH_DEBOUNCE_MS = 300;
/** Hero bottom must clear this fraction of the viewport before the launcher fades in. */
const HERO_HIDE_BOTTOM_RATIO = 0.72;
/** Once this many px of the footer are on screen the launcher fades back out —
 *  it sits over the footer's links (Privacy Settings et al) otherwise. */
const FOOTER_HIDE_REVEAL_PX = 56;

/** How long to wait for Turnstile's success callback after forcing a reset.
 *  interaction-only normally resolves well under a second; 4s is slack for a
 *  slow network, not for a visible challenge. */
const GATE_TOKEN_WAIT_MS = 4000;

/**
 * 8 samples of silence (8kHz mono 8-bit WAV), used to "unlock" an <audio>
 * element while the click's user activation is still live.
 *
 * Browsers only permit playback that a user gesture initiated, and the
 * activation is consumed/expires quickly. Synthesizing a reply takes SECONDS
 * (8.3s measured for a 290-char message), so calling play() after awaiting it
 * is far too late: it rejects NotAllowedError and the widget falls back to the
 * robotic browser voice even though the audio is perfectly good. Playing this
 * clip synchronously on click marks THAT element as user-initiated, so the
 * later play() with the real URL is allowed.
 */
const SILENT_UNLOCK_WAV =
  "data:audio/wav;base64,UklGRiwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQgAAACAgICAgICAgA==";

/**
 * localStorage prefix for the gate's signed transcript + signature. Stored
 * beside "divinci-chat-history:" and cleared with it — the two must never
 * diverge (see saveMessages).
 */
const GATE_STATE_KEY = "divinci-chat-gate:";

/**
 * localStorage prefix for the sound on/off preference. Persisted per release
 * so a visitor who turned voice on once doesn't have to do it on every visit.
 * Default is OFF — a marketing site must never make noise unprompted, and
 * browsers block autoplay until a user gesture anyway (flipping this toggle
 * IS that gesture, which is why auto-play from it is allowed to work).
 */
const SOUND_PREF_KEY = "divinci-chat-sound:";

/**
 * True when the panel is rendering as the full-screen phone layout. Must stay
 * in lockstep with the breakpoint in divinci-chat-widget.css — matchMedia with
 * the identical query is how we keep one source of truth for it.
 */
const PHONE_PANEL_QUERY = "(max-width: 600px), (max-height: 480px)";
function isPhonePanel(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(PHONE_PANEL_QUERY).matches;
}

/**
 * Coarse pointer = finger. Used to suppress the composer's autofocus: on a
 * touch device, focusing an input on open summons the software keyboard, which
 * covers over half the screen and pushes the greeting and starter prompts out
 * of view before the visitor has read a word of them.
 */
function isTouchLike(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, html?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

/** Inline SVG path data from Lucide (https://lucide.dev, ISC license).
 * Emoji glyphs render differently per platform; a single stroke-based set
 * keeps the widget chrome uniform everywhere. */
const ICONS: Record<string, string> = {
  "external-link": '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  "loader": '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  "check": '<path d="M20 6 9 17l-5-5"/>',
  "alert": '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  "rotate-ccw": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  "x": '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  "send": '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  "thumbs-up": '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
  "thumbs-down": '<path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/>',
  "copy": '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  "volume": '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  "volume-off": '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>',
  // FILLED on purpose. As a stroke-only outline it reads as an empty
  // placeholder box rather than a stop control (reported 2026-07-30: "the
  // default empty square icon"). The shared <svg> sets fill="none", so the
  // fill has to be declared on the shape itself.
  "stop": '<rect width="12" height="12" x="6" y="6" rx="2" fill="currentColor" stroke="none"/>',
  "smile": '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>',
};

function icon(name: keyof typeof ICONS, extraCls = ""): string {
  return `<svg class="dvc-icon${extraCls ? " " + extraCls : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
}

/**
 * Can this browser comfortably run the 3D robot launcher?
 * Conservative: any signal of a weak device keeps the emoji bubble.
 * The heavy bundle (react + three.js) is only fetched when this passes.
 */
function probeRobotCapability(): boolean {
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    if (nav.connection?.saveData) return false;
    if (nav.connection?.effectiveType && /(^|-)2g$/.test(nav.connection.effectiveType)) return false;
    if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return false;
    if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency < 4) return false;
    // Same guard the robot scene itself uses: refuse software WebGL.
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ||
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}

/** Inline markdown on already-HTML-escaped text (links/bold/italic/code). */
function mdInline(s: string): string {
  // [text](http(s)://url) — protocol-restricted so javascript:/data: can't match.
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)<>]+)\)/g,
    (_m, t, u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>`);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");           // inline code
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");  // bold
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>"); // italic
  return s;
}

/**
 * Minimal, dependency-free markdown → HTML for AI chat replies. Escapes ALL
 * HTML first (so any markup the model emits is inert), then re-introduces only
 * the specific tags generated from markdown syntax — the render-time XSS
 * defense (no raw HTML ever passes through; URLs are protocol-restricted).
 */
function renderMarkdown(src: string): string {
  const lines = escapeHtml(src).split(/\r?\n/);
  const out: string[] = [];
  let ul = false, ol = false, code = false;
  const closeLists = () => { if (ul) { out.push("</ul>"); ul = false; } if (ol) { out.push("</ol>"); ol = false; } };
  for (const line of lines) {
    if (/^```/.test(line)) {
      if (code) { out.push("</code></pre>"); code = false; }
      else { closeLists(); out.push("<pre><code>"); code = true; }
      continue;
    }
    if (code) { out.push(line + "\n"); continue; }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { closeLists(); const n = h[1].length; out.push(`<h${n}>${mdInline(h[2])}</h${n}>`); continue; }
    const u = line.match(/^\s*[-*]\s+(.*)$/);
    if (u) { if (!ul) { closeLists(); out.push("<ul>"); ul = true; } out.push(`<li>${mdInline(u[1])}</li>`); continue; }
    const o = line.match(/^\s*\d+\.\s+(.*)$/);
    if (o) { if (!ol) { closeLists(); out.push("<ol>"); ol = true; } out.push(`<li>${mdInline(o[1])}</li>`); continue; }
    if (line.trim() === "") { closeLists(); continue; }
    closeLists();
    out.push(`<p>${mdInline(line)}</p>`);
  }
  if (code) out.push("</code></pre>");
  closeLists();
  return out.join("");
}

class DivinciChatWidget {
  private readonly cfg: WidgetConfig;
  private readonly client: DivinciClient;
  private view: View = "loading";
  private email = "";
  private open = false;
  private turnstileId: string | null = null;
  private turnstileToken: string | null = null; // captured via Turnstile success callback
  // Invisible captcha-only gate widget — separate from turnstileId/turnstileToken
  // above (the "email" view's own visible widget). Lives in the persistent
  // tsMount container (never wiped by render()) so it survives every chat
  // re-render instead of being torn down and recreated per message.
  private gateTurnstileId: string | null = null;
  private gateTurnstileToken: string | null = null;
  private tsMount!: HTMLDivElement;
  private marketingConsent = false; // GDPR opt-in (optional); wired to CRM in #3
  private remaining: number | null = null;
  // Quota exhausted: keep the conversation history on screen (per-tab memory,
  // not persisted) and disable sending, rather than replacing the whole panel
  // with a bare "sign up" screen that discards what was just discussed.
  private exhausted = false;
  private errorMsg = "";
  // Learned async from getConfig(); null while unknown (treated as OTP mode,
  // the pre-existing default, so the widget degrades gracefully offline).
  private mode: GateMode | null = null;

  private root!: HTMLDivElement;
  private panel!: HTMLDivElement;
  private backdrop!: HTMLDivElement;
  private bubble!: HTMLButtonElement;
  private body!: HTMLDivElement;
  private speech!: HTMLDivElement;
  private speechText!: HTMLSpanElement;
  private speechObserver: IntersectionObserver | null = null;
  private speechSectionId: string | null = null;
  private speechShownAt = 0;
  private speechDebounce: ReturnType<typeof setTimeout> | null = null;
  private speechPendingId: string | null = null;
  private heroEl: Element | null = null;
  private footerEl: Element | null = null;
  // Detach handle for the visualViewport listeners installed while the
  // full-screen mobile panel is open; null when nothing is attached.
  private viewportDetach: (() => void) | null = null;
  // Whether the composer held focus at the moment render() tore the body down.
  // Lets renderChat() restore focus mid-conversation without stealing it on a
  // cold open — see the autofocus note in renderChat().
  private composerWasFocused = false;
  private heroScrollRaf = 0;
  private messages: Array<{ role: "user" | "assistant"; text: string; pending?: boolean; rating?: -1 | 1; ratingDone?: boolean; isError?: boolean; ratingEmoji?: string }> = [];

  // ── Voice playback (Cloudflare Aura-2 via the release SDK) ──
  /** Whether replies should speak themselves as they arrive. */
  private soundOn = false;
  /** The single audio element — one voice at a time, always. */
  private audio: HTMLAudioElement | null = null;
  /**
   * ONE reusable <audio> element for the whole widget, primed inside a user
   * gesture. iOS grants playback permission per ELEMENT, not per page: an
   * element that has played once during a gesture may then be played from
   * script forever, but a freshly constructed element never can. Building a
   * `new Audio()` per clip therefore worked for the speaker button (a click)
   * and silently failed for auto-speak, which runs in an async continuation
   * after the reply arrives, with no gesture in sight.
   */
  private audioEl: HTMLAudioElement | null = null;
  /**
   * Why voice last failed, shown in the panel. Voice has two fallbacks behind
   * it and both can fail silently — the Divinci clip can be blocked by the
   * platform and speechSynthesis can simply refuse to start (iOS will not run
   * it outside a user gesture, and reports no error when it declines). The
   * result was a speaker button that looked like it worked and produced
   * nothing. If it cannot be played, it has to be said.
   */
  private voiceError: string | null = null;
  /** Opt-in playback diagnostics: append ?dvcdebug=1 to any page URL. */
  private readonly debugVoice: boolean =
    typeof location !== "undefined" && /[?&]dvcdebug=1/.test(location.search);
  private voiceDebug: string | null = null;

  /** Record one step of a playback attempt; shown in-panel under ?dvcdebug=1. */
  private vlog(step: string): void {
    // Always console.log — Safari Web Inspector can read it off the phone —
    // and additionally paint it into the panel when debugging is requested,
    // which needs no cable and no second machine.
    // Debug mode only. This trace carries the clip URL, and printing it into
    // every visitor's console is noise at best.
    if (!this.debugVoice) return;
    console.log("[divinci-voice]", step);
    this.voiceDebug = (this.voiceDebug ? this.voiceDebug + " | " : "") + step;
    // Repaint. Without this the panel only ever showed the FIRST entry: every
    // later step accumulated into the string but nothing put it on screen
    // until some unrelated render happened. That made "the trace stopped at
    // step one" indistinguishable from "execution stopped at step one", which
    // is exactly the wrong ambiguity for a diagnostic to carry. Debug mode
    // only, so the normal path is untouched.
    if (this.view === "chat") this.render();
  }

  /** Everything about the element that determines whether sound comes out. */
  private audioState(a: HTMLAudioElement): string {
    return `paused=${a.paused} muted=${a.muted} vol=${a.volume} ` +
           `ready=${a.readyState} net=${a.networkState} ` +
           `t=${a.currentTime.toFixed(2)} dur=${Number.isFinite(a.duration) ? a.duration.toFixed(2) : "?"} ` +
           `err=${a.error?.code ?? "-"}`;
  }
  /** Removes the current element's listeners in one shot (see stopPlayback). */
  private audioEvents: AbortController | null = null;
  /** Transcript index currently playing, so render() can show a stop button. */
  private playingIdx: number | null = null;
  /**
   * Transcript indices already auto-played. render() runs on every state
   * change (ratings, emoji, reopening the panel); without this the same reply
   * would re-speak each time.
   */
  private autoSpoken = new Set<number>();
  private soundBtn!: HTMLButtonElement;

  constructor(cfg: WidgetConfig) {
    this.cfg = cfg;
    this.client = new DivinciClient({ releaseId: cfg.releaseId, baseUrl: cfg.apiBase });
    
    // Load persisted chat history
    const stored = localStorage.getItem("divinci-chat-history:" + cfg.releaseId);
    if (stored) {
      try {
        this.messages = JSON.parse(stored);
      } catch {
        this.messages = [];
      }
    }

    // Restore the SIGNED transcript that backs those messages. Without this the
    // rendered history outlives its signature: the message bubbles come back on
    // reload but the gate's transcript/signiture are empty, so every operation
    // that must prove the conversation is authentic — submitFeedback() and the
    // "continue in app" handoff — fails before it reaches the network.
    // (That was the "Send feedback does nothing, no console or network error"
    // bug: submitFeedback threw its no-signed-transcript guard and the catch
    // below used to swallow it.)
    const storedGate = localStorage.getItem(GATE_STATE_KEY + cfg.releaseId);
    if (storedGate) {
      try {
        const { transcript, signiture } = JSON.parse(storedGate);
        this.client.freeChatGate.hydrate(transcript, signiture);
      } catch {
        // Unparseable — leave the gate empty; the next send() re-signs.
      }
    }

    // Restore the sound preference. Anything but an explicit "1" is off, so a
    // corrupt/absent value fails silent rather than surprising the visitor.
    try {
      this.soundOn = localStorage.getItem(SOUND_PREF_KEY + cfg.releaseId) === "1";
    } catch {
      this.soundOn = false;
    }

    // Replies restored from a previous session must not all speak at once when
    // the panel opens — mark the whole restored transcript as already played.
    for (let i = 0; i < this.client.freeChatGate.getTranscript().length; i++) {
      this.autoSpoken.add(i);
    }

    // Returning visitor: skip straight to chat if a verification token persists.
    if (this.client.freeChatGate.loadStoredToken(this.cfg.releaseId)) this.view = "chat";
    this.mount();
    this.loadGateMode();
  }

  private saveMessages(): void {
    try {
      localStorage.setItem("divinci-chat-history:" + this.cfg.releaseId, JSON.stringify(this.messages));
      // Keep the signed transcript in lockstep with the rendered messages —
      // persisting one without the other is what broke feedback across reloads.
      localStorage.setItem(
        GATE_STATE_KEY + this.cfg.releaseId,
        JSON.stringify(this.client.freeChatGate.getState()),
      );
    } catch {
      // ignore full storage
    }
  }

  /**
   * Learn the release's actual gate mode before rendering the first screen.
   * The panel opens on a plain "loading" state until this resolves —
   * deliberately NOT a guess-then-correct flow: rendering "email" first (its
   * own Turnstile widget) and later swapping views left the first widget's
   * iframe torn out of the DOM without `turnstile.remove()`, and Cloudflare's
   * script doesn't tolerate that. Rendering exactly one view, once, with the
   * mode already known, avoids the double-render entirely.
   *
   * captcha-only releases skip straight to "chat" (matching the sdk.divinci.ai
   * docs assistant's UX — no separate "Start chatting" gate screen): Turnstile
   * runs invisibly in the background via ensureTurnstileRendered(), and the
   * gate session is only established lazily at first-send time.
   */
  private async loadGateMode(): Promise<void> {
    // Learn the mode ALWAYS — not only when we're still on the loading screen.
    //
    // This used to bail early when a stored token had already put us on
    // "chat", which left `this.mode` null for the entire session of every
    // RETURNING visitor. Everything gated on the mode then silently no-ops:
    // ensureTurnstileRendered(), ensureGateStarted(), the 401 recovery in
    // submitPrompt(), and refreshGateToken() for speak(). So the moment a
    // stored token expired, the visitor could neither send nor hear anything
    // — and no amount of reloading helped, because reloading is exactly what
    // restores the token that triggers the early return. Only clearing
    // localStorage recovered it.
    try {
      const { mode } = await this.client.freeChatGate.getConfig(this.cfg.releaseId);
      this.mode = mode;
    } catch {
      // Network hiccup — leave mode null; the email/OTP flow is the fallback.
    }

    // Warm an invisible Turnstile token even when the view was already
    // decided, so a restored session can re-verify without a visible prompt.
    if (this.mode === "captcha-only") this.ensureTurnstileRendered();

    if (this.view !== "loading") return; // view already decided (stored token)
    if (this.mode === "captcha-only") {
      if (!this.messages || this.messages.length === 0) {
        this.messages = [];
      }
      this.setView("chat");
    } else {
      this.setView("email");
    }
  }

  /** Idempotent: renders the invisible captcha-only gate widget once into the
   * persistent tsMount container, so a token is warm by the time the visitor
   * actually sends a message. No-ops outside captcha-only mode. */
  private ensureTurnstileRendered(): void {
    if (this.mode !== "captcha-only" || this.gateTurnstileId !== null) return;
    if (!window.turnstile) return; // script not loaded yet — retried from ensureGateStarted()
    this.gateTurnstileId = window.turnstile.render(this.tsMount, {
      sitekey: this.cfg.turnstileSiteKey,
      appearance: "interaction-only",
      callback: (token: string) => { this.gateTurnstileToken = token; },
      "error-callback": () => { this.gateTurnstileToken = null; },
      "expired-callback": () => { this.gateTurnstileToken = null; },
    });
  }

  /**
   * Obtain a Turnstile token for a gate /start call.
   *
   * Turnstile tokens are SINGLE-USE. `getResponse()` keeps returning the last
   * issued token even after the server has redeemed it, and siteverify
   * rejects a replay as "timeout-or-duplicate" — which surfaces as a bare 403
   * "Bot verification failed" and looks indistinguishable from a real bot
   * rejection. So any RE-verification (a session that expired, a 401 recovery)
   * must force a brand-new token via reset(); only the very first start may
   * reuse the token the initial render produced, which nothing has spent yet.
   *
   * @param forceFresh discard the current token and wait for a new one.
   */
  private async obtainGateTurnstileToken(forceFresh: boolean): Promise<string> {
    this.ensureTurnstileRendered();
    if (this.gateTurnstileId === null || !window.turnstile) {
      throw new Error("turnstile-pending"); // script not loaded yet
    }

    if (forceFresh) {
      this.gateTurnstileToken = null;
      try {
        window.turnstile.reset(this.gateTurnstileId);
      } catch {
        // Widget already torn down — ensureTurnstileRendered() will not
        // re-create it while gateTurnstileId is set, so surface a retryable
        // error rather than spinning on a dead widget.
        throw new Error("turnstile-pending");
      }
    } else {
      const existing = this.gateTurnstileToken
        ?? window.turnstile.getResponse(this.gateTurnstileId);
      if (existing) return existing;
    }

    // Wait for the success callback to repopulate gateTurnstileToken.
    const deadline = Date.now() + GATE_TOKEN_WAIT_MS;
    while (Date.now() < deadline) {
      if (this.gateTurnstileToken) return this.gateTurnstileToken;
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error("turnstile-pending");
  }

  /** Establishes the freeChatGate session once, consuming one invisible-widget
   * token — called lazily on first send rather than behind an explicit button.
   * Throws "turnstile-pending" if the token isn't ready yet; callers retry. */
  private async ensureGateStarted(): Promise<void> {
    if (this.mode !== "captcha-only" || this.client.freeChatGate.isVerified()) return;
    const token = await this.obtainGateTurnstileToken(false);
    await this.client.freeChatGate.start({ releaseId: this.cfg.releaseId, turnstileToken: token });
    this.gateTurnstileToken = null; // single-use; the session token carries subsequent sends
  }

  private mount(): void {
    this.root = el("div", "dvc-root");
    this.bubble = el("button", "dvc-bubble", "💬");
    this.bubble.setAttribute("aria-label", "Chat with Divinci");
    this.bubble.setAttribute("aria-expanded", "false");
    this.bubble.setAttribute("aria-controls", "dvc-panel");
    this.bubble.addEventListener("click", () => this.toggle());

    this.panel = el("div", "dvc-panel dvc-hidden");
    // Declared a dialog so assistive tech announces it as one and can find its
    // boundaries. aria-modal is NOT set here — it is applied only in the
    // full-screen phone layout (see syncViewport), because on desktop this is a
    // side sheet with the rest of the page still visible and operable, and
    // claiming modality there would hide the page from screen readers that
    // honour it while sighted users can still see and use it.
    this.panel.id = "dvc-panel";
    this.panel.setAttribute("role", "dialog");
    this.panel.setAttribute("aria-labelledby", "dvc-panel-title");
    const header = el("div", "dvc-header", `<span id="dvc-panel-title">Ask Divinci</span>`);
    const headerActions = el("div", "dvc-header-actions");
    
    // Handoff to Web App
    const handoffBtn = el("button", "dvc-clear", icon("external-link"));
    handoffBtn.setAttribute("aria-label", "Continue in app");
    handoffBtn.title = "Continue this conversation in the full Divinci web app";
    handoffBtn.addEventListener("click", async () => {
      if (handoffBtn.disabled) return;
      if (this.messages.length === 0) {
        alert("Start a conversation first before continuing in the app!");
        return;
      }
      handoffBtn.innerHTML = icon("loader", "dvc-icon-spin");
      handoffBtn.disabled = true;
      const appTab = window.open("about:blank", "_blank");
      try {
        const ns = this.client.freeChatGate;
        const { transcript, signiture } = ns.getState();
        const res = await fetch(`${this.cfg.apiBase.replace(/\/+$/, "")}/ai-chat/handoff`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ releaseId: this.cfg.releaseId, prevSigniture: signiture, transcript }),
        });
        if (!res.ok) throw new Error("handoff failed");
        const { token } = await res.json() as { token?: string };
        if (!token) throw new Error("no token");
        
        const webAppUrl = this.cfg.apiBase.includes("stage") 
          ? "https://chat.stage.divinci.app" 
          : "https://chat.divinci.app";
          
        const url = `${webAppUrl}/ai-chat?divinciHandoff=${encodeURIComponent(token)}`;
        if (appTab) appTab.location.href = url;
        else window.open(url, "_blank", "noopener,noreferrer");
        handoffBtn.innerHTML = icon("check");
      } catch (err) {
        if (appTab) appTab.close();
        handoffBtn.innerHTML = icon("alert");
        console.error("Handoff failed:", err);
      } finally {
        setTimeout(() => {
          handoffBtn.innerHTML = icon("external-link");
          handoffBtn.disabled = false;
        }, 2000);
      }
    });

    // Clear / Reset
    const clearBtn = el("button", "dvc-clear", icon("rotate-ccw"));
    clearBtn.setAttribute("aria-label", "Clear conversation");
    clearBtn.title = "Start over";
    clearBtn.addEventListener("click", () => {
      if (confirm("Clear this conversation history?")) {
        this.stopPlayback();
        this.autoSpoken.clear();
        this.messages = [];
        // Guarded, and BEFORE the gate reset. iOS private browsing can throw
        // on localStorage access, and every other localStorage call in this
        // file is already wrapped for that reason — these two were not. An
        // exception here used to abort the handler part-way through, after the
        // messages were dropped but before freeChatGate.reset(), leaving the
        // stale gate session in place. That makes "Clear conversation" appear
        // to work while the session it exists to clear survives, which is
        // precisely the state a visitor reaches for it from.
        try {
          localStorage.removeItem("divinci-chat-history:" + this.cfg.releaseId);
          localStorage.removeItem(GATE_STATE_KEY + this.cfg.releaseId);
        } catch {
          // Private browsing or full storage — there was nothing persisted to
          // clear anyway, and the in-memory reset below is what matters.
        }
        this.client.freeChatGate.reset();
        this.setView("chat");
        this.render();
      }
    });

    // Sound on/off — the single control for voice. Turning it ON is a user
    // gesture, which is exactly what browser autoplay policy requires before
    // subsequent replies may play on their own.
    this.soundBtn = el("button", "dvc-clear");
    this.syncSoundButton();
    this.soundBtn.addEventListener("click", () => this.toggleSound());

    const close = el("button", "dvc-close", icon("x"));
    close.setAttribute("aria-label", "Close chat");
    close.addEventListener("click", () => this.toggle(false));

    headerActions.append(this.soundBtn, handoffBtn, clearBtn, close);
    header.appendChild(headerActions);

    // Insurance behind the panel. Keyboard geometry on iOS is not fully
    // predictable — this is the second real-device gap of this kind — so even
    // if the panel ends up a few pixels short of the screen, what shows
    // through is the widget's own surface rather than the marketing page
    // sliding around behind a modal.
    this.backdrop = el("div", "dvc-backdrop");
    this.backdrop.setAttribute("aria-hidden", "true");

    this.body = el("div", "dvc-body");
    this.tsMount = el("div", "dvc-turnstile-invisible");
    this.tsMount.style.display = "none";
    this.panel.appendChild(header);
    this.panel.appendChild(this.body);
    this.panel.appendChild(this.tsMount);
    this.root.appendChild(this.backdrop);
    this.root.appendChild(this.panel);
    this.root.appendChild(this.bubble);
    this.mountSpeechBubble();
    document.body.appendChild(this.root);
    this.startHeroScrollGate();
    this.upgradeBubbleToRobot();
    this.render();
  }

  /**
   * Scroll gate, both ends of the page:
   *  - On pages with a hero, keep the launcher hidden at the top so it doesn't
   *    compete with the hero composition — fade it in once the second section
   *    enters view. Pages without a hero show the robot immediately.
   *  - At the bottom, fade it back out as the footer arrives; parked over the
   *    footer it covers the Legal/Privacy Settings links.
   */
  private startHeroScrollGate(): void {
    this.heroEl = document.querySelector("section.hero");
    this.footerEl = document.querySelector("footer.site-footer") ?? document.querySelector("footer");
    if (!this.heroEl && !this.footerEl) return;

    if (this.heroEl) {
      this.root.classList.add("dvc-hero-hidden");
      this.root.setAttribute("aria-hidden", "true");
      this.bubble.tabIndex = -1;
    }
    this.syncHeroScrollGate();

    const onScrollOrResize = (): void => {
      if (this.heroScrollRaf) return;
      this.heroScrollRaf = requestAnimationFrame(() => {
        this.heroScrollRaf = 0;
        this.syncHeroScrollGate();
      });
    };
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
  }

  private syncHeroScrollGate(): void {
    if (!this.heroEl && !this.footerEl) return;
    // Stay visible while the panel is open so closing at the top — or reading
    // the footer — doesn't yank the chat away mid-conversation.
    if (this.open) {
      this.root.classList.remove("dvc-hero-hidden");
      this.root.removeAttribute("aria-hidden");
      this.bubble.tabIndex = 0;
      return;
    }
    const vh = window.innerHeight;
    let visible = true;
    if (this.heroEl) {
      visible = this.heroEl.getBoundingClientRect().bottom < vh * HERO_HIDE_BOTTOM_RATIO;
    }
    if (visible && this.footerEl) {
      // Footer top climbs up from vh as it scrolls in; once this much of it
      // shows, the launcher is over its content — get out of the way.
      visible = this.footerEl.getBoundingClientRect().top > vh - FOOTER_HIDE_REVEAL_PX;
    }
    const wasHidden = this.root.classList.contains("dvc-hero-hidden");
    this.root.classList.toggle("dvc-hero-hidden", !visible);
    if (visible) {
      this.root.removeAttribute("aria-hidden");
      this.bubble.tabIndex = 0;
      if (wasHidden) this.revealSpeechIfReady();
    } else {
      this.root.setAttribute("aria-hidden", "true");
      this.bubble.tabIndex = -1;
      this.speech?.classList.remove("dvc-speech-visible");
    }
  }

  /** Ambient speech bubble above the launcher — section-aware blurbs. */
  private mountSpeechBubble(): void {
    this.speech = el("div", "dvc-speech");
    this.speech.setAttribute("aria-hidden", "true");
    const inner = el("div", "dvc-speech-inner");
    this.speechText = el("span", "dvc-speech-text");
    this.speechText.textContent = SPEECH_FALLBACK;
    inner.appendChild(this.speechText);
    inner.appendChild(el("span", "dvc-speech-tail"));
    this.speech.appendChild(inner);
    this.root.appendChild(this.speech);

    // Brief delay so the page settles, then start observing. Speech itself
    // only becomes visible once the launcher is past the hero (see below).
    window.setTimeout(() => {
      this.startSpeechObserver();
      this.revealSpeechIfReady();
    }, 1000);
  }

  /** Show the ambient blurb only when the launcher itself is on-screen. */
  private revealSpeechIfReady(): void {
    if (this.root.classList.contains("dvc-hero-hidden")) return;
    if (this.root.classList.contains("dvc-chat-open")) return;
    if (this.speech.classList.contains("dvc-speech-visible")) return;
    this.speech.classList.add("dvc-speech-visible");
    this.speechShownAt = Date.now();
  }

  private startSpeechObserver(): void {
    const targets: Array<{ id: string; el: Element; blurb: string }> = [];
    for (const { selector, blurb } of SECTION_BLURBS) {
      const node = document.querySelector(selector);
      if (node) targets.push({ id: selector, el: node, blurb });
    }
    if (!targets.length) return;

    this.speechObserver = new IntersectionObserver(
      () => {
        let best: { id: string; blurb: string; ratio: number } | null = null;
        for (const t of targets) {
          const ratio = this.sectionVisibilityRatio(t.el);
          if (ratio <= 0) continue;
          if (!best || ratio > best.ratio) best = { id: t.id, blurb: t.blurb, ratio };
        }
        if (!best) return;
        this.queueSpeechBlurb(best.id, best.blurb);
      },
      { root: null, rootMargin: "-35% 0px -45% 0px", threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    );
    for (const t of targets) this.speechObserver.observe(t.el);
  }

  /** Rough mid-viewport visibility score for a section. */
  private sectionVisibilityRatio(node: Element): number {
    const rect = node.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const top = Math.max(rect.top, vh * 0.35);
    const bottom = Math.min(rect.bottom, vh * 0.55);
    if (bottom <= top) return 0;
    return (bottom - top) / Math.max(rect.height, 1);
  }

  private queueSpeechBlurb(id: string, blurb: string): void {
    if (id === this.speechSectionId) return;
    this.speechPendingId = id;
    if (this.speechDebounce) clearTimeout(this.speechDebounce);
    this.speechDebounce = setTimeout(() => {
      this.speechDebounce = null;
      if (this.speechPendingId !== id) return;
      const elapsed = Date.now() - this.speechShownAt;
      const wait = Math.max(0, SPEECH_DWELL_MS - elapsed);
      if (wait > 0) {
        this.speechDebounce = setTimeout(() => {
          this.speechDebounce = null;
          if (this.speechPendingId === id) this.applySpeechBlurb(id, blurb);
        }, wait);
        return;
      }
      this.applySpeechBlurb(id, blurb);
    }, SPEECH_DEBOUNCE_MS);
  }

  private applySpeechBlurb(id: string, blurb: string): void {
    if (id === this.speechSectionId) return;
    this.speechSectionId = id;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      this.speechText.textContent = blurb;
      this.speech.classList.add("dvc-speech-visible");
      this.speechShownAt = Date.now();
      return;
    }
    this.speech.classList.remove("dvc-speech-visible");
    window.setTimeout(() => {
      this.speechText.textContent = blurb;
      this.speech.classList.add("dvc-speech-visible");
      this.speechShownAt = Date.now();
    }, 280);
  }

  /**
   * Swap the emoji bubble for the 3D Divinci robot (the SDK-docs hero mascot)
   * when the device can handle it. The robot bundle is heavy, so it loads
   * lazily and only after probeRobotCapability() passes; any failure at any
   * stage (script 404, WebGL init, GL context loss) reverts to the emoji.
   */
  private upgradeBubbleToRobot(): void {
    if (!probeRobotCapability()) return;
    const script = document.createElement("script");
    script.src = "/js/divinci-robot.js";
    script.defer = true;
    script.onload = () => {
      const launcher = window.DivinciRobotLauncher;
      if (!launcher) return;
      const holder = el("div", "dvc-bubble-robot-holder");
      const revert = (): void => {
        this.bubble.classList.remove("dvc-bubble-robot");
        holder.remove();
      };
      try {
        launcher.mount(holder, { onFail: revert });
        this.bubble.classList.add("dvc-bubble-robot");
        this.bubble.appendChild(holder);
      } catch {
        revert();
      }
    };
    script.onerror = () => script.remove();
    document.head.appendChild(script);
  }

  /** Focusable children of the open dialog, in DOM order. */
  private dialogFocusables(): HTMLElement[] {
    return Array.from(this.panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter((n) => n.offsetParent !== null || n === document.activeElement);
  }

  /**
   * Keyboard contract for the dialog: Escape closes it, and Tab cannot leave
   * it. Both are obligations that come with role="dialog" — without the trap,
   * Tab walks out of a panel that covers the entire phone screen and into a
   * page the visitor cannot see, with no indication anything moved.
   */
  private onDialogKeydown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      e.stopPropagation();
      this.toggle(false);
      return;
    }
    if (e.key !== "Tab") return;
    const items = this.dialogFocusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (!active || !this.panel.contains(active)) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  private toggle(force?: boolean): void {
    const wasOpen = this.open;
    this.open = force ?? !this.open;
    // Closing the panel must silence it — a voice still talking behind a
    // dismissed widget is the single most annoying failure mode here.
    if (!this.open) this.stopPlayback();
    this.panel.classList.toggle("dvc-hidden", !this.open);
    this.bubble.classList.toggle("dvc-bubble-open", this.open);
    this.root.classList.toggle("dvc-chat-open", this.open);
    this.bubble.setAttribute("aria-expanded", this.open ? "true" : "false");
    if (this.open) this.syncViewport(); else this.releaseViewport();
    if (this.open) this.render();

    if (this.open && !wasOpen) {
      document.addEventListener("keydown", this.onDialogKeydown, true);
    } else if (!this.open && wasOpen) {
      document.removeEventListener("keydown", this.onDialogKeydown, true);
      // Return focus to the control that opened the dialog. Without this,
      // focus is left on a node that has just been hidden, and the next Tab
      // starts over from the top of the document — the visitor loses their
      // place entirely.
      if (this.bubble.isConnected) this.bubble.focus();
    }

    // Closing at the hero top should re-hide the launcher.
    this.syncHeroScrollGate();
  }

  /**
   * Pins the full-screen phone panel to the VISUAL viewport.
   *
   * A `position: fixed` element is laid out against the layout viewport, which
   * on iOS does not shrink when the software keyboard appears. The panel
   * therefore stays full-height, its composer ends up behind the keyboard, and
   * WebKit "helpfully" pans the whole page up to reveal the focused field —
   * which is what drags the header and the opening messages off the top of the
   * screen. Writing visualViewport.height into `--dvc-vh` makes the panel
   * shrink to the space the keyboard actually leaves, so nothing has to pan.
   *
   * Also locks the document behind the panel: without it, a drag that starts
   * on the header or the composer scrolls the page underneath, and closing the
   * chat leaves the visitor somewhere they never navigated to.
   */
  private syncViewport(): void {
    if (this.viewportDetach) return;
    const vv = window.visualViewport;
    const root = document.documentElement;
    const body = document.body;
    // The lock has to go on <html>, not just <body>. The viewport takes its
    // overflow from the root element and only falls through to <body> when the
    // root is `overflow: visible` — and mobile-fixes.css sets
    // `html { overflow-x: hidden }` site-wide, which disables that fallthrough.
    // A body-only lock is silently a no-op here (verified: a wheel over a
    // body-only lock still scrolls the page; over a root lock it does not).
    //
    // Capture the prior inline values so closing restores them verbatim: "" and
    // "hidden" are not interchangeable to restore, and a future drawer or modal
    // must not be silently unlocked by our close.
    const priorRootOverflow = root.style.overflow;
    const priorOverflow = body.style.overflow;

    const apply = () => {
      if (!isPhonePanel()) {
        // Desktop/tablet layout: the panel is a fixed-width side sheet and the
        // page behind it stays scrollable, so leave all of it alone.
        root.style.removeProperty("--dvc-vh");
        root.style.removeProperty("--dvc-vt");
        root.style.overflow = priorRootOverflow;
        body.style.overflow = priorOverflow;
        // Side-sheet layout: the page behind stays visible and operable, so
        // the dialog is emphatically not modal.
        this.panel.removeAttribute("aria-modal");
        return;
      }
      root.style.overflow = "hidden";
      body.style.overflow = "hidden";
      // Full-screen layout: the panel really does cover everything, so the
      // modality claim is true and assistive tech should scope to it.
      this.panel.setAttribute("aria-modal", "true");
      // Deliberately overflow-on-body rather than the position:fixed body
      // trick: the latter resets scrollTop, so closing the chat would dump the
      // visitor back at the top of the page they were reading.
      if (vv) {
        root.style.setProperty("--dvc-vh", `${vv.height}px`);
        // Height alone is not enough. When the software keyboard opens, iOS
        // SCROLLS the visual viewport as well as shrinking it, while a
        // position:fixed element stays pinned to the LAYOUT viewport — which
        // does not move. The panel therefore slides out of alignment with what
        // is actually on screen and the page shows through the gap.
        // offsetTop is how far the visual viewport has scrolled inside the
        // layout viewport, so re-adding it puts the panel back under the
        // visitor's eyes. Rounded because iOS reports sub-pixel values mid
        // animation and a fractional top produces a shimmering 1px seam.
        root.style.setProperty("--dvc-vt", `${Math.max(0, Math.round(vv.offsetTop))}px`);
      }
    };

    // Install the escape hatch BEFORE anything can lock the page. If apply()
    // or addEventListener threw after the lock went on but before the handle
    // existed, the visitor would be left on a permanently unscrollable page
    // with no way back — a self-inflicted denial of the whole site.
    this.viewportDetach = () => {
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      window.removeEventListener("orientationchange", apply);
      root.style.removeProperty("--dvc-vh");
      root.style.removeProperty("--dvc-vt");
      root.style.overflow = priorRootOverflow;
      body.style.overflow = priorOverflow;
      this.panel.removeAttribute("aria-modal");
    };

    apply();
    // `scroll` matters as much as `resize`: iOS reports the software keyboard
    // by scrolling the visual viewport as often as by resizing it, and
    // vv.height is what we actually need off either event.
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    // Rotating the device crosses the (max-height: 480px) arm of the query.
    window.addEventListener("orientationchange", apply);
  }

  private releaseViewport(): void {
    const detach = this.viewportDetach;
    // Clear first: if detach() throws, the stale handle would otherwise make
    // the `if (this.viewportDetach) return` guard in syncViewport() refuse to
    // ever re-arm, and the panel would stop tracking the keyboard.
    this.viewportDetach = null;
    detach?.();
  }

  private setView(v: View): void { this.view = v; this.render(); }

  private render(): void {
    // Dispose of any live Turnstile widget before wiping its container —
    // render() re-fires on every view change AND every panel reopen
    // (toggle()), and ripping the widget's iframe out of the DOM without
    // this leaves Cloudflare's script tracking a dead widget ("Cannot find
    // Widget" in the console) — the NEXT widget it renders then silently
    // fails to verify, which is why "Start chatting" could do nothing.
    if (this.turnstileId && window.turnstile) {
      try { window.turnstile.remove(this.turnstileId); } catch { /* already gone */ }
    }
    this.turnstileId = null;
    // Read before the teardown below destroys the element that holds focus.
    const active = document.activeElement;
    this.composerWasFocused = !!active && (active as HTMLElement).classList?.contains("dvc-input");
    this.body.innerHTML = "";
    switch (this.view) {
      case "loading": return this.renderLoading();
      case "email": return this.renderEmail();
      case "otp": return this.renderOtp();
      case "chat": return this.renderChat();
      case "error": return this.renderError();
      case "blocked": return this.renderBlocked();
    }
  }

  /** Brief placeholder shown only until loadGateMode() resolves — no Turnstile
   * widget yet, since we don't know which screen (email vs captcha) to render. */
  private renderLoading(): void {
    const wrap = el("div", "dvc-pad dvc-center");
    wrap.appendChild(el("p", "dvc-muted", "Loading…"));
    this.body.appendChild(wrap);
  }

  private renderEmail(): void {
    const wrap = el("div", "dvc-pad");
    wrap.appendChild(el("p", "dvc-lead", "Hi! I'm Divinci. Enter your email for a few free messages — I can tell you what Divinci does, our API/SDK, and more."));
    const input = el("input", "dvc-input");
    input.type = "email";
    input.placeholder = "you@example.com";
    input.value = this.email;
    const ts = el("div", "dvc-turnstile");

    // Optional, GDPR-style marketing opt-in. Default OFF and NOT required to
    // chat — consent for marketing must be freely given, so it only governs
    // whether we may later add the email to a mailing list (#3 CRM ingest).
    const consentRow = el("label", "dvc-consent");
    const consent = el("input") as HTMLInputElement;
    consent.type = "checkbox";
    consent.checked = this.marketingConsent;
    // Same-origin policy link (works on staging + prod without hardcoding host).
    const consentText = el("span", "dvc-consent-text",
      `Email me occasional Divinci updates (optional). See our <a href="/privacy-policy/" target="_blank" rel="noopener noreferrer">privacy policy</a>.`);
    consentRow.append(consent, consentText);

    const btn = el("button", "dvc-btn", "Get my code");
    const err = el("p", "dvc-err");
    wrap.append(input, ts, consentRow, btn, err);
    this.body.appendChild(wrap);

    // Invisible / low-friction Turnstile: `interaction-only` means a human who
    // passes the silent bot check never sees a challenge — the token arrives
    // via the success callback. A challenge surfaces only when Cloudflare needs
    // one. error/expired callbacks just clear the token (re-verify at submit).
    this.turnstileToken = null;
    if (window.turnstile) {
      this.turnstileId = window.turnstile.render(ts, {
        sitekey: this.cfg.turnstileSiteKey,
        theme: "light",
        appearance: "interaction-only",
        callback: (token: string) => { this.turnstileToken = token; },
        "error-callback": () => { this.turnstileToken = null; },
        "expired-callback": () => { this.turnstileToken = null; },
      });
    } else {
      ts.innerHTML = `<small class="dvc-muted">Loading verification…</small>`;
    }

    btn.addEventListener("click", async () => {
      this.email = input.value.trim().toLowerCase();
      this.marketingConsent = consent.checked;
      const token = this.turnstileToken ?? window.turnstile?.getResponse(this.turnstileId ?? undefined);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) { err.textContent = "Please enter a valid email."; return; }
      if (!token) { err.textContent = "Please complete the verification check."; return; }
      btn.disabled = true; btn.textContent = "Sending…"; err.textContent = "";
      try {
        await this.client.freeChatGate.start({ releaseId: this.cfg.releaseId, email: this.email, turnstileToken: token, marketingConsent: this.marketingConsent });
        this.setView("otp");
      } catch (e) {
        // Server confirmed the bot check failed → hide the chat (strong signal,
        // unlike a flaky client-side error-callback). Other errors retry inline.
        if (this.looksLikeBotRejection(e)) { this.setView("blocked"); return; }
        err.textContent = this.errText(e, "Couldn't send the code. Please try again.");
        btn.disabled = false; btn.textContent = "Get my code";
        if (window.turnstile && this.turnstileId) window.turnstile.reset(this.turnstileId);
      }
    });
  }

  private renderOtp(): void {
    const wrap = el("div", "dvc-pad");
    const lead = el("p", "dvc-lead", "We emailed a 6-digit code to ");
    const strong = el("strong"); strong.textContent = this.email; // user input → textContent
    lead.appendChild(strong); lead.appendChild(document.createTextNode("."));
    wrap.appendChild(lead);
    const input = el("input", "dvc-input dvc-code");
    input.type = "text"; input.inputMode = "numeric"; input.maxLength = 6; input.placeholder = "123456";
    const btn = el("button", "dvc-btn", "Verify");
    const back = el("button", "dvc-link", "Use a different email");
    const err = el("p", "dvc-err");
    wrap.append(input, btn, back, err);
    this.body.appendChild(wrap);
    input.focus();

    btn.addEventListener("click", async () => {
      const code = input.value.trim();
      if (!/^\d{6}$/.test(code)) { err.textContent = "Enter the 6-digit code."; return; }
      btn.disabled = true; btn.textContent = "Verifying…"; err.textContent = "";
      try {
        await this.client.freeChatGate.verifyOtp({ email: this.email, otpCode: code });
        this.messages = [];
        this.setView("chat");
      } catch (e) {
        err.textContent = this.errText(e, "Incorrect or expired code.");
        btn.disabled = false; btn.textContent = "Verify";
      }
    });
    back.addEventListener("click", () => this.setView("email"));
  }

  private renderChat(): void {
    const wrap = el("div", "dvc-chat");
    const list = el("div", "dvc-messages");
    // role="log" + polite: replies stream in without any focus change, so
    // without this a screen reader user gets silence after pressing send.
    // Polite (not assertive) so it waits for a pause instead of interrupting.
    list.setAttribute("role", "log");
    list.setAttribute("aria-live", "polite");
    list.setAttribute("aria-relevant", "additions text");
    // Gate transcript index of the current assistant reply. The SDK's signed
    // transcript grows by one per SUCCESSFUL send, so the k-th completed,
    // non-error assistant message maps to transcript index k.
    let gateIdx = -1;
    for (const m of this.messages) {
      const node = el("div", `dvc-msg dvc-msg-${m.role}`);
      if (m.pending) {
        // animated "typing…" indicator — three dots bounce in a wave
        node.classList.add("dvc-typing");
        // Three bouncing dots convey "thinking" visually and nothing at all
        // otherwise, so give the node a text equivalent and hide the dots
        // themselves from the accessibility tree.
        node.setAttribute("role", "status");
        node.setAttribute("aria-label", "Divinci is typing");
        node.innerHTML = `<span class="dvc-dot" aria-hidden="true"></span><span class="dvc-dot" aria-hidden="true"></span><span class="dvc-dot" aria-hidden="true"></span>`;
      } else if (m.role === "assistant") {
        // AI reply → markdown rendered to sanitized HTML (escape-first)
        node.classList.add("dvc-md");
        node.innerHTML = renderMarkdown(m.text);
      } else {
        node.textContent = m.text; // user input → textContent, never innerHTML
      }
      list.appendChild(node);
      // Thumbs/feedback only on real (completed, non-error) assistant replies.
      if (m.role === "assistant" && !m.pending && !m.isError) {
        gateIdx += 1;
        list.appendChild(this.buildRating(m, gateIdx));
      }
    }
    if (this.messages.length === 0 && !this.exhausted) {
      // textContent, not el()'s third argument: el() assigns innerHTML, and
      // the greeting and starter labels are page-authored config now rather
      // than literals in this file. They are plain prose — nothing here needs
      // to be parsed as markup, so nothing here is.
      const greeting = el("div", "dvc-msg dvc-msg-assistant");
      greeting.textContent = GREETING;
      list.appendChild(greeting);
      const starters = el("div", "dvc-starters");
      for (const s of CONVERSATION_STARTERS) {
        const btn = el("button", "dvc-starter-btn");
        btn.textContent = s.label;
        btn.addEventListener("click", () => submitPrompt(s.message));
        starters.appendChild(btn);
      }
      list.appendChild(starters);
    }

    // Quota exhausted: keep the conversation on screen, swap the input row
    // for a sign-up CTA instead of wiping the panel down to a bare message.
    if (this.exhausted) {
      const exhaustedBox = el("div", "dvc-pad dvc-center");
      exhaustedBox.appendChild(el("p", "dvc-lead", "You've used your free messages 🎉"));
      exhaustedBox.appendChild(el("p", "dvc-muted", "Sign up free to keep chatting, build your own custom AI, and get an API key."));
      const cta = el("a", "dvc-btn dvc-cta");
      (cta as HTMLAnchorElement).href = this.cfg.signupUrl;
      (cta as HTMLAnchorElement).target = "_blank";
      (cta as HTMLAnchorElement).rel = "noopener";
      cta.textContent = "Sign up free";
      exhaustedBox.appendChild(cta);
      wrap.append(list, exhaustedBox);
      this.body.appendChild(wrap);
      list.scrollTop = list.scrollHeight;
      return;
    }

    const form = el("div", "dvc-inputrow");
    const input = el("input", "dvc-input");
    input.type = "text"; input.placeholder = "Ask Divinci…";
    const send = el("button", "dvc-send", icon("send"));
    send.setAttribute("aria-label", "Send message");
    send.title = "Send";
    form.append(input, send);
    const meta = el("p", "dvc-muted dvc-meta", this.remaining !== null ? `${this.remaining} free message${this.remaining === 1 ? "" : "s"} left` : "");
    if (this.voiceError) {
      const ve = el("p", "dvc-voice-err dvc-meta");
      ve.setAttribute("role", "status");
      ve.textContent = this.voiceError;
      wrap.appendChild(ve);
    }
    if (this.debugVoice && this.voiceDebug) {
      // A button, not a paragraph: this trace exists to be sent to someone,
      // and selecting 10px monospace on a phone to copy it is its own small
      // ordeal. One tap puts it on the clipboard.
      const vd = el("button", "dvc-voice-debug dvc-meta");
      vd.type = "button";
      vd.setAttribute("aria-label", "Copy voice diagnostics");
      const trace = this.voiceDebug;
      vd.textContent = `📋 ${trace}`;
      vd.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(trace);
        } catch {
          // Clipboard API needs a secure context and a permission iOS does not
          // always grant; the textarea route works where it does not.
          const ta = document.createElement("textarea");
          ta.value = trace;
          ta.style.cssText = "position:fixed;opacity:0";
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); } catch { /* nothing more to try */ }
          document.body.removeChild(ta);
        }
        vd.textContent = "✅ Copied — paste it into the chat";
        window.setTimeout(() => { if (vd.isConnected) vd.textContent = `📋 ${trace}`; }, 2500);
      });
      wrap.appendChild(vd);
    }
    wrap.append(list, meta, form);
    this.body.appendChild(wrap);
    list.scrollTop = list.scrollHeight;
    // On a touch device, only focus if the composer ALREADY had focus before
    // this re-render — i.e. the visitor is mid-conversation and the keyboard
    // is up, so we hand it back and typing continues. Focusing unconditionally
    // means opening the panel summons the keyboard immediately, which covers
    // the greeting and the starter prompts (and, before the 16px input rule,
    // fired iOS's focus zoom every single time the widget was opened).
    if (!isTouchLike() || this.composerWasFocused) input.focus();

    const submitPrompt = async (prompt: string) => {
      prompt = prompt.trim();
      if (!prompt) return;
      // Synchronously, while the click/Enter still counts as user activation:
      // the reply this send produces will be auto-spoken minutes later from an
      // async continuation, and iOS will only allow that on an element primed
      // right here.
      if (this.soundOn) this.ensureAudioUnlocked();
      input.value = "";
      this.messages.push({ role: "user", text: prompt });
      this.messages.push({ role: "assistant", text: "", pending: true });
      this.saveMessages();
      this.render();
      try {
        // captcha-only mode: the invisible widget warmed up when the panel
        // opened, but the gate session itself is only established here, on
        // first send — no separate "Start chatting" click. If the token
        // isn't ready yet (rare — interaction-only usually resolves in well
        // under a second), give it one brief retry before surfacing an error.
        if (!this.client.freeChatGate.isVerified()) {
          try {
            await this.ensureGateStarted();
          } catch (e) {
            if (!(e instanceof Error) || e.message !== "turnstile-pending") throw e;
            await new Promise((r) => setTimeout(r, 800));
            await this.ensureGateStarted();
          }
        }
        const { reply, remaining } = await this.client.freeChatGate.send(withPageContext(prompt));
        this.messages[this.messages.length - 1] = { role: "assistant", text: reply };
        this.remaining = remaining;
        this.saveMessages();
        this.render();
        this.autoSpeakLatest();
        // Lock input in place after the reply renders, rather than replacing
        // the whole panel — the conversation just had stays on screen.
        if (remaining <= 0) setTimeout(() => { this.exhausted = true; this.render(); }, 1500);
      } catch (e) {
        this.messages.pop(); // drop the "…" placeholder
        const status = (e as { status?: number })?.status;
        // 403 is recovered on the same path as 401. A single-use Turnstile
        // token that has already been redeemed is rejected by siteverify as
        // "timeout-or-duplicate", and the server reports that as a BARE 403
        // with no context — indistinguishable, from the client, from a real
        // bot rejection (see obtainGateTurnstileToken). Until now that fell
        // through every branch and surfaced to the visitor as the word
        // "Forbidden", with no way forward except clearing the conversation
        // by hand. A 403 the server did NOT explain is treated as a stale
        // session and retried once with a genuinely fresh token;
        // looksLikeBotRejection() still owns the explained ones below.
        const staleSession = status === 401 ||
          (status === 403 && !this.looksLikeBotRejection(e));
        if (staleSession) {
          this.client.freeChatGate.reset();
          if (this.mode === "captcha-only") {
            try {
              this.messages.push({ role: "assistant", text: "", pending: true });
              this.render();
              // refreshGateToken(), not ensureGateStarted(): the reset() above
              // cleared the SDK's session, but the widget still holds the
              // token that session was built from. Re-presenting it gets a
              // "timeout-or-duplicate" rejection from siteverify, so this
              // recovery could never actually recover.
              await this.refreshGateToken();
              const { reply, remaining } = await this.client.freeChatGate.send(withPageContext(prompt));
              this.messages[this.messages.length - 1] = { role: "assistant", text: reply };
              this.remaining = remaining;
              this.saveMessages();
              this.render();
              this.autoSpeakLatest();
              return;
            } catch (retryError) {
              this.messages.pop();
              this.saveMessages();
              e = retryError;
            }
          }
        }
        if (this.isQuota(e)) { this.exhausted = true; this.render(); return; }
        if (this.looksLikeBotRejection(e)) { this.setView("blocked"); return; }
        // "Forbidden" tells a visitor nothing and suggests nothing. When the
        // server declined without explaining, name the likely cause: on
        // mobile the usual one is a content blocker eating the verification
        // challenge, which the visitor can actually act on.
        const explained = typeof (e as { data?: { context?: unknown } })?.data?.context === "string";
        const msg = e instanceof Error && e.message === "turnstile-pending"
          ? "Still verifying — please try sending that again in a moment."
          : (status === 401 || status === 403) && !explained
            ? "Couldn't verify this browser, so that message wasn't sent. If you use a content blocker — Brave Shields, for example — allow challenges.cloudflare.com for this site, then try again."
            : this.errText(e, "Something went wrong. Please try again.");
        this.messages.push({ role: "assistant", text: msg, isError: true });
        this.saveMessages();
        this.render();
      }
    };
    send.addEventListener("click", () => submitPrompt(input.value));
    input.addEventListener("keydown", (ev) => { if ((ev as KeyboardEvent).key === "Enter") submitPrompt(input.value); });
  }

  // ───────────────────────── Voice playback ─────────────────────────
  //
  // Audio comes from the platform's Aura-2 voice (Cloudflare Workers AI,
  // `@cf/deepgram/aura-2-en`, speaker `phoebe`) via the release SDK's
  // freeChatGate.speak(). That call takes a transcript INDEX, not text — the
  // server only speaks replies the release itself signed — so everything here
  // is keyed on the gate transcript index, the same index the thumbs/feedback
  // buttons use.
  //
  // The browser's own speechSynthesis remains as a fallback. It sounds far
  // worse, but "no audio at all" is a worse outcome than "robotic audio" when
  // the network, the gate, or the platform is having a bad day.

  private syncSoundButton(): void {
    const on = this.soundOn;
    this.soundBtn.innerHTML = icon(on ? "volume" : "volume-off");
    this.soundBtn.classList.toggle("dvc-sound-on", on);
    const label = on ? "Turn voice off" : "Turn voice on";
    this.soundBtn.title = on
      ? "Voice is on — replies are read aloud"
      : "Voice is off — read replies aloud";
    this.soundBtn.setAttribute("aria-label", label);
    this.soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
  }

  private toggleSound(): void {
    this.soundOn = !this.soundOn;
    try {
      localStorage.setItem(SOUND_PREF_KEY + this.cfg.releaseId, this.soundOn ? "1" : "0");
    } catch {
      // Private browsing / full storage — the preference just won't persist.
    }
    this.syncSoundButton();
    // Still inside the toggle's click handler.
    if (this.soundOn) this.ensureAudioUnlocked();
    if (!this.soundOn) {
      this.stopPlayback();
      this.render();
      return;
    }
    // Turning sound ON mid-conversation: speak the most recent reply rather
    // than doing nothing visible. This click is the user gesture that makes
    // the play() call legal, so it must happen synchronously off the event.
    const lastIdx = this.client.freeChatGate.getTranscript().length - 1;
    if (lastIdx >= 0) {
      this.autoSpoken.add(lastIdx);
      void this.playMessage(lastIdx);
    } else {
      this.render();
    }
  }

  /**
   * With sound on, speak the reply that just arrived. No-op when sound is off
   * or when this reply has already been played — render() fires on a lot of
   * unrelated state changes and must never re-trigger audio.
   */
  private autoSpeakLatest(): void {
    if (!this.soundOn) return;
    const idx = this.client.freeChatGate.getTranscript().length - 1;
    if (idx < 0 || this.autoSpoken.has(idx)) return;
    this.autoSpoken.add(idx);
    void this.playMessage(idx);
  }

  /**
   * Get a fresh gate token WITHOUT calling freeChatGate.reset().
   *
   * A stored token outlives its server-side validity, so the first speak()
   * after a page sits open (or is reloaded into a restored conversation) comes
   * back 401 even though the conversation itself is perfectly good. send()
   * survives that because its recovery path re-sends the prompt and rebuilds
   * the transcript from scratch; speak() cannot, because reset() clears
   * `transcript` and `signiture` — the exact things it needs.
   *
   * The server verifies the token and the transcript signature INDEPENDENTLY
   * (the signature is checked against the release, not the session), so a new
   * token paired with the existing signed transcript is valid. start() only
   * assigns the token and leaves the transcript alone, which is what makes
   * this safe.
   *
   * Only possible in captcha-only mode — an OTP/magic-link release cannot
   * re-verify without the visitor doing something, so callers fall back to
   * the browser voice instead.
   */
  private async refreshGateToken(): Promise<void> {
    if (this.mode !== "captcha-only") throw new Error("gate-refresh-unavailable");
    // forceFresh: we are here BECAUSE a session was rejected, so whatever
    // token the widget still holds was already spent establishing it.
    const token = await this.obtainGateTurnstileToken(true);
    await this.client.freeChatGate.start({ releaseId: this.cfg.releaseId, turnstileToken: token });
    this.gateTurnstileToken = null; // single-use
  }

  /** Halt whatever is speaking, from either engine. */
  /**
   * Prime audio for iOS. MUST be called synchronously from a user gesture —
   * every caller is a click or a keydown handler, before any await.
   *
   * Two separate iOS problems are handled here:
   *
   *  1. Per-element playback permission (see audioEl). The silent WAV is
   *     played once so the element is blessed for later script-driven use.
   *
   *  2. The ring/silent switch. On iOS the default audio session behaves like
   *     "ambient", which means the hardware mute switch silences HTML5 audio
   *     outright — the page looks like it is playing, the progress runs, and
   *     nothing comes out of the speaker. That is why voice can work on a
   *     laptop and be inaudible on an iPhone sitting on silent. Declaring the
   *     session as "playback" opts into media semantics and ignores the
   *     switch, the same way a video or podcast app does.
   */
  private ensureAudioUnlocked(): void {
    type AudioSessionWindow = Navigator & { audioSession?: { type: string } };
    try {
      const session = (navigator as AudioSessionWindow).audioSession;
      if (session) session.type = "playback";
    } catch {
      // Safari < 16.4 and every non-WebKit engine: nothing to opt into.
    }
    if (this.audioEl) return;
    const el = new Audio();
    el.preload = "auto";
    // Keeps iOS from taking the clip fullscreen or handing it to the native
    // player, which would tear down the widget's own controls.
    el.setAttribute("playsinline", "");
    // Explicit, not assumed: a muted or zero-volume element plays "successfully"
    // and emits every event while producing no sound at all, which is exactly
    // the symptom being chased here.
    el.muted = false;
    el.volume = 1;
    // Attached to the document rather than left detached. iOS is documented to
    // treat orphaned media elements inconsistently, and a detached element is
    // one of the few states that can play silently without erroring. Kept
    // out of layout without display:none, which suppresses media in some
    // engines.
    el.style.cssText = "position:absolute;width:0;height:0;opacity:0;pointer-events:none";
    document.body.appendChild(el);
    el.src = SILENT_UNLOCK_WAV;
    void el.play().catch(() => {
      // Not fatal: a later in-gesture call gets another attempt, and the
      // browser-voice fallback is still there.
    });
    this.audioEl = el;
  }

  /**
   * Point the element at a source and resolve once sound is actually coming
   * out. `play()` resolving is not sufficient — a media element can accept
   * play() and then fail to decode, which arrives as an "error" event, so both
   * outcomes are raced here.
   */
  private playSource(audio: HTMLAudioElement, src: string, signal: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Bounded for the same reason the unlock wait is: this races "playing"
      // against "error", and iOS can deliver NEITHER — the element simply sits
      // there, play() never settles, and the promise is left pending forever.
      // That was the whole bug. Any wait on a media element has to have a
      // floor under it. 20s is generous enough to cover downloading a long
      // clip on mobile data.
      const timer = window.setTimeout(
        () => reject(new Error("playback-start-timeout")), 20000);
      const settle = <T>(fn: (v: T) => void) => (v: T) => { window.clearTimeout(timer); fn(v); };
      const ok = settle<void>(resolve);
      const fail = settle<Error>(reject);
      audio.addEventListener("error", () => fail(new Error(`media-error-${audio.error?.code ?? 0}`)),
        { once: true, signal });
      audio.addEventListener("playing", () => ok(undefined), { once: true, signal });
      audio.src = src;
      audio.play().catch(fail);
    });
  }

  /**
   * Reject rather than hang. A request that never settles leaves the widget
   * sitting in "playing" forever with no error and no sound — which from the
   * outside is indistinguishable from audio that plays silently, and those two
   * need completely different fixes.
   */
  private withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
      p,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`${label}-timeout-${ms}ms`)), ms)),
    ]);
  }

  private stopPlayback(): void {
    if (this.audio) {
      // Detach listeners BEFORE clearing the source. Assigning src = "" makes
      // the browser raise MEDIA_ELEMENT_ERROR ("Empty src attribute") on the
      // element, and the "error" listener attached in playMessage() cannot
      // tell that apart from a real failure — so pressing STOP used to start
      // the robotic browser voice, which is the opposite of stopping.
      this.audioEvents?.abort();
      this.audioEvents = null;
      this.audio.pause();
      // Pause only. Never clear src and never call load() on the shared
      // element: load() resets the media element, and on iOS that can revoke
      // the playback permission it earned inside a user gesture — which would
      // make the FIRST clip work and every later one fail silently. The next
      // playSource() assigns a fresh src anyway, so there is nothing to clean.
      try { this.audio.currentTime = 0; } catch { /* not seekable yet */ }
      this.audio = null;
    }
    try {
      if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel();
    } catch {
      // speechSynthesis is absent on some embedded browsers.
    }
    this.playingIdx = null;
  }

  /**
   * Speak one assistant reply. `gateIdx` is its index in the gate's signed
   * transcript. Safe to call while something else is playing — the previous
   * clip is stopped first, so two replies can never overlap.
   */
  private async playMessage(gateIdx: number): Promise<void> {
    const wasPlaying = this.playingIdx;
    this.stopPlayback();
    // Clicking the speaker on the clip that's already playing means "stop".
    if (wasPlaying === gateIdx) {
      this.render();
      return;
    }

    this.playingIdx = gateIdx;
    this.voiceError = null;
    this.voiceDebug = null;
    type AudioSessionNav = Navigator & { audioSession?: { type: string } };
    this.vlog(`session=${(navigator as AudioSessionNav).audioSession?.type ?? "n/a"}`);
    this.render();

    // Reuse the primed element rather than constructing one. On iOS only an
    // element that has already played inside a gesture may be played from
    // script, and this method is reached BOTH from a click (the speaker
    // button, the sound toggle) and from an async continuation (auto-speak
    // after a reply lands). ensureAudioUnlocked() is a no-op once primed, so
    // the gesture paths still prime it on their first use.
    this.ensureAudioUnlocked();
    const audio = this.audioEl as HTMLAudioElement;
    const unlocked = audio.play().then(() => true).catch(() => false);
    this.audio = audio;

    try {
      let result: { url: string };
      this.vlog(`requesting clip idx=${gateIdx}`);
      try {
        result = await this.withTimeout(this.client.freeChatGate.speak(gateIdx), 20000, "speak");
      } catch (err) {
        // Stale token → refresh in place and retry ONCE. Deliberately not
        // reset()+start(): reset() would wipe the signed transcript this call
        // is built on. See refreshGateToken().
        if ((err as { status?: number })?.status !== 401) throw err;
        this.vlog("401 — refreshing gate token");
        // Bounded: refreshGateToken() waits on a Turnstile token (itself
        // deadline-limited) and then a network start() call that is not.
        await this.withTimeout(this.refreshGateToken(), 20000, "gate-refresh");
        if (this.playingIdx !== gateIdx) { this.vlog("superseded during refresh"); return; }
        result = await this.withTimeout(this.client.freeChatGate.speak(gateIdx), 20000, "speak-retry");
      }
      const { url } = result;
      this.vlog("clip url received");
      // A stop (or another clip) may have landed while we were awaiting.
      if (this.playingIdx !== gateIdx) { this.vlog("superseded before unlock"); return; }
      // Let the unlock settle, then swap the silent clip for the real audio on
      // the SAME element so it keeps its user-initiated status.
      // BOUNDED. `unlocked` is the promise from play()-ing the silent primer
      // clip, and on iOS that promise can stay pending forever: WebKit only
      // settles it when playback actually begins, and neither resolves nor
      // rejects when the element quietly does nothing. A bare `await` here
      // deadlocked the whole method — the clip was fetched and then simply
      // never played, with no error, no sound, and a trace that stopped dead
      // at "clip url received". Confirmed from a real iPhone.
      //
      // Waiting was only ever a courtesy — to avoid swapping src out from
      // under an in-flight play() — and the element is already primed by
      // ensureAudioUnlocked() inside the user gesture, so there is nothing
      // here worth blocking on. Assigning a new src supersedes the pending
      // load anyway.
      const unlockOk = await Promise.race([
        unlocked,
        new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), 400)),
      ]);
      this.vlog(`unlock=${unlockOk}`);
      if (this.playingIdx !== gateIdx) { this.vlog("superseded after unlock"); return; }
      // Scoped to a controller so stopPlayback() can detach the handlers
      // atomically before it clears src (which otherwise fires "error").
      const events = new AbortController();
      this.audioEvents = events;
      audio.addEventListener("ended", () => {
        if (this.playingIdx === gateIdx) {
          this.playingIdx = null;
          this.audio = null;
          this.audioEvents = null;
          this.render();
        }
      }, { signal: events.signal });

      // Streamed straight from the URL. A buffered blob: retry used to sit
      // behind this, on the theory that iOS was refusing the clip over byte
      // ranges or Content-Type. The device disproved that: playback succeeds
      // on the first attempt (`streamed OK … ready=4 net=1 err=-`), the real
      // fault was the unlock deadlock above, and the retry never once ran. It
      // is gone rather than left as an untested path that also required
      // loosening media-src to allow blob:.
      audio.muted = false;
      audio.volume = 1;
      this.vlog(`url=${url.slice(0, 60)}`);
      await this.playSource(audio, url, events.signal);
      this.vlog(`streamed OK ${this.audioState(audio)}`);
        // "playing" fired, but that only means the pipeline started. Sample it
        // again shortly after: an element that reports playing while the clock
        // never advances is producing no sound, and nothing else reports that.
      // "playing" fired, but that only means the pipeline started. Sample it
      // again shortly after: an element that reports playing while the clock
      // never advances is producing no sound, and nothing else reports that.
      window.setTimeout(() => {
        if (this.playingIdx !== gateIdx) return;
        this.vlog(`+800ms ${this.audioState(audio)}`);
        const stalled = audio.currentTime === 0 && !audio.paused;
        if (stalled) this.voiceError = "Voice started but produced no sound.";
        // Repaint whenever there is something new to show. Gating this on
        // debug mode alone meant the stall notice was set and never painted
        // for ordinary visitors — an error message nobody could see.
        if (stalled || this.debugVoice) this.render();
      }, 800);
    } catch (err) {
      if (this.playingIdx !== gateIdx) return;
      console.warn("[divinci-chat] Divinci voice unavailable; using browser voice", err);
      const name = (err as { name?: string })?.name;
      const msg = (err as { message?: string })?.message ?? "";
      this.speakLocally(gateIdx,
        name === "NotAllowedError" ? "the browser blocked audio playback"
        : msg.startsWith("speak-timeout") ? "the voice service timed out"
        : msg.startsWith("playback-start-timeout") ? "playback never started"
        : msg.startsWith("gate-refresh-timeout") ? "the session could not be renewed"
        : msg.startsWith("media-error-") ? "the audio clip could not be decoded"
        : "the Divinci voice service did not respond");
    }
  }

  /**
   * Last-resort playback through the browser's built-in synthesizer. Reads
   * the rendered message text (the transcript reply and the on-screen message
   * are the same string) rather than re-requesting anything.
   */
  private speakLocally(gateIdx: number, reason?: string): void {
    this.audio = null;
    const text = this.assistantTextForGateIdx(gateIdx);
    if (!text || typeof window.speechSynthesis === "undefined") {
      this.playingIdx = null;
      this.voiceError = reason ? `Voice unavailable — ${reason}.` : "Voice unavailable on this device.";
      this.render();
      return;
    }
    // iOS refuses speechSynthesis outside a user gesture and reports nothing
    // when it does — speak() returns, no event fires, no sound is produced.
    // Every path that reaches this fallback has already awaited a network
    // call, so the gesture is long gone. Check whether it actually started
    // and say so if it did not, rather than leaving a dead speaker button.
    window.setTimeout(() => {
      if (this.playingIdx !== gateIdx) return;
      let started = false;
      try { started = !!(window.speechSynthesis.speaking || window.speechSynthesis.pending); } catch { /* absent */ }
      if (started) return;
      this.playingIdx = null;
      this.voiceError = reason
        ? `Voice unavailable — ${reason}.`
        : "Voice unavailable — this browser blocked playback.";
      this.render();
    }, 600);
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      const done = () => {
        if (this.playingIdx === gateIdx) {
          this.playingIdx = null;
          this.render();
        }
      };
      utterance.onend = done;
      utterance.onerror = done;
      this.playingIdx = gateIdx;
      window.speechSynthesis.speak(utterance);
      this.render();
    } catch {
      this.playingIdx = null;
      this.render();
    }
  }

  /**
   * Map a gate transcript index back to the rendered message text. The signed
   * transcript grows by one per SUCCESSFUL send, so the k-th completed,
   * non-error assistant message is transcript index k — the same mapping
   * renderChat() uses to attach rating controls.
   */
  private assistantTextForGateIdx(gateIdx: number): string | null {
    let k = -1;
    for (const m of this.messages) {
      if (m.role !== "assistant" || m.pending || m.isError) continue;
      k += 1;
      if (k === gateIdx) return m.text;
    }
    return null;
  }

  /**
   * Thumbs-up/down + optional feedback for one assistant reply. Routes through
   * the new SDK method client.freeChatGate.submitFeedback(messageIndex, …),
   * which reuses the gate's signed transcript. Positive votes are a local ack
   * (the server's negative-only gate would no-op them); thumbs-down reveals an
   * optional "what was wrong?" box and submits sentiment -1 + the text.
   */
  private buildRating(
    m: { text: string; rating?: -1 | 1; ratingDone?: boolean; ratingEmoji?: string },
    gateIdx: number,
  ): HTMLElement {
    const row = el("div", "dvc-rating");

    // Render active emoji reaction chip if present
    if (m.ratingEmoji) {
      const chip = el("span", "dvc-emoji-chip", m.ratingEmoji);
      chip.title = "Click to remove reaction";
      chip.addEventListener("click", () => {
        delete m.ratingEmoji;
        this.saveMessages();
        this.render();
      });
      row.appendChild(chip);
    }

    if (m.ratingDone) {
      const done = el("span", "dvc-rating-thanks");
      done.textContent = "Thanks for your feedback";
      row.appendChild(done);
      return row;
    }
    const up = el("button", "dvc-thumb" + (m.rating === 1 ? " dvc-thumb-on" : ""), icon("thumbs-up"));
    const down = el("button", "dvc-thumb" + (m.rating === -1 ? " dvc-thumb-on" : ""), icon("thumbs-down"));
    up.type = "button";
    up.title = "Good response";
    up.setAttribute("aria-label", "Good response");
    down.type = "button";
    down.title = "Bad response";
    down.setAttribute("aria-label", "Bad response");
    row.append(up, down);

    // COPY MESSAGE CONTENT BUTTON
    const copy = el("button", "dvc-thumb", icon("copy"));
    copy.type = "button";
    copy.title = "Copy message";
    copy.setAttribute("aria-label", "Copy message");
    copy.addEventListener("click", () => {
      navigator.clipboard.writeText(m.text).then(() => {
        copy.innerHTML = icon("check");
        setTimeout(() => { copy.innerHTML = icon("copy"); }, 1500);
      });
    });

    // READ ALOUD (TTS) BUTTON — Divinci's Aura-2 voice, browser voice as
    // fallback. Doubles as the stop control while this clip is playing.
    const playing = this.playingIdx === gateIdx;
    const speak = el("button", "dvc-thumb" + (playing ? " dvc-thumb-on" : ""), icon(playing ? "stop" : "volume"));
    speak.type = "button";
    speak.title = playing ? "Stop" : "Read aloud";
    speak.setAttribute("aria-label", playing ? "Stop reading" : "Read aloud");
    speak.addEventListener("click", () => {
      // An explicit play counts as "heard" — don't let sound-on then re-speak
      // the same reply over the top of it.
      this.autoSpoken.add(gateIdx);
      void this.playMessage(gateIdx);
    });

    // EMOJI REACTION POPUP BUTTON
    const react = el("button", "dvc-thumb", icon("smile"));
    react.type = "button";
    react.title = "React with emoji";
    react.setAttribute("aria-label", "React with emoji");
    react.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const existingPop = row.querySelector(".dvc-emoji-pop");
      if (existingPop) {
        existingPop.remove();
        return;
      }
      const pop = el("div", "dvc-emoji-pop");
      const emojis = ["❤️", "👏", "🔥", "💡", "🎉"];
      for (const emoji of emojis) {
        const btn = el("button", "dvc-emoji-pop-btn", emoji);
        btn.type = "button";
        btn.addEventListener("click", () => {
          m.ratingEmoji = emoji;
          this.saveMessages();
          pop.remove();
          this.render();
        });
        pop.appendChild(btn);
      }
      row.appendChild(pop);
    });

    row.append(copy, speak, react);

    up.addEventListener("click", () => {
      m.rating = 1;
      this.saveMessages();
      this.render();
    });

    down.addEventListener("click", () => {
      m.rating = -1;
      this.saveMessages();
      if (row.querySelector(".dvc-feedback-box")) return;
      down.classList.add("dvc-thumb-on");
      up.classList.remove("dvc-thumb-on");
      const box = el("div", "dvc-feedback-box");
      const ta = el("textarea", "dvc-feedback-input");
      ta.placeholder = "What was wrong? (optional)";
      ta.maxLength = 2000;
      const submitBtn = el("button", "dvc-feedback-submit", "Send feedback");
      submitBtn.type = "button";
      box.append(ta, submitBtn);
      row.appendChild(box);
      ta.focus();
      submitBtn.addEventListener("click", async () => {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
        try {
          await this.client.freeChatGate.submitFeedback(gateIdx, {
            sentiment: -1,
            feedback: ta.value.trim() || undefined,
          });
          m.ratingDone = true;
          this.saveMessages();
          this.render();
        } catch (err) {
          // NEVER swallow this silently. A bare `catch {}` here is what made the
          // signed-transcript bug invisible for as long as it lasted: the button
          // reverted to its idle label with no console error and no network
          // request, so it read as "the click did nothing".
          console.error("[Divinci] feedback submission failed:", err);
          submitBtn.disabled = false;
          submitBtn.textContent = "Send feedback";
          if (!box.querySelector(".dvc-feedback-err")) {
            const errEl = el("p", "dvc-feedback-err");
            errEl.textContent = "Couldn't send that — please try again.";
            box.appendChild(errEl);
          }
        }
      });
    });

    return row;
  }

  private renderError(): void {
    const wrap = el("div", "dvc-pad dvc-center");
    const e = el("p", "dvc-err"); e.textContent = this.errorMsg || "Something went wrong."; // dynamic → textContent
    wrap.appendChild(e);
    const retry = el("button", "dvc-btn", "Try again");
    retry.addEventListener("click", () => this.setView(
      this.client.freeChatGate.isVerified() || this.mode === "captcha-only" ? "chat" : "email",
    ));
    wrap.appendChild(retry);
    this.body.appendChild(wrap);
  }

  private renderBlocked(): void {
    const wrap = el("div", "dvc-pad dvc-center");
    wrap.appendChild(el("p", "dvc-lead", "We couldn't verify your browser 🛡️"));
    wrap.appendChild(el("p", "dvc-muted", "Automated traffic isn't allowed here. If you're a person, refresh the page and try again."));
    this.body.appendChild(wrap);
  }

  private isQuota(e: unknown): boolean {
    const status = (e as { status?: number })?.status;
    return status === 429;
  }

  /**
   * True only when the server confirmed the bot check FAILED (forged/invalid
   * Turnstile token) — the cue to hide the chat. Deliberately excludes
   * "verification-unavailable" (a server-config issue, not a bot) so a missing
   * secret doesn't masquerade as a blocked visitor. Heuristic on the server's
   * error context; tighten to the exact code once confirmed against /start.
   */
  private looksLikeBotRejection(e: unknown): boolean {
    const anyE = e as { status?: number; message?: string; data?: { context?: unknown; code?: unknown } };
    const ctx = typeof anyE?.data?.context === "string" ? anyE.data.context : "";
    const code = typeof anyE?.data?.code === "string" ? anyE.data.code : "";
    const hay = `${code} ${ctx} ${anyE?.message ?? ""}`.toLowerCase();
    if (hay.includes("unavailable")) return false; // server misconfig, not a bot
    return /(turnstile|captcha|\bbot\b)/.test(hay) || /verif\w*[\s-]?fail/.test(hay);
  }

  private errText(e: unknown, fallback: string): string {
    const anyE = e as { status?: number; message?: string; data?: { context?: unknown } };
    // The server sends a friendly message in the error context for 4xx cases.
    const ctx = anyE?.data?.context;
    if (typeof ctx === "string") return ctx;
    if (anyE?.status === 429) return "You've hit the limit — sign up free to keep chatting.";
    return anyE?.message || fallback;
  }
}

function boot(): void {
  if (window.__divinciChatBooted) return;
  const cfg = readConfig();
  if (!cfg) return;
  window.__divinciChatBooted = true;
  new DivinciChatWidget(cfg);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
