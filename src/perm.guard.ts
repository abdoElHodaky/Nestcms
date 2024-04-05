import {NestInterceptor,ExecutionContext,CallHandler,Injectable,CanActivate,Reflector } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { Permission } from "./permissions/permissions-models.decorator";
@Injectable()
// "implements" guide us how to put together an interceptor
export class PermGuard implements CanActivate {
  constructor(private userService: UsersService, private reflector:Reflector ) {}
  // handler refers to the route handler
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const permissions = this.reflector.getAllAndOverride<string[],string[]>("permissions",[context.getHandler(),context.getClass()])
    
    const {userId} = context.switchToHttp().getRequest().user;
    return check(permissions,userId);
  }
  async check(permissions,userId){
    let _permissions = this.userService.my_Permissions(userId)[0].permissions
    
  }
}
