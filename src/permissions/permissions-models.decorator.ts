import {SetMetadata} from '@nestjs/common';
import { Permission , OnModel } from './permissions-models.enum';

export const Permissions = (permissions: Permission[], models:OnModel[],...res) => SetMetadata('permissions', {_perms:permissions,_mdls:models});
//export const onModel = (...onModels: onModel[]) => SetMetadata('onModels', onModels);
