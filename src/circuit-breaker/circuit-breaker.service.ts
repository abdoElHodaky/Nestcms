import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CircuitBreakerState,
  CircuitBreakerConfig,
  CircuitBreakerStats,
  CircuitBreakerOptions,
  RollingWindow,
} from './interfaces/circuit-breaker.interface';

class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private requests: number = 0;
  private nextAttempt: Date | null = null;
  private lastFailure: Date | null = null;
  private lastSuccess: Date | null = null;
  private rollingWindow: RollingWindow[] = [];
  private readonly logger = new Logger(`CircuitBreaker:${this.config.name}`);

  constructor(
    private readonly config: CircuitBreakerConfig,
    private readonly options: CircuitBreakerOptions = {},
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.logger.log(`Circuit breaker ${this.config.name} moved to HALF_OPEN state`);
        this.options.onHalfOpen?.(this.getStats());
      } else {
        this.logger.warn(`Circuit breaker ${this.config.name} is OPEN, rejecting request`);
        if (this.options.fallback) {
          return await this.options.fallback();
        }
        throw new Error(`Circuit breaker ${this.config.name} is OPEN`);
      }
    }

    this.requests++;
    const startTime = Date.now();

    try {
      // Set timeout for the operation
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), this.config.timeout);
      });

      const result = await Promise.race([operation(), timeoutPromise]);
      
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.successes++;
    this.lastSuccess = new Date();
    this.addToRollingWindow(true);

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.CLOSED;
      this.failures = 0;
      this.nextAttempt = null;
      this.logger.log(`Circuit breaker ${this.config.name} moved to CLOSED state`);
      this.options.onClose?.(this.getStats());
    }
  }

  private onFailure(error: any): void {
    this.failures++;
    this.lastFailure = new Date();
    this.addToRollingWindow(false);

    this.logger.error(`Circuit breaker ${this.config.name} recorded failure:`, error.message);

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.OPEN;
      this.nextAttempt = new Date(Date.now() + this.config.resetTimeout);
      this.logger.warn(`Circuit breaker ${this.config.name} moved to OPEN state from HALF_OPEN`);
      this.options.onOpen?.(this.getStats());
    } else if (this.state === CircuitBreakerState.CLOSED && this.shouldOpen()) {
      this.state = CircuitBreakerState.OPEN;
      this.nextAttempt = new Date(Date.now() + this.config.resetTimeout);
      this.logger.warn(`Circuit breaker ${this.config.name} moved to OPEN state`);
      this.options.onOpen?.(this.getStats());
    }
  }

  private shouldOpen(): boolean {
    const errorRate = this.getErrorRate();
    return errorRate >= this.config.errorThreshold && this.requests >= 10; // Minimum requests before opening
  }

  private shouldAttemptReset(): boolean {
    return this.nextAttempt !== null && Date.now() >= this.nextAttempt.getTime();
  }

  private addToRollingWindow(success: boolean): void {
    const now = Date.now();
    this.rollingWindow.push({ timestamp: now, success });

    // Remove old entries outside the rolling window
    const cutoff = now - this.config.rollingTimeout;
    this.rollingWindow = this.rollingWindow.filter(entry => entry.timestamp > cutoff);
  }

  private getErrorRate(): number {
    if (this.rollingWindow.length === 0) return 0;

    const failures = this.rollingWindow.filter(entry => !entry.success).length;
    return (failures / this.rollingWindow.length) * 100;
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      requests: this.requests,
      errorRate: this.getErrorRate(),
      nextAttempt: this.nextAttempt,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
    };
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.requests = 0;
    this.nextAttempt = null;
    this.lastFailure = null;
    this.lastSuccess = null;
    this.rollingWindow = [];
    this.logger.log(`Circuit breaker ${this.config.name} has been reset`);
  }
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private circuitBreakers = new Map<string, CircuitBreaker>();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Create or get a circuit breaker
   */
  getCircuitBreaker(
    name: string,
    config?: Partial<CircuitBreakerConfig>,
    options?: CircuitBreakerOptions,
  ): CircuitBreaker {
    if (this.circuitBreakers.has(name)) {
      return this.circuitBreakers.get(name)!;
    }

    const defaultConfig: CircuitBreakerConfig = {
      name,
      timeout: this.configService.get<number>('CIRCUIT_BREAKER_TIMEOUT', 30000),
      errorThreshold: this.configService.get<number>('CIRCUIT_BREAKER_ERROR_THRESHOLD', 50),
      resetTimeout: this.configService.get<number>('CIRCUIT_BREAKER_RESET_TIMEOUT', 30000),
      rollingTimeout: this.configService.get<number>('CIRCUIT_BREAKER_ROLLING_TIMEOUT', 10000),
      rollingBuckets: this.configService.get<number>('CIRCUIT_BREAKER_ROLLING_BUCKETS', 10),
    };

    const finalConfig = { ...defaultConfig, ...config };
    const circuitBreaker = new CircuitBreaker(finalConfig, options);
    
    this.circuitBreakers.set(name, circuitBreaker);
    this.logger.log(`Created circuit breaker: ${name}`);
    
    return circuitBreaker;
  }

  /**
   * Execute an operation with circuit breaker protection
   */
  async execute<T>(
    name: string,
    operation: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>,
    options?: CircuitBreakerOptions,
  ): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(name, config, options);
    return await circuitBreaker.execute(operation);
  }

  /**
   * Get statistics for a specific circuit breaker
   */
  getStats(name: string): CircuitBreakerStats | null {
    const circuitBreaker = this.circuitBreakers.get(name);
    return circuitBreaker ? circuitBreaker.getStats() : null;
  }

  /**
   * Get statistics for all circuit breakers
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    for (const [name, circuitBreaker] of this.circuitBreakers) {
      stats[name] = circuitBreaker.getStats();
    }
    
    return stats;
  }

  /**
   * Reset a specific circuit breaker
   */
  reset(name: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(name);
    if (circuitBreaker) {
      circuitBreaker.reset();
      return true;
    }
    return false;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.reset();
    }
    this.logger.log('All circuit breakers have been reset');
  }

  /**
   * Remove a circuit breaker
   */
  remove(name: string): boolean {
    return this.circuitBreakers.delete(name);
  }

  /**
   * Get all circuit breaker names
   */
  getCircuitBreakerNames(): string[] {
    return Array.from(this.circuitBreakers.keys());
  }
}
