import {NestInterceptor,ExecutionContext,CallHandler,Injectable,CanActivate } from '@nestjs/common';
import { UsersService } from './users/users.service';

@Injectable()
// "implements" guide us how to put together an interceptor
export class CheckPermGuard implements CanActivate {
  constructor(private userService: UsersService) {}
  // handler refers to the route handler
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return check(request);
  }
  async check(request){
    
  }
}
