import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';


export class CreateProjectScheduleDto {
   @IsNotEmpty()
   @ApiProperty()
   readonly title: string;
   
   @IsOptional()
   @ApiPropertyOptional()
   readonly content: string;

   @IsNotEmpty()
   @ApiProperty()
   readonly startDate: string;

   @IsNotEmpty()
   @ApiProperty()
    readonly endDate:string;

   @IsOptional()
   @ApiProperty()
   readonly projectId?:string;
   
}
