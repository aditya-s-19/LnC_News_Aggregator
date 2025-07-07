import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ArticleModule } from './article/article.module';
import { AuthModule } from './auth/auth.module';
import { UserService } from './user/user.service';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    ArticleModule,
    AuthModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, UserService],
})
export class AppModule {}
