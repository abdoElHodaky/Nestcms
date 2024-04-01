import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class CreateProjectScheduleDto {
   @ApiProperty()
  readonly title: string;
   @ApiProperty()
  readonly content: string;
   @ApiProperty()
  readonly startDate: string;
   @ApiProperty()
  readonly endDate:string;
   @ApiPropertyOptional()
  readonly projectId?:string;
   
}
