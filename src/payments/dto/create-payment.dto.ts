import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional,IsDate,IsInt } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';

export class CreatePaymentDto {
  
  @IsNotEmpty()
  @IsObjectId()
  @ApiProperty()
  readonly contractId:string;
 /* @ApiProperty()
  readonly clientId:string; */
  @IsNotEmpty()
  @ApiProperty()
  readonly title: string;

  @IsNotEmpty()
  @ApiProperty()
  readonly content: string;

  @IsDate()
  @ApiProperty()
  readonly Date:string

  @IsOptional()
  @ApiPropertyOptional()
  readonly status:string;

  @IsInt()
  @ApiProperty()
  readonly amount:number;
  
  @IsNotEmpty()
  @ApiProperty()
  readonly currency:string;
 
  
}
