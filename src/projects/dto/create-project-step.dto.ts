import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';


export class CreateProjectStepDto {
  @IsOptional()
  @ApiPropertyOptional()
  readonly content?:string;
  
  @IsOptional()
  @ApiPropertyOptional()
  readonly status?:string
  
  @IsNotEmpty()
  @ApiProperty()
  readonly projectId:string;
  
  @IsNotEmpty()
  @ApiProperty()
  readonly startDate:string;
  
  @IsNotEmpty()
  @ApiProperty()
  readonly endDate:string;
  
}
