import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class CreateArticleDto {
  readonly title: string;
  readonly content: string;
  readonly author?: string;
  readonly creationDate?: string;
}
