/**
 * HTML Sanitization Utility
 *
 * Prevents XSS attacks by sanitizing user-generated HTML content
 * before rendering it in the application.
 *
 * Uses DOMPurify to remove potentially malicious content while
 * preserving safe HTML formatting used in proposals.
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * This function removes all potentially dangerous HTML/JavaScript while
 * preserving safe formatting tags used in proposal content.
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string safe for rendering
 *
 * @example
 * ```typescript
 * // Safe usage
 * const content = sanitizeHtml(block.content);
 * <div dangerouslySetInnerHTML={{ __html: content }} />
 *
 * // This will remove malicious scripts
 * sanitizeHtml('<script>alert("xss")</script><p>Safe content</p>')
 * // Returns: '<p>Safe content</p>'
 * ```
 */
export const sanitizeHtml = (html: string): string => {
  // Return empty string for null/undefined to prevent errors
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    // Only allow safe HTML tags used in proposal content
    ALLOWED_TAGS: [
      // Headings
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',

      // Text formatting
      'p', 'br', 'strong', 'em', 'u', 'span', 'div',

      // Lists
      'ul', 'ol', 'li',

      // Tables
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',

      // Other formatting
      'blockquote', 'code', 'pre'
    ],

    // Only allow safe attributes
    ALLOWED_ATTR: [
      'class',      // For styling
      'style',      // For inline styles (font sizes, colors)
      'colspan',    // For table cells
      'rowspan',    // For table cells
    ],

    // Security settings
    ALLOW_DATA_ATTR: false,        // Block data-* attributes
    ALLOW_UNKNOWN_PROTOCOLS: false, // Block unknown protocols
    SAFE_FOR_TEMPLATES: true,      // Extra safety for templates

    // Remove unsafe content completely (don't just escape it)
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,

    // Additional security
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
};

/**
 * Strip all HTML tags and return plain text
 * Useful for generating excerpts or plain text previews
 *
 * @param html - The HTML string to strip
 * @returns Plain text with all HTML removed
 *
 * @example
 * ```typescript
 * stripHtml('<p>Hello <strong>World</strong></p>')
 * // Returns: 'Hello World'
 * ```
 */
export const stripHtml = (html: string): string => {
  if (!html) return '';

  // Use DOMPurify to strip all tags
  const cleaned = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  });

  // Clean up extra whitespace
  return cleaned.replace(/\s+/g, ' ').trim();
};

/**
 * Truncate HTML content while preserving valid HTML structure
 *
 * @param html - The HTML string to truncate
 * @param maxLength - Maximum character length (default: 200)
 * @returns Truncated and sanitized HTML
 */
export const truncateHtml = (html: string, maxLength: number = 200): string => {
  if (!html) return '';

  // First sanitize
  const clean = sanitizeHtml(html);

  // Strip tags for length check
  const text = stripHtml(clean);

  if (text.length <= maxLength) {
    return clean;
  }

  // Truncate the text
  const truncated = text.substring(0, maxLength) + '...';
  return `<p>${truncated}</p>`;
};
