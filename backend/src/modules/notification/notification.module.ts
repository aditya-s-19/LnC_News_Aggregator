import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationController } from './notification.controller';
import { NotificationValidator } from './notification.validator';
import { ArticleModule } from '../article/article.module';

@Module({
  imports: [PrismaModule, AuthModule, ArticleModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationValidator],
  exports: [NotificationService], // ✅ must export it
})
export class NotificationModule {}
