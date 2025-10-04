import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project } from './interface/project';
import { Design } from './interface/design';
import { ProjectStep } from './interface/project-step';
import { Employee } from '../users/interfaces/user';
import { Note } from '../notes/interface/note.interface';
import { ProjectEarning } from '../earnings/interface/earning';
import { AggregationService } from '../aggregation/aggregation.service';
import { CacheService } from '../cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AggregationOptions } from '../aggregation/interfaces/aggregation.interface';

@Injectable()
export class OptimizedProjectsService {
  private readonly logger = new Logger(OptimizedProjectsService.name);

  constructor(
    @InjectModel('Project') private readonly projectModel: Model<Project>,
    @InjectModel('Design') private readonly designModel: Model<Design>,
    @InjectModel('ProjectStep') private readonly stepModel: Model<ProjectStep>,
    private readonly aggregationService: AggregationService,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Get project designs with optimized caching
   */
  async getProjectDesignsOptimized(
    projectId: string,
    options: AggregationOptions = {}
  ): Promise<Design[]> {
    const pipeline = [
      { $match: { _id: new Types.ObjectId(projectId) } },
      {
        $lookup: {
          from: "designs",
          localField: "designs",
          foreignField: "_id",
          as: "designs",
        },
      },
      {
        $project: {
          designs: 1,
          _id: 0,
        },
      },
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { projectId, operation: 'designs' },
      { prefix: 'project', suffix: 'designs' }
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
        this.projectModel,
        pipeline,
        aggregationOptions
      );

      const designs = result.data?.[0]?.designs || [];
      
      // Emit event for analytics
      this.eventEmitter.emit('project.designs.accessed', {
        projectId,
        designCount: designs.length,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return designs;
    } catch (error) {
      this.logger.error(`Error getting designs for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get project steps with optimized caching
   */
  async getProjectStepsOptimized(
    projectId: string,
    options: AggregationOptions = {}
  ): Promise<ProjectStep[]> {
    const pipeline = [
      { $match: { _id: new Types.ObjectId(projectId) } },
      {
        $lookup: {
          from: "steps",
          localField: "steps",
          foreignField: "_id",
          as: "steps",
        },
      },
      {
        $unwind: {
          path: "$steps",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { "steps.order": 1, "steps.createdAt": 1 },
      },
      {
        $group: {
          _id: "$_id",
          steps: { $push: "$steps" },
        },
      },
      {
        $project: {
          steps: 1,
          _id: 0,
        },
      },
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { projectId, operation: 'steps' },
      { prefix: 'project', suffix: 'steps' }
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
        this.projectModel,
        pipeline,
        aggregationOptions
      );

      const steps = result.data?.[0]?.steps || [];
      
      // Emit event for analytics
      this.eventEmitter.emit('project.steps.accessed', {
        projectId,
        stepCount: steps.length,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return steps;
    } catch (error) {
      this.logger.error(`Error getting steps for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get project notes with optimized caching
   */
  async getProjectNotesOptimized(
    projectId: string,
    options: AggregationOptions = {}
  ): Promise<Note[]> {
    const pipeline = [
      { $match: { _id: new Types.ObjectId(projectId) } },
      {
        $lookup: {
          from: "notes",
          let: { projectId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$onId", "$$projectId"] },
                    { $eq: ["$onModel", "Project"] },
                  ],
                },
              },
            },
            {
              $sort: { createdAt: -1 },
            },
          ],
          as: "notes",
        },
      },
      {
        $project: {
          notes: 1,
          _id: 0,
        },
      },
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { projectId, operation: 'notes' },
      { prefix: 'project', suffix: 'notes' }
    );

    const aggregationOptions: AggregationOptions = {
      useReplica: true,
      useCache: true,
      cacheTTL: 900, // 15 minutes (notes change more frequently)
      cacheKey,
      readPreference: 'secondaryPreferred',
      ...options,
    };

    try {
      const result = await this.aggregationService.executeAggregation<any[]>(
        this.projectModel,
        pipeline,
        aggregationOptions
      );

      const notes = result.data?.[0]?.notes || [];
      
      // Emit event for analytics
      this.eventEmitter.emit('project.notes.accessed', {
        projectId,
        noteCount: notes.length,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return notes;
    } catch (error) {
      this.logger.error(`Error getting notes for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get project with all details (employee, designs, steps, notes, earnings)
   */
  async getProjectWithDetailsOptimized(
    projectId: string,
    options: AggregationOptions = {}
  ): Promise<any> {
    const pipeline = [
      { $match: { _id: new Types.ObjectId(projectId) } },
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
          from: "designs",
          localField: "designs",
          foreignField: "_id",
          as: "designs",
        },
      },
      {
        $lookup: {
          from: "steps",
          localField: "steps",
          foreignField: "_id",
          as: "steps",
        },
      },
      {
        $lookup: {
          from: "notes",
          let: { projectId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$onId", "$$projectId"] },
                    { $eq: ["$onModel", "Project"] },
                  ],
                },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 10 }, // Limit to recent notes for performance
          ],
          as: "notes",
        },
      },
      {
        $lookup: {
          from: "projectearnings",
          localField: "_id",
          foreignField: "project",
          as: "earnings",
        },
      },
      {
        $addFields: {
          employee: { $arrayElemAt: ["$employeeDetails", 0] },
          totalEarnings: { $sum: "$earnings.amount" },
          earningsCount: { $size: "$earnings" },
          designCount: { $size: "$designs" },
          stepCount: { $size: "$steps" },
          noteCount: { $size: "$notes" },
          completedSteps: {
            $size: {
              $filter: {
                input: "$steps",
                cond: { $eq: ["$$this.status", "completed"] },
              },
            },
          },
          progressPercentage: {
            $cond: [
              { $gt: [{ $size: "$steps" }, 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      {
                        $size: {
                          $filter: {
                            input: "$steps",
                            cond: { $eq: ["$$this.status", "completed"] },
                          },
                        },
                      },
                      { $size: "$steps" },
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          employeeDetails: 0,
        },
      },
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { projectId, operation: 'details' },
      { prefix: 'project', suffix: 'details' }
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
        this.projectModel,
        pipeline,
        aggregationOptions
      );

      const projectDetails = result.data?.[0] || null;
      
      // Emit event for analytics
      this.eventEmitter.emit('project.details.accessed', {
        projectId,
        hasEmployee: !!projectDetails?.employee,
        designCount: projectDetails?.designCount || 0,
        stepCount: projectDetails?.stepCount || 0,
        noteCount: projectDetails?.noteCount || 0,
        totalEarnings: projectDetails?.totalEarnings || 0,
        progressPercentage: projectDetails?.progressPercentage || 0,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return projectDetails;
    } catch (error) {
      this.logger.error(`Error getting project details for ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get projects by employee with caching
   */
  async getProjectsByEmployeeOptimized(
    employeeId: string,
    options: AggregationOptions = {}
  ): Promise<Project[]> {
    const pipeline = [
      { $match: { employee: new Types.ObjectId(employeeId) } },
      {
        $lookup: {
          from: "projectearnings",
          localField: "_id",
          foreignField: "project",
          as: "earnings",
        },
      },
      {
        $addFields: {
          totalEarnings: { $sum: "$earnings.amount" },
          earningsCount: { $size: "$earnings" },
        },
      },
      {
        $project: {
          earnings: 0,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { employeeId, operation: 'by_employee' },
      { prefix: 'projects', suffix: 'employee' }
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
      const result = await this.aggregationService.executeAggregation<Project[]>(
        this.projectModel,
        pipeline,
        aggregationOptions
      );

      // Emit event for analytics
      this.eventEmitter.emit('projects.by_employee.accessed', {
        employeeId,
        projectCount: result.data?.length || 0,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return result.data || [];
    } catch (error) {
      this.logger.error(`Error getting projects for employee ${employeeId}:`, error);
      throw error;
    }
  }

  /**
   * Get project statistics with caching
   */
  async getProjectStatsOptimized(options: AggregationOptions = {}): Promise<any> {
    const pipeline = [
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          activeProjects: {
            $sum: {
              $cond: [{ $eq: ["$status", "active"] }, 1, 0],
            },
          },
          completedProjects: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
          pendingProjects: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "projectearnings",
          pipeline: [
            {
              $group: {
                _id: null,
                totalEarnings: { $sum: "$amount" },
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
        },
      },
      {
        $project: {
          _id: 0,
          totalProjects: 1,
          activeProjects: 1,
          completedProjects: 1,
          pendingProjects: 1,
          activePercentage: {
            $multiply: [
              { $divide: ["$activeProjects", "$totalProjects"] },
              100,
            ],
          },
          completionRate: {
            $multiply: [
              { $divide: ["$completedProjects", "$totalProjects"] },
              100,
            ],
          },
          totalEarnings: "$earningsStats.totalEarnings",
          avgEarningsPerProject: "$earningsStats.avgEarnings",
        },
      },
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { operation: 'stats' },
      { prefix: 'projects', suffix: 'stats' }
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
        this.projectModel,
        pipeline,
        aggregationOptions
      );

      const stats = result.data?.[0] || {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        pendingProjects: 0,
        activePercentage: 0,
        completionRate: 0,
        totalEarnings: 0,
        avgEarningsPerProject: 0,
      };

      // Emit event for analytics
      this.eventEmitter.emit('projects.stats.accessed', {
        stats,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return stats;
    } catch (error) {
      this.logger.error('Error getting project statistics:', error);
      throw error;
    }
  }

  /**
   * Get top earning projects with caching
   */
  async getTopEarningProjectsOptimized(
    limit: number = 10,
    options: AggregationOptions = {}
  ): Promise<any[]> {
    const pipeline = [
      {
        $lookup: {
          from: "projectearnings",
          localField: "_id",
          foreignField: "project",
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
        $addFields: {
          employee: { $arrayElemAt: ["$employeeDetails", 0] },
          totalEarnings: { $sum: "$earnings.amount" },
          earningsCount: { $size: "$earnings" },
          avgEarnings: { $avg: "$earnings.amount" },
        },
      },
      {
        $match: {
          totalEarnings: { $gt: 0 },
        },
      },
      {
        $project: {
          earnings: 0,
          employeeDetails: 0,
        },
      },
      {
        $sort: { totalEarnings: -1 },
      },
      {
        $limit: limit,
      },
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { limit, operation: 'top_earning' },
      { prefix: 'projects', suffix: 'top_earning' }
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
        this.projectModel,
        pipeline,
        aggregationOptions
      );

      // Emit event for analytics
      this.eventEmitter.emit('projects.top_earning.accessed', {
        limit,
        resultCount: result.data?.length || 0,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return result.data || [];
    } catch (error) {
      this.logger.error('Error getting top earning projects:', error);
      throw error;
    }
  }

  /**
   * Invalidate project-related cache
   */
  async invalidateProjectCache(projectId?: string): Promise<void> {
    try {
      if (projectId) {
        // Invalidate specific project caches
        const patterns = [
          `project:*:${projectId}:*`,
          `projects:*:employee:*`,
          `projects:*:stats`,
          `projects:*:top_earning`,
        ];

        for (const pattern of patterns) {
          await this.cacheService.clearByPattern(pattern);
        }
      } else {
        // Invalidate all project caches
        await this.cacheService.clearByPattern('project*');
      }

      this.logger.log(`Invalidated project cache${projectId ? ` for ${projectId}` : 's'}`);
    } catch (error) {
      this.logger.error('Error invalidating project cache:', error);
    }
  }

  /**
   * Warm frequently accessed project caches
   */
  async warmProjectCaches(): Promise<void> {
    try {
      this.logger.log('Warming project caches...');

      // Warm project statistics cache
      await this.getProjectStatsOptimized({ warmCache: true });

      // Warm top earning projects cache
      await this.getTopEarningProjectsOptimized(10, { warmCache: true });

      this.logger.log('Project caches warmed successfully');
    } catch (error) {
      this.logger.error('Error warming project caches:', error);
    }
  }

  /**
   * Get performance metrics for project operations
   */
  getPerformanceMetrics(): any {
    return this.aggregationService.getStats();
  }
}
