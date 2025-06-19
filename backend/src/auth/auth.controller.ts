import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserRequestDto } from './dtos/registerUserRequest.dto';
import { LoginUserRequestDto } from './dtos/loginUserRequest.dto';
import { LoginUserResponseDto } from './dtos/loginUserResponse.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterUserRequestDto) {
    await this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginUserRequestDto): Promise<LoginUserResponseDto> {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException();
    return await this.authService.login(user);
  }
}
