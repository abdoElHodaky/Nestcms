import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class LoginUserDto {
  
  @IsNotEmpty()
  @ApiProperty()
  readonly email: string;
  
  @IsNotEmpty()
  @ApiProperty()
  readonly password: string;
}
