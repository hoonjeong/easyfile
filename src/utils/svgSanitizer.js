/**
 * SVG Sanitizer
 * Removes potentially dangerous elements and attributes from SVG files
 */

// Dangerous elements that should be removed
const DANGEROUS_ELEMENTS = [
  'script',
  'foreignObject',
  'iframe',
  'embed',
  'object',
  'applet',
  'frame',
  'frameset',
  'layer',
  'ilayer',
  'bgsound'
];

// Dangerous attributes that should be removed
const DANGEROUS_ATTRIBUTES = [
  // Event handlers
  'onload', 'onerror', 'onclick', 'ondblclick', 'onmousedown', 'onmouseup',
  'onmouseover', 'onmousemove', 'onmouseout', 'onmouseenter', 'onmouseleave',
  'onkeydown', 'onkeyup', 'onkeypress', 'onfocus', 'onblur', 'onchange',
  'onsubmit', 'onreset', 'onselect', 'oninput', 'oncontextmenu',
  'ondrag', 'ondragend', 'ondragenter', 'ondragleave', 'ondragover',
  'ondragstart', 'ondrop', 'onscroll', 'onwheel', 'oncopy', 'oncut', 'onpaste',
  'onabort', 'oncanplay', 'oncanplaythrough', 'oncuechange', 'ondurationchange',
  'onemptied', 'onended', 'onloadeddata', 'onloadedmetadata', 'onloadstart',
  'onpause', 'onplay', 'onplaying', 'onprogress', 'onratechange', 'onseeked',
  'onseeking', 'onstalled', 'onsuspend', 'ontimeupdate', 'onvolumechange',
  'onwaiting', 'ontoggle', 'onanimationstart', 'onanimationend', 'onanimationiteration',
  'ontransitionend', 'onresize', 'onbeforeunload', 'onunload', 'onhashchange',
  'onpopstate', 'onstorage', 'onmessage', 'onoffline', 'ononline', 'onpagehide',
  'onpageshow', 'onbeforeprint', 'onafterprint',
  // Other dangerous attributes
  'formaction', 'xlink:actuate', 'xlink:href'
];

// Dangerous URL patterns
const DANGEROUS_URL_PATTERNS = [
  /^javascript:/i,
  /^data:text\/html/i,
  /^vbscript:/i,
  /^data:application/i
];

/**
 * Check if a URL is potentially dangerous
 */
const isDangerousUrl = (url) => {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  return DANGEROUS_URL_PATTERNS.some(pattern => pattern.test(trimmed));
};

/**
 * Sanitize SVG content string
 * @param {string} svgContent - Raw SVG content
 * @returns {string} - Sanitized SVG content
 */
export const sanitizeSvg = (svgContent) => {
  if (!svgContent || typeof svgContent !== 'string') {
    return svgContent;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');

  // Check for parsing errors
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid SVG file');
  }

  // Remove dangerous elements
  DANGEROUS_ELEMENTS.forEach(tagName => {
    const elements = doc.querySelectorAll(tagName);
    elements.forEach(el => el.remove());
  });

  // Process all elements
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(element => {
    // Remove dangerous attributes
    DANGEROUS_ATTRIBUTES.forEach(attr => {
      if (element.hasAttribute(attr)) {
        element.removeAttribute(attr);
      }
      // Also check for case-insensitive versions
      Array.from(element.attributes).forEach(a => {
        if (a.name.toLowerCase() === attr.toLowerCase()) {
          element.removeAttribute(a.name);
        }
      });
    });

    // Check href and xlink:href for dangerous URLs
    ['href', 'xlink:href'].forEach(attrName => {
      const value = element.getAttribute(attrName);
      if (value && isDangerousUrl(value)) {
        element.removeAttribute(attrName);
      }
    });

    // Check style attribute for dangerous content
    const style = element.getAttribute('style');
    if (style) {
      // Remove url() that points to javascript or data
      const sanitizedStyle = style.replace(
        /url\s*\(\s*['"]?\s*(javascript:|data:text\/html|vbscript:)[^)]*\)/gi,
        ''
      );
      if (sanitizedStyle !== style) {
        element.setAttribute('style', sanitizedStyle);
      }
    }
  });

  // Serialize back to string
  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc.documentElement);
};

/**
 * Sanitize SVG file and return as Blob
 * @param {File} file - SVG file
 * @returns {Promise<Blob>} - Sanitized SVG as Blob
 */
export const sanitizeSvgFile = async (file) => {
  const text = await file.text();
  const sanitized = sanitizeSvg(text);
  return new Blob([sanitized], { type: 'image/svg+xml' });
};

/**
 * Create safe preview URL for SVG
 * First sanitizes the SVG, then creates blob URL
 * @param {File} file - SVG file
 * @returns {Promise<string>} - Safe blob URL
 */
export const createSafeSvgPreviewUrl = async (file) => {
  const sanitizedBlob = await sanitizeSvgFile(file);
  return URL.createObjectURL(sanitizedBlob);
};

export default {
  sanitizeSvg,
  sanitizeSvgFile,
  createSafeSvgPreviewUrl
};
