/**
 * Divinci AI Cloudflare Worker
 * Serves static Zola site with enhanced features and email handling
 */

import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

/**
 * Inject the Cloudflare-derived ISO country code into the <meta name="cf-country">
 * tag so the inline gating script in base.html can decide whether to load the
 * Instantly/Leadsy marketing tag without consent (non-EU) or wait for consent (EU).
 * HTMLRewriter streams, so this is essentially free on HTML responses.
 */
function injectCfCountry(response, request) {
  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.includes('text/html')) return response;

  const country = (request.cf && request.cf.country) || '';
  return new HTMLRewriter()
    .on('meta[name="cf-country"]', {
      element(element) {
        element.setAttribute('content', country);
      },
    })
    .transform(response);
}

/**
 * Rewrite absolute base URLs in HTML responses to use the current host.
 * This makes preview/dev/staging deployments work without rebuilding.
 * The BASE_URL env var tells us what Zola baked into the HTML at build time.
 */
async function rewriteBaseUrls(response, requestUrl, env) {
  const builtBaseUrl = env.BASE_URL || 'https://divinci.ai';
  const currentOrigin = requestUrl.origin;

  // Skip rewriting if we're already on the expected domain
  if (currentOrigin === builtBaseUrl) {
    return response;
  }

  const contentType = response.headers.get('Content-Type') || '';
  // Only rewrite HTML responses
  if (!contentType.includes('text/html')) {
    return response;
  }

  let html = await response.text();
  // Replace build-time base URL with current origin
  html = html.replaceAll(builtBaseUrl, currentOrigin);

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Redirect www to apex domain
    if (url.hostname === 'www.divinci.ai') {
      return Response.redirect(`https://divinci.ai${url.pathname}${url.search}`, 301);
    }

    // CSP violation reports are POSTed here. Modern browsers also use the
    // Reporting-Endpoints + report-to mechanism; we list both for coverage.
    const cspReportPath = '/api/csp-report';
    const cspReportUrl = `${url.origin}${cspReportPath}`;

    // Add security headers
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      // SAMEORIGIN (not DENY) so we can embed our own /vindex-viewer.html
      // in shortcodes and homepage previews. Cross-origin framing is still
      // blocked by browsers and reinforced by `frame-ancestors 'self'` in
      // the CSP below.
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      'Reporting-Endpoints': `csp-endpoint="${cspReportUrl}"`,
      'Content-Security-Policy': `default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com https://cdn.jsdelivr.net https://r2.leadsy.ai https://tag.trovo-tag.com https://js.hs-scripts.com https://js.hs-analytics.net https://js.hs-banner.com https://js.hscollectedforms.net; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; connect-src 'self' https: data:; media-src 'self' https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev; frame-src 'self' https://www.google.com/maps/ https://challenges.cloudflare.com https://tag.trovo-tag.com https://www.youtube.com https://www.youtube-nocookie.com https://cloudflare.tv; frame-ancestors 'self'; report-uri ${cspReportPath}; report-to csp-endpoint;`,
    };

    // Handle CSP violation reports: lightweight log endpoint. Browser sends
    // application/csp-report (legacy) or application/reports+json (Reporting API).
    if (url.pathname === cspReportPath && request.method === 'POST') {
      try {
        const body = await request.text();
        console.warn('[csp-violation]', body.slice(0, 4096));
      } catch (e) {
        // Don't let a malformed report take down the endpoint
      }
      return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    }

    // Handle robots.txt
    if (url.pathname === '/robots.txt') {
      return new Response(`User-agent: *
Allow: /

Sitemap: ${url.origin}/sitemap.xml`, {
        headers: {
          'Content-Type': 'text/plain',
          ...securityHeaders
        }
      });
    }

    // Handle sitemap.xml redirect
    if (url.pathname === '/sitemap.xml') {
      return Response.redirect(`${url.origin}/sitemap/index.html`, 301);
    }

    // Handle contact form API
    if (url.pathname === '/api/contact') {
      return handleContactForm(request, env);
    }

    // Public system status, read from Datadog monitor state. Same-origin, so
    // the footer indicator and /status page need no CORS proxy.
    if (url.pathname === '/api/status') {
      return handleStatus(request, env, ctx);
    }

    // Language redirect logic for non-default languages
    // English content lives at root (Zola default language), so no redirect needed for /
    if (url.pathname === '/') {
      const acceptLanguage = request.headers.get('Accept-Language') || '';
      const nonDefaultLanguages = ['es', 'fr', 'ar'];

      for (const lang of nonDefaultLanguages) {
        if (acceptLanguage.toLowerCase().startsWith(lang)) {
          return Response.redirect(`${url.origin}/${lang}/`, 302);
        }
      }
      // English or unknown — fall through to serve root index.html
    }

    // Per-route Early Hints. When the CF dashboard toggle "Early Hints" is on,
    // Cloudflare reads Link rel=preload response headers and sends them as a
    // 103 Early Hints response before the worker's HTML body arrives — the
    // browser can start fetching the LCP image during server think time,
    // saving ~100-200ms LCP. Harmless when the toggle is off (browsers ignore
    // the extra Link headers on the final 200 response).
    // Keep this list short — only ABOVE-FOLD critical assets.
    let earlyHintsLink = null;
    if (url.pathname === '/' || /^\/(es|fr|ar|de|it|pt|ru|ja|zh|ko|nl|hi)\/?$/.test(url.pathname)) {
      // Homepage hero image (LCP element). Same across all language variants.
      // imagesrcset + imagesizes lets the browser preload the variant that
      // matches the viewport (400w on phones, 600w on tablets, 800w on desktop)
      // — matches the <img srcset> in templates/index.html exactly.
      earlyHintsLink = [
        `<${url.origin}/images/davinci-painter-robot-800w.webp>; rel=preload; as=image; imagesrcset="${url.origin}/images/davinci-painter-robot-400w.webp 400w, ${url.origin}/images/davinci-painter-robot-600w.webp 600w, ${url.origin}/images/davinci-painter-robot-800w.webp 800w"; imagesizes="(max-width: 600px) 100vw, (max-width: 900px) 600px, 800px"`,
        `<${url.origin}/css/style.css>; rel=preload; as=style`,
      ].join(', ');
    } else if (/^\/(.*\/)?api\/?$/.test(url.pathname)) {
      // /api/ pages: preload the Redoc bundle so it's in cache by the time DCL fires.
      earlyHintsLink = `<${url.origin}/js/redoc.standalone.js>; rel=preload; as=script`;
    }

    // Try to serve the static asset
    try {
      const response = await env.ASSETS.fetch(request);

      // If we got a successful response, add security headers
      if (response.status < 400) {
        // Build headers via the Headers API so case-sensitive keys merge
        // correctly. Previously `Cache-Control` (caps) + spread `cache-control`
        // (lower from upstream) both ended up in the plain-object literal,
        // and the platform picked the upstream value — so static assets were
        // shipping with the worker's `max-age=0` default instead of our
        // `max-age=31536000`. Result: Lighthouse re-fetched posters every
        // page load instead of using browser cache, costing ~200-500ms LCP.
        const newResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
        Object.entries(securityHeaders).forEach(([k, v]) => newResponse.headers.set(k, v));
        // Note .webp added to the immutable list (was missing, so 1080p hero
        // posters were shipping with max-age=3600 even on the happy path).
        const isStaticAsset = url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot|ico|webm|mp4|avif)$/);
        newResponse.headers.set(
          'Cache-Control',
          isStaticAsset ? 'public, max-age=31536000, immutable' : 'public, max-age=3600'
        );
        if (earlyHintsLink) newResponse.headers.set('Link', earlyHintsLink);

        // Inject Cloudflare country code into the cf-country meta tag, then
        // rewrite absolute URLs (no-op in production where origin matches BASE_URL).
        const withCountry = injectCfCountry(newResponse, request);
        return rewriteBaseUrls(withCountry, url, env);
      }
      
      // If 404, try to serve custom 404 page
      if (response.status === 404) {
        const custom404 = await env.ASSETS.fetch(new Request(`${url.origin}/404.html`));
        if (custom404.status === 200) {
          return new Response(custom404.body, {
            status: 404,
            headers: {
              'Content-Type': 'text/html',
              ...securityHeaders
            }
          });
        }
      }
      
      return response;
    } catch (error) {
      // Fallback error response
      return new Response('Internal Server Error', {
        status: 500,
        headers: securityHeaders
      });
    }
  }
};

/**
 * Handle contact form submissions
 */
async function handleContactForm(request, env) {
  const allowedOrigins = ['https://divinci.ai', 'https://dev.divinci.ai', 'https://staging.divinci.ai'];
  const requestOrigin = request.headers.get('Origin') || '';
  const corsOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : 'https://divinci.ai';

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Only handle POST requests
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // Parse form data
    const formData = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'subject', 'message'];
    const missingFields = requiredFields.filter(field => !formData[field] || formData[field].trim() === '');
    
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: ' + missingFields.join(', ') 
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': corsOrigin
          }
        }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid email address' 
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': corsOrigin
          }
        }
      );
    }

    // Get client information
    const clientIP = request.headers.get('CF-Connecting-IP') || '';
    const userAgent = request.headers.get('User-Agent') || '';

    // Basic rate limiting (5 submissions per IP per hour)
    const rateLimitKey = `rate_limit:${clientIP}:${Math.floor(Date.now() / (1000 * 60 * 60))}`;
    const currentCount = parseInt(await env.KV?.get(rateLimitKey) || '0');
    if (currentCount >= 5) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Too many requests. Please try again later.' 
        }),
        { 
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': corsOrigin
          }
        }
      );
    }

    // Verify Turnstile token (if secret key is configured)
    const turnstileToken = formData['cf-turnstile-response'];
    if (env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Security verification required'
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': corsOrigin
            }
          }
        );
      }

      // Verify the Turnstile token with Cloudflare
      const turnstileVerifyData = new FormData();
      turnstileVerifyData.append('secret', env.TURNSTILE_SECRET_KEY);
      turnstileVerifyData.append('response', turnstileToken);
      turnstileVerifyData.append('remoteip', clientIP);

      const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: turnstileVerifyData,
      });

      const turnstileResult = await turnstileResponse.json();
      if (!turnstileResult.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Security verification failed. Please try again.'
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': corsOrigin
            }
          }
        );
      }
    }
    
    // Sanitize fields to prevent email header injection
    const sanitize = (str) => str.replace(/[\r\n]/g, ' ').trim();
    const safeName = sanitize(formData.name);
    const safeSubject = sanitize(formData.subject);

    // Create email content
    const emailSubject = `Contact Form: ${safeSubject}`;
    const emailBody = `
New contact form submission from divinci.ai:

Name: ${safeName}
Email: ${formData.email}
Company: ${formData.company || 'Not specified'}
Subject: ${safeSubject}

Message:
${formData.message}

---
Technical Details:
IP: ${clientIP}
User Agent: ${userAgent}
Timestamp: ${new Date().toISOString()}
    `.trim();

    // Create MIME message
    const msg = createMimeMessage();
    msg.setSender({ 
      name: 'Divinci AI Contact Form', 
      addr: 'contact@divinci.net' 
    });
    msg.setRecipient('support@divinci.net');
    msg.setSubject(emailSubject);
    // Only set Reply-To if email passes strict validation (no CRLF injection)
    const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (formData.email && strictEmailRegex.test(formData.email) && !formData.email.includes('\r') && !formData.email.includes('\n')) {
      try {
        msg.setHeader('Reply-To', formData.email);
      } catch (e) {
        // Invalid Reply-To header, skip silently
      }
    }
    msg.addMessage({
      contentType: 'text/plain',
      data: emailBody
    });

    // Create EmailMessage and send
    const emailMessage = new EmailMessage(
      'contact@divinci.net',
      'support@divinci.net', 
      msg.asRaw()
    );

    // Send email using Cloudflare Email Routing
    await env.CONTACT_EMAIL.send(emailMessage);

    // Update rate limit counter after successful submission
    if (env.KV) {
      await env.KV.put(rateLimitKey, (currentCount + 1).toString(), { expirationTtl: 3600 });
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Thank you! Your message has been sent successfully. We will get back to you within 24 hours.' 
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin
        }
      }
    );

  } catch (error) {
    console.error('Email sending error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to send message. Please try again later.' 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin
        }
      }
    );
  }
}
// ─────────────────────────────────────────────────────────────────────────
// Public system status (/api/status)
//
// Reads live Datadog monitor state and maps it to customer-facing components.
// Same-origin, so /status and the footer indicator consume it directly.
//
// DESIGN RULE — do not "fix" this by defaulting to operational: any state we
// cannot positively verify resolves to `unknown`, never `operational`. A green
// dot that cannot go red is an unsubstantiated claim, which is exactly what we
// removed from /security. `unknown` is a correct, honest answer.
//
// COMPONENT MAPPING: the backing monitors are Cloudflare zone-wide metrics
// spanning divinci.app AND divinci.ai together, so they cannot currently
// distinguish per-service health. One honest component is therefore better
// than four that would move in lockstep and mislabel the cause. When the
// content-matched GCP uptime checks are mirrored into Datadog (see
// docs/ops/STATUS_PAGE_OPTIONS.md in the server repo), add per-service
// components here — it is a config change, nothing else.
const STATUS_COMPONENTS = [
  {
    id: 'platform',
    name: 'Platform',
    description: 'Chat, API, and web — edge and origin availability',
    monitors: [
      // Cloudflare cannot reach origin (522/523/524/530) — a real outage.
      { id: 20807650, onAlert: 'major_outage' },
      // Elevated 5xx — degraded but generally still serving.
      { id: 20807649, onAlert: 'degraded' },
    ],
  },
];

// Ranked worst-last. `unknown` deliberately outranks `operational` so missing
// data never presents as healthy.
const STATUS_RANK = { operational: 0, unknown: 1, degraded: 2, partial_outage: 3, major_outage: 4 };
const worstStatus = (a, b) => (STATUS_RANK[b] > STATUS_RANK[a] ? b : a);

function monitorStateToStatus(overallState, onAlert) {
  switch (overallState) {
    case 'OK': return 'operational';
    case 'Alert': return onAlert;
    case 'Warn': return 'degraded';
    // 'No Data' / 'Skipped' / 'Unknown' / anything unrecognized: we genuinely
    // do not know, so say so.
    default: return 'unknown';
  }
}

function statusPayload(overall, components, extra) {
  return JSON.stringify({
    status: overall,
    components,
    updatedAt: new Date().toISOString(),
    source: 'datadog-monitors',
    ...extra,
  });
}

// ── 90-day uptime history ────────────────────────────────────────────────
//
// Stored as ONE rolled-up KV record (one read + at most one write per sample)
// rather than a key per day, which would mean 90 reads per request.
//
// Sampling is driven by /api/status traffic — the footer indicator on every
// page view keeps it fed — and rate-limited to one write per SAMPLE_INTERVAL.
// This avoids depending on a cron trigger (see
// feedback_cf_worker_schedules_put_fails: the schedules PUT is unreliable on
// this account, and there's a 3-trigger cap per worker).
const HISTORY_KEY = 'history:v1';
const HISTORY_DAYS = 90;
const SAMPLE_INTERVAL_MS = 5 * 60 * 1000;

const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

async function recordSample(env, status) {
  if (!env.STATUS_HISTORY) return;
  try {
    const now = Date.now();
    const raw = await env.STATUS_HISTORY.get(HISTORY_KEY, { type: 'json' });
    const rec = raw && typeof raw === 'object' ? raw : { days: {}, lastSampleAt: 0, since: dayKey(now) };
    if (!rec.days) rec.days = {};

    // Rate-limit writes; a status CHANGE always samples immediately so a short
    // outage can't be missed between intervals.
    const today = rec.days[dayKey(now)];
    const changed = !today || (today.worst && today.worst !== status && STATUS_RANK[status] > STATUS_RANK[today.worst]);
    if (!changed && rec.lastSampleAt && now - rec.lastSampleAt < SAMPLE_INTERVAL_MS) return;

    const k = dayKey(now);
    const d = rec.days[k] || { ok: 0, degraded: 0, outage: 0, unknown: 0, worst: 'operational' };
    if (status === 'operational') d.ok++;
    else if (status === 'degraded') d.degraded++;
    else if (status === 'unknown') d.unknown++;
    else d.outage++; // partial_outage | major_outage
    d.worst = worstStatus(d.worst || 'operational', status);
    rec.days[k] = d;
    rec.lastSampleAt = now;
    if (!rec.since) rec.since = k;

    // Prune anything outside the window so the record can't grow unbounded.
    const cutoff = dayKey(now - HISTORY_DAYS * 86400000);
    for (const key of Object.keys(rec.days)) if (key < cutoff) delete rec.days[key];

    await env.STATUS_HISTORY.put(HISTORY_KEY, JSON.stringify(rec));
  } catch (e) {
    // History is a nice-to-have; never let it break the status response.
    console.error('[status] history write failed:', e && e.message ? e.message : e);
  }
}

async function readHistory(env) {
  if (!env.STATUS_HISTORY) return null;
  try {
    const rec = await env.STATUS_HISTORY.get(HISTORY_KEY, { type: 'json' });
    if (!rec || !rec.days) return { days: [], since: null, uptimePct: null };

    const out = [];
    const now = Date.now();
    for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
      const k = dayKey(now - i * 86400000);
      const d = rec.days[k];
      if (!d) {
        // No samples that day: explicitly "no data", NOT a green bar.
        out.push({ date: k, status: 'no_data', uptimePct: null });
        continue;
      }
      // `unknown` samples are excluded from the denominator — they mean we
      // could not measure, which is not the same as downtime.
      const measured = d.ok + d.degraded + d.outage;
      out.push({
        date: k,
        status: measured === 0 ? 'no_data' : d.worst,
        uptimePct: measured === 0 ? null : Math.round((d.ok / measured) * 10000) / 100,
      });
    }

    const withData = out.filter(x => x.uptimePct !== null);
    const overallPct = withData.length
      ? Math.round((withData.reduce((s, x) => s + x.uptimePct, 0) / withData.length) * 100) / 100
      : null;

    return { days: out, since: rec.since || null, uptimePct: overallPct, daysWithData: withData.length };
  } catch (e) {
    console.error('[status] history read failed:', e && e.message ? e.message : e);
    return null;
  }
}

async function handleStatus(request, env, ctx) {
  const headers = {
    'Content-Type': 'application/json',
    // Short TTL: fresh enough to be useful during an incident, long enough to
    // stay well inside the Datadog API rate limit under marketing-site traffic.
    'Cache-Control': 'public, max-age=45',
    'X-Content-Type-Options': 'nosniff',
  };

  const cache = caches.default;
  const cacheKey = new Request(new URL('/api/status', request.url).toString(), { method: 'GET' });
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  // Never expose which specific monitors back a component — component-level
  // status is all the public needs.
  const unknownComponents = STATUS_COMPONENTS.map(c => ({
    id: c.id, name: c.name, description: c.description, status: 'unknown',
  }));

  const apiKey = env.DD_API_KEY;
  // DD_MONITOR_TOKEN is the dedicated read-only application key scoped to
  // `monitors_read` only (it 403s on everything else, verified). Prefer it so
  // this public Worker never holds a write-capable Datadog credential; the
  // later names are legacy fallbacks.
  const appKey = env.DD_MONITOR_TOKEN || env.DD_STATUS_APP_KEY || env.DD_APP_KEY;
  if (!apiKey || !appKey) {
    return new Response(
      statusPayload('unknown', unknownComponents, { configured: false, history: await readHistory(env) }),
      { status: 200, headers }
    );
  }

  try {
    const site = env.DD_SITE || 'us5.datadoghq.com';
    const res = await fetch(`https://api.${site}/api/v1/monitor?page_size=100`, {
      headers: { 'DD-API-KEY': apiKey, 'DD-APPLICATION-KEY': appKey },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`datadog ${res.status}`);

    // Guard the parse: a non-JSON body (HTML error page, empty) must not throw
    // an opaque SyntaxError — we want it to land in the catch as `unknown`.
    const text = await res.text();
    let monitors;
    try {
      monitors = JSON.parse(text);
    } catch {
      throw new Error(`datadog returned non-JSON (${res.status})`);
    }
    if (!Array.isArray(monitors)) throw new Error('unexpected datadog payload shape');

    const byId = new Map(monitors.map(m => [m.id, m]));

    let overall = 'operational';
    const components = STATUS_COMPONENTS.map(c => {
      let status = 'operational';
      for (const ref of c.monitors) {
        const mon = byId.get(ref.id);
        // A monitor we expected but did not get back is an unknown, not an OK —
        // otherwise a deleted or renamed monitor silently reads as healthy.
        status = worstStatus(status, mon ? monitorStateToStatus(mon.overall_state, ref.onAlert) : 'unknown');
      }
      overall = worstStatus(overall, status);
      return { id: c.id, name: c.name, description: c.description, status };
    });

    // Record BEFORE reading back, so today's bar reflects this sample.
    await recordSample(env, overall);

    const response = new Response(
      statusPayload(overall, components, { configured: true, history: await readHistory(env) }),
      { status: 200, headers }
    );
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    console.error('[status] upstream failed:', err && err.message ? err.message : err);
    // Record the unknown too — a gap in monitoring is itself worth showing,
    // and it keeps the denominator honest rather than silently skipping.
    ctx.waitUntil(recordSample(env, 'unknown'));
    // Degrade to unknown — never assert operational on a failed lookup.
    return new Response(
      statusPayload('unknown', unknownComponents, { configured: true, error: 'upstream_unavailable', history: await readHistory(env) }),
      { status: 200, headers }
    );
  }
}
