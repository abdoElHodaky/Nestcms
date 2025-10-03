/**
 * ⚡ **EVENT-DRIVEN CIRCUIT BREAKER SERVICE**
 * 
 * Advanced circuit breaker implementation with event-driven architecture,
 * comprehensive metrics, and resilience patterns for external services.
 * 
 * @author NestCMS Team
 * @version 2.0.0
 * @since 2024-01-15
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { 
  PaymentEventType, 
  CircuitBreakerEvent, 
  PaymentEventPriority, 
  PaymentEventStatus,
  PerformanceMetricEvent 
} from '../payments/interfaces/payment-types.interface';

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface EventDrivenCircuitBreakerConfig {
  name: string;
  errorThreshold: number;          // Error rate percentage to trigger open state
  timeout: number;                 // Request timeout in milliseconds
  resetTimeout: number;            // Time to wait before trying half-open state
  minimumRequests: number;         // Minimum requests before evaluating error rate
  maxConcurrentRequests: number;   // Maximum concurrent requests in half-open state
  monitoringPeriod: number;        // Time window for error rate calculation
  successThreshold: number;        // Success rate to close circuit in half-open state
  volumeThreshold: number;         // Minimum request volume for circuit evaluation
  slowCallThreshold: number;       // Threshold for slow calls in milliseconds
  slowCallRateThreshold: number;   // Percentage of slow calls to trigger open
  enableEventEmission: boolean;    // Enable event emission for monitoring
  enableMetrics: boolean;          // Enable detailed metrics collection
}

export interface CircuitBreakerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  timeouts: number;
  slowCalls: number;
  rejectedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  lastRequestTime: Date;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  errorRate: number;
  successRate: number;
  slowCallRate: number;
  uptime: number;
  throughput: number;
  responseTimes: number[];
}

export interface CircuitBreakerStats {
  serviceName: string;
  state: CircuitBreakerState;
  config: EventDrivenCircuitBreakerConfig;
  metrics: CircuitBreakerMetrics;
  stateHistory: Array<{
    state: CircuitBreakerState;
    timestamp: Date;
    reason: string;
    metrics: Partial<CircuitBreakerMetrics>;
  }>;
  nextRetryTime?: Date;
  activeRequests: number;
  createdAt: Date;
  lastStateChange: Date;
}

export interface CircuitBreakerExecutionResult<T> {
  result: T;
  executionTime: number;
  fromFallback: boolean;
  circuitState: CircuitBreakerState;
  requestId: string;
}

@Injectable()
export class EventDrivenCircuitBreakerService {
  private readonly logger = new Logger(EventDrivenCircuitBreakerService.name);
  private readonly circuits = new Map<string, CircuitBreakerStats>();
  private readonly activeRequests = new Map<string, Set<string>>();
  private readonly requestTimers = new Map<string, NodeJS.Timeout>();
  private readonly metricsCleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    // Start metrics cleanup interval
    this.metricsCleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, 60000); // Cleanup every minute
  }

  /**
   * Create a new event-driven circuit breaker for a service
   */
  createCircuit(serviceName: string, config?: Partial<EventDrivenCircuitBreakerConfig>): void {
    const defaultConfig: EventDrivenCircuitBreakerConfig = {
      name: serviceName,
      errorThreshold: this.configService.get<number>('CIRCUIT_BREAKER_ERROR_THRESHOLD', 50),
      timeout: this.configService.get<number>('CIRCUIT_BREAKER_TIMEOUT', 30000),
      resetTimeout: this.configService.get<number>('CIRCUIT_BREAKER_RESET_TIMEOUT', 30000),
      minimumRequests: this.configService.get<number>('CIRCUIT_BREAKER_MIN_REQUESTS', 10),
      maxConcurrentRequests: this.configService.get<number>('CIRCUIT_BREAKER_MAX_CONCURRENT', 5),
      monitoringPeriod: this.configService.get<number>('CIRCUIT_BREAKER_MONITORING_PERIOD', 60000),
      successThreshold: this.configService.get<number>('CIRCUIT_BREAKER_SUCCESS_THRESHOLD', 80),
      volumeThreshold: this.configService.get<number>('CIRCUIT_BREAKER_VOLUME_THRESHOLD', 20),
      slowCallThreshold: this.configService.get<number>('CIRCUIT_BREAKER_SLOW_CALL_THRESHOLD', 10000),
      slowCallRateThreshold: this.configService.get<number>('CIRCUIT_BREAKER_SLOW_CALL_RATE_THRESHOLD', 50),
      enableEventEmission: this.configService.get<boolean>('CIRCUIT_BREAKER_ENABLE_EVENTS', true),
      enableMetrics: this.configService.get<boolean>('CIRCUIT_BREAKER_ENABLE_METRICS', true),
    };

    const circuitConfig = { ...defaultConfig, ...config };
    const now = new Date();

    const stats: CircuitBreakerStats = {
      serviceName,
      state: CircuitBreakerState.CLOSED,
      config: circuitConfig,
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        timeouts: 0,
        slowCalls: 0,
        rejectedRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        lastRequestTime: now,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        errorRate: 0,
        successRate: 100,
        slowCallRate: 0,
        uptime: 100,
        throughput: 0,
        responseTimes: [],
      },
      stateHistory: [{
        state: CircuitBreakerState.CLOSED,
        timestamp: now,
        reason: 'Circuit breaker initialized',
        metrics: {},
      }],
      activeRequests: 0,
      createdAt: now,
      lastStateChange: now,
    };

    this.circuits.set(serviceName, stats);
    this.activeRequests.set(serviceName, new Set());

    this.logger.log(`Event-driven circuit breaker created for service: ${serviceName}`);
    
    if (circuitConfig.enableEventEmission) {
      this.emitCircuitBreakerEvent(serviceName, CircuitBreakerState.CLOSED, CircuitBreakerState.CLOSED);
    }
  }

  /**
   * Execute a function with event-driven circuit breaker protection
   */
  async execute<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>,
    operationName?: string,
  ): Promise<CircuitBreakerExecutionResult<T>> {
    const circuit = this.circuits.get(serviceName);
    if (!circuit) {
      throw new Error(`Circuit breaker not found for service: ${serviceName}`);
    }

    const requestId = this.generateRequestId();
    const startTime = Date.now();
    let fromFallback = false;

    // Check if circuit allows request
    if (!this.canExecute(serviceName)) {
      circuit.metrics.rejectedRequests++;
      
      if (fallback) {
        this.logger.warn(`Circuit breaker OPEN for ${serviceName}, executing fallback`);
        const fallbackResult = await fallback();
        fromFallback = true;
        
        return {
          result: fallbackResult,
          executionTime: Date.now() - startTime,
          fromFallback,
          circuitState: circuit.state,
          requestId,
        };
      }
      
      throw new Error(`Circuit breaker is OPEN for service: ${serviceName}`);
    }

    try {
      // Track active request
      this.activeRequests.get(serviceName)!.add(requestId);
      circuit.activeRequests++;
      
      // Set timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Request timeout after ${circuit.config.timeout}ms`));
        }, circuit.config.timeout);
        
        this.requestTimers.set(requestId, timer);
      });

      // Execute operation with timeout
      const result = await Promise.race([operation(), timeoutPromise]);
      
      // Clear timeout
      this.clearRequestTimer(requestId);

      // Record success
      const duration = Date.now() - startTime;
      this.recordSuccess(serviceName, duration, operationName);

      return {
        result,
        executionTime: duration,
        fromFallback,
        circuitState: circuit.state,
        requestId,
      };

    } catch (error) {
      // Clear timeout
      this.clearRequestTimer(requestId);

      // Record failure
      const duration = Date.now() - startTime;
      const isTimeout = error.message.includes('timeout');
      this.recordFailure(serviceName, duration, isTimeout, error, operationName);

      // Execute fallback if available
      if (fallback) {
        this.logger.warn(`Operation failed for ${serviceName}, executing fallback: ${error.message}`);
        const fallbackResult = await fallback();
        fromFallback = true;
        
        return {
          result: fallbackResult,
          executionTime: Date.now() - startTime,
          fromFallback,
          circuitState: circuit.state,
          requestId,
        };
      }

      throw error;

    } finally {
      // Remove from active requests
      this.activeRequests.get(serviceName)!.delete(requestId);
      circuit.activeRequests--;
    }
  }

  /**
   * Check if circuit breaker allows request execution
   */
  private canExecute(serviceName: string): boolean {
    const circuit = this.circuits.get(serviceName)!;
    const now = new Date();

    switch (circuit.state) {
      case CircuitBreakerState.CLOSED:
        return true;

      case CircuitBreakerState.OPEN:
        // Check if reset timeout has passed
        if (circuit.nextRetryTime && now >= circuit.nextRetryTime) {
          this.transitionToHalfOpen(serviceName);
          return true;
        }
        return false;

      case CircuitBreakerState.HALF_OPEN:
        // Allow limited concurrent requests
        const activeCount = this.activeRequests.get(serviceName)!.size;
        return activeCount < circuit.config.maxConcurrentRequests;

      default:
        return false;
    }
  }

  /**
   * Record successful operation with detailed metrics
   */
  private recordSuccess(serviceName: string, duration: number, operationName?: string): void {
    const circuit = this.circuits.get(serviceName)!;
    const metrics = circuit.metrics;

    metrics.totalRequests++;
    metrics.successfulRequests++;
    metrics.consecutiveSuccesses++;
    metrics.consecutiveFailures = 0;
    metrics.lastRequestTime = new Date();
    metrics.lastSuccessTime = new Date();

    // Track response times for percentile calculations
    metrics.responseTimes.push(duration);
    if (metrics.responseTimes.length > 1000) {
      metrics.responseTimes = metrics.responseTimes.slice(-1000); // Keep last 1000 measurements
    }

    // Check for slow calls
    if (duration > circuit.config.slowCallThreshold) {
      metrics.slowCalls++;
    }

    this.updateMetrics(serviceName);

    // Emit performance metric event
    if (circuit.config.enableEventEmission && circuit.config.enableMetrics) {
      this.emitPerformanceMetric(serviceName, 'response_time', duration, {
        operation: operationName || 'unknown',
        status: 'success',
        circuit_state: circuit.state,
      });
    }

    // Transition to closed if in half-open state and success threshold met
    if (circuit.state === CircuitBreakerState.HALF_OPEN) {
      const recentSuccessRate = (metrics.consecutiveSuccesses / 
        (metrics.consecutiveSuccesses + metrics.consecutiveFailures)) * 100;
      
      if (recentSuccessRate >= circuit.config.successThreshold) {
        this.transitionToClosed(serviceName);
      }
    }
  }

  /**
   * Record failed operation with detailed error tracking
   */
  private recordFailure(
    serviceName: string, 
    duration: number, 
    isTimeout: boolean, 
    error: Error,
    operationName?: string
  ): void {
    const circuit = this.circuits.get(serviceName)!;
    const metrics = circuit.metrics;

    metrics.totalRequests++;
    metrics.failedRequests++;
    metrics.consecutiveFailures++;
    metrics.consecutiveSuccesses = 0;
    metrics.lastRequestTime = new Date();
    metrics.lastFailureTime = new Date();

    if (isTimeout) {
      metrics.timeouts++;
    }

    // Track response times even for failures
    metrics.responseTimes.push(duration);
    if (metrics.responseTimes.length > 1000) {
      metrics.responseTimes = metrics.responseTimes.slice(-1000);
    }

    this.updateMetrics(serviceName);

    // Emit performance metric event
    if (circuit.config.enableEventEmission && circuit.config.enableMetrics) {
      this.emitPerformanceMetric(serviceName, 'response_time', duration, {
        operation: operationName || 'unknown',
        status: 'failure',
        error_type: isTimeout ? 'timeout' : 'error',
        circuit_state: circuit.state,
      });
    }

    // Check if circuit should open
    if (circuit.state === CircuitBreakerState.CLOSED && this.shouldOpenCircuit(serviceName)) {
      this.transitionToOpen(serviceName, error);
    } else if (circuit.state === CircuitBreakerState.HALF_OPEN) {
      // Return to open state on any failure in half-open
      this.transitionToOpen(serviceName, error);
    }
  }

  /**
   * Update comprehensive circuit metrics
   */
  private updateMetrics(serviceName: string): void {
    const circuit = this.circuits.get(serviceName)!;
    const metrics = circuit.metrics;

    if (metrics.totalRequests > 0) {
      metrics.errorRate = (metrics.failedRequests / metrics.totalRequests) * 100;
      metrics.successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
      metrics.slowCallRate = (metrics.slowCalls / metrics.totalRequests) * 100;
    }

    // Calculate response time percentiles
    if (metrics.responseTimes.length > 0) {
      const sortedTimes = [...metrics.responseTimes].sort((a, b) => a - b);
      const p95Index = Math.floor(sortedTimes.length * 0.95);
      const p99Index = Math.floor(sortedTimes.length * 0.99);
      
      metrics.averageResponseTime = sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length;
      metrics.p95ResponseTime = sortedTimes[p95Index] || 0;
      metrics.p99ResponseTime = sortedTimes[p99Index] || 0;
    }

    // Calculate throughput (requests per second over monitoring period)
    const monitoringPeriodSeconds = circuit.config.monitoringPeriod / 1000;
    metrics.throughput = metrics.totalRequests / monitoringPeriodSeconds;

    // Calculate uptime based on recent performance
    const recentWindow = circuit.config.monitoringPeriod;
    const now = Date.now();
    const windowStart = now - recentWindow;
    
    if (metrics.lastFailureTime && metrics.lastFailureTime.getTime() > windowStart) {
      metrics.uptime = Math.max(0, metrics.successRate);
    } else {
      metrics.uptime = 100;
    }
  }

  /**
   * Check if circuit should transition to open state
   */
  private shouldOpenCircuit(serviceName: string): boolean {
    const circuit = this.circuits.get(serviceName)!;
    const metrics = circuit.metrics;

    // Need minimum requests before evaluating
    if (metrics.totalRequests < circuit.config.minimumRequests) {
      return false;
    }

    // Need minimum volume threshold
    if (metrics.totalRequests < circuit.config.volumeThreshold) {
      return false;
    }

    // Check error rate threshold
    const errorRateExceeded = metrics.errorRate >= circuit.config.errorThreshold;
    
    // Check slow call rate threshold
    const slowCallRateExceeded = metrics.slowCallRate >= circuit.config.slowCallRateThreshold;

    return errorRateExceeded || slowCallRateExceeded;
  }

  /**
   * Transition circuit to OPEN state with detailed logging
   */
  private transitionToOpen(serviceName: string, error?: Error): void {
    const circuit = this.circuits.get(serviceName)!;
    const previousState = circuit.state;
    
    circuit.state = CircuitBreakerState.OPEN;
    circuit.nextRetryTime = new Date(Date.now() + circuit.config.resetTimeout);
    circuit.lastStateChange = new Date();
    
    const reason = `Error rate ${circuit.metrics.errorRate.toFixed(2)}% exceeded threshold ${circuit.config.errorThreshold}%` +
      (circuit.metrics.slowCallRate >= circuit.config.slowCallRateThreshold ? 
        `, Slow call rate ${circuit.metrics.slowCallRate.toFixed(2)}% exceeded threshold ${circuit.config.slowCallRateThreshold}%` : '');
    
    circuit.stateHistory.push({
      state: CircuitBreakerState.OPEN,
      timestamp: new Date(),
      reason,
      metrics: {
        errorRate: circuit.metrics.errorRate,
        slowCallRate: circuit.metrics.slowCallRate,
        totalRequests: circuit.metrics.totalRequests,
        consecutiveFailures: circuit.metrics.consecutiveFailures,
      },
    });

    this.logger.warn(`Circuit breaker OPENED for service: ${serviceName} - ${reason}`);
    
    if (circuit.config.enableEventEmission) {
      this.emitCircuitBreakerEvent(serviceName, CircuitBreakerState.OPEN, previousState);
    }
  }

  /**
   * Transition circuit to HALF_OPEN state
   */
  private transitionToHalfOpen(serviceName: string): void {
    const circuit = this.circuits.get(serviceName)!;
    const previousState = circuit.state;
    
    circuit.state = CircuitBreakerState.HALF_OPEN;
    circuit.nextRetryTime = undefined;
    circuit.lastStateChange = new Date();
    circuit.metrics.consecutiveSuccesses = 0;
    circuit.metrics.consecutiveFailures = 0;
    
    circuit.stateHistory.push({
      state: CircuitBreakerState.HALF_OPEN,
      timestamp: new Date(),
      reason: 'Reset timeout expired, testing service availability',
      metrics: {
        uptime: circuit.metrics.uptime,
        lastFailureTime: circuit.metrics.lastFailureTime,
      },
    });

    this.logger.log(`Circuit breaker HALF-OPEN for service: ${serviceName}`);
    
    if (circuit.config.enableEventEmission) {
      this.emitCircuitBreakerEvent(serviceName, CircuitBreakerState.HALF_OPEN, previousState);
    }
  }

  /**
   * Transition circuit to CLOSED state
   */
  private transitionToClosed(serviceName: string): void {
    const circuit = this.circuits.get(serviceName)!;
    const previousState = circuit.state;
    
    circuit.state = CircuitBreakerState.CLOSED;
    circuit.nextRetryTime = undefined;
    circuit.lastStateChange = new Date();
    
    circuit.stateHistory.push({
      state: CircuitBreakerState.CLOSED,
      timestamp: new Date(),
      reason: `Service recovered, success rate: ${circuit.metrics.successRate.toFixed(2)}%`,
      metrics: {
        successRate: circuit.metrics.successRate,
        consecutiveSuccesses: circuit.metrics.consecutiveSuccesses,
        uptime: circuit.metrics.uptime,
      },
    });

    this.logger.log(`Circuit breaker CLOSED for service: ${serviceName}`);
    
    if (circuit.config.enableEventEmission) {
      this.emitCircuitBreakerEvent(serviceName, CircuitBreakerState.CLOSED, previousState);
    }
  }

  /**
   * Emit circuit breaker state change event
   */
  private emitCircuitBreakerEvent(
    serviceName: string, 
    newState: CircuitBreakerState, 
    previousState: CircuitBreakerState
  ): void {
    const circuit = this.circuits.get(serviceName)!;
    
    const event: CircuitBreakerEvent = {
      id: this.generateEventId(),
      type: this.getEventTypeForState(newState),
      timestamp: new Date(),
      version: '2.0',
      priority: newState === CircuitBreakerState.OPEN ? PaymentEventPriority.HIGH : PaymentEventPriority.MEDIUM,
      status: PaymentEventStatus.COMPLETED,
      correlationId: this.generateCorrelationId(),
      aggregateId: serviceName,
      aggregateType: 'EventDrivenCircuitBreaker',
      metadata: {
        source: 'EventDrivenCircuitBreakerService',
        traceId: this.generateTraceId(),
      },
      data: {
        serviceName,
        state: newState,
        errorRate: circuit.metrics.errorRate,
        requestCount: circuit.metrics.totalRequests,
        failureCount: circuit.metrics.failedRequests,
        lastFailureTime: circuit.metrics.lastFailureTime,
        nextRetryTime: circuit.nextRetryTime,
        configuration: circuit.config,
      },
    };

    this.eventEmitter.emit(event.type, event);
  }

  /**
   * Emit performance metric event
   */
  private emitPerformanceMetric(
    serviceName: string,
    metricName: string,
    metricValue: number,
    tags: Record<string, string>
  ): void {
    const event: PerformanceMetricEvent = {
      id: this.generateEventId(),
      type: PaymentEventType.PERFORMANCE_METRIC,
      timestamp: new Date(),
      version: '2.0',
      priority: PaymentEventPriority.LOW,
      status: PaymentEventStatus.COMPLETED,
      correlationId: this.generateCorrelationId(),
      aggregateId: serviceName,
      aggregateType: 'CircuitBreakerMetrics',
      metadata: {
        source: 'EventDrivenCircuitBreakerService',
        traceId: this.generateTraceId(),
      },
      data: {
        metricName,
        metricValue,
        metricUnit: metricName === 'response_time' ? 'milliseconds' : 'count',
        tags,
        timestamp: new Date(),
        context: {
          service: serviceName,
          operation: tags.operation || 'unknown',
          duration: metricName === 'response_time' ? metricValue : undefined,
          statusCode: tags.status === 'success' ? 200 : 500,
          errorRate: this.circuits.get(serviceName)?.metrics.errorRate,
        },
      },
    };

    this.eventEmitter.emit(event.type, event);
  }

  /**
   * Get event type for circuit breaker state
   */
  private getEventTypeForState(state: CircuitBreakerState): PaymentEventType {
    switch (state) {
      case CircuitBreakerState.OPEN:
        return PaymentEventType.CIRCUIT_BREAKER_OPENED;
      case CircuitBreakerState.CLOSED:
        return PaymentEventType.CIRCUIT_BREAKER_CLOSED;
      case CircuitBreakerState.HALF_OPEN:
        return PaymentEventType.CIRCUIT_BREAKER_HALF_OPEN;
      default:
        return PaymentEventType.CIRCUIT_BREAKER_CLOSED;
    }
  }

  /**
   * Clear request timer
   */
  private clearRequestTimer(requestId: string): void {
    const timer = this.requestTimers.get(requestId);
    if (timer) {
      clearTimeout(timer);
      this.requestTimers.delete(requestId);
    }
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const cutoff = Date.now() - maxAge;

    for (const [serviceName, circuit] of this.circuits.entries()) {
      // Clean up old state history
      circuit.stateHistory = circuit.stateHistory.filter(
        entry => entry.timestamp.getTime() > cutoff
      );

      // Clean up old response times
      if (circuit.metrics.responseTimes.length > 1000) {
        circuit.metrics.responseTimes = circuit.metrics.responseTimes.slice(-500);
      }
    }
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(serviceName: string): CircuitBreakerStats | null {
    return this.circuits.get(serviceName) || null;
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): Map<string, CircuitBreakerStats> {
    return new Map(this.circuits);
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(serviceName: string): void {
    const circuit = this.circuits.get(serviceName);
    if (!circuit) {
      throw new Error(`Circuit breaker not found for service: ${serviceName}`);
    }

    const previousState = circuit.state;
    circuit.state = CircuitBreakerState.CLOSED;
    circuit.nextRetryTime = undefined;
    circuit.lastStateChange = new Date();
    circuit.metrics.consecutiveFailures = 0;
    circuit.metrics.consecutiveSuccesses = 0;
    
    circuit.stateHistory.push({
      state: CircuitBreakerState.CLOSED,
      timestamp: new Date(),
      reason: 'Manual reset',
      metrics: {},
    });

    this.logger.log(`Circuit breaker manually reset for service: ${serviceName}`);
    
    if (circuit.config.enableEventEmission) {
      this.emitCircuitBreakerEvent(serviceName, CircuitBreakerState.CLOSED, previousState);
    }
  }

  /**
   * Remove circuit breaker
   */
  removeCircuit(serviceName: string): void {
    this.circuits.delete(serviceName);
    this.activeRequests.delete(serviceName);
    
    // Clear any pending timers
    for (const [requestId, timer] of this.requestTimers.entries()) {
      if (requestId.startsWith(serviceName)) {
        clearTimeout(timer);
        this.requestTimers.delete(requestId);
      }
    }

    this.logger.log(`Circuit breaker removed for service: ${serviceName}`);
  }

  /**
   * Cleanup on service shutdown
   */
  onModuleDestroy(): void {
    if (this.metricsCleanupInterval) {
      clearInterval(this.metricsCleanupInterval);
    }

    // Clear all timers
    for (const timer of this.requestTimers.values()) {
      clearTimeout(timer);
    }
    this.requestTimers.clear();
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate trace ID
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
