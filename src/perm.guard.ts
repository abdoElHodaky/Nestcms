import {NestInterceptor,ExecutionContext,CallHandler,Injectable,CanActivate } from '@nestjs/common';
import { Reflector } from "@nestjs/core";
import { UsersService } from './users/users.service';
import { Permissions } from "./permissions/permissions-models.decorator";
import { AuthGuard } from '@nestjs/passport';
import { User} from "./users/interfaces/user"
@Injectable()
export class PermGuard implements CanActivate {
 private userService: UsersService
 // private reflector?:Reflector
  constructor(
              
              private reflector:Reflector
  ) {}
  // handler refers to the route handler
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> {
    const permissions = this.reflector.getAllAndOverride<{_perms:string[],_mdls:string[]}>("permissions",[context.getHandler(),context.getClass()])
    const req = context.switchToHttp().getRequest(); 
    return this.check(permissions,req?.user?._id); 
  }
  async check(permissions,userId){
    let {_perms,_mdls}=permissions
    let _permissions = this.userService.my_Permissions(userId)[0].permissions
    let res=_permissions.filter(({onModel,type},i)=>{
      if(_mdls.includes(onModel)==true && _perms.includes(type)==true)
        return true
    })
    if (res.length>0) return true
    
  }
}

export class OptionalJwtAuthGuard extends AuthGuard('jwt') {

  // Override handleRequest so it never throws an error
  handleRequest(err, user, info, context) {
    return (user!=undefined)?user:new User();
  }

}
