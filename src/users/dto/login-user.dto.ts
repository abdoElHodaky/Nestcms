import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class LoginUserDto {
  @ApiProperty()
  readonly email: string;
  @ApiProperty()
  readonly password: string;
}
