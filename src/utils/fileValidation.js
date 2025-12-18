/**
 * File Security Validation Utility
 * Prevents dangerous file uploads and validates file types
 */

// Dangerous file extensions that should NEVER be allowed
const BLOCKED_EXTENSIONS = [
  // Executables
  '.exe', '.com', '.bat', '.cmd', '.msi', '.msp', '.msc',
  '.pif', '.scr', '.hta', '.cpl', '.msc', '.jar',
  // Scripts
  '.js', '.jse', '.ws', '.wsf', '.wsc', '.wsh',
  '.ps1', '.ps1xml', '.ps2', '.ps2xml', '.psc1', '.psc2',
  '.vbs', '.vbe', '.vb', '.vbscript',
  '.sh', '.bash', '.zsh', '.csh', '.fish',
  '.pl', '.pm', '.py', '.pyw', '.pyc', '.pyo',
  '.rb', '.rbw', '.php', '.php3', '.php4', '.php5', '.phtml',
  // System files
  '.sys', '.drv', '.dll', '.ocx', '.cpl',
  '.inf', '.reg', '.scf', '.lnk', '.url',
  // Office macros
  '.docm', '.dotm', '.xlsm', '.xltm', '.xlam',
  '.pptm', '.potm', '.ppam', '.ppsm', '.sldm',
  // Archives that could contain executables
  '.iso', '.img', '.dmg', '.toast', '.vcd',
  // Other dangerous
  '.application', '.gadget', '.msp', '.com',
  '.ade', '.adp', '.app', '.asp', '.aspx', '.bas',
  '.chm', '.cnt', '.crt', '.csh', '.der', '.fxp',
  '.hlp', '.hpj', '.ins', '.isp', '.its', '.jse',
  '.ksh', '.mad', '.maf', '.mag', '.mam', '.maq',
  '.mar', '.mas', '.mat', '.mau', '.mav', '.maw',
  '.mda', '.mdb', '.mde', '.mdt', '.mdw', '.mdz',
  '.ops', '.pcd', '.prg', '.pst', '.scf', '.sct',
  '.shb', '.shs', '.tmp', '.vsmacros', '.vsw',
  '.xnk', '.xsl', '.xslt'
];

// Dangerous MIME types
const BLOCKED_MIME_TYPES = [
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-sh',
  'application/x-shellscript',
  'application/x-bat',
  'application/x-msi',
  'application/hta',
  'application/x-javascript',
  'text/javascript',
  'application/javascript',
  'text/x-python',
  'text/x-php',
  'application/x-php',
  'application/x-httpd-php',
  'text/x-perl',
  'application/x-perl'
];

// Allowed file types for each category
const ALLOWED_FILE_TYPES = {
  // Image converters
  heic: {
    extensions: ['.heic', '.heif'],
    mimeTypes: ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence']
  },
  webp: {
    extensions: ['.webp'],
    mimeTypes: ['image/webp']
  },
  psd: {
    extensions: ['.psd'],
    mimeTypes: ['image/vnd.adobe.photoshop', 'application/x-photoshop', 'image/x-photoshop']
  },
  tiff: {
    extensions: ['.tiff', '.tif'],
    mimeTypes: ['image/tiff', 'image/x-tiff']
  },
  svg: {
    extensions: ['.svg'],
    mimeTypes: ['image/svg+xml']
  },
  ico: {
    extensions: ['.ico'],
    mimeTypes: ['image/x-icon', 'image/vnd.microsoft.icon']
  },

  // Document converters
  excel: {
    extensions: ['.xlsx', '.xls', '.xlsb'],
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.ms-excel.sheet.binary.macroEnabled.12'
    ]
  },
  markdown: {
    extensions: ['.md', '.markdown', '.mdown', '.mkd', '.mkdn', '.txt'],
    mimeTypes: ['text/markdown', 'text/x-markdown', 'text/plain']
  },

  // Media converters
  audio: {
    extensions: ['.m4a', '.aac', '.wav', '.ogg', '.flac', '.mp3', '.wma'],
    mimeTypes: [
      'audio/mp4', 'audio/x-m4a', 'audio/m4a',
      'audio/aac', 'audio/x-aac',
      'audio/wav', 'audio/x-wav', 'audio/wave',
      'audio/ogg', 'audio/vorbis',
      'audio/flac', 'audio/x-flac',
      'audio/mpeg', 'audio/mp3',
      'audio/x-ms-wma'
    ]
  },
  video: {
    extensions: ['.webm'],
    mimeTypes: ['video/webm']
  },
  gif: {
    extensions: ['.gif'],
    mimeTypes: ['image/gif']
  },

  // PDF tools
  pdf: {
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf']
  }
};

/**
 * Get file extension from filename (lowercase)
 */
export const getFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return '';
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot).toLowerCase();
};

/**
 * Check if file extension is blocked
 */
export const isBlockedExtension = (filename) => {
  const ext = getFileExtension(filename);
  return BLOCKED_EXTENSIONS.includes(ext);
};

/**
 * Check if MIME type is blocked
 */
export const isBlockedMimeType = (mimeType) => {
  if (!mimeType) return false;
  return BLOCKED_MIME_TYPES.some(blocked =>
    mimeType.toLowerCase().includes(blocked.toLowerCase())
  );
};

/**
 * Validate file against allowed types for a specific category
 */
export const validateFileType = (file, category) => {
  if (!file || !category) {
    return { valid: false, error: 'validation.missingParams' };
  }

  const allowedTypes = ALLOWED_FILE_TYPES[category];
  if (!allowedTypes) {
    return { valid: false, error: 'validation.unknownCategory' };
  }

  const ext = getFileExtension(file.name);
  const mimeType = file.type?.toLowerCase() || '';

  // First check if it's a blocked dangerous file
  if (isBlockedExtension(file.name)) {
    return { valid: false, error: 'validation.dangerousFile' };
  }

  if (isBlockedMimeType(mimeType)) {
    return { valid: false, error: 'validation.dangerousMime' };
  }

  // Check extension
  const validExtension = allowedTypes.extensions.includes(ext);

  // Check MIME type (if provided by browser)
  // Some files may not have MIME type, so we allow if extension matches
  const validMimeType = !mimeType ||
    allowedTypes.mimeTypes.some(allowed => mimeType.includes(allowed.toLowerCase()));

  if (!validExtension) {
    return {
      valid: false,
      error: 'validation.invalidExtension',
      allowed: allowedTypes.extensions.join(', ')
    };
  }

  if (mimeType && !validMimeType) {
    return {
      valid: false,
      error: 'validation.invalidMimeType',
      allowed: allowedTypes.extensions.join(', ')
    };
  }

  return { valid: true };
};

/**
 * Generic file security check (for any file)
 */
export const securityCheck = (file) => {
  if (!file) {
    return { valid: false, error: 'validation.noFile' };
  }

  // Check for dangerous extensions
  if (isBlockedExtension(file.name)) {
    return { valid: false, error: 'validation.dangerousFile' };
  }

  // Check for dangerous MIME types
  if (isBlockedMimeType(file.type)) {
    return { valid: false, error: 'validation.dangerousMime' };
  }

  // Check for suspicious double extensions (e.g., file.jpg.exe)
  const parts = file.name.split('.');
  if (parts.length > 2) {
    const lastExt = '.' + parts[parts.length - 1].toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(lastExt)) {
      return { valid: false, error: 'validation.suspiciousFilename' };
    }
  }

  // Check for hidden files (starting with dot)
  if (file.name.startsWith('.')) {
    return { valid: false, error: 'validation.hiddenFile' };
  }

  // Check for empty filename
  if (file.name.trim() === '' || file.name === getFileExtension(file.name)) {
    return { valid: false, error: 'validation.invalidFilename' };
  }

  return { valid: true };
};

/**
 * Sanitize filename for safe display
 */
export const sanitizeFilename = (filename) => {
  if (!filename) return '';
  // Remove any HTML/script tags
  return filename
    .replace(/<[^>]*>/g, '')
    .replace(/[<>:"\/\\|?*]/g, '_')
    .trim();
};

/**
 * Get human-readable file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Maximum file sizes by category (in bytes)
 */
export const MAX_FILE_SIZES = {
  heic: 50 * 1024 * 1024,      // 50MB
  webp: 50 * 1024 * 1024,      // 50MB
  psd: 100 * 1024 * 1024,      // 100MB
  tiff: 100 * 1024 * 1024,     // 100MB
  svg: 10 * 1024 * 1024,       // 10MB
  ico: 5 * 1024 * 1024,        // 5MB
  excel: 50 * 1024 * 1024,     // 50MB
  markdown: 5 * 1024 * 1024,   // 5MB
  audio: 200 * 1024 * 1024,    // 200MB
  video: 500 * 1024 * 1024,    // 500MB
  gif: 100 * 1024 * 1024,      // 100MB
  pdf: 100 * 1024 * 1024       // 100MB
};

export default {
  validateFileType,
  securityCheck,
  isBlockedExtension,
  isBlockedMimeType,
  getFileExtension,
  sanitizeFilename,
  formatFileSize,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES,
  BLOCKED_EXTENSIONS
};
