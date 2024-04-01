import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class CreateProjectStepDto {
  @ApiProperty()
  readonly desc:string;
  @ApiProperty()
  readonly projectId:string;
  @ApiPorperty()
  startDate:string;
  @ApiProperty()
  endDate:string;
  
}
