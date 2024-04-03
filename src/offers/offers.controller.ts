import { Controller, Post, Body, Get, Delete, Param, UseInterceptors, Put,UseGuards,Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateOfferDto } from './dto/create-offer.dto';
import { AcceptOfferDto } from './dto/accept-offer.dto';
import { LinkToContractDto } from "./dto/link-contract.dto";
import { OfferService } from './offers.service';
import { ApiTags,ApiSecurity,ApiBearerAuth } from "@nestjs/swagger";
//import { CurrentUserInterceptor } from '../currentuser.interceptor';
//import { UpdateArticleDto } from './dto/update-article.dto';
//@UseInterceptors(CurrentUserInterceptor)
@ApiBearerAuth('JWTAuthorization')
@ApiTags("Offer")
@UseGuards(AuthGuard('jwt'))
@Controller(["api/offers"])
export class OfferController {
  constructor(private readonly offerService: OfferService) {}
  @Post("create")
  async create(@Body() createOfferDto: CreateOfferDto) {
    return await this.offerService.create(createOfferDto);
  }
  @Get("employee")
  async employee_all(@Request() req){
    return await this.offerService.employee_all(req.user.id);
  }
  @Post("accept")
  async employee_accept(@Body() acceptOfferDto:AcceptOfferDto){
    return await this.offerService.accept(acceptOfferDto)
  }
  @Post("linkcontract")
  async linkContract(@Body() linkToContractDto:LinkToContractDto){
    return await this.offerService.LinkContract(linkToContractDto);
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
