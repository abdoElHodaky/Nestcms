import { Injectable } from '@nestjs/common';
import { Model ,Types} from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AddEarningDto } from './dto/add-earning.dto';
import { CompoundEarningDto } from './dto/compound-earning.dto';

import {Earning, ProjectEarning,OrgzEarning} from './interface/earning';
import { ProjectService} from "../projects/"
import { OrgzService} from "../orgs/orgzs.service"
import { AggregationBuilder, AggregationUtils } from '../utils/aggregation';
import { Cache, Monitor } from '../decorators/cache.decorator';
@Injectable()
export class EarningService {
   model(type:string):any{
    if (type=="project") return this.pearnModel
    if (type=="orgz") return this.orgsearnModel
  }
  constructor(
    @InjectModel('ProjectEarning') private readonly pearnModel: Model<ProjectEarning>,
    @InjectModel('OrgzEarning') private readonly orgsearnModel: Model<OrgzEarning>
  ) {}
  private projectService:ProjectService
  private orgzService:OrgzService
 
  async add(addEarningDto: AddEarningDto): Promise<Earning> {
    const {forType,addToId,...rest}=addEarningDto
    if (forType=="project")
    { const createdNote = new this.pearnModel({...rest});
      createdNote.project=await this.projectService.find_Id(addToId)
    return await createdNote.save(); }
   if (forType=="orgz"){
      const createdOrgEarn=new this.orgsearnModel({...rest})
      createdOrgEarn.orgz=await this.orgzService.find_Id(addToId)
      return  await createdOrgEarn.save()
   }
     
  }
   
  async collect_orgz_earn(opts:{orgzid:string,type:string,id:string|Types.ObjectId}):Promise<any>{
     const model=this.orgsearnModel
     return await  model.findByIdAndUpdate(opts.orgzid,{
        $push:{earningIds:{type:opts.type,id:opts.id}}
     },{new:true}).exec()
  }

   @Monitor({ logSlowQueries: true, threshold: 2000 })
   async compound_earnings(compoundEarning: CompoundEarningDto): Promise<any> {
     try {
       const { type, Id } = compoundEarning;
       const _model = this.model;
       const earning = await _model(type).findById(Id).exec();
       
       if (!earning || !earning.earningIds) {
         throw new Error(`Earning with ID ${Id} not found or has no earning IDs`);
       }

       const { earningIds } = earning;
       
       // Process earnings in parallel with optimized aggregation
       const earningsPromises = earningIds.map(async (ob: any) => {
         const model = _model(ob.type);
         const fieldName = `total_earn_${ob.type}`;
         
         const result = await AggregationBuilder.create()
           .match({
             _id: { $in: ob.earningIds.map((id: string) => new Types.ObjectId(id)) }
           })
           .group({
             _id: '$currency',
             totalAmount: { $sum: '$amount' },
             totalPeriod: { $sum: '$period' },
             count: { $sum: 1 }
           })
           .project({
             currency: '$_id',
             totalAmount: 1,
             totalPeriod: 1,
             count: 1,
             title: {
               $concat: [fieldName, ' for ', { $toString: '$totalPeriod' }, ' months']
             },
             _id: 0
           })
           .comment(`EarningService.compound_earnings - ${ob.type} aggregation`)
           .execute(model);

         return {
           forType: ob.type,
           earnings: result
         };
       });

       const results = await Promise.all(earningsPromises);
       
       // Create compound earnings records
       const createPromises = results.map(async (result) => {
         if (result.earnings.length > 0) {
           return await _model(result.forType).create(result.earnings);
         }
         return null;
       });

       await Promise.all(createPromises);
       
       return results.filter(r => r.earnings.length > 0);
     } catch (error) {
       console.error('Error in compound_earnings:', error);
       throw new Error(`Failed to compound earnings: ${error.message}`);
     }
   }

   
  async find_Id(_id:string,type:string):Promise<Earning>{
   
     return await this.model(type).findById(_id).exec()
   }

   /**
    * Get earnings statistics with optimized aggregation
    */
   @Cache({ ttl: 10 * 60 * 1000 }) // Cache for 10 minutes
   @Monitor({ logSlowQueries: true, threshold: 1000 })
   async getEarningsStatistics(
     type: 'project' | 'orgz',
     dateRange?: { from: Date; to: Date }
   ): Promise<any> {
     try {
       return await AggregationUtils.buildEarningsAnalysis(type, dateRange)
         .allowDiskUse(true)
         .maxTime(20000) // 20 seconds timeout
         .comment(`EarningService.getEarningsStatistics - ${type} earnings analysis`)
         .execute(this.model(type));
     } catch (error) {
       console.error('Error in getEarningsStatistics:', error);
       throw new Error(`Failed to fetch ${type} earnings statistics: ${error.message}`);
     }
   }

   /**
    * Get top earning projects or organizations
    */
   @Cache({ ttl: 15 * 60 * 1000 }) // Cache for 15 minutes
   @Monitor({ logSlowQueries: true, threshold: 1500 })
   async getTopEarners(
     type: 'project' | 'orgz',
     limit: number = 10,
     dateRange?: { from: Date; to: Date }
   ): Promise<any[]> {
     try {
       const builder = AggregationBuilder.create();
       
       if (dateRange) {
         builder.match(AggregationUtils.createDateRangeMatch('createdAt', dateRange));
       }

       const lookupField = type === 'project' ? 'project' : 'orgz';
       const lookupCollection = type === 'project' ? 'projects' : 'orgzs';

       return await builder
         .group({
           _id: `$${lookupField}`,
           totalEarnings: { $sum: '$amount' },
           averageEarning: { $avg: '$amount' },
           earningsCount: { $sum: 1 },
           totalPeriod: { $sum: '$period' },
           currencies: { $addToSet: '$currency' }
         })
         .lookup({
           from: lookupCollection,
           localField: '_id',
           foreignField: '_id',
           as: 'details'
         })
         .addFields({
           details: { $arrayElemAt: ['$details', 0] }
         })
         .sort({ totalEarnings: -1 })
         .limit(limit)
         .project({
           _id: 0,
           entityId: '$_id',
           entityName: '$details.name',
           entityTitle: '$details.title',
           totalEarnings: 1,
           averageEarning: { $round: ['$averageEarning', 2] },
           earningsCount: 1,
           totalPeriod: 1,
           currencies: 1
         })
         .comment(`EarningService.getTopEarners - Top ${type} earners`)
         .execute(this.model(type));
     } catch (error) {
       console.error('Error in getTopEarners:', error);
       throw new Error(`Failed to fetch top ${type} earners: ${error.message}`);
     }
   }

   /**
    * Get earnings trend over time
    */
   @Cache({ ttl: 20 * 60 * 1000 }) // Cache for 20 minutes
   @Monitor({ logSlowQueries: true, threshold: 2000 })
   async getEarningsTrend(
     type: 'project' | 'orgz',
     groupBy: 'day' | 'week' | 'month' = 'month',
     dateRange?: { from: Date; to: Date }
   ): Promise<any[]> {
     try {
       const builder = AggregationBuilder.create();
       
       if (dateRange) {
         builder.match(AggregationUtils.createDateRangeMatch('createdAt', dateRange));
       }

       // Define date grouping based on groupBy parameter
       let dateGroup: any;
       switch (groupBy) {
         case 'day':
           dateGroup = {
             year: { $year: '$createdAt' },
             month: { $month: '$createdAt' },
             day: { $dayOfMonth: '$createdAt' }
           };
           break;
         case 'week':
           dateGroup = {
             year: { $year: '$createdAt' },
             week: { $week: '$createdAt' }
           };
           break;
         case 'month':
         default:
           dateGroup = {
             year: { $year: '$createdAt' },
             month: { $month: '$createdAt' }
           };
           break;
       }

       return await builder
         .group({
           _id: dateGroup,
           totalEarnings: { $sum: '$amount' },
           averageEarning: { $avg: '$amount' },
           earningsCount: { $sum: 1 },
           uniqueCurrencies: { $addToSet: '$currency' }
         })
         .sort({ '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 })
         .project({
           _id: 0,
           period: '$_id',
           totalEarnings: 1,
           averageEarning: { $round: ['$averageEarning', 2] },
           earningsCount: 1,
           uniqueCurrencies: 1,
           periodLabel: {
             $switch: {
               branches: [
                 {
                   case: { $eq: [groupBy, 'day'] },
                   then: {
                     $concat: [
                       { $toString: '$_id.year' }, '-',
                       { $toString: '$_id.month' }, '-',
                       { $toString: '$_id.day' }
                     ]
                   }
                 },
                 {
                   case: { $eq: [groupBy, 'week'] },
                   then: {
                     $concat: [
                       { $toString: '$_id.year' }, '-W',
                       { $toString: '$_id.week' }
                     ]
                   }
                 }
               ],
               default: {
                 $concat: [
                   { $toString: '$_id.year' }, '-',
                   { $toString: '$_id.month' }
                 ]
               }
             }
           }
         })
         .comment(`EarningService.getEarningsTrend - ${type} earnings trend by ${groupBy}`)
         .execute(this.model(type));
     } catch (error) {
       console.error('Error in getEarningsTrend:', error);
       throw new Error(`Failed to fetch ${type} earnings trend: ${error.message}`);
     }
   }
  
}
