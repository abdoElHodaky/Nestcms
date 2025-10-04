/**
 * 🔐 **WEBHOOK SECURITY SERVICE**
 * 
 * Comprehensive webhook security implementation with signature verification,
 * replay attack prevention, IP whitelisting, and advanced security monitoring.
 * 
 * @author NestCMS Team
 * @version 2.0.0
 * @since 2024-01-15
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import { 
  PaymentEventType,
  SecurityEvent,
  PaymentEventPriority,
  PaymentEventStatus,
} from '../interfaces/payment-types.interface';

export interface WebhookSecurityConfig {
  secretKey: string;
  signatureHeader: string;
  signatureAlgorithm: string;
  timestampHeader: string;
  timestampTolerance: number;
  ipWhitelist: string[];
  requireHttps: boolean;
  maxPayloadSize: number;
  enableReplayProtection: boolean;
  enableRateLimiting: boolean;
  rateLimitWindow: number;
  rateLimitMax: number;
  enableMetrics: boolean;
  enableAlerting: boolean;
}

export interface WebhookValidationRequest {
  payload: string;
  signature: string;
  timestamp: string;
  ipAddress: string;
  headers: Record<string, string>;
  userAgent?: string;
  contentType?: string;
}

export interface WebhookValidationResult {
  isValid: boolean;
  signatureValid: boolean;
  timestampValid: boolean;
  ipWhitelisted: boolean;
  replayDetected: boolean;
  rateLimitExceeded: boolean;
  reason?: string;
  securityScore: number;
  validationDetails: {
    signatureAlgorithm: string;
    timestampDifference: number;
    payloadSize: number;
    ipAddress: string;
    userAgent?: string;
    validationTime: number;
  };
}

export interface WebhookSecurityMetrics {
  totalRequests: number;
  validRequests: number;
  invalidRequests: number;
  signatureFailures: number;
  timestampFailures: number;
  ipBlockedRequests: number;
  replayAttacks: number;
  rateLimitViolations: number;
  lastValidRequest: Date;
  lastSecurityViolation: Date;
  averageValidationTime: number;
  securityScore: number;
}

@Injectable()
export class WebhookSecurityService {
  private readonly logger = new Logger(WebhookSecurityService.name);
  private readonly config: WebhookSecurityConfig;
  private readonly replayCache = new Map<string, Date>();
  private readonly rateLimitCache = new Map<string, { count: number; resetTime: Date }>();
  private readonly securityMetrics: WebhookSecurityMetrics;
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.config = {
      secretKey: this.configService.get<string>('PAYTABS_WEBHOOK_SECRET', ''),
      signatureHeader: this.configService.get<string>('PAYTABS_SIGNATURE_HEADER', 'x-paytabs-signature'),
      signatureAlgorithm: this.configService.get<string>('PAYTABS_SIGNATURE_ALGORITHM', 'sha256'),
      timestampHeader: this.configService.get<string>('PAYTABS_TIMESTAMP_HEADER', 'x-paytabs-timestamp'),
      timestampTolerance: this.configService.get<number>('PAYTABS_TIMESTAMP_TOLERANCE', 300), // 5 minutes
      ipWhitelist: this.parseIpWhitelist(this.configService.get<string>('PAYTABS_IP_WHITELIST', '')),
      requireHttps: this.configService.get<boolean>('PAYTABS_REQUIRE_HTTPS', true),
      maxPayloadSize: this.configService.get<number>('PAYTABS_MAX_PAYLOAD_SIZE', 1048576), // 1MB
      enableReplayProtection: this.configService.get<boolean>('WEBHOOK_REPLAY_PROTECTION', true),
      enableRateLimiting: this.configService.get<boolean>('WEBHOOK_RATE_LIMITING', true),
      rateLimitWindow: this.configService.get<number>('WEBHOOK_RATE_LIMIT_WINDOW', 60000), // 1 minute
      rateLimitMax: this.configService.get<number>('WEBHOOK_RATE_LIMIT_MAX', 100),
      enableMetrics: this.configService.get<boolean>('WEBHOOK_METRICS_ENABLED', true),
      enableAlerting: this.configService.get<boolean>('WEBHOOK_ALERTING_ENABLED', true),
    };

    this.securityMetrics = {
      totalRequests: 0,
      validRequests: 0,
      invalidRequests: 0,
      signatureFailures: 0,
      timestampFailures: 0,
      ipBlockedRequests: 0,
      replayAttacks: 0,
      rateLimitViolations: 0,
      lastValidRequest: new Date(),
      lastSecurityViolation: new Date(),
      averageValidationTime: 0,
      securityScore: 100,
    };

    // Start cleanup interval for replay cache and rate limiting
    this.cleanupInterval = setInterval(() => {
      this.cleanupCaches();
    }, 60000); // Cleanup every minute

    this.validateConfiguration();
  }

  /**
   * Validate webhook with comprehensive security checks
   */
  async validateWebhook(request: WebhookValidationRequest): Promise<WebhookValidationResult> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();

    try {
      this.securityMetrics.totalRequests++;

      // Initialize validation result
      const result: WebhookValidationResult = {
        isValid: false,
        signatureValid: false,
        timestampValid: false,
        ipWhitelisted: true,
        replayDetected: false,
        rateLimitExceeded: false,
        securityScore: 0,
        validationDetails: {
          signatureAlgorithm: this.config.signatureAlgorithm,
          timestampDifference: 0,
          payloadSize: Buffer.byteLength(request.payload, 'utf8'),
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
          validationTime: 0,
        },
      };

      // 1. Check payload size
      if (result.validationDetails.payloadSize > this.config.maxPayloadSize) {
        result.reason = `Payload size ${result.validationDetails.payloadSize} exceeds maximum ${this.config.maxPayloadSize}`;
        await this.recordSecurityViolation('PAYLOAD_SIZE_EXCEEDED', request, correlationId);
        return this.finalizeValidation(result, startTime);
      }

      // 2. Check IP whitelist
      if (this.config.ipWhitelist.length > 0) {
        result.ipWhitelisted = this.isIpWhitelisted(request.ipAddress);
        if (!result.ipWhitelisted) {
          result.reason = `IP address ${request.ipAddress} not in whitelist`;
          this.securityMetrics.ipBlockedRequests++;
          await this.recordSecurityViolation('IP_NOT_WHITELISTED', request, correlationId);
          return this.finalizeValidation(result, startTime);
        }
      }

      // 3. Check rate limiting
      if (this.config.enableRateLimiting) {
        result.rateLimitExceeded = this.isRateLimitExceeded(request.ipAddress);
        if (result.rateLimitExceeded) {
          result.reason = 'Rate limit exceeded';
          this.securityMetrics.rateLimitViolations++;
          await this.recordSecurityViolation('RATE_LIMIT_EXCEEDED', request, correlationId);
          return this.finalizeValidation(result, startTime);
        }
      }

      // 4. Validate timestamp
      result.timestampValid = this.validateTimestamp(request.timestamp);
      result.validationDetails.timestampDifference = this.getTimestampDifference(request.timestamp);
      
      if (!result.timestampValid) {
        result.reason = `Timestamp validation failed. Difference: ${result.validationDetails.timestampDifference}s`;
        this.securityMetrics.timestampFailures++;
        await this.recordSecurityViolation('INVALID_TIMESTAMP', request, correlationId);
        return this.finalizeValidation(result, startTime);
      }

      // 5. Check for replay attacks
      if (this.config.enableReplayProtection) {
        result.replayDetected = this.isReplayAttack(request.signature, request.timestamp);
        if (result.replayDetected) {
          result.reason = 'Replay attack detected';
          this.securityMetrics.replayAttacks++;
          await this.recordSecurityViolation('REPLAY_ATTACK', request, correlationId);
          return this.finalizeValidation(result, startTime);
        }
      }

      // 6. Validate signature (most important check)
      result.signatureValid = this.validateSignature(request.payload, request.signature, request.timestamp);
      
      if (!result.signatureValid) {
        result.reason = 'Signature validation failed';
        this.securityMetrics.signatureFailures++;
        await this.recordSecurityViolation('INVALID_SIGNATURE', request, correlationId);
        return this.finalizeValidation(result, startTime);
      }

      // All validations passed
      result.isValid = true;
      result.securityScore = this.calculateSecurityScore(result);
      
      this.securityMetrics.validRequests++;
      this.securityMetrics.lastValidRequest = new Date();
      
      // Record successful validation in replay cache
      if (this.config.enableReplayProtection) {
        this.replayCache.set(this.generateReplayKey(request.signature, request.timestamp), new Date());
      }

      this.logger.log(`Webhook validation successful: ${correlationId}`);
      
      return this.finalizeValidation(result, startTime);

    } catch (error) {
      this.logger.error(`Webhook validation error: ${error.message}`, error.stack);
      
      const result: WebhookValidationResult = {
        isValid: false,
        signatureValid: false,
        timestampValid: false,
        ipWhitelisted: false,
        replayDetected: false,
        rateLimitExceeded: false,
        reason: `Validation error: ${error.message}`,
        securityScore: 0,
        validationDetails: {
          signatureAlgorithm: this.config.signatureAlgorithm,
          timestampDifference: 0,
          payloadSize: 0,
          ipAddress: request.ipAddress,
          validationTime: Date.now() - startTime,
        },
      };

      await this.recordSecurityViolation('VALIDATION_ERROR', request, correlationId);
      return result;
    }
  }

  /**
   * Validate HMAC signature with constant-time comparison
   */
  private validateSignature(payload: string, signature: string, timestamp: string): boolean {
    try {
      if (!this.config.secretKey) {
        this.logger.error('Webhook secret key not configured');
        return false;
      }

      // Create the expected signature
      const expectedSignature = this.createSignature(payload, timestamp);
      
      // Use constant-time comparison to prevent timing attacks
      return this.constantTimeCompare(signature, expectedSignature);

    } catch (error) {
      this.logger.error(`Signature validation error: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Create HMAC signature for payload and timestamp
   */
  private createSignature(payload: string, timestamp: string): string {
    const signedPayload = `${timestamp}.${payload}`;
    const hmac = crypto.createHmac(this.config.signatureAlgorithm, this.config.secretKey);
    hmac.update(signedPayload, 'utf8');
    const signature = hmac.digest('hex');
    
    return `${this.config.signatureAlgorithm}=${signature}`;
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
   * Validate timestamp within tolerance window
   */
  private validateTimestamp(timestamp: string): boolean {
    try {
      const webhookTime = parseInt(timestamp, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      const timeDifference = Math.abs(currentTime - webhookTime);
      
      return timeDifference <= this.config.timestampTolerance;

    } catch (error) {
      this.logger.error(`Timestamp validation error: ${error.message}`);
      return false;
    }
  }

  /**
   * Get timestamp difference in seconds
   */
  private getTimestampDifference(timestamp: string): number {
    try {
      const webhookTime = parseInt(timestamp, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      return Math.abs(currentTime - webhookTime);
    } catch (error) {
      return -1;
    }
  }

  /**
   * Check if IP address is whitelisted
   */
  private isIpWhitelisted(ipAddress: string): boolean {
    if (this.config.ipWhitelist.length === 0) {
      return true; // No whitelist configured, allow all
    }

    return this.config.ipWhitelist.some(whitelistedIp => {
      // Support CIDR notation and exact matches
      if (whitelistedIp.includes('/')) {
        return this.isIpInCidr(ipAddress, whitelistedIp);
      }
      return ipAddress === whitelistedIp;
    });
  }

  /**
   * Check if IP is in CIDR range
   */
  private isIpInCidr(ip: string, cidr: string): boolean {
    try {
      const [range, bits] = cidr.split('/');
      const mask = ~(2 ** (32 - parseInt(bits)) - 1);
      
      const ipInt = this.ipToInt(ip);
      const rangeInt = this.ipToInt(range);
      
      return (ipInt & mask) === (rangeInt & mask);
    } catch (error) {
      this.logger.error(`CIDR validation error: ${error.message}`);
      return false;
    }
  }

  /**
   * Convert IP address to integer
   */
  private ipToInt(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  /**
   * Check for replay attacks
   */
  private isReplayAttack(signature: string, timestamp: string): boolean {
    const replayKey = this.generateReplayKey(signature, timestamp);
    return this.replayCache.has(replayKey);
  }

  /**
   * Generate replay protection key
   */
  private generateReplayKey(signature: string, timestamp: string): string {
    return crypto.createHash('sha256').update(`${signature}:${timestamp}`).digest('hex');
  }

  /**
   * Check rate limiting
   */
  private isRateLimitExceeded(ipAddress: string): boolean {
    const now = new Date();
    const rateLimitData = this.rateLimitCache.get(ipAddress);

    if (!rateLimitData || now > rateLimitData.resetTime) {
      // Reset or initialize rate limit
      this.rateLimitCache.set(ipAddress, {
        count: 1,
        resetTime: new Date(now.getTime() + this.config.rateLimitWindow),
      });
      return false;
    }

    rateLimitData.count++;
    return rateLimitData.count > this.config.rateLimitMax;
  }

  /**
   * Calculate security score based on validation results
   */
  private calculateSecurityScore(result: WebhookValidationResult): number {
    let score = 0;

    if (result.signatureValid) score += 40;
    if (result.timestampValid) score += 20;
    if (result.ipWhitelisted) score += 15;
    if (!result.replayDetected) score += 15;
    if (!result.rateLimitExceeded) score += 10;

    return score;
  }

  /**
   * Finalize validation result with timing and metrics
   */
  private finalizeValidation(result: WebhookValidationResult, startTime: number): WebhookValidationResult {
    const validationTime = Date.now() - startTime;
    result.validationDetails.validationTime = validationTime;

    // Update metrics
    if (this.config.enableMetrics) {
      this.updateSecurityMetrics(result, validationTime);
    }

    if (!result.isValid) {
      this.securityMetrics.invalidRequests++;
      this.securityMetrics.lastSecurityViolation = new Date();
    }

    return result;
  }

  /**
   * Update security metrics
   */
  private updateSecurityMetrics(result: WebhookValidationResult, validationTime: number): void {
    // Update average validation time
    const totalValidations = this.securityMetrics.totalRequests;
    this.securityMetrics.averageValidationTime = 
      (this.securityMetrics.averageValidationTime * (totalValidations - 1) + validationTime) / totalValidations;

    // Update security score
    const validRequests = this.securityMetrics.validRequests;
    const totalRequests = this.securityMetrics.totalRequests;
    this.securityMetrics.securityScore = totalRequests > 0 ? (validRequests / totalRequests) * 100 : 100;
  }

  /**
   * Record security violation event
   */
  private async recordSecurityViolation(
    violationType: string, 
    request: WebhookValidationRequest, 
    correlationId: string
  ): Promise<void> {
    if (!this.config.enableAlerting) return;

    const securityEvent: SecurityEvent = {
      id: this.generateEventId(),
      type: PaymentEventType.SECURITY_EVENT,
      timestamp: new Date(),
      version: '2.0',
      priority: PaymentEventPriority.HIGH,
      status: PaymentEventStatus.COMPLETED,
      correlationId,
      aggregateId: 'webhook-security',
      aggregateType: 'WebhookSecurity',
      metadata: {
        source: 'WebhookSecurityService',
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        traceId: this.generateTraceId(),
      },
      data: {
        eventType: 'WEBHOOK_SECURITY_VIOLATION',
        severity: this.getViolationSeverity(violationType),
        description: `Webhook security violation: ${violationType}`,
        sourceIp: request.ipAddress,
        userAgent: request.userAgent,
        additionalData: {
          violationType,
          payloadSize: Buffer.byteLength(request.payload, 'utf8'),
          headers: request.headers,
          timestamp: request.timestamp,
        },
        detectedAt: new Date(),
        mitigationActions: this.getMitigationActions(violationType),
      },
    };

    await this.eventEmitter.emit(securityEvent.type, securityEvent);

    this.logger.warn(`Security violation detected: ${violationType} from ${request.ipAddress} (${correlationId})`);
  }

  /**
   * Get violation severity
   */
  private getViolationSeverity(violationType: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'PAYLOAD_SIZE_EXCEEDED': 'medium',
      'IP_NOT_WHITELISTED': 'high',
      'RATE_LIMIT_EXCEEDED': 'medium',
      'INVALID_TIMESTAMP': 'high',
      'REPLAY_ATTACK': 'critical',
      'INVALID_SIGNATURE': 'critical',
      'VALIDATION_ERROR': 'high',
    };

    return severityMap[violationType] || 'medium';
  }

  /**
   * Get mitigation actions for violation type
   */
  private getMitigationActions(violationType: string): string[] {
    const mitigationMap: Record<string, string[]> = {
      'PAYLOAD_SIZE_EXCEEDED': ['Block request', 'Log violation', 'Monitor for patterns'],
      'IP_NOT_WHITELISTED': ['Block IP', 'Alert security team', 'Review IP whitelist'],
      'RATE_LIMIT_EXCEEDED': ['Temporary IP block', 'Monitor for DDoS', 'Adjust rate limits'],
      'INVALID_TIMESTAMP': ['Block request', 'Check time synchronization', 'Monitor for clock skew'],
      'REPLAY_ATTACK': ['Block request', 'Alert security team', 'Investigate attack source'],
      'INVALID_SIGNATURE': ['Block request', 'Alert security team', 'Verify webhook configuration'],
      'VALIDATION_ERROR': ['Block request', 'Log error details', 'Review validation logic'],
    };

    return mitigationMap[violationType] || ['Block request', 'Log violation', 'Manual review'];
  }

  /**
   * Parse IP whitelist from configuration
   */
  private parseIpWhitelist(ipWhitelistString: string): string[] {
    if (!ipWhitelistString) return [];
    
    return ipWhitelistString
      .split(',')
      .map(ip => ip.trim())
      .filter(ip => ip.length > 0);
  }

  /**
   * Validate service configuration
   */
  private validateConfiguration(): void {
    if (!this.config.secretKey) {
      this.logger.warn('Webhook secret key not configured - signature validation will fail');
    }

    if (this.config.timestampTolerance < 60) {
      this.logger.warn('Timestamp tolerance is very low - may cause legitimate requests to fail');
    }

    if (this.config.maxPayloadSize > 10 * 1024 * 1024) { // 10MB
      this.logger.warn('Maximum payload size is very large - may impact performance');
    }

    this.logger.log('Webhook security service configured successfully');
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCaches(): void {
    const now = new Date();
    const replayExpiry = new Date(now.getTime() - (this.config.timestampTolerance * 2 * 1000));

    // Cleanup replay cache
    for (const [key, timestamp] of this.replayCache.entries()) {
      if (timestamp < replayExpiry) {
        this.replayCache.delete(key);
      }
    }

    // Cleanup rate limit cache
    for (const [ip, data] of this.rateLimitCache.entries()) {
      if (now > data.resetTime) {
        this.rateLimitCache.delete(ip);
      }
    }
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): WebhookSecurityMetrics {
    return { ...this.securityMetrics };
  }

  /**
   * Reset security metrics (for testing or maintenance)
   */
  resetSecurityMetrics(): void {
    Object.assign(this.securityMetrics, {
      totalRequests: 0,
      validRequests: 0,
      invalidRequests: 0,
      signatureFailures: 0,
      timestampFailures: 0,
      ipBlockedRequests: 0,
      replayAttacks: 0,
      rateLimitViolations: 0,
      lastValidRequest: new Date(),
      lastSecurityViolation: new Date(),
      averageValidationTime: 0,
      securityScore: 100,
    });
  }

  /**
   * Cleanup on service shutdown
   */
  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Generate unique correlation ID
   */
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate trace ID
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
