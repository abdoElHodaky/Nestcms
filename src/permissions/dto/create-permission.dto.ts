import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {


  @ApiProperty()
  readonly type: string;
   
   @ApiProperty()
  readonly status: string;
  
   @ApiPropertyOptional()
    readonly _byId?:string;
  
   @ApiPropertyOptional()
    readonly _forId:string;
  
   @ApiProperty()
   readonly onModel?:string

   @ApiProperty()
   readonly onId?:string

}
