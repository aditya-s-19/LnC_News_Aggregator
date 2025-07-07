import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminValidator } from './admin.validator';
import { PrismaModule } from 'src/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { ArticleModule } from '../article/article.module';

@Module({
  imports: [ArticleModule, PrismaModule],
  controllers: [AdminController],
  providers: [AdminService, AdminValidator],
})
export class AdminModule {}
