import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';

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
  @IsObjectId()
  @ApiProperty()
  readonly onId:string
  
  @IsNotEmpty()
  @ApiProperty()
  readonly onModel:string
  
  @IsOptional()
  @IsObjectId()
  @ApiProperty()
  readonly authorId?:string;
}
