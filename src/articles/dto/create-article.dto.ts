import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class CreateArticleDto {
  
  @ApiProperty()
  @IsNotEmpty()
  readonly title: string;
  @ApiProperty()
  @IsNotEmpty()
  readonly content: string;
  //readonly author?: string;
  
 // readonly creationDate?: string;
}
