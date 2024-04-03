import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteDto {
  
  @ApiProperty()
  readonly title: string;
  @ApiProperty()
  readonly content: string;
  @ApiPropertyOptional()
  readonly status:string;
  @ApiProperty()
  readonly onId:string
  @ApiProperty()
  readonly onType:string

}
