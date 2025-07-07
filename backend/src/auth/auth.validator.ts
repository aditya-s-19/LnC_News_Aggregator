import { Injectable } from '@nestjs/common';
import { UserFoundException } from 'src/utils/exceptions/user-found';
import { UserNotFoundException } from 'src/utils/exceptions/user-not-found';
import * as bcrypt from 'bcrypt';
import { InvalidCredentialsException } from 'src/utils/exceptions/invalid-credentials';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthValidator {
  constructor(private prisma: PrismaService) {}

  public async userShouldExist(email: string) {
    const response = await this.prisma.user.findFirst({
      where: { email },
    });
    if (!response) throw new UserNotFoundException();
    return response;
  }

  public async userShouldNotExist(email: string) {
    const response = await this.prisma.user.findFirst({
      where: { email },
    });
    if (response) throw new UserFoundException();
  }

  public async userIdShouldExist(userId: number) {
    const response = await this.prisma.user.findFirst({
      where: { id: userId },
    });
    if (!response) throw new UserNotFoundException();
    return response;
  }

  public async validateUser(
    email: string,
    pass: string,
  ): Promise<{
    username: string;
    email: string;
    role: string;
    id: number;
  }> {
    const user = await this.userShouldExist(email);
    if (await bcrypt.compare(pass, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    } else {
      throw new InvalidCredentialsException();
    }
  }
}
