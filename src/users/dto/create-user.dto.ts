import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  readonly username:string
  @ApiProperty()
  readonly email: string;
  @ApiProperty()
  readonly password: string;
  @ApiPropertyOptional()
  readonly address?:string
  @ApiPropertyOptional()
  readonly isClient?:boolean
  @ApiPropertyOptional()
  readonly type?:string
}
