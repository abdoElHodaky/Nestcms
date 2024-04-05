import {SetMetadata} from '@nestjs/common';
import { Permission , OnModel } from './permissions-models.enum';

export const Permissions = (...permissions:{_perms:Permission[],_mdls:OnModel[]}) => SetMetadata('permissions',permissions);
//export const onModel = (...onModels: onModel[]) => SetMetadata('onModels', onModels);
