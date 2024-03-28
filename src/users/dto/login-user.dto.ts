import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class LoginUserDto {
  @ApiProperty({
    type: String,
    description: 'This is a required property',
  })
  readonly email: string;
  @ApiProperty({
    type: String,
    description: 'This is a required property',
  })
  readonly password: string;
}
