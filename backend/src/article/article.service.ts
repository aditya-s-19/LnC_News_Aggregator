import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NewsApiAdapter } from 'src/adapters/news-api.adapter';
import { TheNewsApiAdapter } from 'src/adapters/the-news-api.adapter';
import axios from 'axios';
import { adapterPriority } from 'src/utils/constants/adapter-priority';
import { apiName } from 'src/utils/enums/api-name.enum';
import { NewsAdapter } from 'src/interfaces/news-adapter.interface';

@Injectable()
export class ArticleService implements OnModuleInit {
  private logger = new Logger(ArticleService.name);
  private adapterMap: null | Record<apiName, NewsAdapter> = null;

  constructor(
    private prisma: PrismaService,
    private newsApiAdapter: NewsApiAdapter,
    private theNewsApiAdapter: TheNewsApiAdapter,
  ) {
    this.adapterMap = {
      [apiName.NEWS_API]: this.newsApiAdapter,
      [apiName.THE_NEWS_API]: this.theNewsApiAdapter,
    };
  }

  async onModuleInit() {
    this.logger.log('App started — fetching articles immediately');
    await this.fetchArticles();
  }

  @Cron(CronExpression.EVERY_4_HOURS)
  async fetchArticles() {
    const now = new Date();
    const from = new Date(now.getTime() - 28 * 60 * 60 * 1000);
    const to = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (let api of Object.values(apiName)) {
      if (!this.adapterMap) return;
      const adapter = this.adapterMap[api];
      try {
        const response = await adapter.fetchArticles(from, to);
        await this.processArticles(response);
        await this.updateSourceStatus(api, 'Active');
        break;
      } catch (err) {
        await this.updateSourceStatus(api, 'Inactive');
      }
    }
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
      await this.prisma.newsSource.update({
        where: { id: source.id },
        data: { status, last_accessed: new Date() },
      });
    }
  }
}
