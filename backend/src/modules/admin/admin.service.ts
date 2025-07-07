// src/admin/admin.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateSourceRequestDto } from './dtos/update-source-request.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getSources() {
    return await this.prisma.newsSource.findMany();
  }

  async updateSource(id: number, dto: UpdateSourceRequestDto) {
    return await this.prisma.newsSource.update({
      where: { id },
      data: {
        ...dto,
        last_accessed: new Date(),
      },
    });
  }

  async addCategory(name: string) {
    return await this.prisma.category.create({
      data: { name, isHidden: false },
    });
  }

  async getReportedArticlesWithCounts() {
    const reports = await this.prisma.userReportedArticle.findMany({
      include: {
        article: true,
        user: true,
      },
    });

    const grouped = new Map<
      number,
      { article: any; count: number; reporters: any[] }
    >();

    for (const report of reports) {
      if (!grouped.has(report.article_id)) {
        grouped.set(report.article_id, {
          article: report.article,
          count: 0,
          reporters: [],
        });
      }

      const entry = grouped.get(report.article_id)!;
      entry.count++;
      entry.reporters.push({ id: report.user.id, email: report.user.email });
    }

    return Array.from(grouped.values());
  }

  async setArticleHidden(articleId: number, hidden: boolean) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });
    if (!article) throw new NotFoundException('Article not found');
    if (article.isHidden === hidden) {
      throw new ConflictException(
        `Article already ${hidden ? 'hidden' : 'unhidden'}`,
      );
    }

    await this.prisma.article.update({
      where: { id: articleId },
      data: { isHidden: hidden },
    });
  }

  async setCategoryHidden(categoryId: number, hidden: boolean) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');
    if (category.isHidden === hidden) {
      throw new ConflictException(
        `Category already ${hidden ? 'hidden' : 'unhidden'}`,
      );
    }

    await this.prisma.category.update({
      where: { id: categoryId },
      data: { isHidden: hidden },
    });
  }

  async addHiddenKeyword(keyword: string) {
    const exists = await this.prisma.hiddenArticleKeyword.findFirst({
      where: { keyword: { equals: keyword, mode: 'insensitive' } },
    });
    if (exists) throw new ConflictException('Keyword already exists');

    await this.prisma.hiddenArticleKeyword.create({ data: { keyword } });
  }

  async removeHiddenKeyword(id: number) {
    const exists = await this.prisma.hiddenArticleKeyword.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException('Keyword Id not found');

    await this.prisma.hiddenArticleKeyword.delete({ where: { id } });
  }

  async getModerationStatus() {
    const [categories, hiddenKeywords] = await Promise.all([
      this.prisma.category.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.hiddenArticleKeyword.findMany({ orderBy: { id: 'asc' } }),
    ]);
    return { categories, hiddenKeywords };
  }
}
