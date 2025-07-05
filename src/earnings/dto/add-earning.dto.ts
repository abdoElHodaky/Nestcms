import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
//import { IsObjectId } from 'class-validator-mongo-object-id';

export class AddEarningDto {
  
  @IsNotEmpty()
  @ApiProperty()
  readonly title: string;
  
  @IsNotEmpty()
  @ApiProperty()
  readonly amount: number;
  
  @IsOptional()
  @ApiPropertyOptional()
  readonly status:string;
  
  @IsNotEmpty()
  @IsObjectId()
  @ApiProperty()
  readonly forType:string
  
  
  @IsOptional()
  @ApiProperty()
  readonly announced_date:string;

  @IsNotEmpty()
  @ApiProperty()
  readonly announced_periodically:string
}
