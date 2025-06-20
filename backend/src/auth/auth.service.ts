import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { LoginUserResponseDto } from './dtos/loginUserResponse.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(dto: { email: string; password: string; name: string }) {
    const user = await this.userService.createUser(
      dto.email,
      dto.password,
      dto.name,
    );
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
