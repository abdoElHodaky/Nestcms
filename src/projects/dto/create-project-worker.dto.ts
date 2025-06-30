import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';
import {CreateEmployeeDto} from "../../users/dto"
export class CreateProjectWorkerDto extends PartialType(CreateEmployeeDto) {
  
  @IsNotEmpty()
  @IsObjectId()
  @ApiProperty()
  readonly projectId:string;
  
  
}
