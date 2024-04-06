import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
//import { User,Admin } from "../../users/interfaces/user";
export class CreatePermissionDto {
  @ApiProperty()
  readonly type: string;
   
   @ApiProperty()
  readonly status: string;
  
   @ApiProperty()
  readonly endDate:string;
  
   @ApiPropertyOptional()
    readonly _byId?:string;
  
   @ApiPropertyOptional()
    readonly _forId:string;
  
   @ApiPropertyOptional()
   readonly onType?:string

}
