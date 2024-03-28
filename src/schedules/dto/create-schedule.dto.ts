import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class CreateScheduleDto {
   @ApiProperty()
  readonly title: string;
   @ApiProperty()
  readonly content: string;
   @ApiProperty()
  readonly startDate: string;
   @ApiProperty()
  readonly endDate:string;
   @ApiPropertyOptial()
  readonly employeeId?:string;
   @ApiPropertyOptial()
  readonly clientId?:string
}
