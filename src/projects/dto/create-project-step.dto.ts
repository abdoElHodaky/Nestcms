import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class CreateProjectStepDto {
  @ApiPropertyOptional()
  readonly content?:string;
  @ApiPropertyOptional()
  readonly status?:string
  @ApiProperty()
  readonly projectId:string;
  @ApiProperty()
  readonly startDate:string;
  @ApiProperty()
  readonly endDate:string;
  
}
