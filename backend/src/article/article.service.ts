import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NewsApiAdapter } from 'src/adapters/news-api.adapter';
import { TheNewsApiAdapter } from 'src/adapters/the-news-api.adapter';
import axios from 'axios';

@Injectable()
export class ArticleService {
  // implements OnModuleInit {
  private logger = new Logger(ArticleService.name);

  constructor(
    private prisma: PrismaService,
    private newsApi: NewsApiAdapter,
    private theNewsApi: TheNewsApiAdapter,
  ) {}

  //   async onModuleInit() {
  //     this.logger.log('App started — fetching articles immediately');
  //     await this.fetchArticles();
  //   }

  @Cron(CronExpression.EVERY_4_HOURS)
  async fetchArticles() {
    const now = new Date();
    const from = new Date(now.getTime() - 28 * 60 * 60 * 1000);
    const to = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
      await this.processArticles(await this.newsApi.fetchArticles(from, to));
      await this.updateSourceStatus('NewsAPI', 'Active');
    } catch (err) {
      await this.updateSourceStatus('NewsAPI', 'Inactive');
      try {
        await this.processArticles(
          await this.theNewsApi.fetchArticles(from, to),
        );
        await this.updateSourceStatus('TheNewsAPI', 'Active');
      } catch (fallbackErr) {
        await this.updateSourceStatus('TheNewsAPI', 'Inactive');
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
