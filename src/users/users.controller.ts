import { Controller, Get, UseGuards, Post,Body, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiExcludeEndpoint , ApiBearerAuth } from "@nestjs/swagger";

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @ApiExcludeEndpoint()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
  @ApiBearerAuth('JWTAuthorization')
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Request() req) {
    // As we use the JWT guard on this method,
    // we need to pass a header containing 'Bearer the_corresponding_jwt_token_passed_on_successful_login'
    // when making a GET request to http://localhost:3000/api/me
    return req.user;
  }
  @ApiBearerAuth('JWTAuthorization')
  @UseGuards(AuthGuard('jwt'))
  @Get('permissions')
  async getPermission(@Request() req) {
   return this.usersService.my_Permissions(req.user._id)
  }


  @ApiBearerAuth('JWTAuthorization')
  @UseGuards(AuthGuard('jwt'))
  @Get("projects")
  async getProjects(@Request() req){
    return this.usersService.my_Projects(req.user._id)
  }



}
