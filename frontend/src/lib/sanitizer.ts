import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') return '';
  return DOMPurify.sanitize(html);
}

/**
 * Sanitize text content (strip all HTML)
 */
export function sanitizeText(text: string): string {
  if (typeof text !== 'string') return '';
  const temp = document.createElement('div');
  temp.textContent = text;
  return temp.innerHTML;
}

/**
 * Sanitize URL to prevent javascript: protocol attacks
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';
  const sanitized = url.trim().toLowerCase();
  if (sanitized.startsWith('javascript:') || sanitized.startsWith('data:')) {
    return '';
  }
  return url;
}

/**
 * Validate and sanitize user input
 */
export function sanitizeInput(input: string, options?: { allowHtml?: boolean }): string {
  if (typeof input !== 'string') return '';
  
  if (options?.allowHtml) {
    return sanitizeHtml(input);
  }
  
  return sanitizeText(input);
}
