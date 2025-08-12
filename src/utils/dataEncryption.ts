// Data masking and encryption utilities for sensitive driver information

export class DataSecurity {
  
  /**
   * Mask sensitive license number - show only last 4 digits
   */
  static maskLicenseNumber(licenseNumber: string | null | undefined): string {
    if (!licenseNumber || licenseNumber.length < 4) {
      return '••••••••';
    }
    
    const lastFour = licenseNumber.slice(-4);
    const maskedPortion = '•'.repeat(Math.max(licenseNumber.length - 4, 4));
    return maskedPortion + lastFour;
  }

  /**
   * Mask medical card number - show only last 3 digits
   */
  static maskMedicalCardNumber(cardNumber: string | null | undefined): string {
    if (!cardNumber || cardNumber.length < 3) {
      return '••••••';
    }
    
    const lastThree = cardNumber.slice(-3);
    const maskedPortion = '•'.repeat(Math.max(cardNumber.length - 3, 3));
    return maskedPortion + lastThree;
  }

  /**
   * Mask phone number - show only last 4 digits
   */
  static maskPhoneNumber(phoneNumber: string | null | undefined): string {
    if (!phoneNumber) {
      return '•••-•••-••••';
    }
    
    // Extract digits only
    const digits = phoneNumber.replace(/\D/g, '');
    
    if (digits.length !== 10) {
      return '•••-•••-••••';
    }
    
    return `•••-•••-${digits.slice(-4)}`;
  }

  /**
   * Mask email address - show only first letter and domain
   */
  static maskEmail(email: string | null | undefined): string {
    if (!email || !email.includes('@')) {
      return '•••••@••••••.com';
    }
    
    const [username, domain] = email.split('@');
    const maskedUsername = username[0] + '•'.repeat(Math.max(username.length - 1, 3));
    return `${maskedUsername}@${domain}`;
  }

  /**
   * Validate sensitive data format
   */
  static validateLicenseNumber(licenseNumber: string): boolean {
    // Basic validation - adjust based on your state/country requirements
    return /^[A-Z0-9]{6,15}$/i.test(licenseNumber.replace(/[-\s]/g, ''));
  }

  static validateMedicalCardNumber(cardNumber: string): boolean {
    // Basic validation for medical card numbers
    return /^[A-Z0-9]{4,12}$/i.test(cardNumber.replace(/[-\s]/g, ''));
  }

  /**
   * Sanitize file names for secure storage
   */
  static sanitizeFileName(fileName: string): string {
    // Remove potentially dangerous characters
    const sanitized = fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^[._]+|[._]+$/g, '')
      .toLowerCase();
    
    // Ensure file has an extension
    if (!sanitized.includes('.')) {
      return sanitized + '.unknown';
    }
    
    return sanitized;
  }

  /**
   * Generate secure document ID
   */
  static generateDocumentId(driverId: string, documentType: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${driverId}_${documentType}_${timestamp}_${random}`;
  }

  /**
   * Check if data should be masked based on user role and context
   */
  static shouldMaskData(
    dataType: 'license' | 'medical_card' | 'phone' | 'email',
    userRole: 'admin' | 'dispatcher' | 'driver',
    isOwnData: boolean
  ): boolean {
    // Admin can see everything
    if (userRole === 'admin') {
      return false;
    }
    
    // Drivers can see their own data
    if (userRole === 'driver' && isOwnData) {
      return false;
    }
    
    // Dispatchers have limited access to sensitive data
    if (userRole === 'dispatcher') {
      return ['license', 'medical_card'].includes(dataType);
    }
    
    // Default: mask everything
    return true;
  }

  /**
   * Audit log entry for sensitive data access
   */
  static createAuditEntry(
    userId: string,
    action: 'view' | 'edit' | 'download' | 'delete',
    targetDriverId: string,
    dataType: string,
    additionalDetails?: Record<string, any>
  ) {
    return {
      user_id: userId,
      action_type: `sensitive_data_${action}`,
      target_driver_id: targetDriverId,
      action_details: {
        data_type: dataType,
        timestamp: new Date().toISOString(),
        ip_address: 'unknown', // Would be populated in edge function
        user_agent: navigator.userAgent,
        ...additionalDetails
      }
    };
  }

  /**
   * File type validation for security
   */
  static validateFileType(file: File): { isValid: boolean; reason?: string } {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        reason: 'File type not allowed. Only PDF, JPEG, PNG, and WebP files are permitted.'
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        reason: 'File size too large. Maximum size is 10MB.'
      };
    }

    // Check for suspicious file names
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.php$/i,
      /\.asp$/i,
      /\.jsp$/i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
      return {
        isValid: false,
        reason: 'File name contains suspicious patterns.'
      };
    }

    return { isValid: true };
  }

  /**
   * Generate secure temporary access token for document viewing
   */
  static generateTempAccessToken(): string {
    const timestamp = Date.now();
    const random = crypto.getRandomValues(new Uint8Array(16));
    const randomString = Array.from(random, byte => byte.toString(16).padStart(2, '0')).join('');
    
    return `temp_${timestamp}_${randomString}`;
  }
}