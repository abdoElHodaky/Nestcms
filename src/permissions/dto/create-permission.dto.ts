import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty()
  readonly type: string;
   
   @ApiProperty()
  readonly status: string;
  
   @ApiProperty()
  readonly endDate:string;
  
   @ApiPropertyOptional()
  readonly _by?:{};
  
   @ApiPropertyOptional()
  readonly _for?:{};
  
   @ApiPropertyOptional()
   readonly on?:{}

}
