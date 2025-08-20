import { Injectable } from '@nestjs/common';
import { Model,Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto,  CreateClientDto, CreateEmployeeDto  } from './dto/';
import { User } from './interfaces/user';
import { AggregationBuilder, AggregationUtils } from '../utils/aggregation';
import { Cache, Monitor } from '../decorators/cache.decorator';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async create(userType:string,createUserDto: CreateUserDto): Promise<User> {
   // let cudto=createUserDto
    let createdUser;
    switch (userType){
      case "Employee":
        let cemdto:CreateEmployeeDto=createUserDto
         cemdto.isEmployee=true
         cemdto.employeeType=createUserDto.employeeType
         createdUser=new this.userModel({...cemdto})
        
        break;
      case "Client":
        let cudto:CreateClientDto=createUserDto;
        cudto.isEmployee=false
        cudto.employeeType=""
        createdUser=new this.userModel({...cudto})
        break;
      default:
        break
    }
    //const createdUser = new this.userModel(cutdo);
    return await createdUser.save();
  }

  async findOne(email: string): Promise<User> {
    return await this.userModel.findOne({ email }, '-__v').exec();
  }

  async find_Id(_id: string): Promise<User> {
    let user=await this.userModel.findById(_id).exec();
     return user 

  }

  async findMany_Id(_ids:string[]):Promise<User[]>{
    let users=await this.userModel.find().where('_id').in(_ids).exec()
    return users
  }
  @Cache({ ttl: 15 * 60 * 1000 }) // Cache for 15 minutes (permissions don't change often)
  @Monitor({ logSlowQueries: true, threshold: 500 })
  async my_Permissions(_id: string): Promise<any> {
    try {
      const result = await AggregationBuilder.create()
        .match({ _id: new Types.ObjectId(_id) })
        .lookup({
          from: 'permissions',
          localField: 'permissions',
          foreignField: 'for',
          as: 'permissions_have'
        })
        .project({
          name: 1,
          email: 1,
          isEmployee: 1,
          employeeType: 1,
          permissions_have: 1
        })
        .hint({ _id: 1 })
        .comment('UsersService.my_Permissions - Get user permissions')
        .execute(this.userModel);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error in my_Permissions:', error);
      throw new Error(`Failed to fetch permissions for user ${_id}: ${error.message}`);
    }
  }
  @Cache({ ttl: 5 * 60 * 1000 }) // Cache for 5 minutes
  @Monitor({ logSlowQueries: true, threshold: 800 })
  async my_Projects(uid: string): Promise<any> {
    try {
      const result = await AggregationBuilder.create()
        .match({ _id: new Types.ObjectId(uid) })
        .lookup({
          from: 'projects',
          localField: '_id',
          foreignField: 'employee',
          as: 'projects',
          pipeline: [
            {
              $project: {
                title: 1,
                description: 1,
                status: 1,
                createdAt: 1,
                updatedAt: 1
              }
            },
            {
              $sort: { createdAt: -1 }
            }
          ]
        })
        .project({
          name: 1,
          email: 1,
          isEmployee: 1,
          employeeType: 1,
          projects: 1,
          projectsCount: { $size: '$projects' }
        })
        .hint({ _id: 1 })
        .comment('UsersService.my_Projects - Get user projects with details')
        .execute(this.userModel);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error in my_Projects:', error);
      throw new Error(`Failed to fetch projects for user ${uid}: ${error.message}`);
    }
  }

  /**
   * Get user statistics with optimized aggregation
   */
  @Cache({ ttl: 20 * 60 * 1000 }) // Cache for 20 minutes
  @Monitor({ logSlowQueries: true, threshold: 1000 })
  async getUserStatistics(dateRange?: { from: Date; to: Date }): Promise<any> {
    try {
      return await AggregationUtils.buildUserStatistics(dateRange)
        .allowDiskUse(true)
        .maxTime(30000) // 30 seconds timeout
        .comment('UsersService.getUserStatistics - User analytics')
        .execute(this.userModel);
    } catch (error) {
      console.error('Error in getUserStatistics:', error);
      throw new Error(`Failed to fetch user statistics: ${error.message}`);
    }
  }

  /**
   * Get top performing employees
   */
  @Cache({ ttl: 15 * 60 * 1000 }) // Cache for 15 minutes
  @Monitor({ logSlowQueries: true, threshold: 1500 })
  async getTopPerformers(limit: number = 10): Promise<any[]> {
    try {
      return await AggregationUtils.buildTopPerformersAnalysis(limit)
        .allowDiskUse(true)
        .maxTime(25000) // 25 seconds timeout
        .comment('UsersService.getTopPerformers - Top employee performers')
        .execute(this.userModel);
    } catch (error) {
      console.error('Error in getTopPerformers:', error);
      throw new Error(`Failed to fetch top performers: ${error.message}`);
    }
  }

  /**
   * Search users with optimized text search
   */
  @Cache({ ttl: 3 * 60 * 1000 }) // Cache for 3 minutes
  @Monitor({ logSlowQueries: true, threshold: 800 })
  async searchUsers(
    searchTerm: string,
    userType?: 'employee' | 'client',
    page: number = 1,
    limit: number = 10
  ): Promise<{ users: any[]; total: number }> {
    try {
      const searchMatch = AggregationUtils.createTextSearchMatch(searchTerm, [
        'name',
        'email',
        'employeeType'
      ]);

      let filters: any = { ...searchMatch };
      if (userType === 'employee') {
        filters.isEmployee = true;
      } else if (userType === 'client') {
        filters.isEmployee = false;
      }

      const result = await AggregationBuilder.create()
        .match(filters)
        .facet({
          users: [
            ...AggregationUtils.createPaginationStages(page, limit),
            {
              $lookup: {
                from: 'projects',
                localField: '_id',
                foreignField: 'employee',
                as: 'projects'
              }
            },
            {
              $lookup: {
                from: 'contracts',
                localField: '_id',
                foreignField: 'employee',
                as: 'employeeContracts'
              }
            },
            {
              $lookup: {
                from: 'contracts',
                localField: '_id',
                foreignField: 'client',
                as: 'clientContracts'
              }
            },
            {
              $addFields: {
                projectsCount: { $size: '$projects' },
                employeeContractsCount: { $size: '$employeeContracts' },
                clientContractsCount: { $size: '$clientContracts' },
                relevanceScore: {
                  $add: [
                    { $cond: [{ $regexMatch: { input: '$name', regex: searchTerm, options: 'i' } }, 3, 0] },
                    { $cond: [{ $regexMatch: { input: '$email', regex: searchTerm, options: 'i' } }, 2, 0] },
                    { $cond: [{ $regexMatch: { input: '$employeeType', regex: searchTerm, options: 'i' } }, 1, 0] }
                  ]
                }
              }
            },
            {
              $sort: { relevanceScore: -1, createdAt: -1 }
            },
            {
              $project: {
                name: 1,
                email: 1,
                isEmployee: 1,
                employeeType: 1,
                createdAt: 1,
                projectsCount: 1,
                employeeContractsCount: 1,
                clientContractsCount: 1,
                relevanceScore: 1
              }
            }
          ],
          totalCount: [
            { $match: filters },
            { $count: 'count' }
          ]
        })
        .comment('UsersService.searchUsers - Text search with relevance scoring')
        .execute(this.userModel);

      const users = result[0]?.users || [];
      const total = result[0]?.totalCount[0]?.count || 0;

      return { users, total };
    } catch (error) {
      console.error('Error in searchUsers:', error);
      throw new Error(`Failed to search users: ${error.message}`);
    }
  }

  /**
   * Get user activity timeline
   */
  @Cache({ ttl: 5 * 60 * 1000 }) // Cache for 5 minutes
  @Monitor({ logSlowQueries: true, threshold: 800 })
  async getUserActivity(userId: string, limit: number = 20): Promise<any[]> {
    try {
      return await AggregationUtils.buildActivityTimeline('user', userId, limit)
        .comment('UsersService.getUserActivity - User activity timeline')
        .execute(this.userModel);
    } catch (error) {
      console.error('Error in getUserActivity:', error);
      throw new Error(`Failed to fetch user activity: ${error.message}`);
    }
  }

  /**
   * Get users with comprehensive details
   */
  @Cache({ ttl: 10 * 60 * 1000 }) // Cache for 10 minutes
  @Monitor({ logSlowQueries: true, threshold: 1200 })
  async getUsersWithDetails(
    filters: any = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ users: any[]; total: number }> {
    try {
      const result = await AggregationBuilder.create()
        .match(filters)
        .facet({
          users: [
            ...AggregationUtils.createPaginationStages(page, limit),
            {
              $lookup: {
                from: 'projects',
                localField: '_id',
                foreignField: 'employee',
                as: 'projects',
                pipeline: [
                  { $project: { title: 1, status: 1, createdAt: 1 } },
                  { $sort: { createdAt: -1 } },
                  { $limit: 5 } // Only get latest 5 projects
                ]
              }
            },
            {
              $lookup: {
                from: 'contracts',
                localField: '_id',
                foreignField: 'employee',
                as: 'employeeContracts'
              }
            },
            {
              $lookup: {
                from: 'contracts',
                localField: '_id',
                foreignField: 'client',
                as: 'clientContracts'
              }
            },
            {
              $lookup: {
                from: 'permissions',
                localField: 'permissions',
                foreignField: 'for',
                as: 'userPermissions'
              }
            },
            {
              $addFields: {
                projectsCount: { $size: '$projects' },
                employeeContractsCount: { $size: '$employeeContracts' },
                clientContractsCount: { $size: '$clientContracts' },
                permissionsCount: { $size: '$userPermissions' },
                lastProjectDate: { $max: '$projects.createdAt' },
                totalContracts: {
                  $add: ['$employeeContractsCount', '$clientContractsCount']
                }
              }
            },
            {
              $project: {
                name: 1,
                email: 1,
                isEmployee: 1,
                employeeType: 1,
                createdAt: 1,
                updatedAt: 1,
                projects: 1,
                projectsCount: 1,
                employeeContractsCount: 1,
                clientContractsCount: 1,
                totalContracts: 1,
                permissionsCount: 1,
                lastProjectDate: 1
              }
            }
          ],
          totalCount: [
            { $match: filters },
            { $count: 'count' }
          ]
        })
        .comment('UsersService.getUsersWithDetails - Comprehensive user data')
        .execute(this.userModel);

      const users = result[0]?.users || [];
      const total = result[0]?.totalCount[0]?.count || 0;

      return { users, total };
    } catch (error) {
      console.error('Error in getUsersWithDetails:', error);
      throw new Error(`Failed to fetch users with details: ${error.message}`);
    }
  }

}
