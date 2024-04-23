import { Controller, Post, Body, Get, Delete, Param, UseInterceptors, Put,UseGuards,Request ,Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermGuard } from "../perm.guard";
import { Permissions } from "./permissions-models.decorator";
import { CreatePermissionDto } from './dto/create-permission.dto';
import { PermissionService } from './permissions.service';
import { ApiTags,ApiSecurity,ApiBearerAuth,ApiExcludeEndpoint,ApiOperation } from "@nestjs/swagger";
//import { CurrentUserInterceptor } from '../currentuser.interceptor';
//import { UpdateArticleDto } from './dto/update-article.dto';
//@UseInterceptors(CurrentUserInterceptor)
//@ApiBearerAuth('JWTAuthorization')
@ApiTags("Permission")
//@UseGuards(AuthGuard('jwt'))
@Controller(["api/permissions"])
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}
 
  @ApiBearerAuth('JWTAuthorization')
  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiOperation({description:"get all permissions"})
  async All() {
  //  return this.permissionService.All();
  }

  
  @ApiBearerAuth('JWTAuthorization')
  @Permissions({_perms:["Write"],_models:["Permission"]})
  @UseGuards(AuthGuard('jwt'),PermGuard)
  @Post("create")
  @ApiOperation({description:"create permission"})
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    return await this.permissionService.create(createPermissionDto);
  }
  
  

  


  /*
  @Get("employee")
  async employee_all(@Request() req){
    return await this.offerService.employee_all(req.user.id);
  }
  @Post("accept")
  async employee_accept(@Body() acceptOfferDto:AcceptOfferDto){
    return await this.offerService.accept(acceptOfferDto)
  }*/
  /*@Post("linkcontract")
  async linkContract(@Body() paymentLinkToContractDto: PaymentLinkToContractDto){
    return await this.paymentService.LinkContract(paymentLinkToContractDto);
  }


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
