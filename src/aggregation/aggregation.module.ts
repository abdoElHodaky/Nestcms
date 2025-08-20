/**
 * AggregationModule - Global module for aggregation optimization
 * 
 * Provides aggregation utilities, caching, and performance monitoring
 * as injectable services throughout the application.
 */

import { Module, Global } from '@nestjs/common';
import { AggregationService } from './aggregation.service';

@Global()
@Module({
  providers: [AggregationService],
  exports: [AggregationService],
})
export class AggregationModule {
  constructor(private aggregationService: AggregationService) {
    // Log module initialization
    console.log('🚀 AggregationModule initialized with optimization utilities');
    
    // Log initial health check
    const health = this.aggregationService.healthCheck();
    console.log(`📊 Aggregation system status: ${health.status}`);
  }
}

