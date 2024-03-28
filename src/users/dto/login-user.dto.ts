import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class LoginUserDto {
  @ApiProperty({
    
    description: 'This is a required property',
  })
  readonly email: string;
  @ApiProperty({
    
    description: 'This is a required property',
  })
  readonly password: string;
}
