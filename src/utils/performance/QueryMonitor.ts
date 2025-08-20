/**
 * QueryMonitor - Performance monitoring for aggregation queries
 * 
 * Tracks query performance, identifies slow queries, and provides
 * optimization suggestions.
 */

export interface QueryMetrics {
  queryId: string;
  executionTime: number;
  documentsExamined: number;
  documentsReturned: number;
  indexesUsed: string[];
  memoryUsage?: number;
  pipeline: any[];
  timestamp: Date;
  collection: string;
}

export interface PerformanceAlert {
  type: 'slow_query' | 'high_memory' | 'no_index' | 'large_result';
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion: string;
  metrics: QueryMetrics;
}

export class QueryMonitor {
  private static instance: QueryMonitor;
  private metrics: QueryMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private maxMetricsHistory = 1000;

  // Performance thresholds
  private readonly thresholds = {
    slowQueryMs: 1000,
    highMemoryMB: 100,
    largeResultCount: 10000
  };

  private constructor() {}

  static getInstance(): QueryMonitor {
    if (!QueryMonitor.instance) {
      QueryMonitor.instance = new QueryMonitor();
    }
    return QueryMonitor.instance;
  }

  /**
   * Record query metrics
   */
  recordMetrics(metrics: QueryMetrics): void {
    if (!metrics) return;
    
    try {
      // Add timestamp if not provided
      if (!metrics.timestamp) {
        metrics.timestamp = new Date();
      }

      // Store metrics
      this.metrics.push(metrics);

      // Limit history size
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics = this.metrics.slice(-this.maxMetricsHistory);
      }

      // Check for performance issues
      this.analyzeMetrics(metrics);
    } catch (error: any) {
      console.error('Error recording query metrics:', error?.message || String(error));
    }
  }

  /**
   * Analyze metrics and generate alerts
   */
  private analyzeMetrics(metrics: QueryMetrics): void {
    if (!metrics) return;
    
    const alerts: PerformanceAlert[] = [];

    // Check for slow queries
    if (metrics.executionTime > this.thresholds.slowQueryMs) {
      alerts.push({
        type: 'slow_query',
        severity: metrics.executionTime > 5000 ? 'high' : 'medium',
        message: `Slow query detected: ${metrics.executionTime}ms execution time`,
        suggestion: 'Consider adding indexes, optimizing pipeline stages, or using $limit',
        metrics
      });
    }

    // Check for high memory usage
    if (metrics.memoryUsage && metrics.memoryUsage > this.thresholds.highMemoryMB * 1024 * 1024) {
      alerts.push({
        type: 'high_memory',
        severity: 'medium',
        message: `High memory usage: ${Math.round(metrics.memoryUsage / 1024 / 1024)}MB`,
        suggestion: 'Consider using allowDiskUse option or optimizing pipeline stages',
        metrics
      });
    }

    // Check for queries without indexes
    if (metrics.indexesUsed.length === 0 && metrics.documentsExamined > 100) {
      alerts.push({
        type: 'no_index',
        severity: 'high',
        message: 'Query not using any indexes',
        suggestion: 'Add appropriate indexes for the query conditions',
        metrics
      });
    }

    // Check for large result sets
    if (metrics.documentsReturned > this.thresholds.largeResultCount) {
      alerts.push({
        type: 'large_result',
        severity: 'medium',
        message: `Large result set: ${metrics.documentsReturned} documents`,
        suggestion: 'Consider adding pagination with $skip and $limit',
        metrics
      });
    }

    // Store alerts
    this.alerts.push(...alerts);

    // Log high severity alerts
    alerts.forEach(alert => {
      if (alert.severity === 'high') {
        console.warn('Performance Alert:', alert);
      }
    });
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    totalQueries: number;
    averageExecutionTime: number;
    slowQueries: number;
    alertCounts: Record<string, number>;
    topSlowQueries: QueryMetrics[];
  } {
    const totalQueries = this.metrics.length;
    const averageExecutionTime = totalQueries > 0 
      ? this.metrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries 
      : 0;
    
    const slowQueries = this.metrics.filter(m => m.executionTime > this.thresholds.slowQueryMs).length;
    
    const alertCounts = this.alerts.reduce((counts, alert) => {
      counts[alert.type] = (counts[alert.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const topSlowQueries = [...this.metrics]
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    return {
      totalQueries,
      averageExecutionTime: Math.round(averageExecutionTime),
      slowQueries,
      alertCounts,
      topSlowQueries
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 50): PerformanceAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Clear metrics and alerts
   */
  clear(): void {
    this.metrics = [];
    this.alerts = [];
  }

  /**
   * Generate optimization suggestions for a pipeline
   */
  suggestOptimizations(pipeline: any[]): string[] {
    const suggestions: string[] = [];

    // Check pipeline stage order
    let foundLookup = false;
    let foundSort = false;
    
    for (let i = 0; i < pipeline.length; i++) {
      const stage = pipeline[i];
      
      if (stage.$lookup) {
        foundLookup = true;
      }
      
      if (stage.$sort) {
        foundSort = true;
      }
      
      if (stage.$match && foundLookup) {
        suggestions.push('Move $match stages before $lookup stages for better performance');
      }
      
      if (stage.$sort && foundLookup && !foundSort) {
        suggestions.push('Consider sorting before $lookup operations when possible');
      }
    }

    // Check for missing $limit
    const hasLimit = pipeline.some(stage => stage.$limit);
    const hasLookup = pipeline.some(stage => stage.$lookup);
    
    if (hasLookup && !hasLimit) {
      suggestions.push('Consider adding $limit to prevent large result sets with $lookup');
    }

    // Check for complex $group operations
    const groupStages = pipeline.filter(stage => stage.$group);
    if (groupStages.length > 1) {
      suggestions.push('Multiple $group stages detected - consider combining if possible');
    }

    return suggestions;
  }
}
