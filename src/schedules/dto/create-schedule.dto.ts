import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class CreateScheduleDto {
   @ApiProperty({
   type:String
  })
  readonly title: string;
   @ApiProperty({
    type:String
    
  })
  readonly content: string;
   @ApiProperty({
  })type:String
  readonly startDate: string;
   @ApiProperty({
    type:String
  })
  readonly endDate:string;
   @ApiPropertyOptial({
    type:String
  })
  readonly employeeId?:string;
   @ApiPropertyOptial({
    type:String
  })
  readonly clientId?:string
}
