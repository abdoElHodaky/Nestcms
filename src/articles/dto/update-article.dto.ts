import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateArticleDto {
  @ApiProperty()
  @IsNotEmpty()
  readonly title: string;
  
  @ApiProperty()
  @IsNotEmpty()
  readonly content: string;

}
