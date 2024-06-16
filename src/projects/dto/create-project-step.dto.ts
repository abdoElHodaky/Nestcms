import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';


export class CreateProjectStepDto {
  
  @IsOptional()
  @ApiPropertyOptional()
  readonly content?:string;
  
  @IsOptional()
  @ApiPropertyOptional()
  readonly status?:string
  
  @IsNotEmpty()
  @IsObjectId()
  @ApiProperty()
  readonly projectId:string;
  
  @IsNotEmpty()
  @ApiProperty()
  readonly startDate:string;
  
  @IsNotEmpty()
  @ApiProperty()
  readonly endDate:string;
  
}
