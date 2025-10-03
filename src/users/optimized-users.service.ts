import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './interfaces/user';
import { AggregationService } from '../aggregation/aggregation.service';
import { CacheService } from '../cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AggregationOptions } from '../aggregation/interfaces/aggregation.interface';

@Injectable()
export class OptimizedUsersService {
  private readonly logger = new Logger(OptimizedUsersService.name);

  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly aggregationService: AggregationService,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Get user permissions with optimized caching
   */
  async getUserPermissionsOptimized(
    userId: string,
    options: AggregationOptions = {}
  ): Promise<any> {
    const pipeline = [
      { $match: { _id: new Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "permissions",
          localField: "permissions",
          foreignField: "for",
          as: "permissions_have",
        },
      },
      {
        $project: {
          _id: 1,
          email: 1,
          fullName: 1,
          isEmployee: 1,
          employeeType: 1,
          permissions_have: 1,
          permissionCount: { $size: "$permissions_have" },
        },
      },
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { userId, operation: 'permissions' },
      { prefix: 'user', suffix: 'permissions' }
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
        this.userModel,
        pipeline,
        aggregationOptions
      );

      const userWithPermissions = result.data?.[0] || null;
      
      // Emit event for analytics
      this.eventEmitter.emit('user.permissions.accessed', {
        userId,
        permissionCount: userWithPermissions?.permissionCount || 0,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return userWithPermissions;
    } catch (error) {
      this.logger.error(`Error getting permissions for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user projects with optimized caching
   */
  async getUserProjectsOptimized(
    userId: string,
    options: AggregationOptions = {}
  ): Promise<any> {
    const pipeline = [
      { $match: { _id: new Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "employee",
          as: "projects",
        },
      },
      {
        $lookup: {
          from: "projectearnings",
          let: { projectIds: "$projects._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$project", "$$projectIds"],
                },
              },
            },
            {
              $group: {
                _id: "$project",
                totalEarnings: { $sum: "$amount" },
                currency: { $first: "$currency" },
              },
            },
          ],
          as: "projectEarnings",
        },
      },
      {
        $addFields: {
          projects: {
            $map: {
              input: "$projects",
              as: "project",
              in: {
                $mergeObjects: [
                  "$$project",
                  {
                    earnings: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$projectEarnings",
                            cond: { $eq: ["$$this._id", "$$project._id"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
          totalProjectEarnings: { $sum: "$projectEarnings.totalEarnings" },
          projectCount: { $size: "$projects" },
          activeProjects: {
            $size: {
              $filter: {
                input: "$projects",
                cond: { $eq: ["$$this.status", "active"] },
              },
            },
          },
          completedProjects: {
            $size: {
              $filter: {
                input: "$projects",
                cond: { $eq: ["$$this.status", "completed"] },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          email: 1,
          fullName: 1,
          isEmployee: 1,
          employeeType: 1,
          projects: 1,
          totalProjectEarnings: 1,
          projectCount: 1,
          activeProjects: 1,
          completedProjects: 1,
          projectEarnings: 0,
        },
      },
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { userId, operation: 'projects' },
      { prefix: 'user', suffix: 'projects' }
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
        this.userModel,
        pipeline,
        aggregationOptions
      );

      const userWithProjects = result.data?.[0] || null;
      
      // Emit event for analytics
      this.eventEmitter.emit('user.projects.accessed', {
        userId,
        projectCount: userWithProjects?.projectCount || 0,
        activeProjects: userWithProjects?.activeProjects || 0,
        completedProjects: userWithProjects?.completedProjects || 0,
        totalEarnings: userWithProjects?.totalProjectEarnings || 0,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return userWithProjects;
    } catch (error) {
      this.logger.error(`Error getting projects for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user contracts with optimized caching
   */
  async getUserContractsOptimized(
    userId: string,
    options: AggregationOptions = {}
  ): Promise<any> {
    const pipeline = [
      { $match: { _id: new Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "contracts",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$employee", "$$userId"] },
                    { $eq: ["$client", "$$userId"] },
                  ],
                },
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
                userRole: {
                  $cond: [
                    { $eq: ["$employee", "$$userId"] },
                    "employee",
                    "client",
                  ],
                },
              },
            },
            {
              $project: {
                employeeDetails: 0,
                clientDetails: 0,
              },
            },
          ],
          as: "contracts",
        },
      },
      {
        $addFields: {
          contractCount: { $size: "$contracts" },
          employeeContracts: {
            $size: {
              $filter: {
                input: "$contracts",
                cond: { $eq: ["$$this.userRole", "employee"] },
              },
            },
          },
          clientContracts: {
            $size: {
              $filter: {
                input: "$contracts",
                cond: { $eq: ["$$this.userRole", "client"] },
              },
            },
          },
          activeContracts: {
            $size: {
              $filter: {
                input: "$contracts",
                cond: { $eq: ["$$this.status", "active"] },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          email: 1,
          fullName: 1,
          isEmployee: 1,
          employeeType: 1,
          contracts: 1,
          contractCount: 1,
          employeeContracts: 1,
          clientContracts: 1,
          activeContracts: 1,
        },
      },
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { userId, operation: 'contracts' },
      { prefix: 'user', suffix: 'contracts' }
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
        this.userModel,
        pipeline,
        aggregationOptions
      );

      const userWithContracts = result.data?.[0] || null;
      
      // Emit event for analytics
      this.eventEmitter.emit('user.contracts.accessed', {
        userId,
        contractCount: userWithContracts?.contractCount || 0,
        employeeContracts: userWithContracts?.employeeContracts || 0,
        clientContracts: userWithContracts?.clientContracts || 0,
        activeContracts: userWithContracts?.activeContracts || 0,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return userWithContracts;
    } catch (error) {
      this.logger.error(`Error getting contracts for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user dashboard data with comprehensive caching
   */
  async getUserDashboardOptimized(
    userId: string,
    options: AggregationOptions = {}
  ): Promise<any> {
    const pipeline = [
      { $match: { _id: new Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "employee",
          as: "projects",
        },
      },
      {
        $lookup: {
          from: "contracts",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$employee", "$$userId"] },
                    { $eq: ["$client", "$$userId"] },
                  ],
                },
              },
            },
          ],
          as: "contracts",
        },
      },
      {
        $lookup: {
          from: "projectearnings",
          let: { projectIds: "$projects._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$project", "$$projectIds"],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalEarnings: { $sum: "$amount" },
                earningsCount: { $sum: 1 },
                avgEarnings: { $avg: "$amount" },
                currencies: { $addToSet: "$currency" },
              },
            },
          ],
          as: "earningsStats",
        },
      },
      {
        $lookup: {
          from: "permissions",
          localField: "permissions",
          foreignField: "for",
          as: "permissions",
        },
      },
      {
        $addFields: {
          earningsStats: { $arrayElemAt: ["$earningsStats", 0] },
          dashboardStats: {
            totalProjects: { $size: "$projects" },
            activeProjects: {
              $size: {
                $filter: {
                  input: "$projects",
                  cond: { $eq: ["$$this.status", "active"] },
                },
              },
            },
            completedProjects: {
              $size: {
                $filter: {
                  input: "$projects",
                  cond: { $eq: ["$$this.status", "completed"] },
                },
              },
            },
            totalContracts: { $size: "$contracts" },
            activeContracts: {
              $size: {
                $filter: {
                  input: "$contracts",
                  cond: { $eq: ["$$this.status", "active"] },
                },
              },
            },
            totalPermissions: { $size: "$permissions" },
          },
        },
      },
      {
        $project: {
          _id: 1,
          email: 1,
          fullName: 1,
          isEmployee: 1,
          employeeType: 1,
          createdAt: 1,
          dashboardStats: 1,
          totalEarnings: "$earningsStats.totalEarnings",
          earningsCount: "$earningsStats.earningsCount",
          avgEarnings: "$earningsStats.avgEarnings",
          currencies: "$earningsStats.currencies",
          recentProjects: {
            $slice: [
              {
                $sortArray: {
                  input: "$projects",
                  sortBy: { createdAt: -1 },
                },
              },
              5,
            ],
          },
          recentContracts: {
            $slice: [
              {
                $sortArray: {
                  input: "$contracts",
                  sortBy: { createdAt: -1 },
                },
              },
              5,
            ],
          },
        },
      },
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { userId, operation: 'dashboard' },
      { prefix: 'user', suffix: 'dashboard' }
    );

    const aggregationOptions: AggregationOptions = {
      useReplica: true,
      useCache: true,
      cacheTTL: 900, // 15 minutes (dashboard data changes frequently)
      cacheKey,
      readPreference: 'secondaryPreferred',
      ...options,
    };

    try {
      const result = await this.aggregationService.executeAggregation<any[]>(
        this.userModel,
        pipeline,
        aggregationOptions
      );

      const dashboardData = result.data?.[0] || null;
      
      // Emit event for analytics
      this.eventEmitter.emit('user.dashboard.accessed', {
        userId,
        dashboardStats: dashboardData?.dashboardStats,
        totalEarnings: dashboardData?.totalEarnings || 0,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return dashboardData;
    } catch (error) {
      this.logger.error(`Error getting dashboard data for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get users statistics with caching
   */
  async getUsersStatsOptimized(options: AggregationOptions = {}): Promise<any> {
    const pipeline = [
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          employees: {
            $sum: {
              $cond: [{ $eq: ["$isEmployee", true] }, 1, 0],
            },
          },
          clients: {
            $sum: {
              $cond: [{ $eq: ["$isEmployee", false] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "projects",
          pipeline: [
            {
              $group: {
                _id: null,
                totalProjects: { $sum: 1 },
                uniqueEmployees: { $addToSet: "$employee" },
              },
            },
          ],
          as: "projectStats",
        },
      },
      {
        $lookup: {
          from: "contracts",
          pipeline: [
            {
              $group: {
                _id: null,
                totalContracts: { $sum: 1 },
                uniqueEmployees: { $addToSet: "$employee" },
                uniqueClients: { $addToSet: "$client" },
              },
            },
          ],
          as: "contractStats",
        },
      },
      {
        $addFields: {
          projectStats: { $arrayElemAt: ["$projectStats", 0] },
          contractStats: { $arrayElemAt: ["$contractStats", 0] },
        },
      },
      {
        $project: {
          _id: 0,
          totalUsers: 1,
          employees: 1,
          clients: 1,
          employeePercentage: {
            $multiply: [{ $divide: ["$employees", "$totalUsers"] }, 100],
          },
          clientPercentage: {
            $multiply: [{ $divide: ["$clients", "$totalUsers"] }, 100],
          },
          totalProjects: "$projectStats.totalProjects",
          activeEmployees: { $size: "$projectStats.uniqueEmployees" },
          totalContracts: "$contractStats.totalContracts",
          contractEmployees: { $size: "$contractStats.uniqueEmployees" },
          contractClients: { $size: "$contractStats.uniqueClients" },
        },
      },
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { operation: 'stats' },
      { prefix: 'users', suffix: 'stats' }
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
        this.userModel,
        pipeline,
        aggregationOptions
      );

      const stats = result.data?.[0] || {
        totalUsers: 0,
        employees: 0,
        clients: 0,
        employeePercentage: 0,
        clientPercentage: 0,
        totalProjects: 0,
        activeEmployees: 0,
        totalContracts: 0,
        contractEmployees: 0,
        contractClients: 0,
      };

      // Emit event for analytics
      this.eventEmitter.emit('users.stats.accessed', {
        stats,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return stats;
    } catch (error) {
      this.logger.error('Error getting users statistics:', error);
      throw error;
    }
  }

  /**
   * Get top performing employees with caching
   */
  async getTopPerformingEmployeesOptimized(
    limit: number = 10,
    options: AggregationOptions = {}
  ): Promise<any[]> {
    const pipeline = [
      { $match: { isEmployee: true } },
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "employee",
          as: "projects",
        },
      },
      {
        $lookup: {
          from: "projectearnings",
          let: { projectIds: "$projects._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$project", "$$projectIds"],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalEarnings: { $sum: "$amount" },
                earningsCount: { $sum: 1 },
                avgEarnings: { $avg: "$amount" },
              },
            },
          ],
          as: "earningsStats",
        },
      },
      {
        $addFields: {
          earningsStats: { $arrayElemAt: ["$earningsStats", 0] },
          projectCount: { $size: "$projects" },
          completedProjects: {
            $size: {
              $filter: {
                input: "$projects",
                cond: { $eq: ["$$this.status", "completed"] },
              },
            },
          },
          activeProjects: {
            $size: {
              $filter: {
                input: "$projects",
                cond: { $eq: ["$$this.status", "active"] },
              },
            },
          },
        },
      },
      {
        $addFields: {
          totalEarnings: "$earningsStats.totalEarnings",
          earningsCount: "$earningsStats.earningsCount",
          avgEarnings: "$earningsStats.avgEarnings",
          completionRate: {
            $cond: [
              { $gt: ["$projectCount", 0] },
              {
                $multiply: [
                  { $divide: ["$completedProjects", "$projectCount"] },
                  100,
                ],
              },
              0,
            ],
          },
          performanceScore: {
            $add: [
              { $multiply: ["$completedProjects", 10] },
              { $multiply: ["$activeProjects", 5] },
              { $divide: [{ $ifNull: ["$earningsStats.totalEarnings", 0] }, 100] },
            ],
          },
        },
      },
      {
        $match: {
          $or: [
            { projectCount: { $gt: 0 } },
            { totalEarnings: { $gt: 0 } },
          ],
        },
      },
      {
        $project: {
          projects: 0,
          earningsStats: 0,
        },
      },
      {
        $sort: { performanceScore: -1 },
      },
      {
        $limit: limit,
      },
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { limit, operation: 'top_performing' },
      { prefix: 'employees', suffix: 'top_performing' }
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
        this.userModel,
        pipeline,
        aggregationOptions
      );

      // Emit event for analytics
      this.eventEmitter.emit('employees.top_performing.accessed', {
        limit,
        resultCount: result.data?.length || 0,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return result.data || [];
    } catch (error) {
      this.logger.error('Error getting top performing employees:', error);
      throw error;
    }
  }

  /**
   * Invalidate user-related cache
   */
  async invalidateUserCache(userId?: string): Promise<void> {
    try {
      if (userId) {
        // Invalidate specific user caches
        const patterns = [
          `user:*:${userId}:*`,
          `users:*:stats`,
          `employees:*:top_performing`,
        ];

        for (const pattern of patterns) {
          await this.cacheService.clearByPattern(pattern);
        }
      } else {
        // Invalidate all user caches
        await this.cacheService.clearByPattern('user*');
        await this.cacheService.clearByPattern('employee*');
      }

      this.logger.log(`Invalidated user cache${userId ? ` for ${userId}` : 's'}`);
    } catch (error) {
      this.logger.error('Error invalidating user cache:', error);
    }
  }

  /**
   * Warm frequently accessed user caches
   */
  async warmUserCaches(): Promise<void> {
    try {
      this.logger.log('Warming user caches...');

      // Warm users statistics cache
      await this.getUsersStatsOptimized({ warmCache: true });

      // Warm top performing employees cache
      await this.getTopPerformingEmployeesOptimized(10, { warmCache: true });

      this.logger.log('User caches warmed successfully');
    } catch (error) {
      this.logger.error('Error warming user caches:', error);
    }
  }

  /**
   * Get performance metrics for user operations
   */
  getPerformanceMetrics(): any {
    return this.aggregationService.getStats();
  }
}
