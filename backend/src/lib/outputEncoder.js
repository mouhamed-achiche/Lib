/**
 * Output Encoding Utilities
 * Encodes user-generated content to prevent XSS attacks
 */

/**
 * HTML entity encode a string
 */
function htmlEncode(str) {
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * URL encode a string
 */
function urlEncode(str) {
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string') return str;
  
  return encodeURIComponent(str);
}

/**
 * JavaScript string encode
 */
function jsEncode(str) {
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\f/g, '\\f')
    .replace(/\v/g, '\\v')
    .replace(/\0/g, '\\0');
}

/**
 * Encode an object recursively (for API responses)
 * This encodes string values to prevent XSS
 */
function encodeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return htmlEncode(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => encodeObject(item));
  }
  
  if (typeof obj === 'object') {
    const encoded = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Skip encoding certain fields that should remain raw
        const skipFields = ['id', 'email', 'phone', 'created_at', 'updated_at', 'expires_at', 'slug', 'image_url'];
        if (skipFields.includes(key)) {
          encoded[key] = obj[key];
        } else {
          encoded[key] = encodeObject(obj[key]);
        }
      }
    }
    return encoded;
  }
  
  return obj;
}

/**
 * Sanitize user-generated content for safe display
 * This is a lighter version that only encodes HTML-dangerous characters
 */
function sanitizeUserContent(content) {
  if (content === null || content === undefined) return '';
  if (typeof content !== 'string') return content;
  
  return htmlEncode(content);
}

module.exports = {
  htmlEncode,
  urlEncode,
  jsEncode,
  encodeObject,
  sanitizeUserContent
};
