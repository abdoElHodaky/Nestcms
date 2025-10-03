import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { CacheService } from '../cache/cache.service';
import { DatabaseService } from '../database/database.service';
import { AggregationService } from '../aggregation/aggregation.service';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { CircuitBreakerState } from '../circuit-breaker/interfaces/circuit-breaker.interface';
import {
  HealthCheckResult,
  SystemHealthStatus,
  DatabaseHealthCheck,
  CacheHealthCheck,
  PayTabsHealthCheck,
} from './interfaces/health-check.interface';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly cacheService: CacheService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly databaseService: DatabaseService,
    private readonly aggregationService: AggregationService,
  ) {}

  /**
   * Get overall system health status
   */
  async getSystemHealth(): Promise<SystemHealthStatus> {
    const startTime = Date.now();

    try {
      const [database, cache, paytabs] = await Promise.allSettled([
        this.checkDatabaseHealth(),
        this.checkCacheHealth(),
        this.checkPayTabsHealth(),
      ]);

      const services: Record<string, HealthCheckResult> = {
        database: this.processHealthCheckResult(database, 'Database'),
        cache: this.processHealthCheckResult(cache, 'Cache'),
        paytabs: this.processHealthCheckResult(paytabs, 'PayTabs'),
      };

      // Determine overall health
      const healthyServices = Object.values(services).filter(s => s.status === 'healthy').length;
      const totalServices = Object.keys(services).length;
      
      let overall: 'healthy' | 'unhealthy' | 'degraded';
      if (healthyServices === totalServices) {
        overall = 'healthy';
      } else if (healthyServices === 0) {
        overall = 'unhealthy';
      } else {
        overall = 'degraded';
      }

      return {
        overall,
        services,
        timestamp: new Date(),
        uptime: Date.now() - this.startTime,
      };

    } catch (error) {
      this.logger.error('Error checking system health:', error);
      
      return {
        overall: 'unhealthy',
        services: {
          system: {
            status: 'unhealthy',
            timestamp: new Date(),
            responseTime: Date.now() - startTime,
            error: error.message,
          },
        },
        timestamp: new Date(),
        uptime: Date.now() - this.startTime,
      };
    }
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth(): Promise<DatabaseHealthCheck> {
    const startTime = Date.now();

    try {
      // Check connection status
      const connected = this.mongoConnection.readyState === 1;
      
      if (!connected) {
        throw new Error('Database not connected');
      }

      // Get database stats
      const admin = this.mongoConnection.db.admin();
      const serverStatus = await admin.serverStatus();
      
      // Get collection count
      const collections = await this.mongoConnection.db.listCollections().toArray();
      
      // Get index information
      let totalIndexes = 0;
      for (const collection of collections) {
        const indexes = await this.mongoConnection.db.collection(collection.name).indexes();
        totalIndexes += indexes.length;
      }

      return {
        connected: true,
        responseTime: Date.now() - startTime,
        collections: collections.length,
        indexes: totalIndexes,
        replicationStatus: serverStatus.repl?.setName || 'standalone',
      };

    } catch (error) {
      this.logger.error('Database health check failed:', error);
      throw error;
    }
  }

  /**
   * Check cache health
   */
  async checkCacheHealth(): Promise<CacheHealthCheck> {
    const startTime = Date.now();

    try {
      const connected = this.cacheService.isConnected();
      
      if (!connected) {
        throw new Error('Cache not connected');
      }

      // Get cache statistics
      const stats = await this.cacheService.getStats();
      
      // Test cache operation
      const testKey = 'health_check_test';
      const testValue = { timestamp: Date.now() };
      
      await this.cacheService.set(testKey, testValue, { ttl: 60, useCache: true });
      const retrieved = await this.cacheService.get(testKey, { useCache: true });
      
      if (!retrieved || (retrieved as any).timestamp !== testValue.timestamp) {
        throw new Error('Cache read/write test failed');
      }

      // Clean up test key
      await this.cacheService.delete(testKey);

      return {
        connected: true,
        responseTime: Date.now() - startTime,
        memoryUsage: stats.memoryUsage,
        hitRate: stats.hitRate,
        totalKeys: stats.totalKeys,
      };

    } catch (error) {
      this.logger.error('Cache health check failed:', error);
      throw error;
    }
  }

  /**
   * Check PayTabs service health
   */
  async checkPayTabsHealth(): Promise<PayTabsHealthCheck> {
    const startTime = Date.now();

    try {
      // Get circuit breaker stats for PayTabs
      const createPaymentStats = this.circuitBreakerService.getStats('paytabs-create-payment');
      const verifyPaymentStats = this.circuitBreakerService.getStats('paytabs-verify-payment');

      // Determine overall circuit breaker state
      const states = [createPaymentStats?.state, verifyPaymentStats?.state].filter(Boolean);
      const circuitBreakerState = states.includes(CircuitBreakerState.OPEN) ? CircuitBreakerState.OPEN : 
                                 states.includes(CircuitBreakerState.HALF_OPEN) ? CircuitBreakerState.HALF_OPEN : CircuitBreakerState.CLOSED;

      // Calculate average error rate
      const errorRates = [createPaymentStats?.errorRate, verifyPaymentStats?.errorRate]
        .filter(rate => rate !== undefined) as number[];
      const averageErrorRate = errorRates.length > 0 ? 
        errorRates.reduce((sum, rate) => sum + rate, 0) / errorRates.length : 0;

      // Find last successful call
      const lastSuccessTimes = [createPaymentStats?.lastSuccess, verifyPaymentStats?.lastSuccess]
        .filter(Boolean) as Date[];
      const lastSuccessfulCall = lastSuccessTimes.length > 0 ? 
        new Date(Math.max(...lastSuccessTimes.map(d => d.getTime()))) : undefined;

      return {
        initialized: true, // We'll assume it's initialized if we got this far
        responseTime: Date.now() - startTime,
        circuitBreakerState,
        lastSuccessfulCall,
        errorRate: averageErrorRate,
      };

    } catch (error) {
      this.logger.error('PayTabs health check failed:', error);
      throw error;
    }
  }

  /**
   * Get circuit breaker statistics
   */
  async getCircuitBreakerStats(): Promise<Record<string, any>> {
    try {
      return this.circuitBreakerService.getAllStats();
    } catch (error) {
      this.logger.error('Error getting circuit breaker stats:', error);
      return {};
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    try {
      return await this.cacheService.getStats();
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return null;
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<any> {
    try {
      const admin = this.mongoConnection.db.admin();
      const [serverStatus, dbStats] = await Promise.all([
        admin.serverStatus(),
        this.mongoConnection.db.stats(),
      ]);

      return {
        serverStatus: {
          version: serverStatus.version,
          uptime: serverStatus.uptime,
          connections: serverStatus.connections,
          network: serverStatus.network,
          replication: serverStatus.repl,
        },
        dbStats: {
          collections: dbStats.collections,
          objects: dbStats.objects,
          dataSize: dbStats.dataSize,
          storageSize: dbStats.storageSize,
          indexes: dbStats.indexes,
          indexSize: dbStats.indexSize,
        },
      };

    } catch (error) {
      this.logger.error('Error getting database stats:', error);
      return null;
    }
  }

  /**
   * Perform a deep health check with detailed diagnostics
   */
  async getDetailedHealth(): Promise<{
    system: SystemHealthStatus;
    circuitBreakers: Record<string, any>;
    cache: any;
    database: any;
  }> {
    const [system, circuitBreakers, cache, database] = await Promise.allSettled([
      this.getSystemHealth(),
      this.getCircuitBreakerStats(),
      this.getCacheStats(),
      this.getDatabaseStats(),
    ]);

    return {
      system: system.status === 'fulfilled' ? system.value : {
        overall: 'unhealthy',
        services: {},
        timestamp: new Date(),
        uptime: Date.now() - this.startTime,
      },
      circuitBreakers: circuitBreakers.status === 'fulfilled' ? circuitBreakers.value : {},
      cache: cache.status === 'fulfilled' ? cache.value : null,
      database: database.status === 'fulfilled' ? database.value : null,
    };
  }

  /**
   * Get database connection statistics
   */
  async getDatabaseConnectionStats(): Promise<any> {
    try {
      return await this.databaseService.getStats();
    } catch (error) {
      this.logger.error('Error getting database connection stats:', error);
      return null;
    }
  }

  /**
   * Get aggregation performance metrics
   */
  async getAggregationMetrics(): Promise<any> {
    try {
      const stats = this.aggregationService.getStats();
      const queryPatterns = this.aggregationService.getQueryPatterns();
      
      return {
        stats,
        queryPatterns: queryPatterns.map(pattern => ({
          name: pattern.name,
          collection: pattern.collection,
          cacheStrategy: pattern.cacheStrategy,
          ttl: pattern.ttl,
          useReplica: pattern.useReplica,
        })),
        performance: {
          cacheHitRate: stats.totalQueries > 0 
            ? Math.round((stats.cacheHits / stats.totalQueries) * 100 * 100) / 100
            : 0,
          replicaUsageRate: stats.totalQueries > 0
            ? Math.round((stats.replicaQueries / stats.totalQueries) * 100 * 100) / 100
            : 0,
          errorRate: stats.totalQueries > 0
            ? Math.round((stats.errorCount / stats.totalQueries) * 100 * 100) / 100
            : 0,
          slowQueryRate: stats.totalQueries > 0
            ? Math.round((stats.slowQueries / stats.totalQueries) * 100 * 100) / 100
            : 0,
        },
      };
    } catch (error) {
      this.logger.error('Error getting aggregation metrics:', error);
      return null;
    }
  }

  /**
   * Check database replica health
   */
  async checkDatabaseReplicaHealth(): Promise<any> {
    try {
      const connectionHealth = await this.databaseService.checkHealth();
      const stats = await this.databaseService.getStats();
      
      return {
        connections: connectionHealth,
        stats,
        healthy: connectionHealth.every(conn => conn.connected),
        replicaCount: connectionHealth.filter(conn => conn.type === 'replica').length,
        primaryConnected: connectionHealth.some(conn => conn.type === 'primary' && conn.connected),
      };
    } catch (error) {
      this.logger.error('Error checking database replica health:', error);
      return {
        connections: [],
        stats: null,
        healthy: false,
        replicaCount: 0,
        primaryConnected: false,
        error: error.message,
      };
    }
  }

  private processHealthCheckResult(
    result: PromiseSettledResult<any>,
    serviceName: string,
  ): HealthCheckResult {
    if (result.status === 'fulfilled') {
      return {
        status: 'healthy',
        timestamp: new Date(),
        responseTime: 0, // Will be set by individual health checks
        details: result.value,
      };
    } else {
      this.logger.error(`${serviceName} health check failed:`, result.reason);
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        responseTime: 0,
        error: result.reason?.message || 'Unknown error',
      };
    }
  }
}
