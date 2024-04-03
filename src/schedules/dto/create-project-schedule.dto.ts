import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class CreateProjectScheduleDto {
   @ApiProperty()
  readonly title: string;
   @ApiPropertyOptional()
  readonly content: string;
   @ApiProperty()
  readonly startDate: string;
   @ApiProperty()
  readonly endDate:string;
   @ApiProperty()
  readonly projectId?:string;
   
}
