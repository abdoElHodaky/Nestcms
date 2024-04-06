import { Controller, Post, Body, Get, Delete, Param, UseInterceptors, Put,UseGuards,Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateContractDto } from './dto/create-contract.dto';
import { ContractService } from './contracts.service';
import { ApiTags,ApiSecurity,ApiBearerAuth,ApiOperation } from "@nestjs/swagger";
//import { CurrentUserInterceptor } from '../currentuser.interceptor';
//import { UpdateArticleDto } from './dto/update-article.dto';
//@UseInterceptors(CurrentUserInterceptor)
@ApiBearerAuth('JWTAuthorization')
@ApiTags("Contract")
@UseGuards(AuthGuard('jwt'))
@Controller("api/contracts")
export class ContractController {
  constructor(private readonly contractService: ContractService) {}
  
  @ApiOperation({description:"create contract for specific client from specific offer"})
  @Post("create")
  async create(@Body() createContractDto: CreateContractDto) {
    return await this.contractService.create(createContractDto);
  }
  
  @ApiOperation({description:"get contract of specific employee"})
  @Get("employee")
  async employee_all(@Request() req){
    return await this.contractService.employee_all(req.user.id);
  }
/*

  @Get()
  async findAll() {
    return this.articlesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @Delete(':id')
  async deleteArticle(@Param('id') id: string) {
    // tslint:disable-next-line: no-console
    console.log('delete article with id -> ', id);
    return this.articlesService.delete(id);
  }*/
}
