import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateContractDto {
  
  @ApiProperty()
  @IsNotEmpty()
  readonly title: string;
  
  @ApiProperty()
  @IsNotEmpty()
  readonly content: string;
  @IsOptional()
  @ApiPropertyOptional()
  readonly author: string;
  @IsNotEmpty()
  @ApiProperty()
  readonly startDate: string;
  
  @IsNotEmpty()
  @ApiProperty()
  readonly endDate:string;
  
  @IsOptional()
  @ApiProperty()
  readonly status:string;
  
  @IsNotEmpty()
  @ApiPropertyOptional()
  readonly path?:string
  
  @IsNotEmpty()
  @ApiPropertyOptional()
  readonly employeeId?:string;
  @IsOptional()
  @ApiPropertyOptional()
  readonly clientId?:string;
  
  @IsNotEmpty()
  @ApiPropertyOptional()
  readonly offerId?:string

}
