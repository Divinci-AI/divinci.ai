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

type View = "loading" | "email" | "otp" | "captcha" | "chat" | "exhausted" | "error" | "blocked";

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
const CONVERSATION_STARTERS: Array<{ label: string; message: string }> = [
  { label: "What is Divinci?", message: "What is Divinci AI?" },
  { label: "Connect an AI via MCP", message: "How do I connect Claude or Grok to Divinci over MCP?" },
  { label: "Compare pricing plans", message: "What's the difference between the Free, Starter, Pro, and Enterprise plans?" },
];

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, html?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html !== undefined) node.innerHTML = html;
  return node;
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
  private marketingConsent = false; // GDPR opt-in (optional); wired to CRM in #3
  private remaining: number | null = null;
  private errorMsg = "";
  // Learned async from getConfig(); null while unknown (treated as OTP mode,
  // the pre-existing default, so the widget degrades gracefully offline).
  private mode: GateMode | null = null;

  private root!: HTMLDivElement;
  private panel!: HTMLDivElement;
  private bubble!: HTMLButtonElement;
  private body!: HTMLDivElement;
  private messages: Array<{ role: "user" | "assistant"; text: string; pending?: boolean; rating?: -1 | 1; ratingDone?: boolean; isError?: boolean }> = [];

  constructor(cfg: WidgetConfig) {
    this.cfg = cfg;
    this.client = new DivinciClient({ releaseId: cfg.releaseId, baseUrl: cfg.apiBase });
    // Returning visitor: skip straight to chat if a verification token persists.
    if (this.client.freeChatGate.loadStoredToken(this.cfg.releaseId)) this.view = "chat";
    this.mount();
    this.loadGateMode();
  }

  /**
   * Learn the release's actual gate mode before rendering the first
   * "please verify" screen. The panel opens on a plain "loading" state (no
   * Turnstile) until this resolves — deliberately NOT a guess-then-correct
   * flow: rendering "email" first (its own Turnstile widget) and later
   * swapping to "captcha" (a second widget) left the first widget's iframe
   * torn out of the DOM without `turnstile.remove()`, and Cloudflare's script
   * doesn't tolerate that — every widget after the first silently stopped
   * verifying ("Cannot find Widget" in the console, "Start chatting" doing
   * nothing). Rendering exactly one view, once, with the mode already known,
   * avoids the double-render entirely.
   */
  private async loadGateMode(): Promise<void> {
    if (this.view !== "loading") return; // already on "chat" via a stored token
    try {
      const { mode } = await this.client.freeChatGate.getConfig(this.cfg.releaseId);
      this.mode = mode;
    } catch {
      // Network hiccup — fall back to the pre-existing email/OTP flow.
    }
    if (this.view === "loading") this.setView(this.mode === "captcha-only" ? "captcha" : "email");
  }

  private mount(): void {
    this.root = el("div", "dvc-root");
    this.bubble = el("button", "dvc-bubble", "💬");
    this.bubble.setAttribute("aria-label", "Chat with Divinci");
    this.bubble.addEventListener("click", () => this.toggle());

    this.panel = el("div", "dvc-panel dvc-hidden");
    const header = el("div", "dvc-header", `<span>Ask Divinci</span>`);
    const close = el("button", "dvc-close", "×");
    close.setAttribute("aria-label", "Close chat");
    close.addEventListener("click", () => this.toggle(false));
    header.appendChild(close);

    this.body = el("div", "dvc-body");
    this.panel.appendChild(header);
    this.panel.appendChild(this.body);
    this.root.appendChild(this.panel);
    this.root.appendChild(this.bubble);
    document.body.appendChild(this.root);
    this.upgradeBubbleToRobot();
    this.render();
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
    if (this.open) this.render();
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
      case "captcha": return this.renderCaptcha();
      case "chat": return this.renderChat();
      case "exhausted": return this.renderExhausted();
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

  /**
   * captcha-only mode: no email/OTP at all — a Turnstile pass is the whole
   * gate. start() (no email arg) returns a token immediately on success.
   */
  private renderCaptcha(): void {
    const wrap = el("div", "dvc-pad");
    wrap.appendChild(el("p", "dvc-lead", "Hi! I'm Divinci. Complete the quick check below to start chatting — no email needed."));
    const ts = el("div", "dvc-turnstile");
    const btn = el("button", "dvc-btn", "Start chatting");
    const err = el("p", "dvc-err");
    wrap.append(ts, btn, err);
    this.body.appendChild(wrap);

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
      const token = this.turnstileToken ?? window.turnstile?.getResponse(this.turnstileId ?? undefined);
      if (!token) { err.textContent = "Please complete the verification check."; return; }
      btn.disabled = true; btn.textContent = "Verifying…"; err.textContent = "";
      try {
        await this.client.freeChatGate.start({ releaseId: this.cfg.releaseId, turnstileToken: token });
        this.messages = [];
        this.setView("chat");
      } catch (e) {
        if (this.looksLikeBotRejection(e)) { this.setView("blocked"); return; }
        err.textContent = this.errText(e, "Couldn't verify. Please try again.");
        btn.disabled = false; btn.textContent = "Start chatting";
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
    if (this.messages.length === 0) {
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
    const form = el("div", "dvc-inputrow");
    const input = el("input", "dvc-input");
    input.type = "text"; input.placeholder = "Ask Divinci…";
    const send = el("button", "dvc-send", "→");
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
      this.render();
      try {
        const { reply, remaining } = await this.client.freeChatGate.send(prompt);
        this.messages[this.messages.length - 1] = { role: "assistant", text: reply };
        this.remaining = remaining;
        this.render();
        if (remaining <= 0) setTimeout(() => this.setView("exhausted"), 1500);
      } catch (e) {
        this.messages.pop(); // drop the "…" placeholder
        if (this.isQuota(e)) { this.setView("exhausted"); return; }
        this.messages.push({ role: "assistant", text: this.errText(e, "Something went wrong. Please try again."), isError: true });
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
    m: { rating?: -1 | 1; ratingDone?: boolean },
    gateIdx: number,
  ): HTMLElement {
    const row = el("div", "dvc-rating");
    if (m.ratingDone) {
      const done = el("span", "dvc-rating-thanks");
      done.textContent = "Thanks for your feedback";
      row.appendChild(done);
      return row;
    }
    const up = el("button", "dvc-thumb" + (m.rating === 1 ? " dvc-thumb-on" : ""), "👍");
    const down = el("button", "dvc-thumb" + (m.rating === -1 ? " dvc-thumb-on" : ""), "👎");
    up.type = "button";
    down.type = "button";
    row.append(up, down);

    up.addEventListener("click", () => {
      // Positive votes are a server-side no-op for the gate (negative-only),
      // so this is a local acknowledgement only.
      m.rating = 1;
      this.render();
    });

    down.addEventListener("click", () => {
      m.rating = -1;
      // Reveal the optional box inline (no full re-render, so typed text isn't
      // lost). Idempotent — a second click won't stack boxes.
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
          this.render();
        } catch {
          submitBtn.disabled = false;
          submitBtn.textContent = "Send feedback";
        }
      });
    });

    return row;
  }

  private renderExhausted(): void {
    const wrap = el("div", "dvc-pad dvc-center");
    wrap.appendChild(el("p", "dvc-lead", "You've used your free messages 🎉"));
    wrap.appendChild(el("p", "dvc-muted", "Sign up free to keep chatting, build your own custom AI, and get an API key."));
    const cta = el("a", "dvc-btn dvc-cta");
    (cta as HTMLAnchorElement).href = this.cfg.signupUrl;
    (cta as HTMLAnchorElement).target = "_blank";
    (cta as HTMLAnchorElement).rel = "noopener";
    cta.textContent = "Sign up free";
    wrap.appendChild(cta);
    this.body.appendChild(wrap);
  }

  private renderError(): void {
    const wrap = el("div", "dvc-pad dvc-center");
    const e = el("p", "dvc-err"); e.textContent = this.errorMsg || "Something went wrong."; // dynamic → textContent
    wrap.appendChild(e);
    const retry = el("button", "dvc-btn", "Try again");
    retry.addEventListener("click", () => this.setView(
      this.client.freeChatGate.isVerified() ? "chat" : this.mode === "captcha-only" ? "captcha" : "email",
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
