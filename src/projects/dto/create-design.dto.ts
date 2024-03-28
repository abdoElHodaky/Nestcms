import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class CreateDesignDto {
  @ApiPropertyOptional()
  readonly desc:string;
  @ApiProperty()
  readonly path:string;
}
