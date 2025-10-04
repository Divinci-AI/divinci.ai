// Cloudflare Worker to serve R2 assets
// This provides a custom domain for our static assets with optimal caching

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1); // Remove leading slash
    
    try {
      // Get object from R2
      const object = await env.DIVINCI_STATIC_ASSETS.get(key);
      
      if (!object) {
        return new Response('Not Found', { status: 404 });
      }
      
      // Determine content type based on file extension
      const extension = key.split('.').pop().toLowerCase();
      const contentTypeMap = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'webp': 'image/webp',
        'css': 'text/css',
        'js': 'application/javascript',
        'json': 'application/json',
        'txt': 'text/plain',
        'html': 'text/html'
      };
      
      const contentType = contentTypeMap[extension] || 'application/octet-stream';
      
      // Set optimal headers for social media crawlers and performance
      const headers = new Headers({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      });
      
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
      }
      
      return new Response(object.body, { headers });
      
    } catch (error) {
      console.error('R2 Error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};