import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ArticleModule } from './article/article.module';
import { AuthModule } from './auth/auth.module';
import { UserService } from './user/user.service';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot(), ArticleModule, AuthModule],
  controllers: [AppController],
  providers: [AppService, UserService],
})
export class AppModule {}
