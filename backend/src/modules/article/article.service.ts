import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { NewsApiAdapter } from 'src/adapters/news-api.adapter';
import { TheNewsApiAdapter } from 'src/adapters/the-news-api.adapter';
import axios from 'axios';
import { apiName } from 'src/utils/enums/api-name.enum';
import { NewsAdapter } from 'src/interfaces/news-adapter.interface';
import {
  GetArticleByIdResponseDto,
  GetArticlesResponseDto,
} from './dtos/article-response.dto';
import { EmailService } from '../email/email.service';
import { ArticleValidator } from './article.validator';
import { Article } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ArticleService implements OnModuleInit {
  private logger = new Logger(ArticleService.name);
  private adapterMap: null | Record<apiName, NewsAdapter> = null;

  constructor(
    private prisma: PrismaService,
    private newsApiAdapter: NewsApiAdapter,
    private theNewsApiAdapter: TheNewsApiAdapter,
    private emailService: EmailService,
    private articleValidator: ArticleValidator,
    @Inject(forwardRef(() => NotificationService))
    private notificationService: NotificationService,
  ) {
    this.adapterMap = {
      [apiName.NEWS_API]: this.newsApiAdapter,
      [apiName.THE_NEWS_API]: this.theNewsApiAdapter,
    };
  }

  async onModuleInit() {
    this.logger.log('App started — fetching articles immediately');
    // await this.fetchArticlesFromExternalApisIntoDb();
  }

  @Cron(CronExpression.EVERY_4_HOURS)
  async fetchArticlesFromExternalApisIntoDb() {
    const now = new Date();
    const from = new Date(now.getTime() - 28 * 60 * 60 * 1000);
    const to = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (let api of Object.values(apiName)) {
      if (!this.adapterMap) return;
      const adapter = this.adapterMap[api];
      try {
        const response = await adapter.fetchArticles(from, to);
        await this.processArticles(response);
        await this.sendEmailNotificationsToUsers(from, to);
        await this.updateSourceStatus(api, 'Active');
        break;
      } catch (err) {
        await this.updateSourceStatus(api, 'Inactive');
      }
    }
  }

  private async sendEmailNotificationsToUsers(from: Date, to: Date) {
    const users = await this.prisma.user.findMany();

    const latestUncensoredArticles = await this.prisma.article.findMany({
      where: {
        published_at: { gte: from, lte: to },
      },
      include: { category: true },
    });

    const newArticles = await this.filterOutCensoredArticlesByCategoryOrKeyword(
      latestUncensoredArticles,
    );

    for (const user of users) {
      const [categories, keywords, notification] = await Promise.all([
        this.prisma.userSubscribedCategory.findMany({
          where: { user_id: user.id },
        }),
        this.prisma.userSubscribedKeyword.findMany({
          where: { user_id: user.id },
        }),
        this.prisma.userNotification.findUnique({
          where: { user_id: user.id },
        }),
      ]);

      const lastViewed =
        notification?.last_notifications_viewed_at ?? new Date(0);

      const keywordMap = new Map<number, string[]>();
      for (const k of keywords) {
        if (!keywordMap.has(k.category_id)) keywordMap.set(k.category_id, []);
        keywordMap.get(k.category_id)!.push(k.keyword.toLowerCase());
      }

      const enabledCategoryIds = categories.map((c) => c.category_id);

      const matchedArticles = newArticles.filter((article) => {
        if (
          !article.category_id ||
          !enabledCategoryIds.includes(article.category_id)
        ) {
          return false;
        }

        const keywords = keywordMap.get(article.category_id);
        const isAfterLastViewed = article.published_at > lastViewed;

        if (!keywords || keywords.length === 0) {
          // No keywords → include all articles in this category
          return isAfterLastViewed;
        }

        const content =
          `${article.headline} ${article.description ?? ''}`.toLowerCase();
        const matchesKeyword = keywords.some((k) => content.includes(k));
        return matchesKeyword && isAfterLastViewed;
      });

      if (matchedArticles.length === 0) continue;

      const lines = matchedArticles
        .map((a) => `📰 ${a.headline}\n🔗 ${a.url}\n`)
        .join('\n');

      const message = `
  Hi ${user.username},
  
  Here are your latest news updates based on your preferences:
  
  ${lines}
  
  Regards,  
  LnC News Aggregator Team
      `.trim();

      await this.emailService.sendEmail(
        user.email,
        '🗞️ Your News Digest',
        message,
      );
    }
  }

  async getCategories() {
    return await this.prisma.category.findMany({
      where: { isHidden: false },
      orderBy: { id: 'asc' },
    });
  }

  async getArticles(
    userId: number,
    filter: {
      from?: Date;
      to?: Date;
      category_id?: number;
      search?: string;
      orderBy: 'published_at' | 'like_count' | 'dislike_count';
      orderDirection: 'asc' | 'desc';
    },
  ): Promise<GetArticlesResponseDto[]> {
    const where: any = {};

    if (filter.from || filter.to) {
      where.published_at = {};
      if (filter.from) where.published_at.gte = filter.from;
      if (filter.to) where.published_at.lte = filter.to;
    }

    if (filter.category_id) {
      where.category_id = filter.category_id;
    }

    if (filter.search) {
      const searchTerm = filter.search.trim();
      where.OR = [
        { headline: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const articles = await this.prisma.article.findMany({
      where,
      orderBy: {
        [filter.orderBy]: filter.orderDirection,
      },
      include: {
        savedBy: { where: { user_id: userId }, select: { id: true } },
        reactions: {
          where: { user_id: userId },
          select: { reaction_id: true },
        },
      },
    });

    const visibleArticles = await this.filterOutCensoredArticles(
      userId,
      articles.map((article) => ({
        id: article.id,
      })),
    );

    return articles
      .filter((article) =>
        visibleArticles.find(
          (visibleArticle) => visibleArticle.id === article.id,
        ),
      )
      .map((article) => ({
        id: article.id,
        headline: article.headline,
        description: article.description,
      }));
  }

  async getDetailedArticle(
    userId: number,
    articleId: number,
  ): Promise<GetArticleByIdResponseDto> {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: {
        savedBy: { where: { user_id: userId }, select: { id: true } },
        reactions: {
          where: { user_id: userId },
          select: { reaction_id: true },
        },
      },
    });

    if (!article) throw new NotFoundException('Article not found');

    await this.prisma.userReadArticle.upsert({
      where: { user_id_article_id: { user_id: userId, article_id: articleId } },
      update: { read_at: new Date() },
      create: { user_id: userId, article_id: articleId },
    });

    return {
      id: article.id,
      headline: article.headline,
      description: article.description,
      source: article.source,
      url: article.url,
      published_at: article.published_at,
      category_id: article.category_id,
      isSaved: article.savedBy.length > 0,
      reaction_id: article.reactions[0]?.reaction_id ?? null,
    };
  }

  async getSavedArticles(userId: number): Promise<GetArticlesResponseDto[]> {
    const savedArticles = await this.prisma.userSavedArticle.findMany({
      where: { user_id: userId },
      include: {
        article: {
          include: {
            reactions: {
              where: { user_id: userId },
              select: { reaction_id: true },
            },
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    const filteredArticles = await this.filterOutCensoredArticles(
      userId,
      savedArticles.map((article) => ({
        id: article.id,
      })),
    );

    return savedArticles
      .filter((article) =>
        filteredArticles.find(
          (filteredArticle) => filteredArticle.id === article.id,
        ),
      )
      .map(({ article }) => ({
        id: article.id,
        headline: article.headline,
        description: article.description,
      }));
  }

  async saveArticle(userId: number, articleId: number) {
    await this.prisma.userSavedArticle.create({
      data: {
        user_id: userId,
        article_id: articleId,
      },
    });
  }

  async unsaveArticle(userId: number, articleId: number) {
    await this.prisma.userSavedArticle.deleteMany({
      where: {
        user_id: userId,
        article_id: articleId,
      },
    });
  }

  async getReactions() {
    return await this.prisma.reaction.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, name: true },
    });
  }

  async reactToArticle(userId: number, articleId: number, reactionId: number) {
    const existing = await this.prisma.userArticleReaction.findFirst({
      where: { user_id: userId, article_id: articleId },
    });

    if (!existing) {
      return this.addReaction(userId, articleId, reactionId);
    }

    return this.updateReaction(existing, reactionId);
  }

  async removeReaction(userId: number, articleId: number): Promise<void> {
    const existing = await this.prisma.userArticleReaction.findFirst({
      where: { user_id: userId, article_id: articleId },
    });

    const reaction = await this.prisma.reaction.findFirst({
      where: { id: existing!.reaction_id },
    });

    if (reaction?.name === 'like' || reaction?.name === 'dislike') {
      const updates = {
        [reaction.name === 'like' ? 'like_count' : 'dislike_count']: {
          decrement: 1,
        },
      };
      await this.prisma.article.update({
        where: { id: articleId },
        data: updates,
      });
    }

    await this.prisma.userArticleReaction.delete({
      where: { id: existing!.id },
    });
  }

  async reportArticle(userId: number, articleId: number): Promise<void> {
    const isReportAlreadyExisting =
      await this.prisma.userReportedArticle.findFirst({
        where: { user_id: userId, article_id: articleId },
      });

    if (isReportAlreadyExisting)
      throw new ConflictException('This report already exists.');

    await this.prisma.userReportedArticle.create({
      data: {
        user_id: userId,
        article_id: articleId,
      },
    });

    const reportCount = await this.prisma.userReportedArticle.count({
      where: { article_id: articleId },
    });

    if (reportCount >= 5) {
      await this.prisma.article.update({
        where: { id: articleId },
        data: { isHidden: true },
      });
    }
  }

  async filterOutCensoredArticles(
    userId: number,
    articles: { id: number }[],
  ): Promise<typeof articles> {
    const result: typeof articles = [];
    for (const article of articles) {
      if (
        !(await this.articleValidator.isArticleCensored(userId, article.id))
      ) {
        result.push(article);
      }
    }
    return result;
  }

  async filterOutCensoredArticlesByCategoryOrKeyword(
    articles: Article[],
  ): Promise<Article[]> {
    const result: Article[] = [];
    for (const article of articles) {
      if (
        !(await this.articleValidator.isArticleCensoredByCategoryOrKeyword(
          article.category_id,
          article.headline,
          article.description,
        ))
      ) {
        result.push(article);
      }
    }
    return result;
  }

  private async processArticles(articles: any[]) {
    const categories = await this.prisma.category.findMany();
    const categoryNames = categories.map((c) => c.name.toLowerCase());

    for (const item of articles) {
      let categoryId = this.matchCategory(item.categories, categories);
      if (!categoryId) {
        categoryId = await this.classifyAndMatch(
          item,
          categoryNames,
          categories,
        );
      }

      await this.prisma.article.upsert({
        where: { url: item.url },
        update: {},
        create: {
          headline: item.title,
          description: item.description,
          source: item.source,
          url: item.url,
          published_at: new Date(item.publishedAt),
          category_id: categoryId,
          isHidden: false,
        },
      });
    }
    this.logger.log(`Processed and stored ${articles.length} articles`);
  }

  private matchCategory(
    articleCategories: string[],
    categories: any[],
  ): number | null {
    const lowerCats = articleCategories.map((c) => c.toLowerCase());
    const matched = categories.find((c) =>
      lowerCats.includes(c.name.toLowerCase()),
    );
    return matched ? matched.id : null;
  }

  private async classifyAndMatch(
    item: any,
    labels: string[],
    categories: any[],
  ): Promise<number | null> {
    try {
      const res = await axios.post('http://localhost:8000/classify', {
        text: item.title + ' ' + (item.description || ''),
        labels,
      });
      const label = res.data.label;
      const matched = categories.find(
        (c) => c.name.toLowerCase() === label.toLowerCase(),
      );
      return matched ? matched.id : null;
    } catch {
      this.logger.warn(`Classification failed for: ${item.title}`);
      return null;
    }
  }

  private async updateSourceStatus(
    name: string,
    status: 'Active' | 'Inactive',
  ) {
    const source = await this.prisma.newsSource.findFirst({ where: { name } });
    if (source) {
      const updatedData: {
        status: 'Active' | 'Inactive';
        last_accessed?: Date;
      } = { status };
      if (status === 'Active') updatedData.last_accessed = new Date();
      await this.prisma.newsSource.update({
        where: { id: source.id },
        data: updatedData,
      });
    }
  }

  private async addReaction(
    userId: number,
    articleId: number,
    reactionId: number,
  ) {
    await this.prisma.userArticleReaction.create({
      data: {
        user_id: userId,
        article_id: articleId,
        reaction_id: reactionId,
      },
    });

    const reaction = await this.prisma.reaction.findFirst({
      where: { id: reactionId },
      select: { name: true },
    });

    if (!reaction) return;

    if (reaction.name === 'like') {
      await this.prisma.article.update({
        where: { id: articleId },
        data: { like_count: { increment: 1 } },
      });
    } else if (reaction.name === 'dislike') {
      await this.prisma.article.update({
        where: { id: articleId },
        data: { dislike_count: { increment: 1 } },
      });
    }
  }

  private async updateReaction(
    reactionRecord: {
      id: number;
      user_id: number;
      article_id: number;
      reaction_id: number;
    },
    newReactionId: number,
  ) {
    const reactionRecordId = reactionRecord.id;

    const [previousReaction, newReaction] = await Promise.all([
      this.prisma.reaction.findUnique({
        where: { id: reactionRecord.reaction_id },
        select: { name: true },
      }),
      this.prisma.reaction.findUnique({
        where: { id: newReactionId },
        select: { name: true },
      }),
    ]);

    if (previousReaction?.name === newReaction?.name)
      throw new ConflictException(
        'This reaction already exists on this article',
      );

    await this.prisma.userArticleReaction.update({
      where: { id: reactionRecordId },
      data: { reaction_id: newReactionId },
    });

    const updates: {
      like_count?: { [key: string]: number };
      dislike_count?: { [key: string]: number };
    } = {};
    if (previousReaction?.name === 'like') {
      updates.like_count = { decrement: 1 };
    } else if (previousReaction?.name === 'dislike') {
      updates.dislike_count = { decrement: 1 };
    }

    if (newReaction?.name === 'like') {
      updates.like_count = { increment: 1 };
    } else if (newReaction?.name === 'dislike') {
      updates.dislike_count = {
        increment: 1,
      };
    }

    if (Object.keys(updates).length > 0) {
      await this.prisma.article.update({
        where: { id: reactionRecord.article_id },
        data: updates,
      });
    }
  }

  async getRecommendations(userId: number): Promise<Article[]> {
    const [settings, likes, reads, dislikes] = await Promise.all([
      this.notificationService.getUserSettings(userId),
      this.prisma.userArticleReaction.findMany({
        where: { user_id: userId, reaction: { name: 'like' } },
        include: { article: true },
      }),
      this.prisma.userReadArticle.findMany({
        where: { user_id: userId },
        include: { article: true },
      }),
      this.prisma.userArticleReaction.findMany({
        where: { user_id: userId, reaction: { name: 'dislike' } },
        include: { article: true },
      }),
    ]);

    // Count category occurrences
    const categoryCount = (
      items: { article: { category_id: number | null } }[],
    ) => items.map((i) => i.article.category_id).filter(Boolean) as number[];

    const mostLiked = this.getTopCategory(categoryCount(likes));
    const mostRead = this.getTopCategory(categoryCount(reads));
    const mostDisliked = this.getTopCategory(categoryCount(dislikes));

    const categoryKeywordMap = new Map<number, string[]>();
    for (const s of Object.values(settings)) {
      if (!s.isEnabled) continue;
      categoryKeywordMap.set(s.id, s.keywords ?? []);
    }
    if (mostLiked && !categoryKeywordMap.has(mostLiked)) {
      categoryKeywordMap.set(mostLiked, []);
    }
    if (mostRead && !categoryKeywordMap.has(mostRead)) {
      categoryKeywordMap.set(mostRead, []);
    }
    if (mostDisliked) categoryKeywordMap.delete(mostDisliked);

    const orConditions: any[] = [];
    for (const [catId, keywords] of categoryKeywordMap.entries()) {
      if (!keywords.length) {
        orConditions.push({ category_id: catId });
      } else {
        for (const keyword of keywords) {
          orConditions.push({
            category_id: catId,
            description: { contains: keyword, mode: 'insensitive' },
          });
        }
      }
    }

    const articles = await this.prisma.article.findMany({
      where: {
        published_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        OR: orConditions,
        isHidden: false,
      },
      orderBy: { like_count: 'desc' },
      take: 50,
    });

    const filteredArticles = await this.filterOutCensoredArticles(
      userId,
      articles,
    );

    return articles.filter((article) =>
      filteredArticles.find((safeArticle) => safeArticle.id === article.id),
    );
  }

  private getTopCategory(ids: number[]): number | null {
    if (!ids.length) return null;
    const freq = new Map<number, number>();
    for (const id of ids) freq.set(id, (freq.get(id) ?? 0) + 1);
    return [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }
}
