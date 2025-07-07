import { ConflictException } from '@nestjs/common';

export class UserFoundException extends ConflictException {
  constructor() {
    super('User already exists');
  }
}
