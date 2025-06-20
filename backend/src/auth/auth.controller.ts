import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserRequestDto } from './dtos/registerUserRequest.dto';
import { LoginUserRequestDto } from './dtos/loginUserRequest.dto';
import { LoginUserResponseDto } from './dtos/loginUserResponse.dto';
import { AuthValidator } from './auth.validator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private authValidator: AuthValidator,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterUserRequestDto) {
    await this.authValidator.userShouldNotExist(dto.email);
    await this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginUserRequestDto): Promise<LoginUserResponseDto> {
    const user = await this.authValidator.validateUser(dto.email, dto.password);
    return await this.authService.login(user);
  }
}
