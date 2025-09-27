/**
 * Client-side Validation Utilities
 * Shared validation functions and schemas for the notifications system
 */

import { z } from 'zod';

// Validation schema for notifications
export const notificationValidationSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long (max 200 characters)')
    .trim(),
  
  message: z.string()
    .min(1, 'Message is required') 
    .max(1000, 'Message too long (max 1000 characters)')
    .trim(),
    
  type: z.enum(['info', 'success', 'warning', 'error'], {
    errorMap: () => ({ message: 'Type must be one of: info, success, warning, error' })
  }).optional().default('info'),
  
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Priority must be one of: low, medium, high, urgent' })
  }).optional().default('medium'),
  
  channel: z.enum(['system', 'email', 'push', 'sms'], {
    errorMap: () => ({ message: 'Channel must be one of: system, email, push, sms' })
  }).optional().default('system'),
  
  tags: z.array(z.string().min(1).max(50)).optional().default([]),
  
  metadata: z.record(z.string(), z.any()).optional().default({}),
  
  scheduledFor: z.string()
    .datetime({ message: 'Invalid datetime format' })
    .optional()
    .refine((date) => {
      if (!date) return true;
      return new Date(date).getTime() > Date.now();
    }, 'Scheduled time must be in the future'),
    
  expiresAt: z.string()
    .datetime({ message: 'Invalid datetime format' })
    .optional()
    .refine((date) => {
      if (!date) return true;
      return new Date(date).getTime() > Date.now();
    }, 'Expiration time must be in the future')
});

// Validation schema for updating notifications
export const updateNotificationSchema = notificationValidationSchema.partial();

// Validation schema for API keys
export const apiKeyValidationSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long (max 100 characters)')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores')
    .trim(),
    
  permissions: z.array(z.string()).optional().default([
    'notifications:create',
    'notifications:read'
  ]),
  
  expiresAt: z.string()
    .datetime({ message: 'Invalid datetime format' })
    .optional()
    .refine((date) => {
      if (!date) return true;
      return new Date(date).getTime() > Date.now();
    }, 'Expiration time must be in the future')
});

// Query parameters validation schema
export const notificationQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  type: z.enum(['info', 'success', 'warning', 'error']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  channel: z.enum(['system', 'email', 'push', 'sms']).optional(),
  status: z.enum(['pending', 'sent', 'failed', 'read']).optional(),
  search: z.string().max(255).optional(),
  tags: z.array(z.string()).or(z.string().transform(s => [s])).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

export type NotificationData = z.infer<typeof notificationValidationSchema>;
export type UpdateNotificationData = z.infer<typeof updateNotificationSchema>;
export type ApiKeyData = z.infer<typeof apiKeyValidationSchema>;
export type NotificationQuery = z.infer<typeof notificationQuerySchema>;

/**
 * Validation result type
 */
export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
  message?: string;
}

/**
 * Client-side validation functions
 */
export const clientValidation = {
  /**
   * Validate notification data
   */
  validateNotification(data: unknown): ValidationResult<NotificationData> {
    try {
      const validatedData = notificationValidationSchema.parse(data);
      return {
        success: true,
        data: validatedData
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) errors[path] = [];
          errors[path].push(err.message);
        });
        
        return {
          success: false,
          errors,
          message: 'Validation failed'
        };
      }
      
      return {
        success: false,
        message: 'Unknown validation error'
      };
    }
  },

  /**
   * Validate notification update data
   */
  validateNotificationUpdate(data: unknown): ValidationResult<UpdateNotificationData> {
    try {
      const validatedData = updateNotificationSchema.parse(data);
      return {
        success: true,
        data: validatedData
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) errors[path] = [];
          errors[path].push(err.message);
        });
        
        return {
          success: false,
          errors,
          message: 'Validation failed'
        };
      }
      
      return {
        success: false,
        message: 'Unknown validation error'
      };
    }
  },

  /**
   * Validate API key data
   */
  validateApiKey(data: unknown): ValidationResult<ApiKeyData> {
    try {
      const validatedData = apiKeyValidationSchema.parse(data);
      return {
        success: true,
        data: validatedData
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) errors[path] = [];
          errors[path].push(err.message);
        });
        
        return {
          success: false,
          errors,
          message: 'Validation failed'
        };
      }
      
      return {
        success: false,
        message: 'Unknown validation error'
      };
    }
  },

  /**
   * Validate query parameters
   */
  validateQuery(data: unknown): ValidationResult<NotificationQuery> {
    try {
      const validatedData = notificationQuerySchema.parse(data);
      return {
        success: true,
        data: validatedData
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) errors[path] = [];
          errors[path].push(err.message);
        });
        
        return {
          success: false,
          errors,
          message: 'Validation failed'
        };
      }
      
      return {
        success: false,
        message: 'Unknown validation error'
      };
    }
  }
};

/**
 * Form validation helpers
 */
export const formValidation = {
  /**
   * Real-time field validation
   */
  validateField(fieldName: string, value: any, schema: z.ZodSchema): string | null {
    try {
      // Extract the specific field schema
      if (schema instanceof z.ZodObject) {
        const fieldSchema = schema.shape[fieldName];
        if (fieldSchema) {
          fieldSchema.parse(value);
        }
      }
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Invalid value';
      }
      return 'Validation error';
    }
  },

  /**
   * Check if a string is a valid email
   */
  isValidEmail(email: string): boolean {
    const emailSchema = z.string().email();
    try {
      emailSchema.parse(email);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if a string is a valid URL
   */
  isValidUrl(url: string): boolean {
    const urlSchema = z.string().url();
    try {
      urlSchema.parse(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if a date string is valid and in the future
   */
  isValidFutureDate(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      return date.getTime() > Date.now();
    } catch {
      return false;
    }
  },

  /**
   * Sanitize HTML content (basic)
   */
  sanitizeHtml(html: string): string {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '');
  },

  /**
   * Clean and validate tags
   */
  cleanTags(tags: string[]): string[] {
    return tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length <= 50)
      .filter((tag, index, array) => array.indexOf(tag) === index) // Remove duplicates
      .slice(0, 20); // Limit to 20 tags
  }
};

/**
 * Security validation helpers
 */
export const securityValidation = {
  /**
   * Check for suspicious patterns in user input
   */
  checkSuspiciousInput(input: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i,
      /src=["']?data:/i,
      /\beval\s*\(/i,
      /\bFunction\s*\(/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(input));
  },

  /**
   * Validate API key format
   */
  isValidApiKeyFormat(key: string): boolean {
    // Expected format: zro_[random string of 32 characters]
    const apiKeyPattern = /^zro_[a-zA-Z0-9]{32}$/;
    return apiKeyPattern.test(key);
  },

  /**
   * Check password strength (basic)
   */
  checkPasswordStrength(password: string): {
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;
    
    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Password should contain lowercase letters');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Password should contain uppercase letters');
    
    if (/\d/.test(password)) score += 1;
    else feedback.push('Password should contain numbers');
    
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Password should contain special characters');
    
    return { score, feedback };
  }
};

/**
 * Utility functions for common validation scenarios
 */
export const validationUtils = {
  /**
   * Debounced validation for real-time form feedback
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Format validation errors for display
   */
  formatValidationErrors(errors: Record<string, string[]>): string[] {
    const formattedErrors: string[] = [];
    
    Object.entries(errors).forEach(([field, fieldErrors]) => {
      fieldErrors.forEach(error => {
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
        formattedErrors.push(`${fieldName}: ${error}`);
      });
    });
    
    return formattedErrors;
  },

  /**
   * Get the first error message from validation result
   */
  getFirstError(validationResult: ValidationResult): string | null {
    if (validationResult.success || !validationResult.errors) {
      return null;
    }
    
    const firstField = Object.keys(validationResult.errors)[0];
    if (!firstField) return null;
    
    return validationResult.errors[firstField][0] || null;
  }
};