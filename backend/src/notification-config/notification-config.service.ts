import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class NotifcationConfigService {
  constructor(private prisma: PrismaClient) {}

  async getNotificationCategories(userId: number) {
    const userSubscribedCategories =
      await this.prisma.userSubscribedCategory.findMany({
        where: {
          user_id: userId,
        },
      });
    const categories = await this.prisma.category.findMany();
    const result: { [key: string]: boolean }[] = categories.map((category) => {
      const isUserSubscribed =
        userSubscribedCategories.filter(
          (userCategory) => userCategory.category_id === category.id,
        ).length > 0;
      return {
        [category.name]: isUserSubscribed,
      };
    });
    return result;
  }

  async updateNotificationsCategories(
    userId: number,
    notificationConfigs: {
      [key: string]: boolean;
    },
  ) {
    const categories = await this.prisma.category.findMany();
    for (let categoryKey in notificationConfigs) {
      let foundCategory = categories.find(
        (category) => category.name === categoryKey,
      );
      if (!foundCategory) {
        throw new Error('Given category is invalid');
      }
    }
    let notificationsStatus = categories.map((c) => {
      return { id: c.id, name: c.name, isEnabled: notificationConfigs[c.name] };
    });

    for (let categoryStatus of notificationsStatus) {
      if (categoryStatus.isEnabled) {
        const userSubscribedCategory =
          await this.prisma.userSubscribedCategory.findFirst({
            where: { user_id: userId, category_id: categoryStatus.id },
          });
        if (!userSubscribedCategory) {
          await this.prisma.userSubscribedCategory.create({
            data: {
              user_id: userId,
              category_id: categoryStatus.id,
            },
          });
        }
      } else {
        await this.prisma.userSubscribedCategory.delete({
          where: {
            user_id_category_id: {
              user_id: userId,
              category_id: categoryStatus.id,
            },
          },
        });
      }
    }
  }

  async getNotificationsKeywords(userId: number) {
    const userSubscribedKeywords =
      await this.prisma.userSubscribedKeyword.findMany({
        where: {
          user_id: userId,
        },
      });

    const categories = await this.prisma.category.findMany();

    const result: { [key: string]: string[] }[] = categories.map((category) => {
      const keywords = userSubscribedKeywords
        .filter((usk) => usk.category_id === category.id)
        .map((usk) => usk.keyword);

      return {
        [category.name]: keywords,
      };
    });

    return result;
  }

  async updateNotificationsKeywords(
    userId: number,
    notificationConfigs: {
      [key: string]: string[];
    },
  ) {
    const categories = await this.prisma.category.findMany();
    for (let categoryKey in notificationConfigs) {
      let foundCategory = categories.find(
        (category) => category.name === categoryKey,
      );
      if (!foundCategory) {
        throw new Error('Given category is invalid');
      }
    }
    let categorieskeywords = categories.map((c) => {
      return { id: c.id, name: c.name, keywords: notificationConfigs[c.name] };
    });

    for (let categoryKeywords of categorieskeywords) {
      await this.prisma.userSubscribedKeyword.deleteMany({
        where: {
          user_id: userId,
          category_id: categoryKeywords.id,
        },
      });
      let keywords = categoryKeywords.keywords;
      await this.prisma.userSubscribedKeyword.createMany({
        data: keywords.map((keyword) => ({
          user_id: userId,
          category_id: categoryKeywords.id,
          keyword,
        })),
        skipDuplicates: true,
      });
    }
  }
}
