import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class CreateScheduleDto {
   @ApiProperty({
    type: String,
    description: 'This is a required property',
  })
  readonly title: string;
   @ApiProperty({
    type: String,
    description: 'This is a required property',
  })
  readonly content: string;
   @ApiProperty({
    type: String,
    description: 'This is a required property',
  })
  readonly startDate: string;
   @ApiProperty({
    type: String,
    description: 'This is a required property',
  })
  readonly endDate:string;
   @ApiPropertyOptial({
    type: String,
    description: 'This is a required property',
  })
  readonly employeeId?:string;
  readonly clientId?:string
}
