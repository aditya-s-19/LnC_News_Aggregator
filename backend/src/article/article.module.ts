import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { NewsApiAdapter } from 'src/adapters/news-api.adapter';
import { TheNewsApiAdapter } from 'src/adapters/the-news-api.adapter';

@Module({
  providers: [ArticleService, NewsApiAdapter, TheNewsApiAdapter],
})
export class ArticleModule {}
