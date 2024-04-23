import {SetMetadata} from '@nestjs/common';
import { Permission , OnModel } from './permissions-models.enum';

export const Permissions = (perms:string[],models:string[]) => SetMetadata('permissions',{_perms:perms,_mdls:models});
//export const onModel = (...onModels: onModel[]) => SetMetadata('onModels', onModels);
