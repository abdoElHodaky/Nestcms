import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteDto {
  
  @ApiProperty()
  readonly title: string;
  @ApiProperty()
  readonly description: string;
  @ApiPropertyOptional()
  readonly status:string;
  @ApiPropertyOptional()
  readonly ownerId:string;
  @ApiProperty()
  readonly address:{
    city:string,
    street:string,
    postalCode:string,
    country:string
  }
}
