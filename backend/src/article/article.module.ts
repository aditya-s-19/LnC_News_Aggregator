import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { NewsApiAdapter } from 'src/adapters/news-api.adapter';
import { TheNewsApiAdapter } from 'src/adapters/the-news-api.adapter';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ArticleValidator } from './article.validator';
import { ArticleController } from './article.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ArticleController],
  providers: [
    ArticleService,
    ArticleValidator,
    NewsApiAdapter,
    TheNewsApiAdapter,
  ],
})
export class ArticleModule {}
