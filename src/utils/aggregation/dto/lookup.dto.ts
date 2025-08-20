import { Type } from 'class-transformer';
import { IsString, IsOptional, IsObject, IsBoolean, IsNumber, ValidateNested } from 'class-validator';
import { Types, PipelineStage } from 'mongoose';

/**
 * Base lookup options DTO
 */
export class BaseLookupDto {
  @IsString()
  from: string;

  @IsString()
  localField: string;

  @IsString()
  foreignField: string = '_id';

  @IsString()
  as: string;

  @IsOptional()
  @IsObject()
  pipeline?: PipelineStage[];
}

/**
 * User lookup options DTO
 */
export class UserLookupDto {
  @IsString()
  @IsOptional()
  localField?: string = 'userId';

  @IsString()
  @IsOptional()
  as?: string = 'user';

  @IsOptional()
  @IsObject()
  project?: object;
}

/**
 * Project lookup options DTO
 */
export class ProjectLookupDto {
  @IsString()
  @IsOptional()
  localField?: string = 'projectId';

  @IsString()
  @IsOptional()
  as?: string = 'project';

  @IsBoolean()
  @IsOptional()
  includeDetails?: boolean = false;
}

/**
 * Contract lookup options DTO
 */
export class ContractLookupDto {
  @IsString()
  @IsOptional()
  localField?: string = 'contractId';

  @IsString()
  @IsOptional()
  as?: string = 'contract';
}

/**
 * Conditional lookup options DTO
 */
export class ConditionalLookupDto {
  @IsString()
  from: string;

  @IsString()
  localField: string;

  @IsString()
  foreignField: string = '_id';

  @IsString()
  as: string;

  @IsOptional()
  @IsObject()
  condition?: object;

  @IsOptional()
  @IsObject()
  project?: object;

  @IsOptional()
  @IsObject()
  sort?: object;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

/**
 * Lookup result interface
 */
export interface LookupResult {
  $lookup: {
    from: string;
    localField: string;
    foreignField: string;
    as: string;
    pipeline?: PipelineStage[];
  };
  }
