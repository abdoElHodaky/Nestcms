export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
  timeout: number;
  errorThreshold: number;
  resetTimeout: number;
  rollingTimeout: number;
  rollingBuckets: number;
  name: string;
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failures: number;
  successes: number;
  requests: number;
  errorRate: number;
  nextAttempt?: Date;
  lastFailure?: Date;
  lastSuccess?: Date;
}

export interface CircuitBreakerOptions {
  fallback?: () => Promise<any>;
  onOpen?: (stats: CircuitBreakerStats) => void;
  onClose?: (stats: CircuitBreakerStats) => void;
  onHalfOpen?: (stats: CircuitBreakerStats) => void;
}

export interface RollingWindow {
  timestamp: number;
  success: boolean;
}
