import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ArticleModule } from './modules/article/article.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserService } from './user/user.service';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    ArticleModule,
    AuthModule,
    AdminModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService, UserService],
})
export class AppModule {}
