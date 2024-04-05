import {SetMetadata} from '@nestjs/common';
import { Permission , OnModel } from './permissions-models.enum';

export const Permission = (...permissions: Permission[]) => SetMetadata('permissions', permissions);
export const onModel = (...onModels: onModel[]) => SetMetadata('onModels', onModels);
