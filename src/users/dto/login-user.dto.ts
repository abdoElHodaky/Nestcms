import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class LoginUserDto {
  @ApiProperty({
    
    type:String
  })
  readonly email: string;
  @ApiProperty({
    
    type:String
  })
  readonly password: string;
}
