import { Injectable } from '@nestjs/common';
import { Model,Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProjectDto } from '../dto/create-project.dto';
import { ProjectLinkToContractDto } from '../dto/link-contract.dto';
import { CreateProjectStepDto } from '../dto/create-project-step.dto';
import { Project } from '../interface/project';
import { CreateDesignDto } from '../dto/create-design.dto';
import { Design } from '../interface/design';
import { ProjectStep } from "../interface/project-step";
import { UsersService } from "../../users/users.service";
import { ContractService } from "../../contracts/contracts.service";
import { OrgzService} from "../../orgs/orgzs.service"
import { Employee } from "../../users/interfaces/user";
import { Note } from "../../notes/interface/note.interface";
import { ProjectEarning} from "../../earnings/";
import { AggregationBuilder, AggregationUtils } from '../../utils/aggregation';
import { Cache, Monitor } from '../../decorators/cache.decorator';
@Injectable()
export class ProjectService {
  private userService:UsersService
  private contractService:ContractService
  private orgzserv:OrgzService
  constructor(@InjectModel('Project') private readonly projectModel: Model<Project>,
              @InjectModel('Design') private readonly designModel: Model<Design>,
              @InjectModel('ProjectStep') private readonly stepModel: Model<ProjectStep>,
              
             ) {}

 
  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const { employeeId,orgzId,...rest }=createProjectDto
    const employee=await this.userService.find_Id(employeeId)
    const createdProject = new this.projectModel({...rest});
    createdProject.employee=employee
    if(orgzId!=null) createdProject.orgz=await this.orgzserv.find_Id(orgzId)
    return await createdProject.save();
  }

  async addDesign(id:string,createDesignDto:CreateDesignDto):Promise<Project>{
    
    const project=await this.projectModel.findById(id).exec()
    const design =new this.designModel({...createDesignDto});
    design.project=project
   // await design.save()
    project.designs.push(design)
    return await project.save()
    
  }
  async addStep(id:string,createProjectStepDto:CreateProjectStepDto):Promise<Project>{
    
    const project=await this.projectModel.findById(id).exec()
    const step= new this.stepModel({...createProjectStepDto})
    project.steps.push(step)
    step.project=project
    //await step.save()
    return await project.save()
  }
  
  async LinkContract(projectLinkToContractDto:ProjectLinkToContractDto):Promise<Project>{
    const {projectId,contractId}=projectLinkToContractDto
    const project=await this.projectModel.findById(projectId)
    const contract=await this.contractService.find_Id(contractId)
    project.contract=contract
    return await project.save()
  }
  @Cache({ ttl: 5 * 60 * 1000 }) // Cache for 5 minutes
  @Monitor({ logSlowQueries: true, threshold: 500 })
  async designs(projectId: string): Promise<Design[]> {
    try {
      const result = await AggregationBuilder.create()
        .match({ _id: new Types.ObjectId(projectId) })
        .lookup({
          from: 'designs',
          localField: 'designs',
          foreignField: '_id',
          as: 'designs'
        })
        .project({
          designs: 1,
          _id: 0
        })
        .hint({ _id: 1 })
        .comment('ProjectService.designs - Get project designs')
        .execute(this.projectModel);

      return result.length > 0 ? result[0].designs : [];
    } catch (error) {
      console.error('Error in designs:', error);
      throw new Error(`Failed to fetch designs for project ${projectId}: ${error.message}`);
    }
  }
  @Cache({ ttl: 5 * 60 * 1000 }) // Cache for 5 minutes
  @Monitor({ logSlowQueries: true, threshold: 500 })
  async steps(projectId: string): Promise<ProjectStep[]> {
    try {
      const result = await AggregationBuilder.create()
        .match({ _id: new Types.ObjectId(projectId) })
        .lookup({
          from: 'steps',
          localField: 'steps',
          foreignField: '_id',
          as: 'steps'
        })
        .project({
          steps: 1,
          _id: 0
        })
        .hint({ _id: 1 })
        .comment('ProjectService.steps - Get project steps')
        .execute(this.projectModel);

      return result.length > 0 ? result[0].steps : [];
    } catch (error) {
      console.error('Error in steps:', error);
      throw new Error(`Failed to fetch steps for project ${projectId}: ${error.message}`);
    }
  }
  @Cache({ ttl: 3 * 60 * 1000 }) // Cache for 3 minutes
  @Monitor({ logSlowQueries: true, threshold: 800 })
  async notes(projectId: string): Promise<Note[]> {
    try {
      const result = await AggregationBuilder.create()
        .match({ _id: new Types.ObjectId(projectId) })
        .lookup({
          from: 'notes',
          let: { projectId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$onId', '$$projectId'] },
                    { $eq: ['$onModel', 'Project'] }
                  ]
                }
              }
            },
            {
              $sort: { createdAt: -1 }
            }
          ],
          as: 'notes'
        })
        .project({
          notes: 1,
          _id: 0
        })
        .hint({ _id: 1 })
        .comment('ProjectService.notes - Get project notes with complex lookup')
        .execute(this.projectModel);

      return result.length > 0 ? result[0].notes : [];
    } catch (error) {
      console.error('Error in notes:', error);
      throw new Error(`Failed to fetch notes for project ${projectId}: ${error.message}`);
    }
  }
  async employees(projectId:string):Promise<Employee>{
    const project = await this.projectModel.findById(projectId).exec()
    return await this.userService.find_Id(project.employee?._id?.toString())
  }
  async find_Id(projectId:string):Promise<Project>{
    return await this.projectModel.findById(projectId)
  }

  async earnings(projectId:string): Promise<ProjectEarning[]> {
    const project=await this.projectModel.findById(projectId)
    return project.earnings
  }

  /**
   * Get project statistics with optimized aggregation
   */
  @Cache({ ttl: 15 * 60 * 1000 }) // Cache for 15 minutes
  @Monitor({ logSlowQueries: true, threshold: 1000 })
  async getProjectStatistics(dateRange?: { from: Date; to: Date }): Promise<any> {
    try {
      return await AggregationUtils.buildProjectStatistics(dateRange)
        .allowDiskUse(true)
        .maxTime(30000) // 30 seconds timeout
        .comment('ProjectService.getProjectStatistics - Project analytics')
        .execute(this.projectModel);
    } catch (error) {
      console.error('Error in getProjectStatistics:', error);
      throw new Error(`Failed to fetch project statistics: ${error.message}`);
    }
  }

  /**
   * Get projects with full details using optimized aggregation
   */
  @Cache({ ttl: 10 * 60 * 1000 }) // Cache for 10 minutes
  @Monitor({ logSlowQueries: true, threshold: 1500 })
  async getProjectsWithDetails(
    filters: any = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ projects: any[]; total: number }> {
    try {
      const result = await AggregationBuilder.create()
        .match(filters)
        .facet({
          projects: [
            ...AggregationUtils.createPaginationStages(page, limit),
            AggregationUtils.createUserLookup('employee', 'employeeDetails', { 
              name: 1, 
              email: 1, 
              employeeType: 1 
            }),
            AggregationUtils.createContractLookup('contract', 'contractDetails'),
            {
              $lookup: {
                from: 'orgzs',
                localField: 'orgz',
                foreignField: '_id',
                as: 'orgzDetails'
              }
            },
            {
              $addFields: {
                employeeDetails: { $arrayElemAt: ['$employeeDetails', 0] },
                contractDetails: { $arrayElemAt: ['$contractDetails', 0] },
                orgzDetails: { $arrayElemAt: ['$orgzDetails', 0] },
                designsCount: { $size: { $ifNull: ['$designs', []] } },
                stepsCount: { $size: { $ifNull: ['$steps', []] } },
                earningsCount: { $size: { $ifNull: ['$earnings', []] } }
              }
            },
            {
              $project: {
                title: 1,
                description: 1,
                status: 1,
                createdAt: 1,
                updatedAt: 1,
                employeeDetails: 1,
                contractDetails: 1,
                orgzDetails: 1,
                designsCount: 1,
                stepsCount: 1,
                earningsCount: 1
              }
            }
          ],
          totalCount: [
            { $match: filters },
            { $count: 'count' }
          ]
        })
        .comment('ProjectService.getProjectsWithDetails - Comprehensive project data')
        .execute(this.projectModel);

      const projects = result[0]?.projects || [];
      const total = result[0]?.totalCount[0]?.count || 0;

      return { projects, total };
    } catch (error) {
      console.error('Error in getProjectsWithDetails:', error);
      throw new Error(`Failed to fetch projects with details: ${error.message}`);
    }
  }

  /**
   * Get project activity timeline
   */
  @Cache({ ttl: 5 * 60 * 1000 }) // Cache for 5 minutes
  @Monitor({ logSlowQueries: true, threshold: 800 })
  async getProjectActivity(projectId: string, limit: number = 20): Promise<any[]> {
    try {
      return await AggregationUtils.buildActivityTimeline('project', projectId, limit)
        .comment('ProjectService.getProjectActivity - Project activity timeline')
        .execute(this.projectModel);
    } catch (error) {
      console.error('Error in getProjectActivity:', error);
      throw new Error(`Failed to fetch project activity: ${error.message}`);
    }
  }

  /**
   * Search projects with optimized text search
   */
  @Cache({ ttl: 2 * 60 * 1000 }) // Cache for 2 minutes
  @Monitor({ logSlowQueries: true, threshold: 1000 })
  async searchProjects(
    searchTerm: string,
    filters: any = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ projects: any[]; total: number }> {
    try {
      const searchMatch = AggregationUtils.createTextSearchMatch(searchTerm, [
        'title',
        'description'
      ]);

      const combinedMatch = { ...filters, ...searchMatch };

      const result = await AggregationBuilder.create()
        .match(combinedMatch)
        .facet({
          projects: [
            ...AggregationUtils.createPaginationStages(page, limit),
            AggregationUtils.createUserLookup('employee', 'employeeDetails', { 
              name: 1, 
              email: 1 
            }),
            {
              $addFields: {
                employeeDetails: { $arrayElemAt: ['$employeeDetails', 0] },
                relevanceScore: {
                  $add: [
                    { $cond: [{ $regexMatch: { input: '$title', regex: searchTerm, options: 'i' } }, 2, 0] },
                    { $cond: [{ $regexMatch: { input: '$description', regex: searchTerm, options: 'i' } }, 1, 0] }
                  ]
                }
              }
            },
            {
              $sort: { relevanceScore: -1, createdAt: -1 }
            },
            {
              $project: {
                title: 1,
                description: 1,
                status: 1,
                createdAt: 1,
                employeeDetails: 1,
                relevanceScore: 1
              }
            }
          ],
          totalCount: [
            { $match: combinedMatch },
            { $count: 'count' }
          ]
        })
        .comment('ProjectService.searchProjects - Text search with relevance scoring')
        .execute(this.projectModel);

      const projects = result[0]?.projects || [];
      const total = result[0]?.totalCount[0]?.count || 0;

      return { projects, total };
    } catch (error) {
      console.error('Error in searchProjects:', error);
      throw new Error(`Failed to search projects: ${error.message}`);
    }
  }
  
}
