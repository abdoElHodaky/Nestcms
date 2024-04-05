import {SetMetadata} from '@nestjs/common';
import { Permission , OnModel } from './permissions-models.enum';

export const Permission = (...permissions: Permission[], ...models:OnModel[]) => SetMetadata('permissions', [permissions,models]);
//export const onModel = (...onModels: onModel[]) => SetMetadata('onModels', onModels);
