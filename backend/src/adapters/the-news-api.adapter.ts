import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { NewsAdapter } from '../interfaces/news-adapter.interface';
import { PrismaService } from '../prisma/prisma.service';
import { NewsArticle } from 'src/interfaces/news-article.interface';

@Injectable()
export class TheNewsApiAdapter implements NewsAdapter {
  private logger = new Logger(TheNewsApiAdapter.name);

  constructor(private prisma: PrismaService) {}

  async fetchArticles(from: Date, to: Date): Promise<NewsArticle[]> {
    const newsSource = await this.prisma.newsSource.findFirst({
      where: { name: 'TheNewsAPI' },
    });

    if (!newsSource?.api_key) {
      this.logger.warn('TheNewsAPI source or API key missing');
      return [];
    }

    const apiToken = newsSource.api_key;
    const limit = 3;
    let page = 1;
    let articles: NewsArticle[] = [];

    try {
      while (true) {
        const response = await axios.get(
          'https://api.thenewsapi.com/v1/news/all',
          {
            params: {
              api_token: apiToken,
              published_after: from.toISOString().slice(0, 19),
              published_before: to.toISOString().slice(0, 19),
              language: 'en',
              limit,
              page,
            },
          },
        );

        const data = response.data.data || [];
        articles = articles.concat(
          data.map((a: any) => ({
            title: a.title,
            description: a.description || '',
            source: a.source || '',
            url: a.url,
            publishedAt: a.published_at,
            categories: a.categories || [],
          })),
        );

        if (data.length < limit || articles.length >= 30) break;
        page++;
      }

      return articles;
    } catch (err) {
      this.logger.error(`TheNewsAPI fetch failed: ${err.message}`);
      throw err;
    }
  }
}
