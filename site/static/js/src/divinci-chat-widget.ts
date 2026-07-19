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
const SPEECH_FALLBACK = "👋 Hi! I'm Divinci — ask me anything.";
const SPEECH_DWELL_MS = 2500;
const SPEECH_DEBOUNCE_MS = 300;
/** Hero bottom must clear this fraction of the viewport before the launcher fades in. */
const HERO_HIDE_BOTTOM_RATIO = 0.72;

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
  "stop": '<rect width="14" height="14" x="5" y="5" rx="2"/>',
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
  private heroScrollRaf = 0;
  private messages: Array<{ role: "user" | "assistant"; text: string; pending?: boolean; rating?: -1 | 1; ratingDone?: boolean; isError?: boolean; ratingEmoji?: string }> = [];

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
    
    // Returning visitor: skip straight to chat if a verification token persists.
    if (this.client.freeChatGate.loadStoredToken(this.cfg.releaseId)) this.view = "chat";
    this.mount();
    this.loadGateMode();
  }

  private saveMessages(): void {
    try {
      localStorage.setItem("divinci-chat-history:" + this.cfg.releaseId, JSON.stringify(this.messages));
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
    if (this.view !== "loading") return; // already on "chat" via a stored token
    try {
      const { mode } = await this.client.freeChatGate.getConfig(this.cfg.releaseId);
      this.mode = mode;
    } catch {
      // Network hiccup — fall back to the pre-existing email/OTP flow.
    }
    if (this.view !== "loading") return;
    if (this.mode === "captcha-only") {
      if (!this.messages || this.messages.length === 0) {
        this.messages = [];
      }
      this.setView("chat");
      this.ensureTurnstileRendered();
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

  /** Establishes the freeChatGate session once, consuming one invisible-widget
   * token — called lazily on first send rather than behind an explicit button.
   * Throws "turnstile-pending" if the token isn't ready yet; callers retry. */
  private async ensureGateStarted(): Promise<void> {
    if (this.mode !== "captcha-only" || this.client.freeChatGate.isVerified()) return;
    this.ensureTurnstileRendered();
    const token = this.gateTurnstileToken
      ?? (this.gateTurnstileId ? window.turnstile?.getResponse(this.gateTurnstileId) : undefined);
    if (!token) throw new Error("turnstile-pending");
    await this.client.freeChatGate.start({ releaseId: this.cfg.releaseId, turnstileToken: token });
    this.gateTurnstileToken = null; // single-use; the session token carries subsequent sends
  }

  private mount(): void {
    this.root = el("div", "dvc-root");
    this.bubble = el("button", "dvc-bubble", "💬");
    this.bubble.setAttribute("aria-label", "Chat with Divinci");
    this.bubble.addEventListener("click", () => this.toggle());

    this.panel = el("div", "dvc-panel dvc-hidden");
    const header = el("div", "dvc-header", `<span>Ask Divinci</span>`);
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
        this.messages = [];
        localStorage.removeItem("divinci-chat-history:" + this.cfg.releaseId);
        this.client.freeChatGate.reset();
        this.setView("chat");
        this.render();
      }
    });

    const close = el("button", "dvc-close", icon("x"));
    close.setAttribute("aria-label", "Close chat");
    close.addEventListener("click", () => this.toggle(false));
    
    headerActions.append(handoffBtn, clearBtn, close);
    header.appendChild(headerActions);

    this.body = el("div", "dvc-body");
    this.tsMount = el("div", "dvc-turnstile-invisible");
    this.tsMount.style.display = "none";
    this.panel.appendChild(header);
    this.panel.appendChild(this.body);
    this.panel.appendChild(this.tsMount);
    this.root.appendChild(this.panel);
    this.root.appendChild(this.bubble);
    this.mountSpeechBubble();
    document.body.appendChild(this.root);
    this.startHeroScrollGate();
    this.upgradeBubbleToRobot();
    this.render();
  }

  /**
   * On pages with a hero, keep the launcher hidden at the top so it doesn't
   * compete with the hero composition — then fade it in once the second
   * section enters view. Pages without a hero show the robot immediately.
   */
  private startHeroScrollGate(): void {
    this.heroEl = document.querySelector("section.hero");
    if (!this.heroEl) return;

    this.root.classList.add("dvc-hero-hidden");
    this.root.setAttribute("aria-hidden", "true");
    this.bubble.tabIndex = -1;
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
    if (!this.heroEl) return;
    // Stay visible while the panel is open so closing at the top doesn't
    // yank the chat away mid-conversation.
    if (this.open) {
      this.root.classList.remove("dvc-hero-hidden");
      this.root.removeAttribute("aria-hidden");
      this.bubble.tabIndex = 0;
      return;
    }
    const bottom = this.heroEl.getBoundingClientRect().bottom;
    const pastHero = bottom < window.innerHeight * HERO_HIDE_BOTTOM_RATIO;
    const wasHidden = this.root.classList.contains("dvc-hero-hidden");
    this.root.classList.toggle("dvc-hero-hidden", !pastHero);
    if (pastHero) {
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

  private toggle(force?: boolean): void {
    this.open = force ?? !this.open;
    this.panel.classList.toggle("dvc-hidden", !this.open);
    this.bubble.classList.toggle("dvc-bubble-open", this.open);
    this.root.classList.toggle("dvc-chat-open", this.open);
    if (this.open) this.render();
    // Closing at the hero top should re-hide the launcher.
    this.syncHeroScrollGate();
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
    // Gate transcript index of the current assistant reply. The SDK's signed
    // transcript grows by one per SUCCESSFUL send, so the k-th completed,
    // non-error assistant message maps to transcript index k.
    let gateIdx = -1;
    for (const m of this.messages) {
      const node = el("div", `dvc-msg dvc-msg-${m.role}`);
      if (m.pending) {
        // animated "typing…" indicator — three dots bounce in a wave
        node.classList.add("dvc-typing");
        node.innerHTML = `<span class="dvc-dot"></span><span class="dvc-dot"></span><span class="dvc-dot"></span>`;
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
      list.appendChild(el("div", "dvc-msg dvc-msg-assistant",
        "👋 Hi, I'm Divinci! Ask me anything — what the platform does, how to get started, our API/SDK/CLI/MCP, or how to connect Claude, Grok, Perplexity, or Mistral."));
      const starters = el("div", "dvc-starters");
      for (const s of CONVERSATION_STARTERS) {
        const btn = el("button", "dvc-starter-btn", s.label);
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
    wrap.append(list, meta, form);
    this.body.appendChild(wrap);
    list.scrollTop = list.scrollHeight;
    input.focus();

    const submitPrompt = async (prompt: string) => {
      prompt = prompt.trim();
      if (!prompt) return;
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
        const { reply, remaining } = await this.client.freeChatGate.send(prompt);
        this.messages[this.messages.length - 1] = { role: "assistant", text: reply };
        this.remaining = remaining;
        this.saveMessages();
        this.render();
        // Lock input in place after the reply renders, rather than replacing
        // the whole panel — the conversation just had stays on screen.
        if (remaining <= 0) setTimeout(() => { this.exhausted = true; this.render(); }, 1500);
      } catch (e) {
        this.messages.pop(); // drop the "…" placeholder
        const status = (e as { status?: number })?.status;
        if (status === 401) {
          this.client.freeChatGate.reset();
          if (this.mode === "captcha-only") {
            try {
              this.messages.push({ role: "assistant", text: "", pending: true });
              this.render();
              await this.ensureGateStarted();
              const { reply, remaining } = await this.client.freeChatGate.send(prompt);
              this.messages[this.messages.length - 1] = { role: "assistant", text: reply };
              this.remaining = remaining;
              this.saveMessages();
              this.render();
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
        const msg = e instanceof Error && e.message === "turnstile-pending"
          ? "Still verifying — please try sending that again in a moment."
          : this.errText(e, "Something went wrong. Please try again.");
        this.messages.push({ role: "assistant", text: msg, isError: true });
        this.saveMessages();
        this.render();
      }
    };
    send.addEventListener("click", () => submitPrompt(input.value));
    input.addEventListener("keydown", (ev) => { if ((ev as KeyboardEvent).key === "Enter") submitPrompt(input.value); });
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

    // READ ALOUD (TTS) BUTTON
    const speak = el("button", "dvc-thumb", icon("volume"));
    speak.type = "button";
    speak.title = "Read aloud";
    speak.setAttribute("aria-label", "Read aloud");
    speak.addEventListener("click", () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        speak.innerHTML = icon("volume");
        return;
      }
      speak.innerHTML = icon("stop");
      const utterance = new SpeechSynthesisUtterance(m.text);
      utterance.onend = () => { speak.innerHTML = icon("volume"); };
      utterance.onerror = () => { speak.innerHTML = icon("volume"); };
      window.speechSynthesis.speak(utterance);
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
        } catch {
          submitBtn.disabled = false;
          submitBtn.textContent = "Send feedback";
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
