import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class CreateProjectStepDto {
  @ApiPropertyOptional()
  readonly content?:string;
  @ApiPropertyOptional()
  readonly status?:string
  @ApiProperty()
  readonly projectId:string;
  @ApiPorperty()
  startDate:string;
  @ApiProperty()
  endDate:string;
  
}
