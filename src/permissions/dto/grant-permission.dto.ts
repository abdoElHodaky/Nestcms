import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GrantPermissionDto {
   @ApiProperty()
  readonly type: string;
   @ApiProperty()
  readonly status: string;
   @ApiProperty()
  readonly endDate:string;
   @ApiPropertyOptional()
  readonly granted_by?:{};
   @ApiPropertyOptional()
  readonly granted_for?:{};
   @ApiPropertyOptional()
   readonly on?:{}
}
