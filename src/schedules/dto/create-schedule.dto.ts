import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class CreateScheduleDto {
   @ApiProperty({
    
    description: 'This is a required property',
  })
  readonly title: string;
   @ApiProperty({
    
    description: 'This is a required property',
  })
  readonly content: string;
   @ApiProperty({
    
    description: 'This is a required property',
  })
  readonly startDate: string;
   @ApiProperty({
    
    description: 'This is a required property',
  })
  readonly endDate:string;
   @ApiPropertyOptial({
    
    description: 'This is a required property',
  })
  readonly employeeId?:string;
   @ApiPropertyOptial({
    
    description: 'This is a required property',
  })
  readonly clientId?:string
}
