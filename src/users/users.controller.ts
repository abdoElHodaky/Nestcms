import { Controller, Post, Body } from '@nestjs/common';
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
}
