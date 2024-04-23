import {SetMetadata} from '@nestjs/common';
import { Permission , OnModel } from './permissions-models.enum';

export const Permissions = (args:{perms:string[],models:string[]}) => SetMetadata('permissions',{_perms:args.perms,_mdls:args.models});
//export const onModel = (...onModels: onModel[]) => SetMetadata('onModels', onModels);
