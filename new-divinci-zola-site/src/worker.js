/**
 * Divinci AI Cloudflare Worker
 * Serves static Zola site with enhanced features
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Add security headers
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self';"
    };

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

    // Language redirect logic - redirect root to /en/ for consistency
    if (url.pathname === '/') {
      // Check Accept-Language header for preferred language
      const acceptLanguage = request.headers.get('Accept-Language') || '';
      const supportedLanguages = ['en', 'es', 'fr', 'ar'];
      
      // Simple language detection
      let preferredLang = 'en';
      for (const lang of supportedLanguages) {
        if (acceptLanguage.toLowerCase().includes(lang)) {
          preferredLang = lang;
          break;
        }
      }
      
      // For now, always redirect to English (can be customized later)
      return Response.redirect(`${url.origin}/en/`, 302);
    }

    // Try to serve the static asset
    try {
      const response = await env.ASSETS.fetch(request);
      
      // If we got a successful response, add security headers
      if (response.status < 400) {
        const newResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...Object.fromEntries(response.headers.entries()),
            ...securityHeaders,
            'Cache-Control': url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico|webm|mp4|avif)$/) 
              ? 'public, max-age=31536000, immutable' 
              : 'public, max-age=3600'
          }
        });
        
        return newResponse;
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