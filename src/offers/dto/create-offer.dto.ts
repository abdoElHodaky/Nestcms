import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObjectId } from 'class-validator-mongo-object-id';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateOfferDto {
  
  @ApiProperty()
  @IsNotEmpty()
  readonly title: string;

  @IsNotEmpty()
  @ApiProperty()
  readonly content: string;
  
  @ApiProperty()
  @IsNotEmpty()
  readonly startDate: string;

  @IsNotEmpty()
  @ApiProperty()
  readonly endDate:string;

  @IsOptional()
  @ApiProperty()
  readonly status:string;

  @IsOptional()
  @IsObjectId()
  @ApiPropertyOptional()
  readonly employeeId?:string;
}
