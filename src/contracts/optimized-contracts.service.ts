import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Contract } from './interface/contract';
import { Employee } from '../users/interfaces/user';
import { AggregationService } from '../aggregation/aggregation.service';
import { CacheService } from '../cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AggregationOptions } from '../aggregation/interfaces/aggregation.interface';

@Injectable()
export class OptimizedContractsService {
  private readonly logger = new Logger(OptimizedContractsService.name);

  constructor(
    @InjectModel('Contract') private readonly contractModel: Model<Contract>,
    private readonly aggregationService: AggregationService,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Get employees for a contract with optimized caching and read replica support
   */
  async getEmployeesOptimized(contractId: string, options: AggregationOptions = {}): Promise<Employee[]> {
    const pipeline = [
      { $match: { _id: new Types.ObjectId(contractId) } },
      {
        $lookup: {
          from: "users",
          localField: "employee",
          foreignField: "_id",
          as: "employees",
        },
      },
      {
        $project: {
          employees: 1,
          _id: 0,
        },
      },
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { contractId, operation: 'employees' },
      { prefix: 'contract', suffix: 'employees' }
    );

    const aggregationOptions: AggregationOptions = {
      useReplica: true,
      useCache: true,
      cacheTTL: 3600, // 1 hour
      cacheKey,
      readPreference: 'secondaryPreferred',
      ...options,
    };

    try {
      const result = await this.aggregationService.executeAggregation<any[]>(
        this.contractModel,
        pipeline,
        aggregationOptions
      );

      const employees = result.data?.[0]?.employees || [];
      
      // Emit event for analytics
      this.eventEmitter.emit('contract.employees.accessed', {
        contractId,
        employeeCount: employees.length,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return employees;
    } catch (error) {
      this.logger.error(`Error getting employees for contract ${contractId}:`, error);
      throw error;
    }
  }

  /**
   * Get contract with all related data (employees, client, offer) - optimized
   */
  async getContractWithDetailsOptimized(
    contractId: string, 
    options: AggregationOptions = {}
  ): Promise<any> {
    const pipeline = [
      { $match: { _id: new Types.ObjectId(contractId) } },
      {
        $lookup: {
          from: "users",
          localField: "employee",
          foreignField: "_id",
          as: "employeeDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "client",
          foreignField: "_id",
          as: "clientDetails",
        },
      },
      {
        $lookup: {
          from: "offers",
          localField: "offerId",
          foreignField: "_id",
          as: "offerDetails",
        },
      },
      {
        $addFields: {
          employee: { $arrayElemAt: ["$employeeDetails", 0] },
          client: { $arrayElemAt: ["$clientDetails", 0] },
          offer: { $arrayElemAt: ["$offerDetails", 0] },
        },
      },
      {
        $project: {
          employeeDetails: 0,
          clientDetails: 0,
          offerDetails: 0,
        },
      },
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { contractId, operation: 'details' },
      { prefix: 'contract', suffix: 'details' }
    );

    const aggregationOptions: AggregationOptions = {
      useReplica: true,
      useCache: true,
      cacheTTL: 1800, // 30 minutes
      cacheKey,
      readPreference: 'secondaryPreferred',
      ...options,
    };

    try {
      const result = await this.aggregationService.executeAggregation<any[]>(
        this.contractModel,
        pipeline,
        aggregationOptions
      );

      const contractDetails = result.data?.[0] || null;
      
      // Emit event for analytics
      this.eventEmitter.emit('contract.details.accessed', {
        contractId,
        cached: result.cached,
        executionTime: result.executionTime,
        hasEmployee: !!contractDetails?.employee,
        hasClient: !!contractDetails?.client,
        hasOffer: !!contractDetails?.offer,
      });

      return contractDetails;
    } catch (error) {
      this.logger.error(`Error getting contract details for ${contractId}:`, error);
      throw error;
    }
  }

  /**
   * Get contracts by employee with caching
   */
  async getContractsByEmployeeOptimized(
    employeeId: string,
    options: AggregationOptions = {}
  ): Promise<Contract[]> {
    const pipeline = [
      { $match: { employee: new Types.ObjectId(employeeId) } },
      {
        $lookup: {
          from: "users",
          localField: "client",
          foreignField: "_id",
          as: "clientDetails",
        },
      },
      {
        $addFields: {
          client: { $arrayElemAt: ["$clientDetails", 0] },
        },
      },
      {
        $project: {
          clientDetails: 0,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { employeeId, operation: 'by_employee' },
      { prefix: 'contracts', suffix: 'employee' }
    );

    const aggregationOptions: AggregationOptions = {
      useReplica: true,
      useCache: true,
      cacheTTL: 1800, // 30 minutes
      cacheKey,
      readPreference: 'secondaryPreferred',
      ...options,
    };

    try {
      const result = await this.aggregationService.executeAggregation<Contract[]>(
        this.contractModel,
        pipeline,
        aggregationOptions
      );

      // Emit event for analytics
      this.eventEmitter.emit('contracts.by_employee.accessed', {
        employeeId,
        contractCount: result.data?.length || 0,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return result.data || [];
    } catch (error) {
      this.logger.error(`Error getting contracts for employee ${employeeId}:`, error);
      throw error;
    }
  }

  /**
   * Get contracts by client with caching
   */
  async getContractsByClientOptimized(
    clientId: string,
    options: AggregationOptions = {}
  ): Promise<Contract[]> {
    const pipeline = [
      { $match: { client: new Types.ObjectId(clientId) } },
      {
        $lookup: {
          from: "users",
          localField: "employee",
          foreignField: "_id",
          as: "employeeDetails",
        },
      },
      {
        $addFields: {
          employee: { $arrayElemAt: ["$employeeDetails", 0] },
        },
      },
      {
        $project: {
          employeeDetails: 0,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { clientId, operation: 'by_client' },
      { prefix: 'contracts', suffix: 'client' }
    );

    const aggregationOptions: AggregationOptions = {
      useReplica: true,
      useCache: true,
      cacheTTL: 1800, // 30 minutes
      cacheKey,
      readPreference: 'secondaryPreferred',
      ...options,
    };

    try {
      const result = await this.aggregationService.executeAggregation<Contract[]>(
        this.contractModel,
        pipeline,
        aggregationOptions
      );

      // Emit event for analytics
      this.eventEmitter.emit('contracts.by_client.accessed', {
        clientId,
        contractCount: result.data?.length || 0,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return result.data || [];
    } catch (error) {
      this.logger.error(`Error getting contracts for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Get contract statistics with advanced caching
   */
  async getContractStatsOptimized(options: AggregationOptions = {}): Promise<any> {
    const pipeline = [
      {
        $group: {
          _id: null,
          totalContracts: { $sum: 1 },
          activeContracts: {
            $sum: {
              $cond: [{ $eq: ["$status", "active"] }, 1, 0],
            },
          },
          completedContracts: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
          pendingContracts: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalContracts: 1,
          activeContracts: 1,
          completedContracts: 1,
          pendingContracts: 1,
          activePercentage: {
            $multiply: [
              { $divide: ["$activeContracts", "$totalContracts"] },
              100,
            ],
          },
          completionRate: {
            $multiply: [
              { $divide: ["$completedContracts", "$totalContracts"] },
              100,
            ],
          },
        },
      },
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { operation: 'stats' },
      { prefix: 'contracts', suffix: 'stats' }
    );

    const aggregationOptions: AggregationOptions = {
      useReplica: true,
      useCache: true,
      cacheTTL: 900, // 15 minutes
      cacheKey,
      readPreference: 'secondaryPreferred',
      ...options,
    };

    try {
      const result = await this.aggregationService.executeAggregation<any[]>(
        this.contractModel,
        pipeline,
        aggregationOptions
      );

      const stats = result.data?.[0] || {
        totalContracts: 0,
        activeContracts: 0,
        completedContracts: 0,
        pendingContracts: 0,
        activePercentage: 0,
        completionRate: 0,
      };

      // Emit event for analytics
      this.eventEmitter.emit('contracts.stats.accessed', {
        stats,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return stats;
    } catch (error) {
      this.logger.error('Error getting contract statistics:', error);
      throw error;
    }
  }

  /**
   * Get contracts with earnings aggregation
   */
  async getContractsWithEarningsOptimized(
    options: AggregationOptions = {}
  ): Promise<any[]> {
    const pipeline = [
      {
        $lookup: {
          from: "projectearnings",
          let: { contractId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$contractId", "$$contractId"],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalEarnings: { $sum: "$amount" },
                currency: { $first: "$currency" },
              },
            },
          ],
          as: "earnings",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "employee",
          foreignField: "_id",
          as: "employeeDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "client",
          foreignField: "_id",
          as: "clientDetails",
        },
      },
      {
        $addFields: {
          employee: { $arrayElemAt: ["$employeeDetails", 0] },
          client: { $arrayElemAt: ["$clientDetails", 0] },
          totalEarnings: { $arrayElemAt: ["$earnings.totalEarnings", 0] },
          currency: { $arrayElemAt: ["$earnings.currency", 0] },
        },
      },
      {
        $project: {
          employeeDetails: 0,
          clientDetails: 0,
          earnings: 0,
        },
      },
      {
        $sort: { totalEarnings: -1 },
      },
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { operation: 'with_earnings' },
      { prefix: 'contracts', suffix: 'earnings' }
    );

    const aggregationOptions: AggregationOptions = {
      useReplica: true,
      useCache: true,
      cacheTTL: 1800, // 30 minutes
      cacheKey,
      readPreference: 'secondaryPreferred',
      ...options,
    };

    try {
      const result = await this.aggregationService.executeAggregation<any[]>(
        this.contractModel,
        pipeline,
        aggregationOptions
      );

      // Emit event for analytics
      this.eventEmitter.emit('contracts.with_earnings.accessed', {
        contractCount: result.data?.length || 0,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return result.data || [];
    } catch (error) {
      this.logger.error('Error getting contracts with earnings:', error);
      throw error;
    }
  }

  /**
   * Invalidate contract-related cache
   */
  async invalidateContractCache(contractId?: string): Promise<void> {
    try {
      if (contractId) {
        // Invalidate specific contract caches
        const patterns = [
          `contract:*:${contractId}:*`,
          `contracts:*:employee:*`,
          `contracts:*:client:*`,
          `contracts:*:stats`,
          `contracts:*:earnings`,
        ];

        for (const pattern of patterns) {
          await this.cacheService.clearByPattern(pattern);
        }
      } else {
        // Invalidate all contract caches
        await this.cacheService.clearByPattern('contract*');
      }

      this.logger.log(`Invalidated contract cache${contractId ? ` for ${contractId}` : 's'}`);
    } catch (error) {
      this.logger.error('Error invalidating contract cache:', error);
    }
  }

  /**
   * Warm frequently accessed contract caches
   */
  async warmContractCaches(): Promise<void> {
    try {
      this.logger.log('Warming contract caches...');

      // Warm contract statistics cache
      await this.getContractStatsOptimized({ warmCache: true });

      // Warm contracts with earnings cache
      await this.getContractsWithEarningsOptimized({ warmCache: true });

      this.logger.log('Contract caches warmed successfully');
    } catch (error) {
      this.logger.error('Error warming contract caches:', error);
    }
  }

  /**
   * Get performance metrics for contract operations
   */
  getPerformanceMetrics(): any {
    return this.aggregationService.getStats();
  }
}
