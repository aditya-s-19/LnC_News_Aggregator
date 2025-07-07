import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminValidator } from './admin.validator';
import { PrismaModule } from 'src/prisma/prisma.module';
import { Module } from '@nestjs/common';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminValidator, PrismaModule],
})
export class AdminModule {}
