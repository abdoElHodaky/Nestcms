import { Controller, Post, Body, Get, Delete, Param, UseInterceptors, Put,UseGuards,Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateOfferDto } from './dto/create-offer.dto';
import { AcceptOfferDto } from './dto/accept-offer.dto';
import { OfferLinkToContractDto } from "./dto/link-contract.dto";
import { OfferService } from './offers.service';
import { ApiTags,ApiSecurity,ApiBearerAuth,ApiOperation } from "@nestjs/swagger";
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
  @ApiOperation({description:"create offer"})
  async create(@Body() createOfferDto: CreateOfferDto) {
    return await this.offerService.create(createOfferDto);
  }
  
  @Get("employee")
  @ApiOperation({description:"get all employee of specific offer"})
  async employee_all(@Request() req){
    return await this.offerService.employee_all(req.user.id);
  }
  
  @Post("accept")
  @ApiOperation({description:"accept offer by specific user"})
  async employee_accept(@Body() acceptOfferDto:AcceptOfferDto){
    return await this.offerService.accept(acceptOfferDto)
  }
  
  @Post("contract")
  @ApiOperation({description:"link contract for offer"})
  async linkContract(@Body() offerLinkToContractDto:OfferLinkToContractDto){
    return await this.offerService.LinkContract(offerLinkToContractDto);
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
