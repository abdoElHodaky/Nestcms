import { Controller, Post, Body ,Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ApiTags , ApiOperation } from "@nestjs/swagger";
@ApiTags("Auth")
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  
  @ApiOperation({description:"login of specific user"})
  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }
  
  @ApiOperation({description:"register of specific type of user"})
  @Post('register/:userType')
  async register(@Param("userType") userType:string, @Body() createUserDto: CreateUserDto) {
    return this.authService.register(userType,createUserDto);
  }
}
