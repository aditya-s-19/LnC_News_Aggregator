import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ArticleValidator {
  constructor(private prisma: PrismaService) {}

  validateArticleQuery(
    from?: string,
    to?: string,
    category_id?: string,
    search?: string,
    order?: string,
  ): {
    from?: Date;
    to?: Date;
    category_id?: number;
    search?: string;
    orderBy: 'published_at' | 'like_count' | 'dislike_count';
    orderDirection: 'asc' | 'desc';
  } {
    let fromDate: Date | undefined;
    let toDate: Date | undefined;
    let catId: number | undefined;
    let searchTerm: string | undefined;
    let orderBy: 'published_at' | 'like_count' | 'dislike_count' =
      'published_at';
    let orderDirection: 'asc' | 'desc' = 'desc';

    if (from) {
      const d = new Date(from);
      if (isNaN(d.getTime()))
        throw new BadRequestException('Invalid param: "from" date');
      fromDate = d;
    }

    if (to) {
      const d = new Date(to);
      if (isNaN(d.getTime()))
        throw new BadRequestException('Invalid param: "to" date');
      toDate = d;
    }

    if (category_id) {
      const n = Number(category_id);
      if (isNaN(n)) throw new BadRequestException('Invalid param: category_id');
      catId = n;
    }

    if (search) {
      const trimmed = search.trim();
      if (trimmed.length === 0)
        throw new BadRequestException('Invalid param: empty search string');
      searchTerm = trimmed;
    }

    if (order) {
      const parts = order.split(':');
      const field = parts[0];
      const direction = parts[1] ?? 'desc';

      if (!['asc', 'desc'].includes(direction))
        throw new BadRequestException('Order direction must be asc or desc');

      switch (field) {
        case 'likes':
          orderBy = 'like_count';
          break;
        case 'dislikes':
          orderBy = 'dislike_count';
          break;
        case 'date':
          orderBy = 'published_at';
          break;
        default:
          throw new BadRequestException('Invalid order field');
      }

      orderDirection = direction as 'asc' | 'desc';
    }

    return {
      from: fromDate,
      to: toDate,
      category_id: catId,
      search: searchTerm,
      orderBy,
      orderDirection,
    };
  }

  async articleShouldNotBeAlreadySaved(userId: number, articleId: number) {
    const exists = await this.prisma.userSavedArticle.findUnique({
      where: {
        user_id_article_id: { user_id: userId, article_id: articleId },
      },
    });

    if (exists) {
      throw new ConflictException('Article already saved.');
    }
  }

  async articleShouldBeAlreadySaved(userId: number, articleId: number) {
    const exists = await this.prisma.userSavedArticle.findUnique({
      where: {
        user_id_article_id: { user_id: userId, article_id: articleId },
      },
    });

    if (!exists) {
      throw new NotFoundException('Article not saved.');
    }
  }

  public async articleIdShouldExist(articleId: number) {
    const response = await this.prisma.article.findFirst({
      where: { id: articleId },
    });
    if (!response) throw new NotFoundException('Article Not Found.');
    return response;
  }

  public async reactionIdShouldExist(reactionId: number) {
    const response = await this.prisma.reaction.findFirst({
      where: { id: reactionId },
    });
    if (!response) throw new NotFoundException('Reaction Not Found.');
    return response;
  }

  public async articleReactionShouldExist(userId: number, articleId: number) {
    const existing = await this.prisma.userArticleReaction.findFirst({
      where: { user_id: userId, article_id: articleId },
    });

    if (!existing) {
      throw new NotFoundException('No reaction found to remove.');
    }
  }
}
