// src/admin/admin.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateSourceRequestDto } from './dtos/update-source-request.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getSources() {
    return this.prisma.newsSource.findMany();
  }

  async updateSource(id: number, dto: UpdateSourceRequestDto) {
    return this.prisma.newsSource.update({
      where: { id },
      data: {
        ...dto,
        last_accessed: new Date(),
      },
    });
  }

  async addCategory(name: string) {
    return this.prisma.category.create({
      data: { name },
    });
  }
}
