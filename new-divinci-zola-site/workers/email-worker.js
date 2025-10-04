import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

/**
 * Cloudflare Worker for handling contact form submissions
 * Sends emails using Cloudflare Email Routing from divinci.net
 */
export default {
  async fetch(request, env, ctx) {
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

    // Only handle POST requests to /api/contact
    if (request.method !== 'POST' || !request.url.includes('/api/contact')) {
      return new Response('Not Found', { status: 404 });
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

      // Rate limiting (simple check - could be enhanced with KV storage)
      const userAgent = request.headers.get('User-Agent') || '';
      const clientIP = request.headers.get('CF-Connecting-IP') || '';
      
      // Create email content
      const emailSubject = `Contact Form: ${formData.subject}`;
      const emailBody = `
New contact form submission from divinci.ai:

Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}
Priority: ${formData.priority || 'Not specified'}
Category: ${formData.category || 'Not specified'}

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
      msg.setHeader('Reply-To', formData.email);
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
};