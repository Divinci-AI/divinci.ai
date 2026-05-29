/**
 * Divinci homepage free-chat widget — a floating chat bubble for divinci.ai.
 *
 * Email-gated, keyless public chat powered by @divinci-ai/client's
 * `homepageChat` namespace: a visitor verifies an email with a 6-digit OTP
 * (behind a Cloudflare Turnstile bot check) to earn a short-lived token, then
 * gets a few free messages with the pinned homepage assistant.
 *
 * Bundled (with the SDK inlined) by esbuild → /static/js/divinci-chat.js.
 * Config comes from data-* attributes on that script tag (see base.html).
 */
import { DivinciClient } from "@divinci-ai/client";

type View = "email" | "otp" | "chat" | "exhausted" | "error";

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
    };
    __divinciChatBooted?: boolean;
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
  return {
    apiBase: d.apiBase,
    releaseId: d.releaseId,
    turnstileSiteKey: d.turnstileSitekey,
    signupUrl: d.signupUrl || "https://app.divinci.app",
  };
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, html?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

class DivinciChatWidget {
  private readonly cfg: WidgetConfig;
  private readonly client: DivinciClient;
  private view: View = "email";
  private email = "";
  private open = false;
  private turnstileId: string | null = null;
  private remaining: number | null = null;
  private errorMsg = "";

  private root!: HTMLDivElement;
  private panel!: HTMLDivElement;
  private bubble!: HTMLButtonElement;
  private body!: HTMLDivElement;
  private messages: Array<{ role: "user" | "assistant"; text: string }> = [];

  constructor(cfg: WidgetConfig) {
    this.cfg = cfg;
    this.client = new DivinciClient({ releaseId: cfg.releaseId, baseUrl: cfg.apiBase });
    // Returning visitor: skip straight to chat if a verification token persists.
    if (this.client.homepageChat.loadStoredToken()) this.view = "chat";
    this.mount();
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
    this.render();
  }

  private toggle(force?: boolean): void {
    this.open = force ?? !this.open;
    this.panel.classList.toggle("dvc-hidden", !this.open);
    this.bubble.classList.toggle("dvc-bubble-open", this.open);
    if (this.open) this.render();
  }

  private setView(v: View): void { this.view = v; this.render(); }

  private render(): void {
    this.body.innerHTML = "";
    switch (this.view) {
      case "email": return this.renderEmail();
      case "otp": return this.renderOtp();
      case "chat": return this.renderChat();
      case "exhausted": return this.renderExhausted();
      case "error": return this.renderError();
    }
  }

  private renderEmail(): void {
    const wrap = el("div", "dvc-pad");
    wrap.appendChild(el("p", "dvc-lead", "Hi! I'm Divinci. Enter your email for a few free messages — I can tell you what Divinci does, our API/SDK, and more."));
    const input = el("input", "dvc-input");
    input.type = "email";
    input.placeholder = "you@example.com";
    input.value = this.email;
    const ts = el("div", "dvc-turnstile");
    const btn = el("button", "dvc-btn", "Get my code");
    const err = el("p", "dvc-err");
    wrap.append(input, ts, btn, err);
    this.body.appendChild(wrap);

    // Render Turnstile (managed widget) into the container.
    if (window.turnstile) {
      this.turnstileId = window.turnstile.render(ts, { sitekey: this.cfg.turnstileSiteKey, theme: "light" });
    } else {
      ts.innerHTML = `<small class="dvc-muted">Loading verification…</small>`;
    }

    btn.addEventListener("click", async () => {
      this.email = input.value.trim().toLowerCase();
      const token = window.turnstile?.getResponse(this.turnstileId ?? undefined);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) { err.textContent = "Please enter a valid email."; return; }
      if (!token) { err.textContent = "Please complete the verification check."; return; }
      btn.disabled = true; btn.textContent = "Sending…"; err.textContent = "";
      try {
        await this.client.homepageChat.verifyEmail(this.email, token);
        this.setView("otp");
      } catch (e) {
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
        await this.client.homepageChat.confirmEmail(this.email, code);
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
    for (const m of this.messages) {
      const node = el("div", `dvc-msg dvc-msg-${m.role}`);
      node.textContent = m.text; // dynamic (user + AI) content → textContent, never innerHTML
      list.appendChild(node);
    }
    if (this.messages.length === 0) {
      list.appendChild(el("div", "dvc-msg dvc-msg-assistant", "👋 Ask me anything about Divinci — custom AIs on your own data, our API/SDK/CLI/MCP, voice, or TrustBench."));
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

    const submit = async () => {
      const prompt = input.value.trim();
      if (!prompt) return;
      input.value = "";
      this.messages.push({ role: "user", text: prompt });
      this.messages.push({ role: "assistant", text: "…" });
      this.render();
      try {
        const { reply, remaining } = await this.client.homepageChat.send(prompt);
        this.messages[this.messages.length - 1] = { role: "assistant", text: reply };
        this.remaining = remaining;
        this.render();
        if (remaining <= 0) setTimeout(() => this.setView("exhausted"), 1500);
      } catch (e) {
        this.messages.pop(); // drop the "…" placeholder
        if (this.isQuota(e)) { this.setView("exhausted"); return; }
        this.messages.push({ role: "assistant", text: this.errText(e, "Something went wrong. Please try again.") });
        this.render();
      }
    };
    send.addEventListener("click", submit);
    input.addEventListener("keydown", (ev) => { if ((ev as KeyboardEvent).key === "Enter") submit(); });
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
    retry.addEventListener("click", () => this.setView(this.client.homepageChat.isVerified() ? "chat" : "email"));
    wrap.appendChild(retry);
    this.body.appendChild(wrap);
  }

  private isQuota(e: unknown): boolean {
    const status = (e as { status?: number })?.status;
    return status === 429;
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
