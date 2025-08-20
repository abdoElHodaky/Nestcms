/**
 * AggregationService - Global service for aggregation utilities
 * 
 * Provides centralized access to aggregation optimization tools
 * and performance monitoring across the application.
 */

import { Injectable } from '@nestjs/common';
import { 
  AggregationBuilder, 
  AggregationUtils, 
  DateRange,
  LookupOptions,
  ConditionalLookupOptions
} from '../utils/aggregation';
import { CacheManager } from '../utils/cache/CacheManager';
import { QueryMonitor } from '../utils/performance/QueryMonitor';
import { Model, PipelineStage, Types } from 'mongoose';

/**
 * Interface for performance statistics
 */
export interface PerformanceStats {
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    averageAccessTime: number;
  };
  queries: {
    totalQueries: number;
    slowQueries: number;
    averageExecutionTime: number;
    peakMemoryUsage: number;
  };
}

/**
 * Interface for health check response
 */
export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'error';
  details: {
    cache: Record<string, any>;
    queries: Record<string, any>;
    recentAlerts: number;
    highSeverityAlerts: number;
  };
}

/**
 * Interface for pipeline validation result
 */
export interface PipelineValidationResult {
  isValid: boolean;
  warnings: string[];
}

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
   * @returns A new AggregationBuilder instance
   */
  createBuilder(): AggregationBuilder {
    return AggregationBuilder.create();
  }

  /**
   * Create a builder with date range filtering
   * @param field The field to apply date range filtering to
   * @param dateRange Optional date range with from and to dates
   * @returns A new AggregationBuilder with date range match applied
   */
  createBuilderWithDateRange(field: string, dateRange?: DateRange): AggregationBuilder {
    const builder = this.createBuilder();
    
    if (dateRange && (dateRange.from || dateRange.to)) {
      builder.match(AggregationUtils.createDateRangeMatch(field, dateRange));
    }
    
    return builder;
  }

  /**
   * Create a builder with user lookup
   * @param localField Field containing the user ID reference
   * @param as Name for the output array field
   * @param project Optional projection to apply
   * @returns A new AggregationBuilder with user lookup applied
   */
  createBuilderWithUserLookup(
    localField: string = 'userId',
    as: string = 'user',
    project?: Record<string, any>
  ): AggregationBuilder {
    const builder = this.createBuilder();
    return AggregationUtils.addUserLookup(builder, localField, as, project);
  }

  /**
   * Create a builder with project lookup
   * @param localField Field containing the project ID reference
   * @param as Name for the output array field
   * @param includeDetails Whether to include all project details
   * @returns A new AggregationBuilder with project lookup applied
   */
  createBuilderWithProjectLookup(
    localField: string = 'projectId',
    as: string = 'project',
    includeDetails: boolean = false
  ): AggregationBuilder {
    const builder = this.createBuilder();
    return AggregationUtils.addProjectLookup(builder, localField, as, includeDetails);
  }

  /**
   * Create a builder with contract lookup
   * @param localField Field containing the contract ID reference
   * @param as Name for the output array field
   * @returns A new AggregationBuilder with contract lookup applied
   */
  createBuilderWithContractLookup(
    localField: string = 'contractId',
    as: string = 'contract'
  ): AggregationBuilder {
    const builder = this.createBuilder();
    return AggregationUtils.addContractLookup(builder, localField, as);
  }

  /**
   * Create a builder with conditional lookup
   * @param options Conditional lookup options
   * @returns A new AggregationBuilder with conditional lookup applied
   */
  createBuilderWithConditionalLookup(options: ConditionalLookupOptions): AggregationBuilder {
    const builder = this.createBuilder();
    return AggregationUtils.addConditionalLookup(builder, options);
  }

  /**
   * Create a builder for activity timeline
   * @param entityType Type of entity to build timeline for
   * @param entityId ID of the entity
   * @param limit Maximum number of timeline items to return
   * @returns An AggregationBuilder configured for activity timeline
   */
  createActivityTimelineBuilder(
    entityType: 'user' | 'project' | 'contract',
    entityId: string,
    limit: number = 20
  ): AggregationBuilder {
    return AggregationUtils.buildActivityTimeline(entityType, entityId, limit);
  }

  /**
   * Get aggregation utilities
   * @returns The AggregationUtils class
   */
  getUtils(): typeof AggregationUtils {
    return AggregationUtils;
  }

  /**
   * Get cache manager instance
   * @returns The CacheManager instance
   */
  getCacheManager(): CacheManager {
    return this.cacheManager;
  }

  /**
   * Get query monitor instance
   * @returns The QueryMonitor instance
   */
  getQueryMonitor(): QueryMonitor {
    return this.queryMonitor;
  }

  /**
   * Get performance statistics
   * @returns Performance statistics for cache and queries
   */
  getPerformanceStats(): PerformanceStats {
    return {
      cache: this.cacheManager.getStats(),
      queries: this.queryMonitor.getStats()
    };
  }

  /**
   * Get recent performance alerts
   * @param limit Maximum number of alerts to return
   * @returns Array of recent performance alerts
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
   * @param pipeline The pipeline stages to validate
   * @returns Validation result with isValid flag and warnings
   */
  validatePipeline(pipeline: PipelineStage[]): PipelineValidationResult {
    const builder = AggregationBuilder.create();
    // Set the pipeline directly for validation
    (builder as any).pipeline = pipeline;
    return builder.validate();
  }

  /**
   * Get optimization suggestions for a pipeline
   * @param pipeline The pipeline stages to analyze
   * @returns Array of optimization suggestions
   */
  getOptimizationSuggestions(pipeline: PipelineStage[]): string[] {
    return this.queryMonitor.suggestOptimizations(pipeline);
  }

  /**
   * Execute an optimized aggregation pipeline
   * @param builder The AggregationBuilder to execute
   * @param model The Mongoose model to execute the aggregation on
   * @param options Optional execution options
   * @returns The aggregation results
   */
  async executeAggregation<T>(
    builder: AggregationBuilder,
    model: Model<T>,
    options?: {
      enableCache?: boolean;
      cacheTTL?: number;
      monitorPerformance?: boolean;
      comment?: string;
    }
  ): Promise<any> {
    // Apply options
    if (options) {
      if (options.enableCache) {
        builder.cache({ enabled: true, ttl: options.cacheTTL });
      }
      
      if (options.comment) {
        builder.comment(options.comment);
      }
    }
    
    // Execute with performance monitoring
    return await builder.execute(model);
  }

  /**
   * Health check for aggregation system
   * @returns Health check result with status and details
   */
  healthCheck(): HealthCheckResult {
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
