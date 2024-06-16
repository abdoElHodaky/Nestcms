import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';


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
   @IsObjectId()
   @ApiPropertyOptional()
   readonly employeeId?:string;
   
   @IsOptional()
   @IsObjectId()
   @ApiPropertyOptional()
   readonly clientId?:string
}
