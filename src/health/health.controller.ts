import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Get basic health status' })
  @ApiResponse({ status: 200, description: 'System is healthy' })
  @ApiResponse({ status: 503, description: 'System is unhealthy' })
  async getHealth(@Res() res: Response) {
    try {
      const health = await this.healthService.getSystemHealth();
      
      const statusCode = health.overall === 'healthy' ? 
        HttpStatus.OK : 
        health.overall === 'degraded' ? 
          HttpStatus.PARTIAL_CONTENT : 
          HttpStatus.SERVICE_UNAVAILABLE;

      return res.status(statusCode).json({
        status: health.overall,
        timestamp: health.timestamp,
        uptime: health.uptime,
        services: Object.keys(health.services).reduce((acc, key) => {
          acc[key] = health.services[key].status;
          return acc;
        }, {} as Record<string, string>),
      });
    } catch (error) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message,
      });
    }
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Get detailed health status with diagnostics' })
  @ApiResponse({ status: 200, description: 'Detailed health information' })
  async getDetailedHealth(@Res() res: Response) {
    try {
      const health = await this.healthService.getDetailedHealth();
      
      const statusCode = health.system.overall === 'healthy' ? 
        HttpStatus.OK : 
        health.system.overall === 'degraded' ? 
          HttpStatus.PARTIAL_CONTENT : 
          HttpStatus.SERVICE_UNAVAILABLE;

      return res.status(statusCode).json(health);
    } catch (error) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message,
      });
    }
  }

  @Get('database')
  @ApiOperation({ summary: 'Get database health and statistics' })
  @ApiResponse({ status: 200, description: 'Database health information' })
  async getDatabaseHealth(@Res() res: Response) {
    try {
      const [health, stats] = await Promise.all([
        this.healthService.checkDatabaseHealth(),
        this.healthService.getDatabaseStats(),
      ]);

      return res.status(HttpStatus.OK).json({
        health,
        stats,
        timestamp: new Date(),
      });
    } catch (error) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message,
      });
    }
  }

  @Get('cache')
  @ApiOperation({ summary: 'Get cache health and statistics' })
  @ApiResponse({ status: 200, description: 'Cache health information' })
  async getCacheHealth(@Res() res: Response) {
    try {
      const [health, stats] = await Promise.all([
        this.healthService.checkCacheHealth(),
        this.healthService.getCacheStats(),
      ]);

      return res.status(HttpStatus.OK).json({
        health,
        stats,
        timestamp: new Date(),
      });
    } catch (error) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message,
      });
    }
  }

  @Get('paytabs')
  @ApiOperation({ summary: 'Get PayTabs service health' })
  @ApiResponse({ status: 200, description: 'PayTabs health information' })
  async getPayTabsHealth(@Res() res: Response) {
    try {
      const health = await this.healthService.checkPayTabsHealth();

      const statusCode = health.circuitBreakerState === 'OPEN' ? 
        HttpStatus.SERVICE_UNAVAILABLE : 
        health.errorRate > 25 ? 
          HttpStatus.PARTIAL_CONTENT : 
          HttpStatus.OK;

      return res.status(statusCode).json({
        health,
        timestamp: new Date(),
      });
    } catch (error) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message,
      });
    }
  }

  @Get('circuit-breakers')
  @ApiOperation({ summary: 'Get circuit breaker statistics' })
  @ApiResponse({ status: 200, description: 'Circuit breaker statistics' })
  async getCircuitBreakerStats() {
    try {
      const stats = await this.healthService.getCircuitBreakerStats();
      
      return {
        circuitBreakers: stats,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  @Get('liveness')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  getLiveness() {
    return {
      status: 'alive',
      timestamp: new Date(),
    };
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Application is ready' })
  @ApiResponse({ status: 503, description: 'Application is not ready' })
  async getReadiness(@Res() res: Response) {
    try {
      const health = await this.healthService.getSystemHealth();
      
      // Consider the application ready if at least database is healthy
      const databaseHealthy = health.services.database?.status === 'healthy';
      
      if (databaseHealthy) {
        return res.status(HttpStatus.OK).json({
          status: 'ready',
          timestamp: new Date(),
          services: health.services,
        });
      } else {
        return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
          status: 'not_ready',
          timestamp: new Date(),
          services: health.services,
        });
      }
    } catch (error) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'not_ready',
        timestamp: new Date(),
        error: error.message,
      });
    }
  }
}
