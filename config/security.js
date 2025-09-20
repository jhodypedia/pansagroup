export const cspDirectives = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "https://code.jquery.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://*.googleapis.com", "https://*.gstatic.com", "https://api.qrserver.com"],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
  "font-src": ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
  "img-src": ["'self'", "data:", "blob:", "https://api.qrserver.com"],
  "connect-src": ["'self'", "ws:", "wss:"],
  "frame-src": ["'self'"]
};
