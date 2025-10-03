import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface WebhookValidationResult {
  isValid: boolean;
  reason?: string;
  timestamp?: number;
  payload?: any;
}

export interface WebhookSecurityConfig {
  secretKey: string;
  algorithm: string;
  timestampTolerance: number; // in seconds
  requiredHeaders: string[];
  ipWhitelist?: string[];
}

@Injectable()
export class WebhookSecurityService {
  private readonly logger = new Logger(WebhookSecurityService.name);
  private readonly config: WebhookSecurityConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      secretKey: this.configService.get<string>('PAYTABS_WEBHOOK_SECRET') || 'default-secret',
      algorithm: this.configService.get<string>('WEBHOOK_SIGNATURE_ALGORITHM', 'sha256'),
      timestampTolerance: this.configService.get<number>('WEBHOOK_TIMESTAMP_TOLERANCE', 300), // 5 minutes
      requiredHeaders: ['x-paytabs-signature', 'x-paytabs-timestamp'],
      ipWhitelist: this.configService.get<string>('PAYTABS_IP_WHITELIST', '').split(',').filter(Boolean),
    };

    this.logger.log('Webhook security service initialized with configuration');
  }

  /**
   * Validate webhook signature using HMAC
   */
  validateSignature(payload: string | Buffer, signature: string, timestamp?: string): WebhookValidationResult {
    try {
      // Create expected signature
      const payloadString = typeof payload === 'string' ? payload : payload.toString();
      const timestampString = timestamp || Math.floor(Date.now() / 1000).toString();
      const signedPayload = `${timestampString}.${payloadString}`;
      
      const expectedSignature = crypto
        .createHmac(this.config.algorithm, this.config.secretKey)
        .update(signedPayload, 'utf8')
        .digest('hex');

      // Extract signature from header (remove algorithm prefix if present)
      const receivedSignature = signature.replace(/^sha256=/, '');

      // Compare signatures using constant-time comparison
      const isValid = this.constantTimeCompare(expectedSignature, receivedSignature);

      if (!isValid) {
        this.logger.warn('Webhook signature validation failed', {
          expected: expectedSignature.substring(0, 8) + '...',
          received: receivedSignature.substring(0, 8) + '...',
        });
        return { isValid: false, reason: 'Invalid signature' };
      }

      return { isValid: true, timestamp: parseInt(timestampString) };
    } catch (error) {
      this.logger.error('Error validating webhook signature:', error);
      return { isValid: false, reason: 'Signature validation error' };
    }
  }

  /**
   * Validate webhook timestamp to prevent replay attacks
   */
  validateTimestamp(timestamp: number): WebhookValidationResult {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDifference = Math.abs(currentTime - timestamp);

    if (timeDifference > this.config.timestampTolerance) {
      this.logger.warn('Webhook timestamp validation failed', {
        timestamp,
        currentTime,
        difference: timeDifference,
        tolerance: this.config.timestampTolerance,
      });
      return { 
        isValid: false, 
        reason: `Timestamp too old or too far in future. Difference: ${timeDifference}s` 
      };
    }

    return { isValid: true, timestamp };
  }

  /**
   * Validate IP address against whitelist
   */
  validateIPAddress(clientIP: string): WebhookValidationResult {
    if (this.config.ipWhitelist.length === 0) {
      // No IP whitelist configured, allow all
      return { isValid: true };
    }

    const isWhitelisted = this.config.ipWhitelist.some(whitelistedIP => {
      // Support CIDR notation and exact matches
      if (whitelistedIP.includes('/')) {
        return this.isIPInCIDR(clientIP, whitelistedIP);
      }
      return clientIP === whitelistedIP;
    });

    if (!isWhitelisted) {
      this.logger.warn('Webhook IP validation failed', {
        clientIP,
        whitelist: this.config.ipWhitelist,
      });
      return { isValid: false, reason: 'IP address not whitelisted' };
    }

    return { isValid: true };
  }

  /**
   * Comprehensive webhook validation
   */
  validateWebhook(
    payload: string | Buffer,
    headers: Record<string, string>,
    clientIP?: string
  ): WebhookValidationResult {
    try {
      // Check required headers
      const missingHeaders = this.config.requiredHeaders.filter(
        header => !headers[header] && !headers[header.toLowerCase()]
      );

      if (missingHeaders.length > 0) {
        return { 
          isValid: false, 
          reason: `Missing required headers: ${missingHeaders.join(', ')}` 
        };
      }

      // Get signature and timestamp from headers (case-insensitive)
      const signature = headers['x-paytabs-signature'] || headers['X-PayTabs-Signature'] || '';
      const timestampHeader = headers['x-paytabs-timestamp'] || headers['X-PayTabs-Timestamp'] || '';

      // Validate IP if provided
      if (clientIP) {
        const ipValidation = this.validateIPAddress(clientIP);
        if (!ipValidation.isValid) {
          return ipValidation;
        }
      }

      // Validate timestamp
      const timestamp = parseInt(timestampHeader);
      if (isNaN(timestamp)) {
        return { isValid: false, reason: 'Invalid timestamp format' };
      }

      const timestampValidation = this.validateTimestamp(timestamp);
      if (!timestampValidation.isValid) {
        return timestampValidation;
      }

      // Validate signature
      const signatureValidation = this.validateSignature(payload, signature, timestampHeader);
      if (!signatureValidation.isValid) {
        return signatureValidation;
      }

      // Parse payload if validation successful
      let parsedPayload;
      try {
        parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : JSON.parse(payload.toString());
      } catch (error) {
        this.logger.warn('Failed to parse webhook payload as JSON');
        parsedPayload = payload;
      }

      this.logger.log('Webhook validation successful', {
        timestamp,
        payloadSize: payload.length,
        clientIP,
      });

      return { 
        isValid: true, 
        timestamp, 
        payload: parsedPayload 
      };

    } catch (error) {
      this.logger.error('Error during webhook validation:', error);
      return { isValid: false, reason: 'Validation error' };
    }
  }

  /**
   * Generate webhook signature for testing
   */
  generateSignature(payload: string, timestamp?: string): string {
    const timestampString = timestamp || Math.floor(Date.now() / 1000).toString();
    const signedPayload = `${timestampString}.${payload}`;
    
    return crypto
      .createHmac(this.config.algorithm, this.config.secretKey)
      .update(signedPayload, 'utf8')
      .digest('hex');
  }

  /**
   * Create webhook headers for testing
   */
  createWebhookHeaders(payload: string): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.generateSignature(payload, timestamp);

    return {
      'X-PayTabs-Signature': `sha256=${signature}`,
      'X-PayTabs-Timestamp': timestamp,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Check if IP is in CIDR range
   */
  private isIPInCIDR(ip: string, cidr: string): boolean {
    try {
      const [range, bits] = cidr.split('/');
      const mask = ~(2 ** (32 - parseInt(bits)) - 1);
      
      const ipInt = this.ipToInt(ip);
      const rangeInt = this.ipToInt(range);
      
      return (ipInt & mask) === (rangeInt & mask);
    } catch (error) {
      this.logger.error('Error checking IP in CIDR:', error);
      return false;
    }
  }

  /**
   * Convert IP address to integer
   */
  private ipToInt(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  }

  /**
   * Get security configuration (without sensitive data)
   */
  getSecurityConfig(): Omit<WebhookSecurityConfig, 'secretKey'> {
    return {
      algorithm: this.config.algorithm,
      timestampTolerance: this.config.timestampTolerance,
      requiredHeaders: this.config.requiredHeaders,
      ipWhitelist: this.config.ipWhitelist,
    };
  }

  /**
   * Update security configuration
   */
  updateConfig(newConfig: Partial<WebhookSecurityConfig>): void {
    Object.assign(this.config, newConfig);
    this.logger.log('Webhook security configuration updated');
  }
}

