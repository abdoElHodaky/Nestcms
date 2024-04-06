import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RevokePermissionDto {
   
   @ApiProperty()
   readonly permissionId:string
   
   @ApiProperty()
  readonly type: string;
   
   @ApiProperty()
  readonly status: string="revoked";
  /* @ApiProperty()
  readonly endDate:string;
   @ApiPropertyOptional()
  readonly _by?:{};
   @ApiPropertyOptional()
  readonly _for?:{};
   @ApiPropertyOptional()
   readonly on?:{} */
}
