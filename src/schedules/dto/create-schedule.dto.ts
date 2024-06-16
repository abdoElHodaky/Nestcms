import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';


export class CreateScheduleDto {
   @IsNotEmpty()
   @ApiProperty()
  readonly title: string;
   
   @IsNotEmpty()
   @ApiProperty()
  readonly content: string;
   
   @IsNotEmpty()
   @ApiProperty()
   readonly startDate: string;
   
   @IsNotEmpty()
   @ApiProperty()
   readonly endDate:string;
   
   @IsOptional()
   @ApiPropertyOptional()
   readonly employeeId?:string;
   
   @IsOptional()
   @ApiPropertyOptional()
   readonly clientId?:string
}
