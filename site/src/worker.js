/**
 * Divinci AI Cloudflare Worker
 * Serves static Zola site with enhanced features and email handling
 */

import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';
import {
  ACTIVITY_KEY,
  publicView,
  sanitizeActivity,
  timingSafeEqual,
} from './www-rag-activity.mjs';
import { AGENT_LINK_HEADER, handleAgentDiscovery } from './agent-discovery.mjs';
import {
  WEB_BOT_AUTH_DIRECTORY_PATH,
  handleWebBotAuthDirectory,
} from './web-bot-auth-directory.mjs';
import { AREAS } from './status-areas.mjs';
import { collectCustomerHealth, shouldCollect } from './customer-health.mjs';
import { NOINDEX, isIndexable, robotsTxt } from './indexability.mjs';
import {
  ATTRIBUTION_KEY,
  collectAttribution,
  customerFacingStatus,
  mergeAttributionIntoDays,
} from './status-attribution.mjs';
import {
  HISTORY_KEY,
  applySample,
  buildHistoryView,
  dayKey,
  worstStatus,
} from './status-history.mjs';
import {
  COMPONENTS_KEY,
  componentsView,
  sanitizeComponentsPush,
  worstOf,
} from './status-components.mjs';

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

// Static assets (images, video) live in the divinci-static-assets R2
// bucket -- see site/tools/r2_migrate.py. Nothing under /images/ is
// served from this origin any more.
const R2 = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev";

export default {
  /**
   * Cron: collect customer-facing edge errors and publish them to Datadog.
   *
   * Guarded on ENVIRONMENT because dev and staging deploy the same code — two
   * environments submitting the same metric would double every value the pager
   * reads, and the resulting series would look like a traffic increase rather
   * than a bug.
   */
  async scheduled(event, env, ctx) {
    // The decision lives in customer-health.mjs so it can be tested — this
    // file imports `cloudflare:email` and cannot be loaded by node --test.
    if (!shouldCollect(env)) {
      console.log(`[customer-health] skipped: ENVIRONMENT=${env.ENVIRONMENT}`);
      return;
    }
    ctx.waitUntil(
      collectCustomerHealth(env).catch((e) => {
        // Never rethrow into the cron runner: the useful signal is the metric
        // going absent, which the monitor's no-data notification reports.
        console.error('[customer-health] collection failed:', e?.message ?? e);
      }),
    );

    // Attribute this window's errors to an AREA of the estate, so a bad day
    // can explain itself on /status at the time rather than waiting for
    // someone to write it up days later. Runs beside the customer-health
    // collector rather than inside it: the two answer different questions
    // (how many customer errors vs where all the errors landed), and a
    // failure in the newer one must never cost us the metric that pages.
    //
    // ⚠️ IT ALSO WRITES THE UPTIME SAMPLE, and that is the point.
    //
    // The 90-day history used to be sampled opportunistically from
    // /api/status TRAFFIC — the footer indicator on each page view. That was
    // reasonable when a missed sample only cost resolution, but it means the
    // record is biased toward the hours people browse a marketing site, and a
    // quiet-hour incident can be absent from it ENTIRELY. It has been:
    // 2026-08-14 was stored as 100% operational while the uptime checks show
    // six degraded windows, and the real 2026-08-02 production outage went in
    // as "degraded 99.47%" because almost nobody was loading the site at
    // 00:22 PT.
    //
    // A cron does not care what time it is. Now that the rating comes from a
    // measurement this job already makes, sampling from here makes the record
    // complete instead of merely representative — and makes the cron the ONLY
    // writer of history:v1, so a request and a tick can no longer interleave
    // their read-modify-writes.
    ctx.waitUntil(
      collectAttribution(env, {
        recordSample: (status) => recordSample(env, status, { bypassRateLimit: true }),
      }).catch((e) => {
        console.error('[status-attribution] collection failed:', e?.message ?? e);
        // A tick that could not measure is a blind spot, and a blind spot is
        // worth recording: `unknown` outranks `operational`, so a run of them
        // rates the day unknown rather than quietly leaving it green.
        return recordSample(env, 'unknown', { bypassRateLimit: true });
      }),
    );
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Redirect www to apex domain
    if (url.hostname === 'www.divinci.ai') {
      return Response.redirect(`https://divinci.ai${url.pathname}${url.search}`, 301);
    }

    // /investors is the investor data room. It is served open on divinci.ai
    // (the Cloudflare Access gate was removed 2026-09-04 by request); it stays
    // noindex, and every other hostname that serves this same bundle (staging,
    // dev, *.workers.dev) 404s the prefix so the only copy is the canonical one.
    // wrangler.jsonc lists "/investors/*" in run_worker_first so the PDFs and
    // HTML under /investors/docs/ hit this check instead of the static handler.
    if (url.pathname === '/investors' || url.pathname.startsWith('/investors/')) {
      if (env.ENVIRONMENT !== 'production') {
        return new Response('Not found', { status: 404, headers: { 'X-Robots-Tag': 'noindex' } });
      }
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
      //
      // media-src carries two entries beyond 'self':
      //   - chat-uploads.divinci.app — where the platform stores chat TTS
      //     audio (the free-chat widget's "read aloud" fetches its MP3 from
      //     there). Omitting it blocks the load outright with
      //     "NotSupportedError: Failed to load because no supported source was
      //     found", which the widget can only interpret as a broken file, so
      //     it silently falls back to the robotic browser voice.
      //   - data: — the widget plays a few samples of silent WAV on click to
      //     mark its <audio> element user-initiated before the (multi-second)
      //     synthesis request. Without this the unlock itself is blocked.
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      // Keep every duplicate of this site out of search results. staging, dev
      // and the *.workers.dev hostname each environment gets for free all
      // serve the same bytes as production and would otherwise compete with
      // it. See isIndexable() for why ENVIRONMENT alone is not enough.
      //
      // robots.txt above must keep allowing crawl for this to work: a
      // disallowed URL is one the crawler never fetches, so it never sees
      // this header, and anything already indexed stays indexed. Crawlable
      // plus noindex is what actually removes a page from the index.
      ...(isIndexable(env, url.hostname) ? {} : { 'X-Robots-Tag': NOINDEX }),
      'Reporting-Endpoints': `csp-endpoint="${cspReportUrl}"`,
      // NOTE on the CloudFront origin in script-src: r2.leadsy.ai/tag.js is
      // only a loader — it pulls its actual payload from the distribution
      // below, which was NOT allowlisted, so the visitor-identification tag
      // silently did nothing. The violation was being reported to
      // /api/csp-report the whole time; the reports go to console.warn, which
      // means `wrangler tail` and nowhere else. A CloudFront distribution
      // hostname can change, so this entry will break the same way again if
      // the vendor re-provisions; if the tag stops working, look here first.
      'Content-Security-Policy': `default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com https://cdn.jsdelivr.net https://r2.leadsy.ai https://ddwl4m2hdecbv.cloudfront.net https://tag.trovo-tag.com https://js.hs-scripts.com https://js.hs-analytics.net https://js.hs-banner.com https://js.hscollectedforms.net https://snap.licdn.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; connect-src 'self' https: data:; media-src 'self' data: https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev https://chat-uploads.divinci.app; frame-src 'self' https://www.google.com/maps/ https://challenges.cloudflare.com https://tag.trovo-tag.com https://www.youtube.com https://www.youtube-nocookie.com https://cloudflare.tv; frame-ancestors 'self'; report-uri ${cspReportPath}; report-to csp-endpoint;`,
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
    //
    // Content-Signal (contentsignals.org, draft-romm-aipref-contentsignals)
    // states what automated systems may DO with content they are allowed to
    // fetch — it is orthogonal to Allow/Disallow, which only govern fetching.
    // Our position, and why each value is what it is:
    //
    //   search=yes    Be indexed and cited by search and answer engines. This
    //                 is a marketing site; being found is the entire point.
    //   ai-input=yes  Be retrieved at inference time to ground an answer, with
    //                 attribution. Same reasoning — a cited answer is a
    //                 referral.
    //   ai-train=no   Do NOT be absorbed into model weights. Training is the
    //                 one use that takes the content and gives back no path
    //                 to us, and we sell to customers who care about exactly
    //                 this distinction for their own content.
    //
    // This is a declaration of preference, not an access control. The
    // enforcement lever is AI Crawl Control in the Cloudflare dashboard.
    if (url.pathname === '/robots.txt') {
      return new Response(robotsTxt(isIndexable(env, url.hostname), url.origin), {
        headers: {
          'Content-Type': 'text/plain',
          ...securityHeaders
        }
      });
    }

    // Web Bot Auth JWKS directory — async because the response is signed with
    // the private key from WEB_BOT_AUTH_PRIVATE_JWK. Kept out of the sync
    // handleAgentDiscovery switch for that reason.
    if (url.pathname === WEB_BOT_AUTH_DIRECTORY_PATH) {
      const dir = await handleWebBotAuthDirectory(request, env);
      Object.entries(securityHeaders).forEach(([k, v]) => dir.headers.set(k, v));
      dir.headers.set('Access-Control-Allow-Origin', '*');
      return dir;
    }

    // Agent-readiness discovery documents (/.well-known/api-catalog, the OAuth
    // metadata, the A2A and MCP cards, the skills index). Returns null for
    // anything it does not own so /.well-known/security.txt still falls
    // through to the static-asset handler below.
    const agentDoc = handleAgentDiscovery(url);
    if (agentDoc) {
      Object.entries(securityHeaders).forEach(([k, v]) => agentDoc.headers.set(k, v));
      // These are cross-origin-read by agent runtimes that are not browsers
      // and have no same-origin relationship with us.
      agentDoc.headers.set('Access-Control-Allow-Origin', '*');
      return agentDoc;
    }

    // Handle sitemap.xml redirect
    if (url.pathname === '/sitemap.xml') {
      return Response.redirect(`${url.origin}/sitemap/index.html`, 301);
    }

    // Handle contact form API
    if (url.pathname === '/api/contact') {
      return handleContactForm(request, env);
    }

    // Public system status, from our own customer-facing error measurement.
    // Same-origin, so the footer indicator and /status page need no CORS proxy.
    if (url.pathname === '/api/status') {
      return handleStatus(request, env, ctx);
    }

    // Per-service component health, pushed from GCP uptime checks by a
    // scheduled job. Write-only endpoint; readers get it via /api/status.
    if (url.pathname === '/api/status/components') {
      return handleStatusComponentsPush(request, env);
    }

    // Live WWW-RAG crawl activity: the laptop daemon POSTs snapshots here,
    // /www-rag polls the GET side.
    if (url.pathname === '/api/www-rag/activity') {
      return handleWwwRagActivity(request, env);
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
      // The hero lives on R2, NOT this origin. These hints used url.origin and
      // so pointed at /images/... after the rasters moved — three 404s fired on
      // every homepage request, and the preload warmed nothing, which is worse
      // than having no Early Hints at all. The URL here must match the <img
      // srcset> in templates/index.html exactly or the browser preloads a
      // resource it then never uses.
      const hero = `${R2}/images/davinci-painter-robot`;
      earlyHintsLink = [
        `<${hero}-800w.webp>; rel=preload; as=image; imagesrcset="${hero}-400w.webp 400w, ${hero}-600w.webp 600w, ${hero}-800w.webp 800w"; imagesizes="(max-width: 600px) 100vw, (max-width: 900px) 600px, 800px"`,
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

        // Agent discovery Link relations (RFC 8288, RFC 9727 §3) on HTML pages.
        // Appended rather than merged into earlyHintsLink so the two concerns
        // stay separable: Cloudflare's Early Hints only forwards rel=preload /
        // rel=preconnect, so these ride along on the final 200 and are ignored
        // by the 103. Agents that never parse HTML can find the API catalog,
        // the machine-readable service description and llms.txt from headers
        // alone.
        if (!url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|eot|ico|webm|mp4|avif|json|xml|txt)$/)) {
          newResponse.headers.append('Link', AGENT_LINK_HEADER);
        }

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
// Same-origin, so /status and the footer indicator consume it directly.
//
// DESIGN RULE — do not "fix" this by defaulting to operational: any state we
// cannot positively verify resolves to `unknown`, never `operational`. A green
// dot that cannot go red is an unsubstantiated claim, which is exactly what we
// removed from /security. `unknown` is a correct, honest answer.
//
// COMPONENT MAPPING: Platform is deliberately ONE component. Its source (see
// customerFacingStatus in status-attribution.mjs) knows which host and path
// each error hit, so it could be split — but the per-service question is
// already answered better by the GCP uptime checks pushed in below, which
// probe each surface directly rather than inferring health from error counts.
// Two overlapping answers to the same question is how a page starts
// contradicting itself.
const STATUS_COMPONENTS = [
  {
    id: 'platform',
    name: 'Platform',
    description: 'Chat, API, and web — edge and origin availability',
  },
];


// STATUS_RANK / worstStatus now live in ./status-history.mjs — the day-rating
// rules need them and they are the same ordering, so keeping two copies in
// sync was an invitation to drift.

// ⚠️ DATADOG NO LONGER FEEDS THIS PAGE (2026-08-26). The Platform component
// used to be monitor 20807649, `[CF] 5xx rate elevated (prod zones)` — a
// ZONE-WIDE count, so staging, dev, our own crons and internal tooling all
// coloured a customer-facing status page. See the long note in
// status-attribution.mjs for the measurements that ended that.
//
// The monitor still exists and still PAGES us, unchanged. We want to be woken
// for our own broken crons; a customer does not want to read about them.
//
// ./monitor-status.mjs is therefore no longer wired to anything. It is kept,
// with its tests, because the duration-aware mapping it encodes is the thing
// you would need again the day a monitor is re-consulted — and rewriting it
// from scratch is how the two-minute-flap-reads-as-MAJOR-OUTAGE bug comes
// back.

function statusPayload(overall, components, extra) {
  return JSON.stringify({
    status: overall,
    components,
    updatedAt: new Date().toISOString(),
    // What the severity above is derived from. Named in the payload because
    // it CHANGED on 2026-08-26 — from a zone-wide Datadog monitor to our own
    // customer-facing classification — and a consumer comparing this week to
    // last week deserves to see that the basis moved rather than infer a
    // sudden improvement in reliability.
    source: 'customer-facing-edge-errors',
    ratingBasisChangedOn: '2026-08-26',
    // The area taxonomy the banded history bars are drawn from. Published
    // rather than duplicated in the template: the ORDER is load-bearing (two
    // identical days must draw identically), and a second hand-maintained copy
    // is how that quietly stops being true.
    areas: AREAS,
    ...extra,
  });
}

// ── Per-service components push ──────────────────────────────────────────
//
// POST /api/status/components — Bearer STATUS_COMPONENTS_TOKEN.
// Write-only by design: there is no GET here, because readers already get the
// merged view from /api/status and a second public surface would be a second
// thing to keep honest. Validation lives in status-components.mjs, which is
// also where the reasoning about untrusted input on a public page sits.

const COMPONENTS_PUSH_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

async function handleStatusComponentsPush(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...COMPONENTS_PUSH_HEADERS, Allow: 'POST' },
    });
  }

  const expected = env.STATUS_COMPONENTS_TOKEN;
  if (!expected) {
    // Unconfigured must fail closed — an absent secret cannot become an open
    // write endpoint that paints the public status page.
    console.error('[status-components] STATUS_COMPONENTS_TOKEN is not configured');
    return new Response(JSON.stringify({ error: 'not_configured' }), {
      status: 503,
      headers: COMPONENTS_PUSH_HEADERS,
    });
  }

  const auth = request.headers.get('Authorization') || '';
  const presented = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!timingSafeEqual(presented, expected)) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: COMPONENTS_PUSH_HEADERS,
    });
  }

  // Bound the read before parsing — an authenticated client is still a client.
  let body;
  try {
    const text = await request.text();
    if (text.length > 8192) {
      return new Response(JSON.stringify({ error: 'payload_too_large' }), {
        status: 413,
        headers: COMPONENTS_PUSH_HEADERS,
      });
    }
    body = JSON.parse(text);
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: COMPONENTS_PUSH_HEADERS,
    });
  }

  const result = sanitizeComponentsPush(body, Date.now());
  if (!result.ok) {
    return new Response(JSON.stringify({ error: 'invalid_payload', detail: result.error }), {
      status: 400,
      headers: COMPONENTS_PUSH_HEADERS,
    });
  }

  if (!env.STATUS_HISTORY) {
    return new Response(JSON.stringify({ error: 'not_configured' }), {
      status: 503,
      headers: COMPONENTS_PUSH_HEADERS,
    });
  }
  await env.STATUS_HISTORY.put(COMPONENTS_KEY, JSON.stringify(result.value));

  return new Response(JSON.stringify({ ok: true, accepted: result.value.components.length }), {
    status: 200,
    headers: COMPONENTS_PUSH_HEADERS,
  });
}

async function readPushedComponents(env) {
  if (!env.STATUS_HISTORY) return componentsView(null, Date.now());
  try {
    const rec = await env.STATUS_HISTORY.get(COMPONENTS_KEY, { type: 'json' });
    return componentsView(rec, Date.now());
  } catch (e) {
    console.error('[status-components] read failed:', e && e.message ? e.message : e);
    return componentsView(null, Date.now());
  }
}

// ── 90-day uptime history ────────────────────────────────────────────────
//
// Sampling is driven by /api/status traffic — the footer indicator on every
// page view keeps it fed — and rate-limited to one write per SAMPLE_INTERVAL.
// This avoids depending on a cron trigger (see
// feedback_cf_worker_schedules_put_fails: the schedules PUT is unreliable on
// this account, and there's a 3-trigger cap per worker).
//
// The sampling and day-rating RULES live in ./status-history.mjs so they can
// be tested directly (npm run test:worker). What stays here is only the KV
// read/write around them.

async function recordSample(env, status, opts = {}) {
  if (!env.STATUS_HISTORY) return;
  try {
    const now = Date.now();
    const raw = await env.STATUS_HISTORY.get(HISTORY_KEY, { type: 'json' });
    const rec = raw && typeof raw === 'object' ? raw : { days: {}, lastSampleAt: 0, since: dayKey(now) };
    if (!applySample(rec, status, now, opts)) return; // rate-limited, nothing to write
    await env.STATUS_HISTORY.put(HISTORY_KEY, JSON.stringify(rec));
  } catch (e) {
    // History is a nice-to-have; never let it break the status response.
    console.error('[status] history write failed:', e && e.message ? e.message : e);
  }
}

/**
 * Which areas each bad day landed on, and the note that says so.
 *
 * Merged into the history view rather than published as its own field: a
 * consumer that has a day already has everything about that day, and a second
 * top-level map keyed by date is a second thing to keep aligned with the
 * first. Only BAD days carry attribution — attributing a green day would be
 * answering a question nobody asked, and would put five bands on a bar that
 * has nothing to break down.
 */
/**
 * The attribution record — the live customer-facing reading AND the per-day
 * area breakdown, in one value.
 *
 * Never throws: attribution is additive detail on the page, and losing it
 * must cost bands and a note, never the history or the response itself.
 */
async function readAttribution(env) {
  if (!env.STATUS_HISTORY) return null;
  try {
    return await env.STATUS_HISTORY.get(ATTRIBUTION_KEY, { type: 'json' });
  } catch (e) {
    console.error('[status] attribution read failed:', e && e.message ? e.message : e);
    return null;
  }
}

async function readHistory(env, attribution) {
  if (!env.STATUS_HISTORY) return null;
  try {
    const rec = await env.STATUS_HISTORY.get(HISTORY_KEY, { type: 'json' });
    if (!rec || !rec.days) return { days: [], since: null, uptimePct: null };
    const view = buildHistoryView(rec, Date.now());
    // The merge rule lives in status-attribution.mjs, where node --test can
    // reach it — it decides what becomes public, so it must be testable.
    view.days = mergeAttributionIntoDays(view.days, attribution);
    return view;
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
    // Public, aggregate-only status — deliberately safe to read from anywhere,
    // and divinci.app's footer indicator is a cross-origin consumer. Kept as
    // a literal '*' rather than reflecting the Origin header on purpose: the
    // response is stored in caches.default, so an Origin-dependent value would
    // be served to the wrong origin on a cache hit (and would need Vary:
    // Origin, which fragments the cache for no benefit here).
    'Access-Control-Allow-Origin': '*',
  };

  const cache = caches.default;
  const cacheKey = new Request(new URL('/api/status', request.url).toString(), { method: 'GET' });
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const unknownComponents = STATUS_COMPONENTS.map(c => ({
    id: c.id, name: c.name, description: c.description, status: 'unknown',
  }));

  try {
    // One clock for the whole evaluation — two components computed against
    // different `now`s could straddle a staleness boundary and disagree.
    const now = Date.now();

    // ⚠️ READ ONCE, USE TWICE. The same record answers "how are we right now"
    // and "which areas did each past bad day land on". Reading it separately
    // for each would let the banner and the bar beneath it be computed from
    // two different snapshots — the page contradicting itself within one
    // response, which is the one thing a status page may never do.
    const attribution = await readAttribution(env);
    const platform = customerFacingStatus(attribution, now);

    const components = STATUS_COMPONENTS.map(c => ({
      id: c.id, name: c.name, description: c.description, status: platform ?? 'unknown',
    }));

    // Per-service components pushed from the GCP uptime checks. They sit AFTER
    // Platform: Platform answers "are customer-facing requests failing at the
    // edge", these answer "which service is unhappy".
    const pushed = await readPushedComponents(env);
    components.push(...pushed);

    // ⚠️ THIS HANDLER NO LONGER WRITES ANYTHING. The 90-day history is
    // sampled by the cron (see scheduled()), which is on a clock rather than
    // on whoever happens to be reading the marketing site — so a quiet-hour
    // incident can no longer be missing from the record. Two consequences
    // worth keeping:
    //
    //   - A public request can no longer trigger a KV read-modify-write, so
    //     the endpoint cannot be made to amplify writes at all.
    //   - The cron is the ONLY writer of history:v1, so nothing interleaves
    //     with it. Do not restore sampling here to "improve resolution": it
    //     would re-introduce both.
    //
    // The history still reflects the PLATFORM status only, never the pushed
    // GCP components. That is a published number people compare across days,
    // and folding the components in would silently redefine it mid-series
    // while letting an external probe flaking in one region write a red
    // window into a record that is supposed to describe US. Both happened on
    // 2026-08-05 before this split existed.

    // The BANNER, by contrast, should reflect current truth from every source.
    const overall = worstStatus(platform ?? 'unknown', worstOf(pushed));

    const response = new Response(
      statusPayload(overall, components, {
        configured: platform !== null,
        // ⚠️ AN ALERTING CONTRACT. A dead collector is already visible on the
        // page — Platform goes `unknown` after 20 minutes — but visible only
        // to a human who happens to look, and the history now depends on that
        // cron entirely. This one boolean makes it CHECKABLE: a content match
        // on `"ratingFresh":true` in the existing marketing-status-api uptime
        // check fires when, and only when, the feed behind this page stops.
        //
        // `configured` cannot do that job: it stays true while a record
        // exists, however old. The two answer different questions and both
        // are published for that reason.
        ratingFresh: platform !== null && platform !== 'unknown',
        history: await readHistory(env, attribution),
      }),
      { status: 200, headers }
    );
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    console.error('[status] status build failed:', err && err.message ? err.message : err);
    // Nothing is recorded here — the cron owns the record, and a failure to
    // BUILD a response is not evidence about the platform. The cron's own
    // failure path is what writes `unknown`.
    // Degrade to unknown — never assert operational on a failed lookup.
    return new Response(
      statusPayload('unknown', unknownComponents, {
        configured: true, ratingFresh: false, error: 'upstream_unavailable',
        history: await readHistory(env, null),
      }),
      { status: 200, headers }
    );
  }
}

// ── Live WWW-RAG crawl activity ──────────────────────────────────────────
//
// GET  /api/www-rag/activity  → public snapshot (no auth, short cache)
// POST /api/www-rag/activity  → reporter push, Bearer WWW_RAG_ACTIVITY_TOKEN
//
// Backed by the STATUS_HISTORY KV namespace under its own key. Sharing the
// namespace is deliberate: it is the same worker with the same lifecycle, and
// provisioning a second namespace buys isolation we don't need for a record
// that is rewritten every 20s and never read by the status code path.
//
// The daemon runs on a laptop and is frequently offline. Every response
// therefore carries `stale` + `ageSeconds`, and publicView() downgrades the
// state to `offline` past STALE_AFTER_MS — the page must never imply a crawl
// is running because a snapshot from yesterday said so.
const ACTIVITY_HEADERS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  // Public read-only aggregate, same rationale as /api/status. The signed-in
  // directory at chat.divinci.app is a cross-origin consumer.
  'Access-Control-Allow-Origin': '*',
};

async function handleWwwRagActivity(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...ACTIVITY_HEADERS,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (request.method === 'GET') {
    // No edge cache here. The record's whole value is freshness, the client
    // already polls on an interval, and a KV read is cheaper than the cache
    // round-trip anyway.
    const headers = { ...ACTIVITY_HEADERS, 'Cache-Control': 'public, max-age=10' };
    if (!env.STATUS_HISTORY) {
      return new Response(JSON.stringify(publicView(null)), { status: 200, headers });
    }
    try {
      const record = await env.STATUS_HISTORY.get(ACTIVITY_KEY, { type: 'json' });
      return new Response(JSON.stringify(publicView(record)), { status: 200, headers });
    } catch (e) {
      console.error('[www-rag-activity] read failed:', e && e.message ? e.message : e);
      // Offline is the honest answer to "we cannot tell" — never 500 a widget.
      return new Response(JSON.stringify(publicView(null)), { status: 200, headers });
    }
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...ACTIVITY_HEADERS, Allow: 'GET, POST, OPTIONS' },
    });
  }

  const expected = env.WWW_RAG_ACTIVITY_TOKEN;
  if (!expected) {
    // Unconfigured must fail closed: an absent secret cannot become an open
    // write endpoint on the marketing site.
    console.error('[www-rag-activity] WWW_RAG_ACTIVITY_TOKEN is not configured');
    return new Response(JSON.stringify({ error: 'not_configured' }), {
      status: 503,
      headers: ACTIVITY_HEADERS,
    });
  }

  const auth = request.headers.get('Authorization') || '';
  const presented = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!timingSafeEqual(presented, expected)) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: ACTIVITY_HEADERS,
    });
  }

  // Bound the read before parsing — an authenticated client is still a client.
  let body;
  try {
    const text = await request.text();
    if (text.length > 16384) {
      return new Response(JSON.stringify({ error: 'payload_too_large' }), {
        status: 413,
        headers: ACTIVITY_HEADERS,
      });
    }
    body = JSON.parse(text);
  } catch (e) {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: ACTIVITY_HEADERS,
    });
  }

  const result = sanitizeActivity(body);
  if (!result.ok) {
    return new Response(JSON.stringify({ error: 'invalid_payload', detail: result.error }), {
      status: 400,
      headers: ACTIVITY_HEADERS,
    });
  }

  if (!env.STATUS_HISTORY) {
    return new Response(JSON.stringify({ error: 'not_configured' }), {
      status: 503,
      headers: ACTIVITY_HEADERS,
    });
  }

  try {
    // TTL so a permanently-dead reporter eventually leaves no record at all,
    // rather than a very old one we keep having to reason about. 24h is well
    // past any normal gap between passes (~3.5h).
    await env.STATUS_HISTORY.put(ACTIVITY_KEY, JSON.stringify(result.value), {
      expirationTtl: 86400,
    });
  } catch (e) {
    console.error('[www-rag-activity] write failed:', e && e.message ? e.message : e);
    return new Response(JSON.stringify({ error: 'write_failed' }), {
      status: 502,
      headers: ACTIVITY_HEADERS,
    });
  }

  return new Response(JSON.stringify({ ok: true, state: result.value.state }), {
    status: 200,
    headers: ACTIVITY_HEADERS,
  });
}
