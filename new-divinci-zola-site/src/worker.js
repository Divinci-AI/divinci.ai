/**
 * Divinci AI Cloudflare Worker
 * Serves static Zola site with enhanced features and email handling
 */

import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

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

    // Handle contact form API
    if (url.pathname === '/api/contact') {
      return handleContactForm(request, env);
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

/**
 * Handle contact form submissions
 */
async function handleContactForm(request, env) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
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
            'Access-Control-Allow-Origin': '*'
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
            'Access-Control-Allow-Origin': '*'
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
            'Access-Control-Allow-Origin': '*'
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
              'Access-Control-Allow-Origin': '*'
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
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
    }
    
    // Create email content
    const emailSubject = `Contact Form: ${formData.subject}`;
    const emailBody = `
New contact form submission from divinci.ai:

Name: ${formData.name}
Email: ${formData.email}
Company: ${formData.company || 'Not specified'}
Subject: ${formData.subject}

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
    // Only set Reply-To if email looks valid (basic check)
    if (formData.email && formData.email.includes('@') && formData.email.includes('.')) {
      try {
        msg.setHeader('Reply-To', formData.email);
      } catch (e) {
        console.log('Invalid Reply-To header, skipping:', formData.email);
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
          'Access-Control-Allow-Origin': '*'
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
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}