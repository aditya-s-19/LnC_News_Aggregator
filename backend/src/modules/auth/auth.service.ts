import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { LoginUserResponseDto } from './dtos/loginUserResponse.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async register(dto: { email: string; password: string; name: string }) {
    const user = await this.userService.createUser(
      dto.email,
      dto.password,
      dto.name,
    );

    await this.prisma.userNotification.create({
      data: {
        user_id: user.id,
        last_notifications_viewed_at: new Date(
          new Date().getTime() - 7 * 24 * 60 * 60 * 1000,
        ),
      },
    });

    return user;
  }

  async login(user: any): Promise<LoginUserResponseDto> {
    const payload = {
      email: user.email,
      sub: user.id,
      username: user.username,
      role: user.role,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      username: user.username,
      role: user.role,
    };
  }
}
