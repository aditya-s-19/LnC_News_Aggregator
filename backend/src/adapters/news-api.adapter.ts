import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { NewsAdapter } from '../interfaces/news-adapter.interface';
import { PrismaService } from '../prisma/prisma.service';
import { NewsArticle } from 'src/interfaces/news-article.interface';

@Injectable()
export class NewsApiAdapter implements NewsAdapter {
  private logger = new Logger(NewsApiAdapter.name);
  private readonly domains = [
    'timesofindia.indiatimes.com',
    'thehindu.com',
    'hindustantimes.com',
    'ndtv.com',
    'indianexpress.com',
    'indiatoday.in',
    'businesstoday.in',
    'news18.com',
    'livemint.com',
    'moneycontrol.com',
    'bbc.co.uk',
    'cnn.com',
    'reuters.com',
    'aljazeera.com',
    'theverge.com',
    'techcrunch.com',
    'bloomberg.com',
    'nytimes.com',
    'wsj.com',
    'foxnews.com',
  ].join(',');

  constructor(private prisma: PrismaService) {}

  public async fetchArticles(from: Date, to: Date): Promise<NewsArticle[]> {
    const newsSource = await this.prisma.newsSource.findFirst({
      where: { name: 'NewsAPI' },
    });

    if (!newsSource?.api_key) {
      this.logger.warn('NewsAPI source or API key missing');
      return [];
    }

    try {
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          apiKey: newsSource.api_key,
          domains: this.domains,
          from: from.toISOString(),
          to: to.toISOString(),
          language: 'en',
          page: 1,
        },
      });

      return (response.data.articles || []).map((a: any) => ({
        title: a.title,
        description: a.description || '',
        source: a.source?.name || '',
        url: a.url,
        publishedAt: a.publishedAt,
        categories: [], // NewsAPI does not provide categories
      }));
    } catch (err) {
      this.logger.error(`NewsAPI fetch failed: ${err.message}`);
      throw err;
    }
  }
}
