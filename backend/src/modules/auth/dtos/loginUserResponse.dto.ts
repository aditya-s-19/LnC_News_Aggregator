import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginUserResponseDto {
  accessToken: string;
  username: string;
  role: string;
}
