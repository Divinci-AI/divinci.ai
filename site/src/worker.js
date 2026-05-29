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
      'Content-Security-Policy': `default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com https://cdn.jsdelivr.net https://r2.leadsy.ai https://tag.trovo-tag.com https://js.hs-scripts.com https://js.hs-analytics.net https://js.hs-banner.com https://js.hscollectedforms.net; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; connect-src 'self' https: data:; media-src 'self' https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev; frame-src 'self' https://www.google.com/maps/ https://challenges.cloudflare.com https://tag.trovo-tag.com https://www.youtube.com https://www.youtube-nocookie.com https://cloudflare.tv; frame-ancestors 'self'; report-uri ${cspReportPath}; report-to csp-endpoint;`,
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
      // Must exactly match the <img src> in templates/index.html or the browser
      // preloads a resource it never uses and Chrome surfaces a warning.
      earlyHintsLink = [
        `<${url.origin}/images/davinci-painter-robot-800w.webp>; rel=preload; as=image`,
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