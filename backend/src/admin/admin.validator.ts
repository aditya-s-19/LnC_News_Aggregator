import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminValidator {
  constructor(private prisma: PrismaService) {}

  async sourceShouldExist(id: number) {
    const source = await this.prisma.newsSource.findUnique({ where: { id } });
    if (!source) throw new NotFoundException('NewsSource not found');
    return source;
  }

  async categoryShouldNotExist(name: string) {
    const existing = await this.prisma.category.findFirst({ where: { name } });
    if (existing) throw new ConflictException('Category already exists');
  }
}
