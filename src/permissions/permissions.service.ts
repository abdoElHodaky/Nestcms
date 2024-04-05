import { Injectable } from '@nestjs/common';
import { Model,Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Permission } from './interfaces/permission';

@Injectable()
export class PermissionService {
  constructor(@InjectModel('Permission') private readonly permModel: Model<Permission>) {}
}
