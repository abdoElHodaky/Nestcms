import { Controller, Get, UseGuards, Post,Body, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiExcludeEndpoint } from "@nestjs/swagger";

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @ApiExcludeEndpoint()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('permissions')
  async getPermission(@Request() req) {
   return this.usersService.my_Permissions(req.user._id)
  }

}
