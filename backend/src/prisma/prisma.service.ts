import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Prisma connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🛑 Prisma disconnected');
  }

  // Example of a helper: clean DB (optional, good for testing)
  async cleanDatabase() {
    await this.$transaction([
      this.userNotification.deleteMany(),
      this.userArticleReaction.deleteMany(),
      this.userSavedArticle.deleteMany(),
      this.userSubscribedKeyword.deleteMany(),
      this.userSubscribedCategory.deleteMany(),
      this.article.deleteMany(),
      this.reaction.deleteMany(),
      this.category.deleteMany(),
      this.newsSource.deleteMany(),
      this.user.deleteMany(),
    ]);
  }
}
