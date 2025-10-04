export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  responseTime: number;
  details?: Record<string, any>;
  error?: string;
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  services: Record<string, HealthCheckResult>;
  timestamp: Date;
  uptime: number;
}

export interface DatabaseHealthCheck {
  connected: boolean;
  responseTime: number;
  collections: number;
  indexes: number;
  replicationStatus?: string;
}

export interface CacheHealthCheck {
  connected: boolean;
  responseTime: number;
  memoryUsage: number;
  hitRate: number;
  totalKeys: number;
}

export interface PayTabsHealthCheck {
  initialized: boolean;
  responseTime: number;
  circuitBreakerState: string;
  lastSuccessfulCall?: Date;
  errorRate: number;
}
