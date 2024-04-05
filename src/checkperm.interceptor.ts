import {NestInterceptor,ExecutionContext,CallHandler,Injectable} from '@nestjs/common';
import { UsersService } from './users/users.service';

@Injectable()
// "implements" guide us how to put together an interceptor
export class CheckPermInterceptor implements NestInterceptor {
  constructor(private userService: UsersService) {}
  // handler refers to the route handler
  async intercept(context: ExecutionContext, handler: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const { userId } = request.session || {};
    if (userId) {
      const permissions = await this.userService.my_permissions(userId);
      
    }
    // run the actual route handler
    return handler.handle();
  }
}
