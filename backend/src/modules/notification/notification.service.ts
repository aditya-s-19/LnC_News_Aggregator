import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async getUserRelevantArticles(userId: number) {
    const user = await this.prisma.userNotification.findUnique({
      where: { user_id: userId },
    });

    const since =
      user?.last_notifications_viewed_at ??
      new Date(Date.now() - 168 * 60 * 60 * 1000); // 7 days

    const subscribedCategories =
      await this.prisma.userSubscribedCategory.findMany({
        where: { user_id: userId },
      });
    const categoryIds = subscribedCategories.map((c) => c.category_id);

    if (categoryIds.length === 0) return [];

    const keywordFilters = await this.prisma.userSubscribedKeyword.findMany({
      where: { user_id: userId },
    });

    // Group keywords by category
    const keywordMap = new Map<number, string[]>();
    for (const k of keywordFilters) {
      if (!keywordMap.has(k.category_id)) keywordMap.set(k.category_id, []);
      keywordMap.get(k.category_id)!.push(k.keyword);
    }

    // Build OR conditions for query
    const orConditions: any[] = [];

    for (const categoryId of categoryIds) {
      const keywords = keywordMap.get(categoryId);
      if (!keywords || keywords.length === 0) {
        // No keywords → match all articles in this category
        orConditions.push({ category_id: categoryId });
      } else {
        // Has keywords → match if description contains any keyword
        for (const keyword of keywords) {
          orConditions.push({
            category_id: categoryId,
            description: { contains: keyword, mode: 'insensitive' },
          });
        }
      }
    }

    const articles = await this.prisma.article.findMany({
      where: {
        published_at: { gt: since },
        OR: orConditions,
      },
      orderBy: { published_at: 'desc' },
    });

    // Update last viewed time
    try {
      await this.prisma.userNotification.update({
        where: { user_id: userId },
        data: { last_notifications_viewed_at: new Date() },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        await this.prisma.userNotification.create({
          data: { user_id: userId, last_notifications_viewed_at: new Date() },
        });
      } else {
        throw error;
      }
    }

    return articles;
  }

  async getUserSettings(userId: number) {
    const categories = await this.prisma.category.findMany({
      orderBy: { id: 'asc' },
    });
    const subscribed = await this.prisma.userSubscribedCategory.findMany({
      where: { user_id: userId },
    });
    const keywords = await this.prisma.userSubscribedKeyword.findMany({
      where: { user_id: userId },
    });

    const settings: Record<
      string,
      { id: number; isEnabled: boolean; keywords: string[] }
    > = {};

    for (const category of categories) {
      const isEnabled = subscribed.some((s) => s.category_id === category.id);
      const userKeywords = keywords
        .filter((k) => k.category_id === category.id)
        .map((k) => k.keyword);

      settings[category.name] = {
        id: category.id,
        isEnabled,
        keywords: userKeywords,
      };
    }

    return settings;
  }

  async updateUserCategories(userId: number, categoryIds: number[]) {
    const categories = await this.prisma.category.findMany();
    const categoryIdSet = new Set(categories.map((c) => c.id));

    for (const id of categoryIds) {
      if (!categoryIdSet.has(id)) {
        throw new BadRequestException(`Invalid category ID: ${id}`);
      }
    }

    await this.prisma.userSubscribedCategory.deleteMany({
      where: { user_id: userId },
    });

    await this.prisma.userSubscribedCategory.createMany({
      data: categoryIds.map((id) => ({ user_id: userId, category_id: id })),
    });
  }

  async updateUserKeywords(
    userId: number,
    categoryId: number,
    keywords: string[],
  ) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new BadRequestException(`Invalid category ID: ${categoryId}`);
    }

    await this.prisma.userSubscribedKeyword.deleteMany({
      where: { user_id: userId, category_id: categoryId },
    });

    await this.prisma.userSubscribedKeyword.createMany({
      data: keywords.map((keyword) => ({
        user_id: userId,
        category_id: categoryId,
        keyword,
      })),
      skipDuplicates: true,
    });
  }

  async updateAllUserSettings(
    userId: number,
    settings: Record<
      string,
      { id: number; isEnabled: boolean; keywords: string[] }
    >,
  ) {
    const allCategoryIds = Object.values(settings).map((s) => s.id);

    await this.updateUserCategories(
      userId,
      allCategoryIds.filter(
        (id) =>
          settings[
            Object.keys(settings).find((key) => settings[key].id === id)!
          ].isEnabled,
      ),
    );

    for (const key in settings) {
      const { id, keywords } = settings[key];
      await this.updateUserKeywords(userId, id, keywords);
    }
  }
}
