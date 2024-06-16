import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';

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
  
  @IsOptional()
  @IsObjectId()
  @ApiPropertyOptional()
  readonly employeeId?:string;


  @IsOptional()
  @IsObjectId()
  @ApiPropertyOptional()
  readonly clientId?:string;
  
  @IsOptional()
  @IsObjectId()
  @ApiPropertyOptional()
  readonly offerId?:string

}
