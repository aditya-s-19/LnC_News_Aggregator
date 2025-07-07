import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from 'src/user/user.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as dotenv from 'dotenv';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { UserModule } from 'src/user/user.module';
import { AuthValidator } from './auth.validator';
import { PrismaModule } from 'src/prisma/prisma.module';
dotenv.config();

const jwtSecret = process.env.JWT_SECRET_KEY;
if (!jwtSecret) {
  throw new Error('JWT_SECRET_KEY is not set in environment variables!');
}

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: '1h' },
    }),
    UserModule,
    PrismaModule,
  ],
  providers: [AuthService, JwtStrategy, AuthValidator],
  controllers: [AuthController],
  exports: [AuthValidator],
})
export class AuthModule {}
