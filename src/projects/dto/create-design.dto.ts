import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';


export class CreateDesignDto {
  
  @IsOptional()
  @ApiPropertyOptional()
  readonly desc:string;
  
  @IsNotEmpty()
  @ApiProperty()
  readonly path:string;
}
