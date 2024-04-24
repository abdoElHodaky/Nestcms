import { Controller, Get, UseGuards, Post,Body, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
//import { User } from "./interfaces/user";
import { ApiExcludeEndpoint , ApiBearerAuth , ApiTags , ApiOperation } from "@nestjs/swagger";
@ApiTags("User")
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
 /* @ApiExcludeEndpoint()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }*/
  @ApiBearerAuth('JWTAuthorization')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({description:" specific user"})
  @Get('me')
  getProfile(@Request() req) {
    // As we use the JWT guard on this method,
    // we need to pass a header containing 'Bearer the_corresponding_jwt_token_passed_on_successful_login'
    // when making a GET request to http://localhost:3000/api/me
    return req.user;
  }
  @ApiBearerAuth('JWTAuthorization')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({description:" permissions of specific user"})
  @Get('permissions')
  async getPermission(@Request() req) {
   let user =this.usersService.my_Permissions(req.user._id) 
   return user.permissions
  }


  @ApiBearerAuth('JWTAuthorization')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({description:" projects of specific user"})
  @Get("projects")
  async getProjects(@Request() req){
    let user= this.usersService.my_Projects(req.user._id)
    return user.projects
  }



}
