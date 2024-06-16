import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateNoteDto {
  
  @IsNotEmpty()
  @ApiProperty()
  readonly title: string;
  
  @IsNotEmpty()
  @ApiProperty()
  readonly content: string;
  
  @IsOptional()
  @ApiPropertyOptional()
  readonly status:string;
  
  @IsNotEmpty()
  @ApiProperty()
  readonly onId:string
  @IsNotEmpty()
  @ApiProperty()
  readonly onModel:string
  
  @IsOptional()
  @ApiProperty()
  readonly authorId?:string;
}
