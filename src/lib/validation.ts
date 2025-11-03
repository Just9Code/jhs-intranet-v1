/**
 * Validation and Sanitization Utilities
 * Protects against XSS, injection attacks, and malicious input
 */

import validator from 'validator';

/**
 * Sanitize string input by escaping HTML entities
 * Prevents XSS attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return validator.escape(input.trim());
}

/**
 * Sanitize an object by escaping all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    const value = sanitized[key];
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value) as any;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item: any) => 
        typeof item === 'string' ? sanitizeString(item) : item
      ) as any;
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value) as any;
    }
  }
  
  return sanitized;
}

/**
 * Validate and sanitize email
 */
export function validateEmail(email: string): { valid: boolean; sanitized: string; error?: string } {
  const trimmed = email.trim();
  
  if (!trimmed) {
    return { valid: false, sanitized: '', error: 'Email est requis' };
  }
  
  if (!validator.isEmail(trimmed)) {
    return { valid: false, sanitized: '', error: 'Email invalide' };
  }
  
  return { valid: true, sanitized: validator.normalizeEmail(trimmed) || trimmed };
}

/**
 * Validate text length
 */
export function validateLength(
  text: string, 
  min: number, 
  max: number,
  fieldName: string = 'Champ'
): { valid: boolean; error?: string } {
  const length = text.trim().length;
  
  if (length < min) {
    return { valid: false, error: `${fieldName} doit contenir au moins ${min} caractères` };
  }
  
  if (length > max) {
    return { valid: false, error: `${fieldName} ne peut pas dépasser ${max} caractères` };
  }
  
  return { valid: true };
}

/**
 * Validate and sanitize phone number
 */
export function validatePhone(phone: string): { valid: boolean; sanitized: string; error?: string } {
  const trimmed = phone.trim();
  
  if (!trimmed) {
    return { valid: true, sanitized: '' }; // Phone is optional
  }
  
  // Remove all non-digit characters except + at start
  const cleaned = trimmed.replace(/[^\d+]/g, '');
  
  if (cleaned.length < 10 || cleaned.length > 15) {
    return { valid: false, sanitized: '', error: 'Numéro de téléphone invalide' };
  }
  
  return { valid: true, sanitized: cleaned };
}

/**
 * Validate URL
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url) return { valid: true }; // URL is optional
  
  if (!validator.isURL(url, { require_protocol: true })) {
    return { valid: false, error: 'URL invalide' };
  }
  
  return { valid: true };
}

/**
 * Validate numeric value
 */
export function validateNumber(
  value: any,
  min?: number,
  max?: number,
  fieldName: string = 'Valeur'
): { valid: boolean; parsed: number; error?: string } {
  const num = Number(value);
  
  if (isNaN(num)) {
    return { valid: false, parsed: 0, error: `${fieldName} doit être un nombre` };
  }
  
  if (min !== undefined && num < min) {
    return { valid: false, parsed: num, error: `${fieldName} doit être au moins ${min}` };
  }
  
  if (max !== undefined && num > max) {
    return { valid: false, parsed: num, error: `${fieldName} ne peut pas dépasser ${max}` };
  }
  
  return { valid: true, parsed: num };
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: string,
  allowedValues: T[],
  fieldName: string = 'Valeur'
): { valid: boolean; value: T | null; error?: string } {
  if (!allowedValues.includes(value as T)) {
    return { 
      valid: false, 
      value: null, 
      error: `${fieldName} doit être l'une des valeurs suivantes: ${allowedValues.join(', ')}` 
    };
  }
  
  return { valid: true, value: value as T };
}

/**
 * Detect potential SQL injection patterns
 */
export function detectSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(--|\/\*|\*\/|;|'|")/g,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Detect potential XSS patterns
 */
export function detectXss(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // event handlers like onclick=
    /<embed[^>]*>/gi,
    /<object[^>]*>/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Comprehensive input validation
 */
export function validateInput(
  input: string,
  fieldName: string = 'Input'
): { valid: boolean; sanitized: string; error?: string } {
  if (detectSqlInjection(input)) {
    return { valid: false, sanitized: '', error: `${fieldName} contient des caractères interdits` };
  }
  
  if (detectXss(input)) {
    return { valid: false, sanitized: '', error: `${fieldName} contient des caractères interdits` };
  }
  
  return { valid: true, sanitized: sanitizeString(input) };
}

/**
 * Validate file upload
 */
export function validateFile(
  file: { name: string; size: number; type: string },
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [],
    allowedExtensions = [],
  } = options;
  
  // Check file size
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `Le fichier est trop volumineux (max ${Math.round(maxSize / 1024 / 1024)}MB)` 
    };
  }
  
  // Check MIME type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Type de fichier non autorisé (${file.type})` 
    };
  }
  
  // Check file extension
  if (allowedExtensions.length > 0) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(ext)) {
      return { 
        valid: false, 
        error: `Extension de fichier non autorisée (.${ext})` 
      };
    }
  }
  
  return { valid: true };
}