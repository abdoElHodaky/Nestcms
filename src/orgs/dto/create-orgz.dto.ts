import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateOrgzDto {
  
  @IsNotEmpty()
  @ApiProperty()
  readonly title: string;
  
  @IsNotEmpty()
  @ApiProperty()
  readonly description: string;
  
  @ApiPropertyOptional()
  readonly status:string;
  @ApiPropertyOptional()
  readonly ownerId:string;
  
  @IsNotEmpty()
  @ApiProperty()
  readonly address:{
    city:string,
    street:string,
    postalCode:string,
    country:string
  }
}
