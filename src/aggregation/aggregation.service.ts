/**
 * AggregationService - Global service for aggregation utilities
 * 
 * Provides centralized access to aggregation optimization tools
 * and performance monitoring across the application.
 */

import { Injectable } from '@nestjs/common';
import { AggregationBuilder, AggregationUtils } from '../utils/aggregation';
import { CacheManager } from '../utils/cache/CacheManager';
import { QueryMonitor } from '../utils/performance/QueryMonitor';

@Injectable()
export class AggregationService {
  private cacheManager: CacheManager;
  private queryMonitor: QueryMonitor;

  constructor() {
    this.cacheManager = CacheManager.getInstance();
    this.queryMonitor = QueryMonitor.getInstance();
  }

  /**
   * Create a new AggregationBuilder instance
   */
  createBuilder(): AggregationBuilder {
    return AggregationBuilder.create();
  }

  /**
   * Get aggregation utilities
   */
  getUtils(): typeof AggregationUtils {
    return AggregationUtils;
  }

  /**
   * Get cache manager instance
   */
  getCacheManager(): CacheManager {
    return this.cacheManager;
  }

  /**
   * Get query monitor instance
   */
  getQueryMonitor(): QueryMonitor {
    return this.queryMonitor;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): any {
    return {
      cache: this.cacheManager.getStats(),
      queries: this.queryMonitor.getStats()
    };
  }

  /**
   * Get recent performance alerts
   */
  getRecentAlerts(limit: number = 50): any[] {
    return this.queryMonitor.getRecentAlerts(limit);
  }

  /**
   * Clear all caches and performance data
   */
  clearAll(): void {
    this.cacheManager.clear();
    this.queryMonitor.clear();
  }

  /**
   * Validate aggregation pipeline
   */
  validatePipeline(pipeline: any[]): { isValid: boolean; warnings: string[] } {
    const builder = AggregationBuilder.create();
    // Set the pipeline directly for validation
    (builder as any).pipeline = pipeline;
    return builder.validate();
  }

  /**
   * Get optimization suggestions for a pipeline
   */
  getOptimizationSuggestions(pipeline: any[]): string[] {
    return this.queryMonitor.suggestOptimizations(pipeline);
  }

  /**
   * Health check for aggregation system
   */
  healthCheck(): {
    status: 'healthy' | 'warning' | 'error';
    details: any;
  } {
    const cacheStats = this.cacheManager.getStats();
    const queryStats = this.queryMonitor.getStats();
    const alerts = this.queryMonitor.getRecentAlerts(10);

    const highSeverityAlerts = alerts.filter(alert => alert.severity === 'high');
    const slowQueries = queryStats.slowQueries;

    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    
    if (highSeverityAlerts.length > 5 || slowQueries > queryStats.totalQueries * 0.3) {
      status = 'error';
    } else if (highSeverityAlerts.length > 0 || slowQueries > queryStats.totalQueries * 0.1) {
      status = 'warning';
    }

    return {
      status,
      details: {
        cache: cacheStats,
        queries: queryStats,
        recentAlerts: alerts.length,
        highSeverityAlerts: highSeverityAlerts.length
      }
    };
  }
}

